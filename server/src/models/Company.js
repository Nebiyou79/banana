const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true,
    maxlength: [100, 'Company name cannot exceed 100 characters']
  },
  tin: {
    type: String,
    trim: true,
    unique: true,
    sparse: true
  },
  industry: {
    type: String,
    trim: true
  },
  logoUrl: {
    type: String
  },
  bannerUrl: {
    type: String
  },
  description: {
    type: String,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  address: {
    type: String,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  website: {
    type: String,
    trim: true
  },
  verified: {
    type: Boolean,
    default: false
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Company', companySchema);