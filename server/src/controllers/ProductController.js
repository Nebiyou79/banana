const Product = require('../models/Product');
const Company = require('../models/Company');
const mongoose = require('mongoose');
const {
  generateImageUrl,
  deleteProductImages,
  deleteProductImage
} = require('../middleware/productUploadMiddleware');

// @desc    Create a new product
// @route   POST /api/v1/products
// @access  Private (Company/Admin)
exports.createProduct = async (req, res) => {
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
      inventory
    } = req.body;

    // Verify user is Company or Admin
    if (!req.user || (req.user.role !== 'company' && req.user.role !== 'admin')) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only companies and admins can create products.'
      });
    }

    // Check if images were uploaded
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one product image is required.'
      });
    }

    // Validate and parse price
    let priceData;
    try {
      priceData = typeof price === 'string' ? JSON.parse(price) : price;
      if (!priceData || typeof priceData.amount !== 'number' || priceData.amount < 0) {
        throw new Error('Valid price amount is required');
      }
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: 'Valid price is required'
      });
    }

    // Process uploaded images
    const productImages = req.processedFiles ? req.processedFiles.map((file, index) => ({
      url: file.url,
      altText: file.altText || `${name} - Image ${index + 1}`,
      isPrimary: index === 0,
      order: index
    })) : req.files.map((file, index) => ({
      url: generateImageUrl(file.filename),
      altText: `${name} - Image ${index + 1}`,
      isPrimary: index === 0,
      order: index
    }));

    // Parse other fields
    const cleanString = (str) => {
      if (typeof str !== 'string') return str;
      return str.replace(/^"(.*)"$/, '$1').trim();
    };

    const tagsArray = tags ? (Array.isArray(tags) ? tags : JSON.parse(tags)) : [];
    const specsArray = specifications ? (Array.isArray(specifications) ? specifications : JSON.parse(specifications)) : [];
    const inventoryData = inventory ? (typeof inventory === 'string' ? JSON.parse(inventory) : inventory) : {};

    // Generate SKU if not provided
    const productSku = sku || `PROD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // FIX: Get the actual Company document ID, not the User ID
    let companyId;

    if (req.user.role === 'company') {
      // Find the company associated with this user
      const Company = require('../models/Company');
      const company = await Company.findOne({ user: req.user._id });

      if (!company) {
        return res.status(404).json({
          success: false,
          message: 'Company profile not found. Please complete your company profile first.'
        });
      }

      companyId = company._id;
    } else if (req.user.role === 'admin') {
      // Admin can specify companyId
      companyId = req.body.companyId;

      if (!companyId) {
        return res.status(400).json({
          success: false,
          message: 'Company ID is required when creating products as admin'
        });
      }
    }

    // Create product
    const product = new Product({
      companyId: companyId,
      name: cleanString(name),
      description: cleanString(description),
      shortDescription: cleanString(shortDescription || description.substring(0, 200)),
      price: {
        amount: parseFloat(priceData.amount.toFixed(2)),
        currency: priceData.currency || 'USD',
        unit: priceData.unit || 'unit'
      },
      images: productImages,
      category: cleanString(category),
      subcategory: subcategory ? cleanString(subcategory) : '',
      tags: tagsArray.map(tag => cleanString(tag).toLowerCase()),
      specifications: specsArray.map(spec => ({
        key: cleanString(spec.key),
        value: cleanString(spec.value)
      })),
      featured: featured === 'true' || featured === true,
      status: 'active',
      metaTitle: cleanString(metaTitle || name),
      metaDescription: cleanString(metaDescription || description.substring(0, 160)),
      sku: productSku,
      inventory: {
        quantity: inventoryData.quantity || 0,
        trackQuantity: inventoryData.trackQuantity || false,
        lowStockAlert: inventoryData.lowStockAlert || 10
      }
    });

    await product.save();

    // Populate company info
    await product.populate('companyId', 'name logoUrl verified industry description website');

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: { product }
    });
  } catch (error) {
    console.error('Create product error:', error);

    // Clean up uploaded files if product creation fails
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        deleteProductImage(file.filename);
      });
    }

    // Handle duplicate SKU error
    if (error.code === 11000 && error.keyPattern.sku) {
      return res.status(400).json({
        success: false,
        message: 'SKU already exists. Please use a different SKU.'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error creating product',
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

    // Text search
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { shortDescription: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } },
        { sku: { $regex: search, $options: 'i' } }
      ];
    }

    // Category filters
    if (category) filter.category = category;
    if (subcategory) filter.subcategory = subcategory;
    if (companyId) filter.companyId = companyId;
    if (featured !== undefined) filter.featured = featured === 'true';

    // Price range filter
    if (minPrice || maxPrice) {
      filter['price.amount'] = {};
      if (minPrice) filter['price.amount'].$gte = parseFloat(minPrice);
      if (maxPrice) filter['price.amount'].$lte = parseFloat(maxPrice);
    }

    // Tags filter
    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : tags.split(',');
      filter.tags = { $in: tagArray.map(tag => tag.toLowerCase()) };
    }

    // Sort options
    const sortOptions = {};
    const validSortFields = ['name', 'price.amount', 'createdAt', 'updatedAt', 'views', 'featured'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
    sortOptions[sortField] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with pagination
    const products = await Product.find(filter)
      .populate('companyId', 'name logoUrl verified industry description website')
      .sort(sortOptions)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    // Get total count for pagination
    const total = await Product.countDocuments(filter);

    // Get aggregation data for filters
    const categories = await Product.distinct('category', { status: 'active' });
    const companies = await Product.distinct('companyId', { status: 'active' });

    res.json({
      success: true,
      data: {
        products,
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
      }
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching products',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get single product by ID
// @route   GET /api/v1/products/:id
// @access  Public
exports.getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('companyId', 'name logoUrl verified industry description website contactEmail phoneNumber address socialMedia');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Increment view count (only for active products)
    if (product.status === 'active') {
      await product.incrementViews();
    }

    res.json({
      success: true,
      data: { product }
    });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching product',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Update product
// @route   PUT /api/v1/products/:id
// @access  Private (Company/Admin)
exports.updateProduct = async (req, res) => {
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
      primaryImageIndex
    } = req.body;

    let product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // FIXED: Check permissions - Find the company associated with the user
    const isAdmin = req.user?.role === 'admin';
    let isOwner = false;

    if (req.user?.role === 'company') {
      const Company = require('../models/Company');
      const userCompany = await Company.findOne({ user: req.user._id });

      if (userCompany) {
        // Compare the product's companyId with the user's company ID
        isOwner = product.companyId.toString() === userCompany._id.toString();
        console.log('🔍 Ownership check:', {
          productCompanyId: product.companyId.toString(),
          userCompanyId: userCompany._id.toString(),
          isOwner: isOwner
        });
      }
    }

    if (!isAdmin && !isOwner) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only update your own products.'
      });
    }

    // Handle image updates
    let updatedImages = [];

    // Keep existing images if specified
    if (existingImages) {
      const existingImagesArray = Array.isArray(existingImages) ? existingImages : JSON.parse(existingImages);
      updatedImages = product.images.filter(img =>
        existingImagesArray.includes(img.url)
      );
    } else {
      updatedImages = [...product.images];
    }

    // Add new uploaded images
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map((file, index) => ({
        url: generateImageUrl(file.filename),
        altText: `${name || product.name} - Image ${updatedImages.length + index + 1}`,
        isPrimary: false,
        order: updatedImages.length + index
      }));
      updatedImages = [...updatedImages, ...newImages];
    }

    // Set primary image
    if (primaryImageIndex !== undefined && updatedImages[primaryImageIndex]) {
      updatedImages.forEach((img, index) => {
        img.isPrimary = index === parseInt(primaryImageIndex);
      });
    }

    // If no images left, return error
    if (updatedImages.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Product must have at least one image.'
      });
    }

    // Parse other fields
    const cleanString = (str) => {
      if (typeof str !== 'string') return str;
      return str.replace(/^"(.*)"$/, '$1').trim();
    };

    const tagsArray = tags ? (Array.isArray(tags) ? tags : JSON.parse(tags)) : product.tags;
    const specsArray = specifications ? (Array.isArray(specifications) ? specifications : JSON.parse(specifications)) : product.specifications;
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
      { new: true, runValidators: true }
    ).populate('companyId', 'name logoUrl verified industry');

    res.json({
      success: true,
      message: 'Product updated successfully',
      data: { product }
    });
  } catch (error) {
    console.error('Update product error:', error);

    // Clean up uploaded files if update fails
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        deleteProductImage(file.filename);
      });
    }

    // Handle duplicate SKU error
    if (error.code === 11000 && error.keyPattern.sku) {
      return res.status(400).json({
        success: false,
        message: 'SKU already exists. Please use a different SKU.'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error updating product',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Delete product
// @route   DELETE /api/v1/products/:id
// @access  Private (Company/Admin)
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // FIXED: Check permissions - Find the company associated with the user
    const isAdmin = req.user?.role === 'admin';
    let isOwner = false;

    if (req.user?.role === 'company') {
      const Company = require('../models/Company');
      const userCompany = await Company.findOne({ user: req.user._id });

      if (userCompany) {
        // Compare the product's companyId with the user's company ID
        isOwner = product.companyId.toString() === userCompany._id.toString();
        console.log('🔍 Delete ownership check:', {
          productCompanyId: product.companyId.toString(),
          userCompanyId: userCompany._id.toString(),
          isOwner: isOwner
        });
      }
    }

    if (!isAdmin && !isOwner) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only delete your own products.'
      });
    }

    // Delete associated images
    const imageFilenames = product.images.map(img =>
      img.url.split('/').pop()
    );
    deleteProductImages(imageFilenames);

    await Product.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Product and associated images deleted successfully'
    });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting product',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
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

    console.log('🔍 Fetching products for company:', companyId, 'with params:', req.query);

    // Validate company exists - try multiple lookup methods
    let company;

    try {
      // First try to find by _id
      company = await Company.findById(companyId);

      if (!company) {
        // If not found by ID, try to find by user ID (in case companyId is actually a user ID)
        company = await Company.findOne({ user: companyId });
      }
    } catch (error) {
      console.error('Company lookup error:', error);
    }

    if (!company) {
      console.log('⚠️ Company not found for ID:', companyId);
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    console.log('✅ Found company:', company.name, 'with ID:', company._id);

    // Build filter - use the actual company ID
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

    // Price range filter
    if (minPrice || maxPrice) {
      filter['price.amount'] = {};
      if (minPrice) filter['price.amount'].$gte = parseFloat(minPrice);
      if (maxPrice) filter['price.amount'].$lte = parseFloat(maxPrice);
    }

    // Sort options mapping
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

    // Calculate skip
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query
    const products = await Product.find(filter)
      .populate('companyId', 'name logoUrl verified industry description website')
      .sort(sortOptions)
      .limit(parseInt(limit))
      .skip(skip);

    const total = await Product.countDocuments(filter);

    // Calculate company stats
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

    // Format stats
    const formattedStats = {
      totalViews: 0,
      averageRating: 4.5, // Default
      activeProducts: 0,
      draftProducts: 0,
      totalRevenue: 0,
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

    res.json({
      success: true,
      data: {
        products,
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
      }
    });
  } catch (error) {
    console.error('❌ Get company products error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching company products',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
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
      data: { categories: formattedCategories }
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching categories',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get featured products
// @route   GET /api/v1/products/featured
// @access  Public
exports.getFeaturedProducts = async (req, res) => {
  try {
    const { limit = 8 } = req.query;

    const products = await Product.getFeatured(parseInt(limit));

    res.json({
      success: true,
      data: { products }
    });
  } catch (error) {
    console.error('Get featured products error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching featured products',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
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
        message: 'Product not found'
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
      .sort({ featured: -1, views: -1 });

    res.json({
      success: true,
      data: { products: relatedProducts }
    });
  } catch (error) {
    console.error('Get related products error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching related products',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
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
        message: 'Invalid status. Must be one of: active, inactive, draft'
      });
    }

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // FIXED: Check permissions - Find the company associated with the user
    const isAdmin = req.user?.role === 'admin';
    let isOwner = false;

    if (req.user?.role === 'company') {
      const Company = require('../models/Company');
      const userCompany = await Company.findOne({ user: req.user._id });

      if (userCompany) {
        // Compare the product's companyId with the user's company ID
        isOwner = product.companyId.toString() === userCompany._id.toString();
      }
    }

    if (!isAdmin && !isOwner) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only update your own products.'
      });
    }

    product.status = status;
    await product.save();

    res.json({
      success: true,
      message: `Product status updated to ${status}`,
      data: { product }
    });
  } catch (error) {
    console.error('Update product status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating product status',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Upload product images
// @route   POST /api/v1/products/upload
// @access  Private (Company/Admin)
exports.uploadImages = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No images uploaded'
      });
    }

    const imageUrls = req.files.map((file, index) => ({
      url: generateImageUrl(file.filename),
      altText: `Product Image ${index + 1}`,
      isPrimary: false,
      order: index
    }));

    res.json({
      success: true,
      message: 'Images uploaded successfully',
      data: { images: imageUrls }
    });
  } catch (error) {
    console.error('Upload images error:', error);

    // Clean up uploaded files if error occurs
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        deleteProductImage(file.filename);
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error uploading images',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};