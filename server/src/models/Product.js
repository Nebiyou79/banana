/**
 * server/src/models/Product.js  (UPDATED)
 *
 * Changes from previous version:
 *  - category / subcategory now use the shared taxonomy slugs (string, indexed)
 *  - price.unit enum expanded to support more real-world units
 *  - savedBy array added for save-product feature
 *  - status enum extended with 'out_of_stock' and 'discontinued'
 *  - ownerSnapshot embedded for fast list rendering (name, logoUrl, verified)
 */
const mongoose = require('mongoose');

// ── image sub-document ────────────────────────────────────────────────────────
const productImageSchema = new mongoose.Schema({
  public_id:         { type: String, required: true },
  secure_url:        { type: String, required: true },
  format:            String,
  width:             Number,
  height:            Number,
  bytes:             Number,
  uploaded_at:       { type: Date, default: Date.now },
  altText:           { type: String, default: '' },
  isPrimary:         { type: Boolean, default: false },
  order:             { type: Number, default: 0 },
  original_filename: String,
  resource_type:     { type: String, default: 'image' },
});

// ── owner snapshot (denormalized for fast list queries) ───────────────────────
const ownerSnapshotSchema = new mongoose.Schema(
  {
    name:       { type: String, trim: true },
    logoUrl:    String,   // legacy
    avatarUrl:  String,   // from Profile.avatar.secure_url
    avatarPublicId: String,
    verified:   { type: Boolean, default: false },
    industry:   String,
    website:    String,
  },
  { _id: false }
);

// ── main schema ───────────────────────────────────────────────────────────────
const productSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, 'Company ID is required'],
      index: true,
    },

    // Denormalized snapshot so list endpoints don't need to populate Company
    ownerSnapshot: ownerSnapshotSchema,

    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      maxlength: [120, 'Product name cannot exceed 120 characters'],
    },
    description: {
      type: String,
      required: [true, 'Product description is required'],
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    shortDescription: {
      type: String,
      maxlength: [250, 'Short description cannot exceed 250 characters'],
    },

    price: {
      amount: {
        type: Number,
        required: [true, 'Product price is required'],
        min: [0, 'Price cannot be negative'],
        set: (v) => Math.round(v * 100) / 100,
      },
      currency: {
        type: String,
        default: 'USD',
        enum: ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CNY', 'ETB', 'KES', 'NGN', 'ZAR', 'GHS'],
        uppercase: true,
      },
      unit: {
        type: String,
        default: 'unit',
        // Expanded — no strict enum so custom units are allowed
        trim: true,
        maxlength: 30,
      },
      displayPrice: String,
    },

    images:    [productImageSchema],
    thumbnail: { public_id: String, secure_url: String },

    // Category taxonomy (slugs from PRODUCT_CATEGORIES)
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
      index: true,
    },
    subcategory: {
      type: String,
      trim: true,
      index: true,
    },

    tags: [{ type: String, trim: true, lowercase: true }],

    specifications: [
      {
        key:   { type: String, trim: true },
        value: { type: String, trim: true },
      },
    ],

    featured:   { type: Boolean, default: false, index: true },

    status: {
      type: String,
      enum: ['active', 'inactive', 'draft', 'out_of_stock', 'discontinued'],
      default: 'draft',
      index: true,
    },

    views: { type: Number, default: 0 },

    // ── Save-product feature ──────────────────────────────────────────────────
    savedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    savedCount: { type: Number, default: 0 },

    // ── SEO ───────────────────────────────────────────────────────────────────
    metaTitle:       { type: String, maxlength: 60 },
    metaDescription: { type: String, maxlength: 160 },
    sku: {
      type: String,
      trim: true,
      uppercase: true,
      sparse: true,
    },

    inventory: {
      quantity:      { type: Number, default: 0, min: 0 },
      trackQuantity: { type: Boolean, default: false },
      lowStockAlert: { type: Number, default: 10 },
    },
  },
  {
    timestamps: true,
    toJSON:   { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ── Indexes ───────────────────────────────────────────────────────────────────
productSchema.index({ companyId: 1, createdAt: -1 });
productSchema.index({ category: 1, subcategory: 1, status: 1 });
productSchema.index({ featured: 1, status: 1 });
productSchema.index({ 'price.amount': 1 });
productSchema.index({ tags: 1 });
productSchema.index({ status: 1, createdAt: -1 });
productSchema.index({ savedBy: 1 });
productSchema.index(
  { name: 'text', description: 'text', tags: 'text', 'ownerSnapshot.name': 'text' },
  { weights: { name: 10, tags: 5, description: 3, 'ownerSnapshot.name': 2 } }
);

// ── Virtuals ──────────────────────────────────────────────────────────────────
productSchema.virtual('formattedPrice').get(function () {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: this.price.currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(this.price.amount);
  } catch {
    return `${this.price.currency} ${this.price.amount.toFixed(2)}`;
  }
});

productSchema.virtual('url').get(function () {
  return `/products/${this._id}`;
});

// ── Middleware ────────────────────────────────────────────────────────────────
productSchema.pre('save', function (next) {
  if (this.price?.amount) {
    try {
      this.price.displayPrice = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: this.price.currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(this.price.amount);
    } catch {}
  }
  // keep savedCount in sync
  this.savedCount = (this.savedBy || []).length;
  next();
});

// ── Methods ───────────────────────────────────────────────────────────────────
productSchema.methods.incrementViews = async function () {
  this.views += 1;
  return this.save();
};

productSchema.methods.setPrimaryImage = async function (imagePublicId) {
  this.images.forEach(img => { img.isPrimary = img.public_id === imagePublicId; });
  const primary = this.images.find(img => img.isPrimary);
  if (primary) this.thumbnail = { public_id: primary.public_id, secure_url: primary.secure_url };
  return this.save();
};

productSchema.methods.deleteCloudinaryImages = async function () {
  const { deleteFromCloudinary } = require('../config/cloudinary');
  const promises = this.images.map(img => deleteFromCloudinary(img.public_id, 'image'));
  if (this.thumbnail?.public_id) promises.push(deleteFromCloudinary(this.thumbnail.public_id, 'image'));
  await Promise.allSettled(promises);
};

// ── Statics ───────────────────────────────────────────────────────────────────
productSchema.statics.getFeatured = function (limit = 10) {
  return this.find({ featured: true, status: 'active' })
    .sort({ createdAt: -1 })
    .limit(limit);
};

productSchema.statics.getByCompany = function (companyId, page = 1, limit = 12) {
  return this.find({ companyId })
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);
};

module.exports = mongoose.model('Product', productSchema);
