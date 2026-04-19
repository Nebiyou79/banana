/**
 * server/src/controllers/ProductController.js  (UPDATED)
 *
 * Key additions / changes:
 *  - saveProduct / unsaveProduct / getSavedProducts endpoints
 *  - getCategories returns full taxonomy hierarchy
 *  - ownerSnapshot sync on create & update
 *  - category/subcategory filtering in getProducts & getCompanyProducts
 *  - public list responses strip public_id from images
 *  - owner list responses include public_id for edit flows
 */

const mongoose = require('mongoose');
const Product  = require('../models/Product');
const Company  = require('../models/Company');
const Profile  = require('../models/Profile');
const User     = require('../models/User');
const cloudinaryStorageService = require('../services/cloudinaryStorageService');
const { deleteFromCloudinary }  = require('../config/cloudinary');
const path = require('path');

// Shared taxonomy
const { PRODUCT_CATEGORIES, ALL_CATEGORY_IDS } = require('../shared/productCategories');

// ── helpers ───────────────────────────────────────────────────────────────────

const cleanString = (str) => {
  if (typeof str !== 'string') return str;
  return str.replace(/^"(.*)"$/, '$1').trim();
};

const parseField = (value, defaultValue = []) => {
  if (!value) return defaultValue;
  if (Array.isArray(value)) return value;
  try { return JSON.parse(value); } catch { return defaultValue; }
};

/**
 * Build ownerSnapshot from Company + Profile documents.
 * Called on create and update.
 */
const buildOwnerSnapshot = async (companyId) => {
  const company = await Company.findById(companyId).lean();
  if (!company) return {};

  // Try to get the Cloudinary avatar from the linked Profile
  let avatarUrl       = null;
  let avatarPublicId  = null;
  if (company.user) {
    const profile = await Profile.findOne({ user: company.user })
      .select('avatar')
      .lean();
    if (profile?.avatar?.secure_url) {
      avatarUrl      = profile.avatar.secure_url;
      avatarPublicId = profile.avatar.public_id;
    }
  }

  return {
    name:           company.name,
    logoUrl:        company.logoUrl  || null,
    avatarUrl:      avatarUrl        || company.logoUrl || null,
    avatarPublicId: avatarPublicId   || null,
    verified:       company.verified || false,
    industry:       company.industry || null,
    website:        company.website  || null,
  };
};

/** Strip public_id from images for public-facing responses */
const sanitizeImagesPublic = (images = []) =>
  images.map(({ public_id, ...rest }) => rest);   // eslint-disable-line no-unused-vars

/** Full images (for owner) */
const sanitizeImagesOwner = (images = []) =>
  images.map(img => ({ ...img }));

// ── create ────────────────────────────────────────────────────────────────────

exports.createProduct = async (req, res) => {
  console.log('🔄 createProduct called');

  const session = await mongoose.startSession();
  session.startTransaction();
  let uploadedImages = [];

  try {
    const { name, description, shortDescription, price, category,
            subcategory, tags, specifications, featured,
            metaTitle, metaDescription, sku, inventory } = req.body;

    if (!req.user || (req.user.role !== 'company' && req.user.role !== 'admin')) {
      await session.abortTransaction(); session.endSession();
      return res.status(403).json({ success: false, message: 'Only companies can create products.', code: 'ACCESS_DENIED' });
    }

    // Images from cloudinaryMediaUpload middleware
    if (!req.cloudinaryProductImages?.images?.length) {
      await session.abortTransaction(); session.endSession();
      return res.status(400).json({ success: false, message: 'At least one product image is required.', code: 'NO_IMAGES' });
    }

    const successfulImages = req.cloudinaryProductImages.images.filter(img => img.success !== false);
    if (!successfulImages.length) {
      await session.abortTransaction(); session.endSession();
      return res.status(400).json({ success: false, message: 'No valid product images uploaded.', code: 'NO_VALID_IMAGES' });
    }

    uploadedImages = successfulImages;

    // Parse price
    let priceData;
    try {
      priceData = typeof price === 'string' ? JSON.parse(price) : price;
      if (!priceData || typeof priceData.amount !== 'number' || priceData.amount < 0)
        throw new Error('invalid');
    } catch {
      await session.abortTransaction(); session.endSession();
      return res.status(400).json({ success: false, message: 'Valid price is required.', code: 'INVALID_PRICE' });
    }

    // Resolve company
    let companyId;
    if (req.user.role === 'company') {
      const company = await Company.findOne({ user: req.user.userId || req.user._id }).session(session);
      if (!company) {
        await session.abortTransaction(); session.endSession();
        return res.status(404).json({ success: false, message: 'Company profile not found.', code: 'COMPANY_NOT_FOUND' });
      }
      companyId = company._id;
    } else {
      companyId = req.body.companyId;
    }

    // Build ownerSnapshot
    const ownerSnapshot = await buildOwnerSnapshot(companyId);

    // Map images
    const productImages = uploadedImages.map((img, index) => ({
      public_id:         img.cloudinary?.public_id  || `product_${Date.now()}_${index}`,
      secure_url:        img.cloudinary?.secure_url || '',
      format:            img.cloudinary?.format     || 'jpg',
      width:             img.cloudinary?.width      || 800,
      height:            img.cloudinary?.height     || 600,
      bytes:             img.cloudinary?.bytes      || img.size || 0,
      uploaded_at:       img.cloudinary?.created_at || new Date(),
      altText:           `${cleanString(name) || 'Product'} - Image ${index + 1}`,
      isPrimary:         img.isPrimary || index === 0,
      order:             index,
      original_filename: img.originalName,
      resource_type:     img.cloudinary?.resource_type || 'image',
    }));

    const tagsArray  = parseField(tags,           []);
    const specsArray = parseField(specifications, []);
    const invData    = parseField(inventory,      {});

    const productSku = sku || `PROD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    const product = new Product({
      companyId,
      ownerSnapshot,
      name:             cleanString(name),
      description:      cleanString(description),
      shortDescription: shortDescription ? cleanString(shortDescription) : description?.substring(0, 200),
      price: {
        amount:   parseFloat(priceData.amount.toFixed(2)),
        currency: priceData.currency || 'USD',
        unit:     priceData.unit     || 'unit',
      },
      images:    productImages,
      thumbnail: {
        public_id:  productImages.find(i => i.isPrimary)?.public_id  || productImages[0].public_id,
        secure_url: productImages.find(i => i.isPrimary)?.secure_url || productImages[0].secure_url,
      },
      category:         cleanString(category),
      subcategory:      subcategory ? cleanString(subcategory) : undefined,
      tags:             tagsArray.map(t => t.trim().toLowerCase()),
      specifications:   specsArray.map(s => ({ key: cleanString(s.key), value: cleanString(s.value) })),
      featured:         featured === 'true' || featured === true,
      status:           'active',
      metaTitle:        metaTitle   ? cleanString(metaTitle)        : cleanString(name),
      metaDescription:  metaDescription ? cleanString(metaDescription) : description?.substring(0, 160),
      sku:              productSku,
      inventory: {
        quantity:      invData.quantity      || 0,
        trackQuantity: invData.trackQuantity || false,
        lowStockAlert: invData.lowStockAlert || 10,
      },
    });

    await product.save({ session });
    await session.commitTransaction();
    session.endSession();

    // Populate for response
    await product.populate('companyId', 'name logoUrl verified industry description website');

    return res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data:    { product },
      code:    'PRODUCT_CREATED',
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('❌ Create product error:', error);

    // Clean up uploaded images
    if (uploadedImages.length) {
      await Promise.allSettled(
        uploadedImages
          .filter(i => i.cloudinary?.public_id)
          .map(i => deleteFromCloudinary(i.cloudinary.public_id, 'image'))
      );
    }

    if (error.code === 11000 && error.keyPattern?.sku)
      return res.status(400).json({ success: false, message: 'SKU already exists.', code: 'DUPLICATE_SKU' });

    return res.status(500).json({ success: false, message: 'Error creating product', code: 'PRODUCT_CREATION_ERROR' });
  }
};

// ── getProducts (public list) ─────────────────────────────────────────────────

exports.getProducts = async (req, res) => {
  try {
    const {
      page = 1, limit = 12,
      search, category, subcategory, companyId,
      featured, tags, minPrice, maxPrice,
      status = 'active',
      sortBy = 'createdAt', sortOrder = 'desc',
    } = req.query;

    const filter = { status };

    if (search) {
      filter.$or = [
        { name:              { $regex: search, $options: 'i' } },
        { description:       { $regex: search, $options: 'i' } },
        { shortDescription:  { $regex: search, $options: 'i' } },
        { tags:              { $in: [new RegExp(search, 'i')] } },
        { sku:               { $regex: search, $options: 'i' } },
        { 'ownerSnapshot.name': { $regex: search, $options: 'i' } },
      ];
    }

    if (category)   filter.category   = category;
    if (subcategory) filter.subcategory = subcategory;
    if (companyId)  filter.companyId   = companyId;
    if (featured !== undefined) filter.featured = featured === 'true';

    if (minPrice || maxPrice) {
      filter['price.amount'] = {};
      if (minPrice) filter['price.amount'].$gte = parseFloat(minPrice);
      if (maxPrice) filter['price.amount'].$lte = parseFloat(maxPrice);
    }

    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : tags.split(',');
      filter.tags = { $in: tagArray.map(t => t.toLowerCase()) };
    }

    const validSort = ['name', 'price.amount', 'createdAt', 'updatedAt', 'views', 'savedCount'];
    const sortField = validSort.includes(sortBy) ? sortBy : 'createdAt';
    const sortOptions = { [sortField]: sortOrder === 'asc' ? 1 : -1 };

    const [products, total] = await Promise.all([
      Product.find(filter)
        .sort(sortOptions)
        .limit(parseInt(limit))
        .skip((parseInt(page) - 1) * parseInt(limit))
        .select('-__v -savedBy')
        .lean(),
      Product.countDocuments(filter),
    ]);

    // Strip public_id for public responses
    const transformed = products.map(p => ({
      ...p,
      images: sanitizeImagesPublic(p.images || []),
    }));

    return res.json({
      success: true,
      data: {
        products: transformed,
        pagination: {
          current: parseInt(page),
          pages:   Math.ceil(total / parseInt(limit)),
          total,
          limit:   parseInt(limit),
        },
      },
      code: 'PRODUCTS_RETRIEVED',
    });
  } catch (error) {
    console.error('getProducts error:', error);
    return res.status(500).json({ success: false, message: 'Error fetching products', code: 'PRODUCTS_FETCH_ERROR' });
  }
};

// ── getProduct (single, public) ───────────────────────────────────────────────

exports.getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('companyId', 'name logoUrl verified industry description website phone address socialLinks')
      .lean();

    if (!product)
      return res.status(404).json({ success: false, message: 'Product not found', code: 'PRODUCT_NOT_FOUND' });

    if (product.status === 'active')
      await Product.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } });

    return res.json({
      success: true,
      data: {
        product: {
          ...product,
          images: sanitizeImagesPublic(product.images || []),
        },
      },
      code: 'PRODUCT_RETRIEVED',
    });
  } catch (error) {
    console.error('getProduct error:', error);
    return res.status(500).json({ success: false, message: 'Error fetching product', code: 'PRODUCT_FETCH_ERROR' });
  }
};

// ── updateProduct ─────────────────────────────────────────────────────────────

exports.updateProduct = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      name, description, shortDescription, price,
      category, subcategory, tags, specifications,
      featured, status, metaTitle, metaDescription,
      sku, inventory, existingImages, primaryImageIndex, imagesToDelete,
    } = req.body;

    let product = await Product.findById(req.params.id).session(session);
    if (!product) {
      await session.abortTransaction(); session.endSession();
      return res.status(404).json({ success: false, message: 'Product not found', code: 'PRODUCT_NOT_FOUND' });
    }

    // Auth check
    const isAdmin = req.user?.role === 'admin';
    let isOwner   = false;
    if (req.user?.role === 'company') {
      const uc = await Company.findOne({ user: req.user.userId || req.user._id }).session(session);
      if (uc) isOwner = product.companyId.toString() === uc._id.toString();
    }
    if (!isAdmin && !isOwner) {
      await session.abortTransaction(); session.endSession();
      return res.status(403).json({ success: false, message: 'Not authorized to update this product.', code: 'ACCESS_DENIED' });
    }

    // Delete images from Cloudinary
    if (imagesToDelete) {
      const toDelete = parseField(imagesToDelete);
      await Promise.allSettled(toDelete.map(id => deleteFromCloudinary(id, 'image')));
      product.images = product.images.filter(img => !toDelete.includes(img.public_id));
    }

    // Keep existing images
    let updatedImages;
    if (existingImages) {
      const keep = parseField(existingImages);
      updatedImages = product.images.filter(img =>
        keep.some(k => (typeof k === 'string' ? k : k.public_id) === img.public_id)
      );
    } else {
      updatedImages = [...product.images];
    }

    // Add newly uploaded images
    if (req.cloudinaryProductImages?.images) {
      const newImgs = req.cloudinaryProductImages.images
        .filter(img => img.success !== false)
        .map((img, index) => ({
          public_id:         img.cloudinary.public_id,
          secure_url:        img.cloudinary.secure_url,
          format:            img.cloudinary.format,
          width:             img.cloudinary.width,
          height:            img.cloudinary.height,
          bytes:             img.cloudinary.bytes,
          uploaded_at:       img.cloudinary.created_at || new Date(),
          altText:           `${name || product.name} - Image ${updatedImages.length + index + 1}`,
          isPrimary:         false,
          order:             updatedImages.length + index,
          original_filename: img.originalName,
          resource_type:     img.cloudinary.resource_type || 'image',
        }));
      updatedImages = [...updatedImages, ...newImgs];
    }

    // Set primary
    const primaryIdx = parseInt(primaryImageIndex);
    if (!isNaN(primaryIdx) && updatedImages[primaryIdx]) {
      updatedImages.forEach((img, i) => { img.isPrimary = i === primaryIdx; });
    } else if (updatedImages.length > 0 && !updatedImages.some(i => i.isPrimary)) {
      updatedImages[0].isPrimary = true;
    }

    if (!updatedImages.length) {
      await session.abortTransaction(); session.endSession();
      return res.status(400).json({ success: false, message: 'Product must have at least one image.', code: 'NO_IMAGES' });
    }

    const primaryImg = updatedImages.find(i => i.isPrimary);
    const thumbnail  = primaryImg
      ? { public_id: primaryImg.public_id, secure_url: primaryImg.secure_url }
      : product.thumbnail;

    // Re-sync ownerSnapshot in case company info changed
    const ownerSnapshot = await buildOwnerSnapshot(product.companyId);

    const priceData    = price ? parseField(price, product.price) : product.price;
    const tagsArray    = parseField(tags, product.tags);
    const specsArray   = parseField(specifications, product.specifications);
    const invData      = parseField(inventory, product.inventory);

    product = await Product.findByIdAndUpdate(
      req.params.id,
      {
        ownerSnapshot,
        name:             name ? cleanString(name) : product.name,
        description:      description ? cleanString(description) : product.description,
        shortDescription: shortDescription ? cleanString(shortDescription) : product.shortDescription,
        price: {
          amount:   priceData.amount ? parseFloat(parseFloat(priceData.amount).toFixed(2)) : product.price.amount,
          currency: priceData.currency || product.price.currency,
          unit:     priceData.unit     || product.price.unit,
        },
        images:     updatedImages,
        thumbnail,
        category:   category   ? cleanString(category)   : product.category,
        subcategory: subcategory ? cleanString(subcategory) : product.subcategory,
        tags:        tagsArray.map(t => cleanString(t).toLowerCase()),
        specifications: specsArray.map(s => ({ key: cleanString(s.key), value: cleanString(s.value) })),
        featured:    featured !== undefined ? (featured === 'true' || featured === true) : product.featured,
        status:      status || product.status,
        metaTitle:   metaTitle   ? cleanString(metaTitle)        : product.metaTitle,
        metaDescription: metaDescription ? cleanString(metaDescription) : product.metaDescription,
        sku:         sku || product.sku,
        inventory: {
          quantity:      invData.quantity      !== undefined ? invData.quantity      : product.inventory.quantity,
          trackQuantity: invData.trackQuantity !== undefined ? invData.trackQuantity : product.inventory.trackQuantity,
          lowStockAlert: invData.lowStockAlert                                       || product.inventory.lowStockAlert,
        },
      },
      { new: true, runValidators: false, session }
    );

    await session.commitTransaction();
    session.endSession();

    await Product.populate(product, { path: 'companyId', select: 'name logoUrl verified industry' });

    return res.json({
      success: true,
      message: 'Product updated successfully',
      data:    { product },
      code:    'PRODUCT_UPDATED',
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('updateProduct error:', error);
    if (error.code === 11000 && error.keyPattern?.sku)
      return res.status(400).json({ success: false, message: 'SKU already exists.', code: 'DUPLICATE_SKU' });
    return res.status(500).json({ success: false, message: 'Error updating product', code: 'PRODUCT_UPDATE_ERROR' });
  }
};

// ── deleteProduct ─────────────────────────────────────────────────────────────

exports.deleteProduct = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const product = await Product.findById(req.params.id).session(session);
    if (!product) {
      await session.abortTransaction(); session.endSession();
      return res.status(404).json({ success: false, message: 'Product not found', code: 'PRODUCT_NOT_FOUND' });
    }

    const isAdmin = req.user?.role === 'admin';
    let isOwner   = false;
    if (req.user?.role === 'company') {
      const uc = await Company.findOne({ user: req.user.userId || req.user._id }).session(session);
      if (uc) isOwner = product.companyId.toString() === uc._id.toString();
    }
    if (!isAdmin && !isOwner) {
      await session.abortTransaction(); session.endSession();
      return res.status(403).json({ success: false, message: 'Not authorized.', code: 'ACCESS_DENIED' });
    }

    await product.deleteCloudinaryImages().catch(console.error);
    await Product.findByIdAndDelete(req.params.id).session(session);
    await session.commitTransaction();
    session.endSession();

    return res.json({ success: true, message: 'Product deleted successfully', code: 'PRODUCT_DELETED' });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    return res.status(500).json({ success: false, message: 'Error deleting product', code: 'PRODUCT_DELETE_ERROR' });
  }
};

// ── getCompanyProducts ────────────────────────────────────────────────────────

exports.getCompanyProducts = async (req, res) => {
  try {
    const { companyId } = req.params;
    const {
      page = 1, limit = 12,
      status, category, subcategory, featured, search,
      sort = 'newest', minPrice, maxPrice,
    } = req.query;

    let company = await Company.findById(companyId);
    if (!company) company = await Company.findOne({ user: companyId });
    if (!company)
      return res.status(404).json({ success: false, message: 'Company not found', code: 'COMPANY_NOT_FOUND' });

    // Determine if requester is the owner so we can show all statuses
    const isOwner = req.user &&
      (req.user.role === 'admin' ||
       (req.user.role === 'company' &&
        (await Company.findOne({ user: req.user.userId || req.user._id }))
          ?._id.toString() === company._id.toString()));

    const filter = { companyId: company._id };

    // Status filter: owner can see all, public sees only active
    if (status) {
      filter.status = status;
    } else {
      filter.status = isOwner ? { $in: ['active', 'draft', 'inactive', 'out_of_stock'] } : 'active';
    }

    if (category)   filter.category   = category;
    if (subcategory) filter.subcategory = subcategory;
    if (featured !== undefined) filter.featured = featured === 'true';
    if (search) {
      filter.$or = [
        { name:        { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags:        { $in: [new RegExp(search, 'i')] } },
      ];
    }
    if (minPrice || maxPrice) {
      filter['price.amount'] = {};
      if (minPrice) filter['price.amount'].$gte = parseFloat(minPrice);
      if (maxPrice) filter['price.amount'].$lte = parseFloat(maxPrice);
    }

    const sortMap = {
      newest:     { createdAt: -1 },
      popular:    { views: -1 },
      price_asc:  { 'price.amount': 1 },
      price_desc: { 'price.amount': -1 },
    };

    const [products, total] = await Promise.all([
      Product.find(filter)
        .sort(sortMap[sort] || sortMap.newest)
        .limit(parseInt(limit))
        .skip((parseInt(page) - 1) * parseInt(limit))
        .lean(),
      Product.countDocuments(filter),
    ]);

    // For owner: include public_id for edit flows; for public: strip it
    const transform = isOwner ? sanitizeImagesOwner : sanitizeImagesPublic;
    const transformed = products.map(p => ({ ...p, images: transform(p.images || []) }));

    return res.json({
      success: true,
      data: {
        products: transformed,
        company: {
          _id:      company._id,
          name:     company.name,
          logoUrl:  company.logoUrl,
          verified: company.verified,
          industry: company.industry,
        },
        pagination: {
          current: parseInt(page),
          pages:   Math.ceil(total / parseInt(limit)),
          total,
          limit:   parseInt(limit),
        },
        isOwnerView: !!isOwner,
      },
      code: 'COMPANY_PRODUCTS_RETRIEVED',
    });
  } catch (error) {
    console.error('getCompanyProducts error:', error);
    return res.status(500).json({ success: false, message: 'Error fetching company products' });
  }
};

// ── getCategories (full hierarchy) ────────────────────────────────────────────

exports.getCategories = async (req, res) => {
  try {
    // Merge taxonomy with live counts
    const counts = await Product.aggregate([
      { $match: { status: 'active' } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
    ]);
    const countMap = {};
    counts.forEach(c => { countMap[c._id] = c.count; });

    const categories = PRODUCT_CATEGORIES.map(cat => ({
      ...cat,
      count: countMap[cat.id] || 0,
    }));

    return res.json({ success: true, data: { categories }, code: 'CATEGORIES_RETRIEVED' });
  } catch (error) {
    console.error('getCategories error:', error);
    return res.status(500).json({ success: false, message: 'Error fetching categories' });
  }
};

// ── getFeaturedProducts ───────────────────────────────────────────────────────

exports.getFeaturedProducts = async (req, res) => {
  try {
    const { limit = 8 } = req.query;
    const products = await Product.find({ status: 'active', featured: true })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .lean();

    return res.json({
      success: true,
      data: { products: products.map(p => ({ ...p, images: sanitizeImagesPublic(p.images || []) })) },
      code: 'FEATURED_PRODUCTS_RETRIEVED',
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error fetching featured products' });
  }
};

// ── getRelatedProducts ────────────────────────────────────────────────────────

exports.getRelatedProducts = async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 4 } = req.query;

    const product = await Product.findById(id);
    if (!product)
      return res.status(404).json({ success: false, message: 'Product not found', code: 'PRODUCT_NOT_FOUND' });

    const related = await Product.find({
      _id:    { $ne: id },
      status: 'active',
      $or: [
        { category:  product.category },
        { companyId: product.companyId },
        { tags:      { $in: product.tags } },
      ],
    })
      .sort({ featured: -1, views: -1 })
      .limit(parseInt(limit))
      .lean();

    return res.json({
      success: true,
      data: { products: related.map(p => ({ ...p, images: sanitizeImagesPublic(p.images || []) })) },
      code: 'RELATED_PRODUCTS_RETRIEVED',
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error fetching related products' });
  }
};

// ── updateProductStatus ───────────────────────────────────────────────────────

exports.updateProductStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const valid = ['active', 'inactive', 'draft', 'out_of_stock', 'discontinued'];
    if (!valid.includes(status))
      return res.status(400).json({ success: false, message: `Invalid status. Allowed: ${valid.join(', ')}`, code: 'INVALID_STATUS' });

    const product = await Product.findById(req.params.id);
    if (!product)
      return res.status(404).json({ success: false, message: 'Product not found', code: 'PRODUCT_NOT_FOUND' });

    const isAdmin = req.user?.role === 'admin';
    let isOwner   = false;
    if (req.user?.role === 'company') {
      const uc = await Company.findOne({ user: req.user.userId || req.user._id });
      if (uc) isOwner = product.companyId.toString() === uc._id.toString();
    }
    if (!isAdmin && !isOwner)
      return res.status(403).json({ success: false, message: 'Not authorized.', code: 'ACCESS_DENIED' });

    product.status = status;
    await product.save();

    return res.json({ success: true, message: `Product status updated to ${status}`, data: { product }, code: 'PRODUCT_STATUS_UPDATED' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error updating product status' });
  }
};

// ── saveProduct ───────────────────────────────────────────────────────────────

exports.saveProduct = async (req, res) => {
  try {
    const userId    = req.user.userId || req.user._id;
    const productId = req.params.id;

    const product = await Product.findById(productId);
    if (!product)
      return res.status(404).json({ success: false, message: 'Product not found', code: 'PRODUCT_NOT_FOUND' });

    const alreadySaved = product.savedBy.some(id => id.toString() === userId.toString());
    if (alreadySaved)
      return res.status(400).json({ success: false, message: 'Product already saved', code: 'ALREADY_SAVED' });

    product.savedBy.push(userId);
    product.savedCount = product.savedBy.length;
    await product.save();

    return res.json({ success: true, message: 'Product saved', data: { savedCount: product.savedCount }, code: 'PRODUCT_SAVED' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error saving product' });
  }
};

// ── unsaveProduct ─────────────────────────────────────────────────────────────

exports.unsaveProduct = async (req, res) => {
  try {
    const userId    = req.user.userId || req.user._id;
    const productId = req.params.id;

    const product = await Product.findById(productId);
    if (!product)
      return res.status(404).json({ success: false, message: 'Product not found', code: 'PRODUCT_NOT_FOUND' });

    product.savedBy  = product.savedBy.filter(id => id.toString() !== userId.toString());
    product.savedCount = product.savedBy.length;
    await product.save();

    return res.json({ success: true, message: 'Product unsaved', data: { savedCount: product.savedCount }, code: 'PRODUCT_UNSAVED' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error unsaving product' });
  }
};

// ── getSavedProducts ──────────────────────────────────────────────────────────

exports.getSavedProducts = async (req, res) => {
  try {
    const userId = req.user.userId || req.user._id;
    const { page = 1, limit = 12 } = req.query;

    const [products, total] = await Promise.all([
      Product.find({ savedBy: userId, status: 'active' })
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip((parseInt(page) - 1) * parseInt(limit))
        .lean(),
      Product.countDocuments({ savedBy: userId, status: 'active' }),
    ]);

    return res.json({
      success: true,
      data: {
        products: products.map(p => ({ ...p, images: sanitizeImagesPublic(p.images || []) })),
        pagination: { current: parseInt(page), pages: Math.ceil(total / parseInt(limit)), total, limit: parseInt(limit) },
      },
      code: 'SAVED_PRODUCTS_RETRIEVED',
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error fetching saved products' });
  }
};

// ── uploadImages (standalone) ─────────────────────────────────────────────────

exports.uploadImages = async (req, res) => {
  try {
    if (!req.files?.productImages)
      return res.status(400).json({ success: false, message: 'No images uploaded.', code: 'NO_IMAGES' });

    const files = Array.isArray(req.files.productImages) ? req.files.productImages : [req.files.productImages];
    const results = await Promise.all(files.map(async (file, i) => {
      const result = await cloudinaryStorageService.uploadFile(file.data, file.name, {
        folder: 'bananalink/products',
        tags:   ['product', 'bananalink', i === 0 ? 'primary' : 'secondary'],
      });
      if (!result.success) return { originalName: file.name, error: result.error, success: false };
      return { ...result.data.cloudinary, isPrimary: i === 0, success: true };
    }));

    const successful = results.filter(r => r.success);
    if (!successful.length)
      return res.status(400).json({ success: false, message: 'No images uploaded successfully.', code: 'NO_VALID_IMAGES' });

    return res.json({ success: true, data: { images: successful }, code: 'IMAGES_UPLOADED' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error uploading images', code: 'IMAGE_UPLOAD_ERROR' });
  }
};

// ── getProductUploadStats ─────────────────────────────────────────────────────

exports.getProductUploadStats = async (req, res) => {
  try {
    const stats = cloudinaryStorageService.getStatistics();
    return res.json({ success: true, data: stats, code: 'UPLOAD_STATS_RETRIEVED' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error fetching stats', code: 'UPLOAD_STATS_ERROR' });
  }
};
