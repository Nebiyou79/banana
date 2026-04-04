const cloudinary = require('cloudinary').v2;
const path = require('path');

// Ensure required environment variables are present
const requiredEnvVars = ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
    console.warn(`⚠️  Missing Cloudinary environment variables: ${missingEnvVars.join(', ')}`);
    console.warn('Uploads will fail. Please add them to your .env file:');
    console.warn('CLOUDINARY_CLOUD_NAME=your_cloud_name');
    console.warn('CLOUDINARY_API_KEY=your_api_key');
    console.warn('CLOUDINARY_API_SECRET=your_api_secret');
}

// Cloudinary configuration
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
});

// Upload presets mapping - FIXED: Document presets use files preset
const UPLOAD_PRESETS = {
    // Document presets - use bananalink_files preset
    DOCUMENT: 'bananalink_files',
    CV: 'bananalink_files',
    ATTACHMENT: 'bananalink_files',
    TENDER: 'bananalink_files',

    // Media presets
    IMAGE: 'bananalink_media',
    PRODUCT_IMAGE: 'bananalink_media',
    POST_MEDIA: 'bananalink_media',

    // Specialized presets
    AVATAR: 'bananalink_avatars',
    COVER: 'bananalink_covers',

    // Video presets
    VIDEO: 'bananalink_media'
};

// File type categories - FIXED: Added more document formats
const FILE_CATEGORIES = {
    DOCUMENTS: {
        extensions: ['.pdf', '.doc', '.docx', '.txt', '.rtf', '.odt', '.ppt', '.pptx', '.xls', '.xlsx'],
        mimeTypes: [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/plain',
            'application/rtf',
            'application/vnd.oasis.opendocument.text',
            'application/vnd.ms-powerpoint',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        ],
        resourceType: 'raw',
        maxSize: 100 * 1024 * 1024 // 100MB
    },
    IMAGES: {
        extensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'],
        mimeTypes: [
            'image/jpeg',
            'image/png',
            'image/gif',
            'image/webp',
            'image/svg+xml'
        ],
        resourceType: 'image',
        maxSize: 20 * 1024 * 1024 // 20MB
    },
    VIDEOS: {
        extensions: ['.mp4', '.mov', '.avi', '.mkv', '.webm'],
        mimeTypes: [
            'video/mp4',
            'video/quicktime',
            'video/x-msvideo',
            'video/x-matroska',
            'video/webm'
        ],
        resourceType: 'video',
        maxSize: 200 * 1024 * 1024 // 200MB
    }
};

// Helper to determine resource type from file
const getResourceType = (file) => {
    const extension = path.extname(file.originalname).toLowerCase();
    const mimeType = file.mimetype;

    // Check by MIME type first (more reliable)
    for (const [category, config] of Object.entries(FILE_CATEGORIES)) {
        if (config.mimeTypes.includes(mimeType)) {
            return {
                resourceType: config.resourceType,
                category: category,
                preset: UPLOAD_PRESETS[category === 'IMAGES' ? 'IMAGE' : category.slice(0, -1)] // Remove 's'
            };
        }
    }

    // Fallback to extension check
    for (const [category, config] of Object.entries(FILE_CATEGORIES)) {
        if (config.extensions.includes(extension)) {
            return {
                resourceType: config.resourceType,
                category: category,
                preset: UPLOAD_PRESETS[category === 'IMAGES' ? 'IMAGE' : category.slice(0, -1)]
            };
        }
    }

    // Default to raw for unknown types
    return {
        resourceType: 'raw',
        category: 'DOCUMENTS',
        preset: UPLOAD_PRESETS.DOCUMENT
    };
};

// NEW: Specialized document upload function
const uploadDocumentToCloudinary = async (fileBuffer, fileName, options = {}) => {
    try {
        console.log('📄 Document upload started:', fileName);

        const fileExt = path.extname(fileName).toLowerCase();
        const fileNameWithoutExt = path.basename(fileName, fileExt);

        // Clean filename for Cloudinary
        const cleanFileName = fileNameWithoutExt
            .replace(/[^a-zA-Z0-9-_]/g, '_')
            .replace(/\s+/g, '_')
            .substring(0, 100);

        // Create timestamp for unique filename
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2, 10);

        // IMPORTANT: Generate unique public_id with extension
        const publicId = `${cleanFileName}_${timestamp}_${randomString}`;

        console.log('📤 Uploading document with options:', {
            fileName,
            fileExt,
            cleanFileName,
            publicId
        });

        // Use files preset for documents
        const uploadOptions = {
            upload_preset: UPLOAD_PRESETS.DOCUMENT, // 'bananalink_files'
            folder: options.folder || 'bananalink/documents',
            tags: ['document', 'bananalink', ...(options.tags || [])],
            context: options.context || {},

            // CRITICAL: Set resource_type to 'raw' explicitly
            resource_type: 'raw',

            // Use the generated public_id
            public_id: publicId,

            // Settings that should match your preset
            overwrite: false,
            invalidate: true,
            use_filename: false, // We're using our own public_id
            unique_filename: false, // We've already made it unique
            type: 'upload',
            access_mode: 'public',

            // For Office documents, try to enable conversion
            ...(fileExt === '.docx' || fileExt === '.doc' || fileExt === '.xlsx' || fileExt === '.xls' || fileExt === '.pptx' || fileExt === '.ppt' ? {
                raw_convert: 'aspose'
            } : {}),

            // Add file extension for better handling
            format: fileExt.replace('.', '')
        };

        console.log('Cloudinary upload options:', JSON.stringify(uploadOptions, null, 2));

        return new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                uploadOptions,
                (error, result) => {
                    if (error) {
                        console.error('❌ Document upload error:', {
                            message: error.message,
                            http_code: error.http_code,
                            name: error.name,
                            fileName: fileName,
                            fileExt: fileExt
                        });

                        // Try alternative approach without preset
                        console.log('⚠️ Trying alternative upload method...');

                        // Fallback: Direct upload without preset
                        const fallbackOptions = {
                            resource_type: 'raw',
                            folder: 'bananalink/documents',
                            public_id: `${cleanFileName}_fallback_${timestamp}_${randomString}`,
                            tags: ['document', 'bananalink', 'fallback'],
                            overwrite: false,
                            invalidate: true,
                            use_filename: false
                        };

                        console.log('Fallback options:', fallbackOptions);

                        const fallbackStream = cloudinary.uploader.upload_stream(
                            fallbackOptions,
                            (fallbackError, fallbackResult) => {
                                if (fallbackError) {
                                    console.error('Fallback upload also failed:', fallbackError);
                                    reject(new Error(`Document upload failed: ${fallbackError.message}`));
                                } else {
                                    console.log('✅ Fallback upload successful');
                                    resolve({
                                        success: true,
                                        data: {
                                            public_id: fallbackResult.public_id,
                                            secure_url: fallbackResult.secure_url,
                                            url: fallbackResult.url,
                                            format: fileExt.replace('.', ''),
                                            resource_type: fallbackResult.resource_type || 'raw',
                                            bytes: fallbackResult.bytes || fileBuffer.length,
                                            created_at: fallbackResult.created_at,
                                            tags: fallbackResult.tags,
                                            original_filename: fileName
                                        }
                                    });
                                }
                            }
                        );
                        fallbackStream.end(fileBuffer);
                    } else {
                        console.log('✅ Document upload success:', {
                            public_id: result.public_id,
                            secure_url: result.secure_url,
                            format: result.format,
                            bytes: result.bytes,
                            resource_type: result.resource_type
                        });
                        resolve({
                            success: true,
                            data: {
                                public_id: result.public_id,
                                secure_url: result.secure_url,
                                url: result.url,
                                format: result.format || fileExt.replace('.', ''),
                                resource_type: result.resource_type || 'raw',
                                bytes: result.bytes || fileBuffer.length,
                                created_at: result.created_at,
                                tags: result.tags,
                                original_filename: fileName
                            }
                        });
                    }
                }
            );

            uploadStream.end(fileBuffer);
        });
    } catch (error) {
        console.error('Error in uploadDocumentToCloudinary:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

// Main upload function - keep for images/videos
const uploadToCloudinary = async (fileBuffer, fileName, options = {}) => {
    try {
        const { resourceType, category, preset } = getResourceType({
            originalname: fileName,
            mimetype: options.mimeType || 'application/octet-stream'
        });

        // For documents, use specialized function
        if (resourceType === 'raw') {
            return await uploadDocumentToCloudinary(fileBuffer, fileName, options);
        }

        // For images/videos, use regular upload
        const uploadOptions = {
            resource_type: resourceType,
            public_id: options.publicId || path.parse(fileName).name,
            folder: options.folder || `bananalink/${resourceType}s`,
            overwrite: options.overwrite || false,
            tags: options.tags || ['bananalink', category.toLowerCase()],
            context: options.context || {},
            ...(preset && { upload_preset: preset })
        };

        // Add transformation options for images
        if (resourceType === 'image' && options.transformations) {
            uploadOptions.transformation = options.transformations;
        }

        console.log('📤 Uploading media with options:', {
            fileName,
            resource_type: uploadOptions.resource_type,
            folder: uploadOptions.folder,
            upload_preset: uploadOptions.upload_preset
        });

        return new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                uploadOptions,
                (error, result) => {
                    if (error) {
                        console.error('Cloudinary upload error:', error);
                        reject(error);
                    } else {
                        resolve({
                            success: true,
                            data: {
                                public_id: result.public_id,
                                secure_url: result.secure_url,
                                url: result.url,
                                format: result.format,
                                resource_type: result.resource_type,
                                bytes: result.bytes,
                                created_at: result.created_at,
                                tags: result.tags,
                                ...(result.width && { width: result.width }),
                                ...(result.height && { height: result.height }),
                                ...(result.duration && { duration: result.duration })
                            }
                        });
                    }
                }
            );

            uploadStream.end(fileBuffer);
        });
    } catch (error) {
        console.error('Error in uploadToCloudinary:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

// Delete from Cloudinary - FIXED: Better resource type handling
const deleteFromCloudinary = async (publicId, resourceType = 'auto') => {
    try {
        console.log('🗑️  Deleting from Cloudinary:', { publicId, resourceType });

        const result = await cloudinary.uploader.destroy(publicId, {
            resource_type: resourceType,
            invalidate: true
        });

        console.log('✅ Delete result:', result);

        return {
            success: result.result === 'ok',
            data: result
        };
    } catch (error) {
        console.error('Error deleting from Cloudinary:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

// Generate optimized URL with transformations
const generateOptimizedUrl = (publicId, options = {}) => {
    const defaultOptions = {
        resource_type: 'auto',
        quality: 'auto:good',
        fetch_format: 'auto',
        ...options
    };

    return cloudinary.url(publicId, defaultOptions);
};

// Get Cloudinary resource info
const getResourceInfo = async (publicId, resourceType = 'auto') => {
    try {
        const result = await cloudinary.api.resource(publicId, {
            resource_type: resourceType
        });

        return {
            success: true,
            data: result
        };
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
};

// Generate proper document download URL WITH VERSION
const generateDocumentDownloadUrl = (cloudinaryData, fileName) => {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const encodedFileName = encodeURIComponent(fileName);

    // If we have secure_url with version, use it
    if (cloudinaryData.secure_url && cloudinaryData.secure_url.includes('/upload/v')) {
        // Extract the versioned URL and add fl_attachment
        const baseUrl = cloudinaryData.secure_url;
        return baseUrl.replace('/upload/', '/upload/fl_attachment/') + `?filename=${encodedFileName}`;
    }

    // Fallback: use public_id with fl_attachment
    return `https://res.cloudinary.com/${cloudName}/raw/upload/fl_attachment/${cloudinaryData.public_id}?filename=${encodedFileName}`;
};

// Generate view URL for documents WITH VERSION
const generateDocumentViewUrl = (cloudinaryData) => {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;

    // Use secure_url if available (includes version)
    if (cloudinaryData.secure_url) {
        return cloudinaryData.secure_url;
    }

    // Fallback: use public_id
    return `https://res.cloudinary.com/${cloudName}/raw/upload/${cloudinaryData.public_id}`;
};

// Update the export at the bottom
module.exports = {
    cloudinary,
    UPLOAD_PRESETS,
    FILE_CATEGORIES,
    getResourceType,
    uploadToCloudinary,
    uploadDocumentToCloudinary,
    deleteFromCloudinary,
    generateOptimizedUrl,
    generateDocumentDownloadUrl, // Export fixed function
    generateDocumentViewUrl,     // Export fixed function
    getResourceInfo
};