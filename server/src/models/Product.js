const mongoose = require('mongoose');

const productImageSchema = new mongoose.Schema({
  public_id: {
    type: String,
    required: true
  },
  secure_url: {
    type: String,
    required: true
  },
  format: String,
  width: Number,
  height: Number,
  bytes: Number,
  uploaded_at: {
    type: Date,
    default: Date.now
  },
  altText: {
    type: String,
    default: ''
  },
  isPrimary: {
    type: Boolean,
    default: false
  },
  order: {
    type: Number,
    default: 0
  },
  original_filename: String,
  resource_type: {
    type: String,
    default: 'image'
  }
});

const productSchema = new mongoose.Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: [true, 'Company ID is required']
  },
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: [120, 'Product name cannot exceed 120 characters']
  },
  description: {
    type: String,
    required: [true, 'Product description is required'],
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  shortDescription: {
    type: String,
    maxlength: [250, 'Short description cannot exceed 250 characters']
  },
  price: {
    amount: {
      type: Number,
      required: [true, 'Product price is required'],
      min: [0, 'Price cannot be negative'],
      set: v => Math.round(v * 100) / 100
    },
    currency: {
      type: String,
      default: 'USD',
      enum: ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CNY', 'ETB'],
      uppercase: true
    },
    unit: {
      type: String,
      default: 'unit',
      enum: ['unit', 'kg', 'lb', 'piece', 'set', 'pair', 'dozen', 'meter', 'liter']
    },
    displayPrice: String
  },
  // UPDATED: Cloudinary-based image structure
  images: [productImageSchema],

  // NEW: Thumbnail for quick access
  thumbnail: {
    public_id: String,
    secure_url: String
  },

  category: {
    type: String,
    required: [true, 'Category is required'],
    index: true,
    trim: true
  },
  subcategory: {
    type: String,
    trim: true,
    index: true
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  specifications: [{
    key: {
      type: String,
      required: false,
      trim: true
    },
    value: {
      type: String,
      required: false,
      trim: true
    }
  }],
  featured: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'draft'],
    default: 'draft'
  },
  views: {
    type: Number,
    default: 0
  },
  metaTitle: {
    type: String,
    maxlength: [60, 'Meta title cannot exceed 60 characters']
  },
  metaDescription: {
    type: String,
    maxlength: [160, 'Meta description cannot exceed 160 characters']
  },
  sku: {
    type: String,
    trim: true,
    uppercase: true,
    sparse: true
  },
  inventory: {
    quantity: {
      type: Number,
      default: 0,
      min: 0
    },
    trackQuantity: {
      type: Boolean,
      default: false
    },
    lowStockAlert: {
      type: Number,
      default: 10
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for optimal performance
productSchema.index({ companyId: 1, createdAt: -1 });
productSchema.index({ category: 1, status: 1 });
productSchema.index({ featured: 1, status: 1 });
productSchema.index({ 'price.amount': 1 });
productSchema.index({ tags: 1 });
productSchema.index({ status: 1, createdAt: -1 });
productSchema.index({ name: 'text', description: 'text', tags: 'text' });

// Virtual for formatted price
productSchema.virtual('formattedPrice').get(function () {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: this.price.currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  return formatter.format(this.price.amount);
});

// Virtual for product URL
productSchema.virtual('url').get(function () {
  return `/products/${this._id}`;
});

// Pre-save middleware to format display price
productSchema.pre('save', function (next) {
  if (this.price && this.price.amount) {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: this.price.currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    this.price.displayPrice = formatter.format(this.price.amount);
  }
  next();
});

// Method to increment views
productSchema.methods.incrementViews = async function () {
  this.views += 1;
  return await this.save();
};

// Method to set primary image
productSchema.methods.setPrimaryImage = async function (imagePublicId) {
  this.images.forEach(img => {
    img.isPrimary = img.public_id === imagePublicId;
  });

  // Update thumbnail if primary image changes
  const primaryImage = this.images.find(img => img.isPrimary);
  if (primaryImage) {
    this.thumbnail = {
      public_id: primaryImage.public_id,
      secure_url: primaryImage.secure_url
    };
  }

  return await this.save();
};

// Method to delete Cloudinary images
productSchema.methods.deleteCloudinaryImages = async function () {
  const { deleteFromCloudinary } = require('../config/cloudinary');

  // Delete all product images from Cloudinary
  const deletePromises = this.images.map(img =>
    deleteFromCloudinary(img.public_id, 'image')
  );

  // Delete thumbnail if exists
  if (this.thumbnail && this.thumbnail.public_id) {
    deletePromises.push(deleteFromCloudinary(this.thumbnail.public_id, 'image'));
  }

  try {
    await Promise.all(deletePromises);
    console.log(`✅ Deleted ${deletePromises.length} images from Cloudinary for product ${this._id}`);
  } catch (error) {
    console.error('❌ Error deleting Cloudinary images:', error);
    // Don't throw error, just log it
  }
};

// Static method to get featured products
productSchema.statics.getFeatured = function (limit = 10) {
  return this.find({
    featured: true,
    status: 'active'
  })
    .populate('companyId', 'name logoUrl verified industry')
    .sort({ createdAt: -1 })
    .limit(limit);
};

// Static method to get products by company with pagination
productSchema.statics.getByCompany = function (companyId, page = 1, limit = 12) {
  const skip = (page - 1) * limit;
  return this.find({ companyId })
    .populate('companyId', 'name logoUrl verified industry')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

module.exports = mongoose.model('Product', productSchema);