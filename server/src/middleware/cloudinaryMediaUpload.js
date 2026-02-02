// server/src/middleware/cloudinaryMediaUpload.js - FIXED VERSION
const multer = require('multer');
const cloudinaryStorageService = require('../services/cloudinaryStorageService');
const { FILE_CATEGORIES, UPLOAD_PRESETS } = require('../config/cloudinary');

// Memory storage for fast processing
const storage = multer.memoryStorage();

// File filter for images and videos
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    ...FILE_CATEGORIES.IMAGES.mimeTypes,
    ...FILE_CATEGORIES.VIDEOS.mimeTypes
  ];

  const allowedExtensions = [
    ...FILE_CATEGORIES.IMAGES.extensions,
    ...FILE_CATEGORIES.VIDEOS.extensions
  ];

  const fileExtension = file.originalname.toLowerCase().match(/\.[0-9a-z]+$/)?.[0] || '';

  // Check by MIME type first
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  }
  // Check by extension as fallback
  else if (allowedExtensions.includes(fileExtension)) {
    cb(null, true);
  }
  // Reject file
  else {
    cb(new Error(`Invalid media type. Allowed: images (${FILE_CATEGORIES.IMAGES.extensions.join(', ')}) and videos (${FILE_CATEGORIES.VIDEOS.extensions.join(', ')})`), false);
  }
};

// Image-only file filter
const imageFileFilter = (req, file, cb) => {
  if (FILE_CATEGORIES.IMAGES.mimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Only image files are allowed. Allowed: ${FILE_CATEGORIES.IMAGES.extensions.join(', ')}`), false);
  }
};

// Create multer instance for single media upload
const uploadSingle = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: Math.max(FILE_CATEGORIES.IMAGES.maxSize, FILE_CATEGORIES.VIDEOS.maxSize),
    files: 1
  }
}).single('media');

// Create multer instance for multiple media upload
const uploadMultiple = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: Math.max(FILE_CATEGORIES.IMAGES.maxSize, FILE_CATEGORIES.VIDEOS.maxSize),
    files: 10 // Maximum 10 media files at once
  }
}).array('media', 10);

/**
 * Unified middleware for media uploads
 * Handles: Images (JPG, PNG, GIF, WebP, SVG), Videos (MP4, MOV, AVI, MKV, WebM)
 *          Avatars, covers, product images, post media
 * 
 * Usage:
 * 1. Single media: router.post('/upload', cloudinaryMediaUpload.single, controller.upload)
 * 2. Multiple media: router.post('/upload', cloudinaryMediaUpload.multiple, controller.upload)
 * 3. Avatar: router.post('/avatar', cloudinaryMediaUpload.avatar, controller.updateAvatar)
 * 4. Cover: router.post('/cover', cloudinaryMediaUpload.cover, controller.updateCover)
 */
const cloudinaryMediaUpload = {
  // Single media upload middleware
  single: (req, res, next) => {
    uploadSingle(req, res, async (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          error: err.message || 'Media upload failed'
        });
      }

      // If no file was uploaded
      if (!req.file) {
        return next();
      }

      try {
        // Determine if it's image or video
        const isImage = FILE_CATEGORIES.IMAGES.mimeTypes.includes(req.file.mimetype);
        const isVideo = FILE_CATEGORIES.VIDEOS.mimeTypes.includes(req.file.mimetype);

        const uploadOptions = {
          folder: isImage ? 'bananalink/images' : 'bananalink/videos',
          tags: ['media', 'bananalink', isImage ? 'image' : 'video'],
          context: {
            uploadSource: 'media_middleware',
            userId: req.user?.id || 'anonymous',
            mediaType: isImage ? 'image' : 'video'
          }
        };

        // Add image transformations if needed
        if (isImage && req.imageTransformations) {
          uploadOptions.transformations = req.imageTransformations;
        }

        // Upload to Cloudinary and create backup
        const uploadResult = await cloudinaryStorageService.uploadFile(
          req.file.buffer,
          req.file.originalname,
          uploadOptions
        );

        if (!uploadResult.success) {
          throw new Error(uploadResult.error || 'Upload failed');
        }

        // Attach standardized media object to request
        req.cloudinaryMedia = {
          success: true,
          media: {
            originalName: req.file.originalname,
            size: req.file.size,
            mimetype: req.file.mimetype,
            type: isImage ? 'image' : 'video',
            cloudinary: uploadResult.data.cloudinary,
            localBackup: uploadResult.data.localBackup,
            metadata: uploadResult.data.metadata
          }
        };

        next();
      } catch (error) {
        console.error('Media upload error:', error);
        return res.status(500).json({
          success: false,
          error: 'Failed to upload media',
          details: error.message
        });
      }
    });
  },

  // Multiple media upload middleware
  multiple: (req, res, next) => {
    uploadMultiple(req, res, async (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          error: err.message || 'Media uploads failed'
        });
      }

      // If no files were uploaded
      if (!req.files || req.files.length === 0) {
        return next();
      }

      try {
        const uploadPromises = req.files.map(async (file) => {
          const isImage = FILE_CATEGORIES.IMAGES.mimeTypes.includes(file.mimetype);
          const isVideo = FILE_CATEGORIES.VIDEOS.mimeTypes.includes(file.mimetype);

          const uploadOptions = {
            folder: isImage ? 'bananalink/images' : 'bananalink/videos',
            tags: ['media', 'bananalink', 'batch_upload', isImage ? 'image' : 'video'],
            context: {
              uploadSource: 'media_middleware',
              userId: req.user?.id || 'anonymous',
              mediaType: isImage ? 'image' : 'video',
              batchId: req.batchId || Date.now().toString()
            }
          };

          const uploadResult = await cloudinaryStorageService.uploadFile(
            file.buffer,
            file.originalname,
            uploadOptions
          );

          return uploadResult.success ? {
            originalName: file.originalname,
            size: file.size,
            mimetype: file.mimetype,
            type: isImage ? 'image' : 'video',
            cloudinary: uploadResult.data.cloudinary,
            localBackup: uploadResult.data.localBackup,
            metadata: uploadResult.data.metadata
          } : {
            originalName: file.originalname,
            error: uploadResult.error,
            success: false
          };
        });

        const uploadedMedia = await Promise.all(uploadPromises);

        // Attach standardized media array to request
        req.cloudinaryMedia = {
          success: true,
          media: uploadedMedia,
          count: uploadedMedia.length,
          successful: uploadedMedia.filter(m => m.success !== false).length,
          failed: uploadedMedia.filter(m => m.success === false).length,
          images: uploadedMedia.filter(m => m.type === 'image'),
          videos: uploadedMedia.filter(m => m.type === 'video')
        };

        next();
      } catch (error) {
        console.error('Multiple media upload error:', error);
        return res.status(500).json({
          success: false,
          error: 'Failed to upload media files',
          details: error.message
        });
      }
    });
  },

  // ========== FIXED AVATAR UPLOAD ==========
  avatar: (req, res, next) => {
    console.log('🔄 [Avatar Middleware] Starting...');
    
    const avatarUpload = multer({
      storage,
      fileFilter: imageFileFilter,
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB max for avatars
        files: 1
      }
    }).single('avatar'); // Field name must be 'avatar'

    avatarUpload(req, res, async (err) => {
      if (err) {
        console.error('❌ [Avatar Middleware] Multer error:', err.message);
        return res.status(400).json({
          success: false,
          error: err.message || 'Avatar upload failed',
          code: 'AVATAR_UPLOAD_ERROR'
        });
      }

      // If no file was uploaded, continue but set req.cloudinaryAvatar
      if (!req.file) {
        console.log('⚠️ [Avatar Middleware] No avatar file received');
        req.cloudinaryAvatar = { 
          success: false, 
          error: 'No file provided',
          debug: {
            hasFile: false,
            filesInRequest: req.files ? Object.keys(req.files) : [],
            bodyKeys: Object.keys(req.body)
          }
        };
        return next();
      }

      console.log('✅ [Avatar Middleware] File received:', {
        name: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
        bufferSize: req.file.buffer?.length || 0
      });

      try {
        // Get user ID from request (supports different auth patterns)
        const userId = req.user?.id || req.user?.userId || req.user?.user?.id || 'anonymous';
        console.log('👤 [Avatar Middleware] User ID:', userId);

        // Upload to Cloudinary
        const uploadResult = await cloudinaryStorageService.uploadFile(
          req.file.buffer,
          req.file.originalname,
          {
            folder: `bananalink/images/avatars/${userId}`,
            upload_preset: UPLOAD_PRESETS.AVATAR,
            tags: ['avatar', 'bananalink', 'user', 'profile'],
            context: {
              uploadSource: 'avatar_middleware',
              userId: userId,
              purpose: 'profile_avatar',
              userRole: req.user?.role || 'unknown',
              timestamp: new Date().toISOString()
            },
            transformations: [
              { width: 300, height: 300, crop: 'fill', gravity: 'face' },
              { quality: 'auto:good' },
              { fetch_format: 'auto' }
            ],
            resource_type: 'image',
            overwrite: true,
            invalidate: true
          }
        );

        console.log('☁️ [Avatar Middleware] Cloudinary result:', {
          success: uploadResult.success,
          publicId: uploadResult.data?.cloudinary?.public_id
        });

        if (!uploadResult.success) {
          throw new Error(uploadResult.error || 'Avatar upload to Cloudinary failed');
        }

        // Create thumbnail URL
        const cloudinaryUrl = uploadResult.data.cloudinary.secure_url;
        const thumbnailUrl = cloudinaryUrl.replace('/upload/', '/upload/w_150,h_150,c_fill,g_face/');

        // Attach standardized avatar object to request
        req.cloudinaryAvatar = {
          success: true,
          avatar: {
            originalName: req.file.originalname,
            size: req.file.size,
            mimetype: req.file.mimetype,
            cloudinary: uploadResult.data.cloudinary,
            localBackup: uploadResult.data.localBackup,
            metadata: uploadResult.data.metadata,
            thumbnailUrl: thumbnailUrl,
            userId: userId,
            uploadedAt: new Date()
          }
        };

        console.log('✅ [Avatar Middleware] Completed successfully');
        next();
      } catch (error) {
        console.error('❌ [Avatar Middleware] Upload error:', error);
        
        // Attach error info to request so controller can handle it
        req.cloudinaryAvatar = {
          success: false,
          error: error.message,
          code: 'UPLOAD_FAILED'
        };
        next();
      }
    });
  },

  // ========== FIXED COVER UPLOAD ==========
  cover: (req, res, next) => {
    console.log('🔄 [Cover Middleware] Starting...');
    
    const coverUpload = multer({
      storage,
      fileFilter: imageFileFilter,
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB max for covers
        files: 1
      }
    }).single('cover'); // Field name must be 'cover'

    coverUpload(req, res, async (err) => {
      if (err) {
        console.error('❌ [Cover Middleware] Multer error:', err.message);
        return res.status(400).json({
          success: false,
          error: err.message || 'Cover upload failed',
          code: 'COVER_UPLOAD_ERROR'
        });
      }

      // If no file was uploaded, continue but set req.cloudinaryCover
      if (!req.file) {
        console.log('⚠️ [Cover Middleware] No cover file received');
        req.cloudinaryCover = { 
          success: false, 
          error: 'No file provided',
          debug: {
            hasFile: false,
            filesInRequest: req.files ? Object.keys(req.files) : [],
            bodyKeys: Object.keys(req.body)
          }
        };
        return next();
      }

      console.log('✅ [Cover Middleware] File received:', {
        name: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
        bufferSize: req.file.buffer?.length || 0
      });

      try {
        // Get user ID from request
        const userId = req.user?.id || req.user?.userId || req.user?.user?.id || 'anonymous';
        console.log('👤 [Cover Middleware] User ID:', userId);

        // Upload to Cloudinary
        const uploadResult = await cloudinaryStorageService.uploadFile(
          req.file.buffer,
          req.file.originalname,
          {
            folder: `bananalink/images/covers/${userId}`,
            upload_preset: UPLOAD_PRESETS.COVER,
            tags: ['cover', 'bananalink', 'user', 'profile'],
            context: {
              uploadSource: 'cover_middleware',
              userId: userId,
              purpose: 'profile_cover',
              userRole: req.user?.role || 'unknown',
              timestamp: new Date().toISOString()
            },
            transformations: [
              { width: 1200, height: 400, crop: 'fill' },
              { quality: 'auto:good' },
              { fetch_format: 'auto' }
            ],
            resource_type: 'image',
            overwrite: true,
            invalidate: true
          }
        );

        console.log('☁️ [Cover Middleware] Cloudinary result:', {
          success: uploadResult.success,
          publicId: uploadResult.data?.cloudinary?.public_id
        });

        if (!uploadResult.success) {
          throw new Error(uploadResult.error || 'Cover upload to Cloudinary failed');
        }

        // Create thumbnail URL
        const cloudinaryUrl = uploadResult.data.cloudinary.secure_url;
        const thumbnailUrl = cloudinaryUrl.replace('/upload/', '/upload/w_400,h_150,c_fill/');

        // Attach standardized cover object to request
        req.cloudinaryCover = {
          success: true,
          cover: {
            originalName: req.file.originalname,
            size: req.file.size,
            mimetype: req.file.mimetype,
            cloudinary: uploadResult.data.cloudinary,
            localBackup: uploadResult.data.localBackup,
            metadata: uploadResult.data.metadata,
            thumbnailUrl: thumbnailUrl,
            userId: userId,
            uploadedAt: new Date()
          }
        };

        console.log('✅ [Cover Middleware] Completed successfully');
        next();
      } catch (error) {
        console.error('❌ [Cover Middleware] Upload error:', error);
        
        // Attach error info to request so controller can handle it
        req.cloudinaryCover = {
          success: false,
          error: error.message,
          code: 'UPLOAD_FAILED'
        };
        next();
      }
    });
  },

  // Product image upload middleware (UNCHANGED)
  productImages: (req, res, next) => {
    const productUpload = multer({
      storage,
      fileFilter: (req, file, cb) => {
        // Only accept images for products
        if (FILE_CATEGORIES.IMAGES.mimeTypes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new Error(`Only image files are allowed for products. Allowed: ${FILE_CATEGORIES.IMAGES.extensions.join(', ')}`), false);
        }
      },
      limits: {
        fileSize: FILE_CATEGORIES.IMAGES.maxSize,
        files: 5 // Max 5 product images
      }
    }).array('productImages', 5); // Field name MUST be 'productImages'

    productUpload(req, res, async (err) => {
      if (err) {
        console.error('Product image upload error:', err);
        return res.status(400).json({
          success: false,
          error: err.message || 'Product images upload failed',
          code: 'IMAGE_UPLOAD_ERROR'
        });
      }

      // If no files were uploaded, continue without images
      if (!req.files || req.files.length === 0) {
        console.log('No product images uploaded, continuing...');
        req.cloudinaryProductImages = {
          success: true,
          images: [],
          count: 0,
          primaryImage: null,
          secondaryImages: []
        };
        return next();
      }

      try {
        console.log(`Uploading ${req.files.length} product images to Cloudinary...`);

        const uploadPromises = req.files.map(async (file, index) => {
          const isPrimary = index === 0; // First image is primary

          const uploadResult = await cloudinaryStorageService.uploadFile(
            file.buffer,
            file.originalname,
            {
              folder: 'bananalink/products',
              tags: ['product', 'bananalink', isPrimary ? 'primary' : 'secondary'],
              context: {
                uploadSource: 'product_middleware',
                userId: req.user?.id || req.user?.userId || 'anonymous',
                productId: req.body.productId || 'unknown',
                isPrimary: isPrimary
              },
              transformations: [
                { width: 800, height: 600, crop: 'fill' },
                { quality: 'auto:good' }
              ]
            }
          );

          if (!uploadResult.success) {
            console.error(`Failed to upload image ${file.originalname}:`, uploadResult.error);
            return {
              originalName: file.originalname,
              error: uploadResult.error,
              success: false,
              isPrimary
            };
          }

          return {
            originalName: file.originalname,
            size: file.size,
            mimetype: file.mimetype,
            cloudinary: uploadResult.data.cloudinary,
            localBackup: uploadResult.data.localBackup,
            metadata: uploadResult.data.metadata,
            isPrimary,
            thumbnailUrl: uploadResult.data.cloudinary.secure_url.replace('/upload/', '/upload/w_200,h_150,c_fill/'),
            success: true
          };
        });

        const productImages = await Promise.all(uploadPromises);

        const successfulImages = productImages.filter(img => img.success !== false);
        const failedImages = productImages.filter(img => img.success === false);

        if (failedImages.length > 0) {
          console.warn(`${failedImages.length} images failed to upload:`, failedImages.map(img => img.originalName));
        }

        req.cloudinaryProductImages = {
          success: successfulImages.length > 0,
          images: productImages,
          count: productImages.length,
          successful: successfulImages.length,
          failed: failedImages.length,
          primaryImage: successfulImages.find(img => img.isPrimary),
          secondaryImages: successfulImages.filter(img => !img.isPrimary)
        };

        console.log(`Successfully uploaded ${successfulImages.length} product images`);
        next();
      } catch (error) {
        console.error('Product images upload error:', error);
        return res.status(500).json({
          success: false,
          error: 'Failed to upload product images',
          details: error.message,
          code: 'UPLOAD_ERROR'
        });
      }
    });
  },

  // Custom media upload with options (UNCHANGED)
  custom: (options = {}) => {
    const customUpload = multer({
      storage,
      fileFilter: options.fileFilter || fileFilter,
      limits: {
        fileSize: options.maxSize || Math.max(FILE_CATEGORIES.IMAGES.maxSize, FILE_CATEGORIES.VIDEOS.maxSize),
        files: options.maxFiles || 5
      }
    })[options.single ? 'single' : 'array'](options.fieldName || 'media', options.maxFiles || 5);

    return (req, res, next) => {
      customUpload(req, res, async (err) => {
        if (err) {
          return res.status(400).json({
            success: false,
            error: err.message || 'Media upload failed'
          });
        }

        const files = options.single ? (req.file ? [req.file] : []) : (req.files || []);

        if (files.length === 0) {
          return next();
        }

        try {
          const uploadPromises = files.map(async (file) => {
            const isImage = FILE_CATEGORIES.IMAGES.mimeTypes.includes(file.mimetype);
            const isVideo = FILE_CATEGORIES.VIDEOS.mimeTypes.includes(file.mimetype);

            const uploadOptions = {
              folder: options.folder || (isImage ? 'bananalink/images' : 'bananalink/videos'),
              tags: ['media', 'bananalink', ...(options.tags || []), isImage ? 'image' : 'video'],
              context: {
                uploadSource: 'custom_media_middleware',
                userId: req.user?.id || 'anonymous',
                mediaType: isImage ? 'image' : 'video',
                ...options.context
              },
              ...(options.transformations && isImage ? { transformations: options.transformations } : {}),
              ...options.cloudinaryOptions
            };

            const uploadResult = await cloudinaryStorageService.uploadFile(
              file.buffer,
              file.originalname,
              uploadOptions
            );

            return uploadResult.success ? {
              originalName: file.originalname,
              size: file.size,
              mimetype: file.mimetype,
              type: isImage ? 'image' : 'video',
              cloudinary: uploadResult.data.cloudinary,
              localBackup: uploadResult.data.localBackup,
              metadata: uploadResult.data.metadata
            } : {
              originalName: file.originalname,
              error: uploadResult.error,
              success: false
            };
          });

          const uploadedMedia = await Promise.all(uploadPromises);

          const resultKey = options.resultKey || 'cloudinaryMedia';
          req[resultKey] = {
            success: true,
            media: uploadedMedia,
            count: uploadedMedia.length,
            successful: uploadedMedia.filter(m => m.success !== false).length,
            failed: uploadedMedia.filter(m => m.success === false).length,
            options
          };

          next();
        } catch (error) {
          console.error('Custom media upload error:', error);
          return res.status(500).json({
            success: false,
            error: 'Failed to upload media',
            details: error.message
          });
        }
      });
    };
  }
};

module.exports = cloudinaryMediaUpload;