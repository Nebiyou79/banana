const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

// Ensure upload directories exist
const createUploadDirs = () => {
  const dirs = [
    path.join(process.cwd(), 'public', 'uploads', 'products'),
    path.join(process.cwd(), 'public', 'uploads', 'products', 'thumbnails')
  ];
  
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};

createUploadDirs();

// Configure storage for product images
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(process.cwd(), 'public', 'uploads', 'products');
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const userId = req.user?.userId || req.user?._id || 'unknown';
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExtension = path.extname(file.originalname);
    const fileName = `product_${userId}_${timestamp}_${randomString}${fileExtension}`;
    
    console.log(`📁 Saving product image: ${fileName}`);
    cb(null, fileName);
  }
});

// File filter for images only
const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    'image/jpeg', 
    'image/jpg', 
    'image/png', 
    'image/webp', 
    'image/gif',
    'image/svg+xml'
  ];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Allowed types: ${allowedMimes.join(', ')}`), false);
  }
};

// Create multer instance
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 15 * 1024 * 1024, // 15MB limit per file
    files: 12 // Maximum 12 product images
  },
  fileFilter: fileFilter
});

// SIMPLE VERSION - No image processing, just return URLs
const processImages = async (req, res, next) => {
  if (!req.files || req.files.length === 0) {
    return next();
  }

  try {
    const processedFiles = req.files.map((file, index) => ({
      url: generateImageUrl(file.filename),
      altText: `Product Image ${index + 1}`,
      isPrimary: index === 0,
      order: index,
      filename: file.filename
    }));

    req.processedFiles = processedFiles;
    console.log(`✅ Successfully processed ${processedFiles.length} images`);
    next();
  } catch (error) {
    console.error('❌ Image processing error:', error);
    
    // Clean up uploaded files if processing fails
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        deleteProductImage(file.filename);
      });
    }
    
    next(new Error('Failed to process images'));
  }
};

// Middleware for handling multiple product image uploads
const productUpload = upload.array('images', 12);

// Error handling middleware for uploads
const handleUploadErrors = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    let message = 'File upload error';
    
    switch (err.code) {
      case 'LIMIT_FILE_SIZE':
        message = 'File too large. Maximum size is 15MB per image.';
        break;
      case 'LIMIT_FILE_COUNT':
        message = 'Too many files uploaded. Maximum 12 images allowed.';
        break;
      case 'LIMIT_UNEXPECTED_FILE':
        message = 'Unexpected field name. Use "images" for product images.';
        break;
      default:
        message = `Upload error: ${err.message}`;
    }
    
    return res.status(400).json({
      success: false,
      message
    });
  } else if (err) {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }
  next();
};

// Utility function to generate image URLs
const generateImageUrl = (filename) => {
  return `/uploads/products/${filename}`;
};

// Utility function to delete product images
const deleteProductImage = (filename) => {
  try {
    const filePath = path.join(process.cwd(), 'public', 'uploads', 'products', filename);
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`🗑️ Deleted product image: ${filename}`);
    }
    
    return true;
  } catch (error) {
    console.error('Error deleting image:', error);
    return false;
  }
};

// Utility to delete multiple images
const deleteProductImages = (filenames) => {
  filenames.forEach(filename => deleteProductImage(filename));
};

module.exports = {
  productUpload,
  processImages,
  handleUploadErrors,
  generateImageUrl,
  deleteProductImage,
  deleteProductImages
};