const mongoose = require('mongoose');
const Product = require('../models/Product');
const Company = require('../models/Company');
const cloudinaryStorageService = require('../services/cloudinaryStorageService');
const { deleteFromCloudinary } = require('../config/cloudinary');
const path = require('path');

// Helper function to clean string fields
const cleanString = (str) => {
  if (typeof str !== 'string') return str;
  return str.replace(/^"(.*)"$/, '$1').trim();
};

// Helper to parse JSON or array fields
const parseField = (value, defaultValue = []) => {
  if (!value) return defaultValue;
  if (Array.isArray(value)) return value;
  try {
    return JSON.parse(value);
  } catch (error) {
    return defaultValue;
  }
};

// @desc    Create a new product
// @route   POST /api/v1/products
// @access  Private (Company/Admin)
exports.createProduct = async (req, res) => {
  console.log('🔄 createProduct called');
  console.log('📦 Request body fields:', Object.keys(req.body));
  console.log('📁 Cloudinary middleware results:', req.cloudinaryProductImages);

  const session = await mongoose.startSession();
  session.startTransaction();

  // Declare uploadedImages here so it's available in error handling
  let uploadedImages = [];

  try {
    const {
      name,
      description,
      shortDescription,
      price,
      category,
      subcategory,
      tags,
      specifications,
      featured,
      metaTitle,
      metaDescription,
      sku,
      inventory,
      productId
    } = req.body;

    // Verify user is Company or Admin
    if (!req.user || (req.user.role !== 'company' && req.user.role !== 'admin')) {
      await session.abortTransaction();
      session.endSession();
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only companies and admins can create products.',
        code: 'ACCESS_DENIED'
      });
    }

    // Check for uploaded files using middleware
    if (req.cloudinaryProductImages && req.cloudinaryProductImages.images) {
      console.log('✅ Found productImages from Cloudinary middleware');
      
      // Get successful images from middleware
      const successfulImages = req.cloudinaryProductImages.images.filter(img => img.success !== false);
      
      if (successfulImages.length === 0) {
        console.log('❌ No valid images from middleware');
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({
          success: false,
          message: 'No valid product images could be uploaded.',
          code: 'NO_VALID_IMAGES',
          failedImages: req.cloudinaryProductImages.images.filter(img => img.success === false)
        });
      }
      
      // Map middleware images to our format
      uploadedImages = successfulImages.map((img, index) => {
        return {
          originalName: img.originalName,
          size: img.size,
          mimetype: img.mimetype,
          cloudinary: img.cloudinary,
          localBackup: img.localBackup,
          metadata: img.metadata,
          isPrimary: img.isPrimary || index === 0,
          success: true
        };
      });
      
      console.log(`✅ ${uploadedImages.length}/${req.cloudinaryProductImages.count} images uploaded successfully via middleware`);
    } else {
      // No files at all
      console.log('❌ No productImages found in request or middleware');
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'At least one product image is required.',
        code: 'NO_IMAGES',
        details: {
          middlewareResult: req.cloudinaryProductImages ? 'exists but no images' : 'no middleware result'
        }
      });
    }

    console.log(`✅ ${uploadedImages.length} images processed successfully`);

    // Validate and parse price
    let priceData;
    try {
      priceData = typeof price === 'string' ? JSON.parse(price) : price;
      if (!priceData || typeof priceData.amount !== 'number' || priceData.amount < 0) {
        throw new Error('Valid price amount is required');
      }
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'Valid price is required',
        details: error.message,
        code: 'INVALID_PRICE'
      });
    }

    // Process uploaded images
    const productImages = uploadedImages.map((img, index) => {
      return {
        public_id: img.cloudinary?.public_id || `product_${Date.now()}_${index}`,
        secure_url: img.cloudinary?.secure_url || img.metadata?.downloadUrl || '',
        format: img.cloudinary?.format || path.extname(img.originalName).replace('.', '') || 'jpg',
        width: img.cloudinary?.width || 800,
        height: img.cloudinary?.height || 600,
        bytes: img.cloudinary?.bytes || img.size || 0,
        uploaded_at: img.cloudinary?.created_at || new Date(),
        altText: `${name || 'Product'} - Image ${index + 1}`,
        isPrimary: img.isPrimary || index === 0,
        order: index,
        original_filename: img.originalName,
        resource_type: img.cloudinary?.resource_type || 'image'
      };
    });

    // Parse other fields
    const tagsArray = tags ? (Array.isArray(tags) ? tags : JSON.parse(tags)) : [];
    const specsArray = specifications ? (Array.isArray(specifications) ? specifications : JSON.parse(specifications)) : [];
    const inventoryData = inventory ? (typeof inventory === 'string' ? JSON.parse(inventory) : inventory) : {};

    // Generate SKU if not provided
    const productSku = sku || `PROD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Get the actual Company document ID
    let companyId;

    if (req.user.role === 'company') {
      const company = await Company.findOne({ user: req.user.userId || req.user._id }).session(session);

      if (!company) {
        await session.abortTransaction();
        session.endSession();
        return res.status(404).json({
          success: false,
          message: 'Company profile not found. Please complete your company profile first.',
          code: 'COMPANY_NOT_FOUND'
        });
      }

      companyId = company._id;
    } else if (req.user.role === 'admin') {
      companyId = req.body.companyId;

      if (!companyId) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({
          success: false,
          message: 'Company ID is required when creating products as admin',
          code: 'COMPANY_ID_REQUIRED'
        });
      }
    }

    // Create product
    const product = new Product({
      companyId: companyId,
      name: name ? cleanString(name) : '',
      description: description ? cleanString(description) : '',
      shortDescription: shortDescription ? cleanString(shortDescription) : (description ? description.substring(0, 200) : ''),
      price: {
        amount: parseFloat(priceData.amount.toFixed(2)),
        currency: priceData.currency || 'USD',
        unit: priceData.unit || 'unit'
      },
      images: productImages,
      thumbnail: {
        public_id: productImages.find(img => img.isPrimary)?.public_id || productImages[0].public_id,
        secure_url: productImages.find(img => img.isPrimary)?.secure_url || productImages[0].secure_url
      },
      category: category ? cleanString(category) : '',
      subcategory: subcategory ? cleanString(subcategory) : '',
      tags: tagsArray.map(tag => tag.trim().toLowerCase()),
      specifications: specsArray.map(spec => ({
        key: spec.key ? cleanString(spec.key) : '',
        value: spec.value ? cleanString(spec.value) : ''
      })),
      featured: featured === 'true' || featured === true,
      status: 'active',
      metaTitle: metaTitle ? cleanString(metaTitle) : (name ? name : ''),
      metaDescription: metaDescription ? cleanString(metaDescription) : (description ? description.substring(0, 160) : ''),
      sku: productSku,
      inventory: {
        quantity: inventoryData.quantity || 0,
        trackQuantity: inventoryData.trackQuantity || false,
        lowStockAlert: inventoryData.lowStockAlert || 10
      }
    });

    await product.save({ session });

    // FIXED: Populate after saving (without session method)
    await Product.populate(product, {
      path: 'companyId',
      select: 'name logoUrl verified industry description website'
    });

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: {
        product,
        uploadStats: {
          totalUploaded: uploadedImages.length,
          successful: uploadedImages.length,
          failed: 0
        }
      },
      code: 'PRODUCT_CREATED'
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    console.error('❌ Create product error:', error);
    console.error('Error stack:', error.stack);

    // Clean up uploaded Cloudinary images if product creation fails
    if (uploadedImages && uploadedImages.length > 0) {
      const cleanupPromises = uploadedImages
        .filter(img => img.success !== false && img.cloudinary && img.cloudinary.public_id)
        .map(img => deleteFromCloudinary(img.cloudinary.public_id, 'image'));

      try {
        await Promise.allSettled(cleanupPromises);
        console.log(`🧹 Cleaned up ${cleanupPromises.length} Cloudinary images after failed product creation`);
      } catch (cleanupError) {
        console.error('Error cleaning up Cloudinary images:', cleanupError);
      }
    }

    if (error.code === 11000 && error.keyPattern.sku) {
      return res.status(400).json({
        success: false,
        message: 'SKU already exists. Please use a different SKU.',
        code: 'DUPLICATE_SKU'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error creating product',
      code: 'PRODUCT_CREATION_ERROR',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      details: process.env.NODE_ENV === 'development' ? {
        name: error.name,
        code: error.code,
        keyPattern: error.keyPattern
      } : undefined
    });
  }
};

// @desc    Upload product images (standalone)
// @route   POST /api/v1/products/upload
// @access  Private (Company/Admin)
exports.uploadImages = async (req, res) => {
  try {
    console.log('🔄 uploadImages called');
    console.log('📁 Request files:', req.files ? Object.keys(req.files) : 'No files');

    if (!req.files || !req.files.productImages) {
      return res.status(400).json({
        success: false,
        message: 'No images uploaded. Please use field name "productImages".',
        code: 'NO_IMAGES'
      });
    }

    const productImages = Array.isArray(req.files.productImages)
      ? req.files.productImages
      : [req.files.productImages];

    console.log(`📸 Processing ${productImages.length} image(s)`);

    const uploadPromises = productImages.map(async (file, index) => {
      try {
        console.log(`🔄 Uploading image ${index + 1}: ${file.name}`);

        const uploadResult = await cloudinaryStorageService.uploadFile(
          file.data,
          file.name,
          {
            folder: 'bananalink/products',
            tags: ['product', 'bananalink', index === 0 ? 'primary' : 'secondary'],
            context: {
              uploadSource: 'product_upload',
              userId: req.user?.id || req.user?.userId || 'anonymous',
              isPrimary: index === 0
            },
            transformations: [
              { width: 800, height: 600, crop: 'fill' },
              { quality: 'auto:good' }
            ]
          }
        );

        if (uploadResult.success) {
          return {
            originalName: file.name,
            size: file.size,
            mimetype: file.mimetype,
            cloudinary: uploadResult.data.cloudinary,
            localBackup: uploadResult.data.localBackup,
            metadata: uploadResult.data.metadata,
            isPrimary: index === 0,
            success: true
          };
        } else {
          console.error(`Failed to upload ${file.name}:`, uploadResult.error);
          return {
            originalName: file.name,
            error: uploadResult.error,
            success: false,
            isPrimary: index === 0
          };
        }
      } catch (error) {
        console.error(`Error uploading ${file.name}:`, error);
        return {
          originalName: file.name,
          error: error.message,
          success: false,
          isPrimary: index === 0
        };
      }
    });

    const uploadedImages = await Promise.all(uploadPromises);
    const successfulImages = uploadedImages.filter(img => img.success !== false);

    if (successfulImages.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid images were uploaded',
        code: 'NO_VALID_IMAGES',
        failedImages: uploadedImages.filter(img => img.success === false)
      });
    }

    const imageUrls = successfulImages.map((img, index) => {
      return {
        public_id: img.cloudinary.public_id,
        secure_url: img.cloudinary.secure_url,
        format: img.cloudinary.format,
        width: img.cloudinary.width,
        height: img.cloudinary.height,
        bytes: img.cloudinary.bytes,
        uploaded_at: img.cloudinary.created_at || new Date(),
        altText: `Uploaded Image ${index + 1}`,
        isPrimary: img.isPrimary,
        order: index,
        original_filename: img.originalName,
        resource_type: img.cloudinary.resource_type || 'image'
      };
    });

    res.json({
      success: true,
      message: 'Images uploaded successfully to Cloudinary',
      data: {
        images: imageUrls,
        uploadStats: {
          totalUploaded: uploadedImages.length,
          successful: successfulImages.length,
          failed: uploadedImages.length - successfulImages.length
        }
      },
      code: 'IMAGES_UPLOADED'
    });
  } catch (error) {
    console.error('Upload images error:', error);

    res.status(500).json({
      success: false,
      message: 'Error uploading images',
      code: 'IMAGE_UPLOAD_ERROR',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get all products with advanced filtering
// @route   GET /api/v1/products
// @access  Public
exports.getProducts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      search,
      category,
      subcategory,
      companyId,
      featured,
      tags,
      minPrice,
      maxPrice,
      status = 'active',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = { status };

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { shortDescription: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } },
        { sku: { $regex: search, $options: 'i' } }
      ];
    }

    if (category) filter.category = category;
    if (subcategory) filter.subcategory = subcategory;
    if (companyId) filter.companyId = companyId;
    if (featured !== undefined) filter.featured = featured === 'true';

    if (minPrice || maxPrice) {
      filter['price.amount'] = {};
      if (minPrice) filter['price.amount'].$gte = parseFloat(minPrice);
      if (maxPrice) filter['price.amount'].$lte = parseFloat(maxPrice);
    }

    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : tags.split(',');
      filter.tags = { $in: tagArray.map(tag => tag.toLowerCase()) };
    }

    const sortOptions = {};
    const validSortFields = ['name', 'price.amount', 'createdAt', 'updatedAt', 'views', 'featured'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
    sortOptions[sortField] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with pagination
    const products = await Product.find(filter)
      .populate('companyId', 'name logoUrl verified industry description website')
      .sort(sortOptions)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .select('-images.public_id')
      .lean();

    // Transform images to only expose secure_url for public access
    const transformedProducts = products.map(product => ({
      ...product,
      images: product.images.map(img => ({
        secure_url: img.secure_url,
        altText: img.altText,
        isPrimary: img.isPrimary,
        order: img.order,
        width: img.width,
        height: img.height
      }))
    }));

    const total = await Product.countDocuments(filter);
    const categories = await Product.distinct('category', { status: 'active' });
    const companies = await Product.distinct('companyId', { status: 'active' });

    res.json({
      success: true,
      data: {
        products: transformedProducts,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
          total,
          limit: parseInt(limit)
        },
        filters: {
          categories,
          companies: companies.length
        }
      },
      code: 'PRODUCTS_RETRIEVED'
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching products',
      code: 'PRODUCTS_FETCH_ERROR'
    });
  }
};

// @desc    Get single product by ID
// @route   GET /api/v1/products/:id
// @access  Public
exports.getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('companyId', 'name logoUrl verified industry description website contactEmail phoneNumber address socialMedia')
      .lean();

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
        code: 'PRODUCT_NOT_FOUND'
      });
    }

    // Increment view count
    if (product.status === 'active') {
      await Product.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } });
    }

    // For public access, only expose secure_url, not public_id
    const transformedProduct = {
      ...product,
      images: product.images.map(img => ({
        secure_url: img.secure_url,
        altText: img.altText,
        isPrimary: img.isPrimary,
        order: img.order,
        width: img.width,
        height: img.height
      }))
    };

    res.json({
      success: true,
      data: { product: transformedProduct },
      code: 'PRODUCT_RETRIEVED'
    });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching product',
      code: 'PRODUCT_FETCH_ERROR'
    });
  }
};

// @desc    Update product
// @route   PUT /api/v1/products/:id
// @access  Private (Company/Admin)
exports.updateProduct = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      name,
      description,
      shortDescription,
      price,
      category,
      subcategory,
      tags,
      specifications,
      featured,
      status,
      metaTitle,
      metaDescription,
      sku,
      inventory,
      existingImages,
      primaryImageIndex,
      imagesToDelete
    } = req.body;

    console.log('🔄 updateProduct called with middleware results:', req.cloudinaryProductImages);

    let product = await Product.findById(req.params.id).session(session);

    if (!product) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: 'Product not found',
        code: 'PRODUCT_NOT_FOUND'
      });
    }

    // Check permissions
    const isAdmin = req.user?.role === 'admin';
    let isOwner = false;

    if (req.user?.role === 'company') {
      const userCompany = await Company.findOne({ user: req.user.userId || req.user._id }).session(session);
      if (userCompany) {
        isOwner = product.companyId.toString() === userCompany._id.toString();
      }
    }

    if (!isAdmin && !isOwner) {
      await session.abortTransaction();
      session.endSession();
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only update your own products.',
        code: 'ACCESS_DENIED'
      });
    }

    // Handle image deletions from Cloudinary
    if (imagesToDelete) {
      const imagesToDeleteArray = Array.isArray(imagesToDelete) ? imagesToDelete : JSON.parse(imagesToDelete);

      const deletePromises = imagesToDeleteArray.map(publicId =>
        deleteFromCloudinary(publicId, 'image')
      );

      try {
        await Promise.all(deletePromises);
        console.log(`Deleted ${deletePromises.length} images from Cloudinary`);
      } catch (deleteError) {
        console.error('Error deleting Cloudinary images:', deleteError);
      }

      // Remove deleted images from product
      product.images = product.images.filter(img =>
        !imagesToDeleteArray.includes(img.public_id)
      );
    }

    // Handle existing images
    let updatedImages = [];
    if (existingImages) {
      const existingImagesArray = parseField(existingImages);
      updatedImages = product.images.filter(img =>
        existingImagesArray.some(existing =>
          existing.public_id === img.public_id
        )
      );
    } else {
      updatedImages = [...product.images];
    }

    // Add new uploaded images from middleware
    if (req.cloudinaryProductImages && req.cloudinaryProductImages.images) {
      const successfulImages = req.cloudinaryProductImages.images.filter(img => img.success !== false);
      
      console.log(`📸 Adding ${successfulImages.length} new image(s) from middleware`);

      const newImages = successfulImages.map((img, index) => {
        return {
          public_id: img.cloudinary.public_id,
          secure_url: img.cloudinary.secure_url,
          format: img.cloudinary.format,
          width: img.cloudinary.width,
          height: img.cloudinary.height,
          bytes: img.cloudinary.bytes,
          uploaded_at: img.cloudinary.created_at || new Date(),
          altText: `${name || product.name} - Image ${updatedImages.length + index + 1}`,
          isPrimary: false,
          order: updatedImages.length + index,
          original_filename: img.originalName,
          resource_type: img.cloudinary.resource_type || 'image'
        };
      });
      
      updatedImages = [...updatedImages, ...newImages];
    }

    // Set primary image
    if (primaryImageIndex !== undefined && updatedImages[primaryImageIndex]) {
      updatedImages.forEach((img, index) => {
        img.isPrimary = index === parseInt(primaryImageIndex);
      });
    } else if (updatedImages.length > 0 && !updatedImages.some(img => img.isPrimary)) {
      updatedImages[0].isPrimary = true;
    }

    if (updatedImages.length === 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'Product must have at least one image.',
        code: 'NO_IMAGES'
      });
    }

    // Update thumbnail from primary image
    const primaryImage = updatedImages.find(img => img.isPrimary);
    const thumbnail = primaryImage ? {
      public_id: primaryImage.public_id,
      secure_url: primaryImage.secure_url
    } : product.thumbnail;

    // Parse other fields
    const tagsArray = parseField(tags, product.tags);
    const specsArray = parseField(specifications, product.specifications);
    const inventoryData = inventory ? (typeof inventory === 'string' ? JSON.parse(inventory) : inventory) : product.inventory;
    const priceData = price ? (typeof price === 'string' ? JSON.parse(price) : price) : product.price;

    // Update fields
    const updateFields = {
      name: name ? cleanString(name) : product.name,
      description: description ? cleanString(description) : product.description,
      shortDescription: shortDescription ? cleanString(shortDescription) : product.shortDescription,
      price: {
        amount: priceData.amount ? parseFloat(priceData.amount.toFixed(2)) : product.price.amount,
        currency: priceData.currency || product.price.currency,
        unit: priceData.unit || product.price.unit
      },
      images: updatedImages,
      thumbnail,
      category: category ? cleanString(category) : product.category,
      subcategory: subcategory ? cleanString(subcategory) : product.subcategory,
      tags: tagsArray.map(tag => cleanString(tag).toLowerCase()),
      specifications: specsArray.map(spec => ({
        key: cleanString(spec.key),
        value: cleanString(spec.value)
      })),
      featured: featured !== undefined ? (featured === 'true' || featured === true) : product.featured,
      status: status || product.status,
      metaTitle: metaTitle ? cleanString(metaTitle) : product.metaTitle,
      metaDescription: metaDescription ? cleanString(metaDescription) : product.metaDescription,
      sku: sku || product.sku,
      inventory: {
        quantity: inventoryData.quantity !== undefined ? inventoryData.quantity : product.inventory.quantity,
        trackQuantity: inventoryData.trackQuantity !== undefined ? inventoryData.trackQuantity : product.inventory.trackQuantity,
        lowStockAlert: inventoryData.lowStockAlert || product.inventory.lowStockAlert
      }
    };

    product = await Product.findByIdAndUpdate(
      req.params.id,
      updateFields,
      { new: true, runValidators: true, session }
    );

    // Then populate separately:
    await Product.populate(product, {
      path: 'companyId',
      select: 'name logoUrl verified industry'
    });

    await session.commitTransaction();
    session.endSession();

    res.json({
      success: true,
      message: 'Product updated successfully',
      data: { product },
      code: 'PRODUCT_UPDATED'
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    console.error('Update product error:', error);

    if (error.code === 11000 && error.keyPattern.sku) {
      return res.status(400).json({
        success: false,
        message: 'SKU already exists. Please use a different SKU.',
        code: 'DUPLICATE_SKU'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error updating product',
      code: 'PRODUCT_UPDATE_ERROR'
    });
  }
};

// @desc    Delete product
// @route   DELETE /api/v1/products/:id
// @access  Private (Company/Admin)
exports.deleteProduct = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const product = await Product.findById(req.params.id).session(session);

    if (!product) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: 'Product not found',
        code: 'PRODUCT_NOT_FOUND'
      });
    }

    // Check permissions
    const isAdmin = req.user?.role === 'admin';
    let isOwner = false;

    if (req.user?.role === 'company') {
      const userCompany = await Company.findOne({ user: req.user.userId || req.user._id }).session(session);
      if (userCompany) {
        isOwner = product.companyId.toString() === userCompany._id.toString();
      }
    }

    if (!isAdmin && !isOwner) {
      await session.abortTransaction();
      session.endSession();
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only delete your own products.',
        code: 'ACCESS_DENIED'
      });
    }

    // Delete associated images from Cloudinary
    if (product.images && product.images.length > 0) {
      const deletePromises = product.images.map(img =>
        deleteFromCloudinary(img.public_id, 'image')
      );

      try {
        await Promise.all(deletePromises);
      } catch (deleteError) {
        console.error('Error deleting Cloudinary images:', deleteError);
      }
    }

    // Delete product from database
    await Product.findByIdAndDelete(req.params.id).session(session);

    await session.commitTransaction();
    session.endSession();

    res.json({
      success: true,
      message: 'Product deleted successfully',
      code: 'PRODUCT_DELETED'
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    console.error('Delete product error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting product',
      code: 'PRODUCT_DELETE_ERROR'
    });
  }
};

// @desc    Get products by company
// @route   GET /api/v1/products/company/:companyId
// @access  Public
exports.getCompanyProducts = async (req, res) => {
  try {
    const { companyId } = req.params;
    const {
      page = 1,
      limit = 12,
      status = 'active',
      category,
      featured,
      search,
      sort = 'newest',
      minPrice,
      maxPrice
    } = req.query;

    let company = await Company.findById(companyId);
    if (!company) {
      company = await Company.findOne({ user: companyId });
    }

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found',
        code: 'COMPANY_NOT_FOUND'
      });
    }

    const filter = {
      companyId: company._id,
      status: status === 'draft' ? 'draft' : 'active'
    };

    if (category) filter.category = category;
    if (featured !== undefined) filter.featured = featured === 'true';
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    if (minPrice || maxPrice) {
      filter['price.amount'] = {};
      if (minPrice) filter['price.amount'].$gte = parseFloat(minPrice);
      if (maxPrice) filter['price.amount'].$lte = parseFloat(maxPrice);
    }

    const sortOptions = {};
    switch (sort) {
      case 'newest':
        sortOptions.createdAt = -1;
        break;
      case 'popular':
        sortOptions.views = -1;
        break;
      case 'price_asc':
        sortOptions['price.amount'] = 1;
        break;
      case 'price_desc':
        sortOptions['price.amount'] = -1;
        break;
      default:
        sortOptions.createdAt = -1;
    }

    const products = await Product.find(filter)
      .populate('companyId', 'name logoUrl verified industry description website')
      .sort(sortOptions)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .select('-images.public_id')
      .lean();

    const total = await Product.countDocuments(filter);

    const stats = await Product.aggregate([
      { $match: { companyId: company._id } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalViews: { $sum: '$views' },
          avgPrice: { $avg: '$price.amount' }
        }
      }
    ]);

    const formattedStats = {
      totalViews: 0,
      activeProducts: 0,
      draftProducts: 0,
      avgPrice: 0
    };

    stats.forEach(stat => {
      if (stat._id === 'active') {
        formattedStats.activeProducts = stat.count;
      } else if (stat._id === 'draft') {
        formattedStats.draftProducts = stat.count;
      }
      formattedStats.totalViews += stat.totalViews || 0;
      formattedStats.avgPrice = stat.avgPrice || 0;
    });

    // Transform images for public access
    const transformedProducts = products.map(product => ({
      ...product,
      images: product.images.map(img => ({
        secure_url: img.secure_url,
        altText: img.altText,
        isPrimary: img.isPrimary,
        order: img.order
      }))
    }));

    res.json({
      success: true,
      data: {
        products: transformedProducts,
        company: {
          _id: company._id,
          name: company.name,
          logoUrl: company.logoUrl,
          verified: company.verified,
          industry: company.industry,
          description: company.description,
          website: company.website
        },
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
          total,
          limit: parseInt(limit)
        },
        stats: formattedStats,
        filters: {
          categories: await Product.distinct('category', { companyId: company._id, status: 'active' }),
          totalProducts: total
        }
      },
      code: 'COMPANY_PRODUCTS_RETRIEVED'
    });
  } catch (error) {
    console.error('Get company products error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching company products',
      code: 'COMPANY_PRODUCTS_ERROR'
    });
  }
};

// @desc    Get product categories
// @route   GET /api/v1/products/categories
// @access  Public
exports.getCategories = async (req, res) => {
  try {
    const categories = await Product.aggregate([
      { $match: { status: 'active' } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          subcategories: { $addToSet: '$subcategory' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    const formattedCategories = categories.map(cat => ({
      name: cat._id,
      count: cat.count,
      subcategories: cat.subcategories.filter(sub => sub && sub.trim() !== '')
    }));

    res.json({
      success: true,
      data: { categories: formattedCategories },
      code: 'CATEGORIES_RETRIEVED'
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching categories',
      code: 'CATEGORIES_ERROR'
    });
  }
};

// @desc    Get featured products
// @route   GET /api/v1/products/featured
// @access  Public
exports.getFeaturedProducts = async (req, res) => {
  try {
    const { limit = 8 } = req.query;

    const products = await Product.find({
      status: 'active',
      featured: true
    })
      .populate('companyId', 'name logoUrl verified')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .select('-images.public_id')
      .lean();

    // Transform images for public access
    const transformedProducts = products.map(product => ({
      ...product,
      images: product.images.map(img => ({
        secure_url: img.secure_url,
        altText: img.altText,
        isPrimary: img.isPrimary
      }))
    }));

    res.json({
      success: true,
      data: { products: transformedProducts },
      code: 'FEATURED_PRODUCTS_RETRIEVED'
    });
  } catch (error) {
    console.error('Get featured products error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching featured products',
      code: 'FEATURED_PRODUCTS_ERROR'
    });
  }
};

// @desc    Get related products
// @route   GET /api/v1/products/:id/related
// @access  Public
exports.getRelatedProducts = async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 4 } = req.query;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
        code: 'PRODUCT_NOT_FOUND'
      });
    }

    const relatedProducts = await Product.find({
      _id: { $ne: id },
      $or: [
        { category: product.category },
        { companyId: product.companyId },
        { tags: { $in: product.tags } }
      ],
      status: 'active'
    })
      .populate('companyId', 'name logoUrl verified')
      .limit(parseInt(limit))
      .sort({ featured: -1, views: -1 })
      .select('-images.public_id')
      .lean();

    // Transform images for public access
    const transformedProducts = relatedProducts.map(product => ({
      ...product,
      images: product.images.map(img => ({
        secure_url: img.secure_url,
        altText: img.altText,
        isPrimary: img.isPrimary
      }))
    }));

    res.json({
      success: true,
      data: { products: transformedProducts },
      code: 'RELATED_PRODUCTS_RETRIEVED'
    });
  } catch (error) {
    console.error('Get related products error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching related products',
      code: 'RELATED_PRODUCTS_ERROR'
    });
  }
};

// @desc    Update product status
// @route   PATCH /api/v1/products/:id/status
// @access  Private (Company/Admin)
exports.updateProductStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['active', 'inactive', 'draft'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be one of: active, inactive, draft',
        code: 'INVALID_STATUS'
      });
    }

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
        code: 'PRODUCT_NOT_FOUND'
      });
    }

    const isAdmin = req.user?.role === 'admin';
    let isOwner = false;

    if (req.user?.role === 'company') {
      const userCompany = await Company.findOne({ user: req.user.userId || req.user._id });
      if (userCompany) {
        isOwner = product.companyId.toString() === userCompany._id.toString();
      }
    }

    if (!isAdmin && !isOwner) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only update your own products.',
        code: 'ACCESS_DENIED'
      });
    }

    product.status = status;
    await product.save();

    res.json({
      success: true,
      message: `Product status updated to ${status}`,
      data: { product },
      code: 'PRODUCT_STATUS_UPDATED'
    });
  } catch (error) {
    console.error('Update product status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating product status',
      code: 'PRODUCT_STATUS_ERROR'
    });
  }
};

// @desc    Get product upload statistics (Cloudinary stats)
// @route   GET /api/v1/products/stats/uploads
// @access  Private (Company/Admin)
exports.getProductUploadStats = async (req, res) => {
  try {
    const cloudinaryStorageService = require('../services/cloudinaryStorageService');
    const stats = cloudinaryStorageService.getStatistics();

    // Filter for product-related stats
    const productStats = {
      totalProducts: stats.backupCount,
      totalSize: stats.backupSize,
      byType: stats.byType
    };

    res.status(200).json({
      success: true,
      data: {
        productStats,
        totalUploads: stats.totalUploads,
        successfulUploads: stats.successfulUploads,
        failedUploads: stats.failedUploads,
        totalSize: stats.totalSize,
        dailyStats: stats.dailyStats,
        lastUpdated: stats.lastUpdated
      },
      code: 'UPLOAD_STATS_RETRIEVED'
    });
  } catch (error) {
    console.error('Get upload stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving upload statistics',
      code: 'UPLOAD_STATS_ERROR'
    });
  }
};
