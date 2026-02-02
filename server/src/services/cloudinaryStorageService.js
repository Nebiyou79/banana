const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const { 
    uploadToCloudinary, 
    uploadDocumentToCloudinary, // Added this
    deleteFromCloudinary, 
    getResourceType,
    generateDocumentDownloadUrl, // Added this
    generateDocumentViewUrl // Added this
} = require('../config/cloudinary');

class CloudinaryStorageService {
    constructor() {
        this.isDevelopment = process.env.NODE_ENV === 'development';
        this.backupBasePath = path.join(process.cwd(), 'backups', 'cloudinary');
        this.mappingFilePath = path.join(this.backupBasePath, 'file-mapping.json');
        this.statsFilePath = path.join(this.backupBasePath, 'upload-stats.json');
        
        // Only create backup structure in production or if explicitly enabled
        if (!this.isDevelopment || process.env.ENABLE_LOCAL_BACKUPS === 'true') {
            this.ensureBackupStructure();
        } else {
            console.log('⚠️  Local backups disabled in development mode');
        }
        
        this.loadMapping();
        this.loadStats();
    }

    // Initialize backup directory structure
    async ensureBackupStructure() {
        const directories = [
            this.backupBasePath,
            path.join(this.backupBasePath, 'documents'),
            path.join(this.backupBasePath, 'images'),
            path.join(this.backupBasePath, 'videos'),
            path.join(this.backupBasePath, 'avatars'),
            path.join(this.backupBasePath, 'covers')
        ];

        for (const dir of directories) {
            try {
                await fs.access(dir);
            } catch {
                await fs.mkdir(dir, { recursive: true });
                console.log(`✅ Created backup directory: ${dir}`);
            }
        }
    }

    // Load file mapping from disk
    async loadMapping() {
        try {
            const data = await fs.readFile(this.mappingFilePath, 'utf8');
            this.fileMapping = JSON.parse(data);
        } catch (error) {
            this.fileMapping = {};
            await this.saveMapping();
        }
    }

    // Save file mapping to disk
    async saveMapping() {
        try {
            // Don't save mapping in development to prevent server restarts
            if (this.isDevelopment && process.env.ENABLE_LOCAL_BACKUPS !== 'true') {
                return;
            }
            
            await fs.writeFile(
                this.mappingFilePath,
                JSON.stringify(this.fileMapping, null, 2)
            );
        } catch (error) {
            console.error('Error saving file mapping:', error);
        }
    }

    // Load upload statistics
    async loadStats() {
        try {
            const data = await fs.readFile(this.statsFilePath, 'utf8');
            this.uploadStats = JSON.parse(data);
        } catch (error) {
            this.uploadStats = {
                totalUploads: 0,
                successfulUploads: 0,
                failedUploads: 0,
                totalSize: 0,
                byType: {
                    documents: { count: 0, size: 0 },
                    images: { count: 0, size: 0 },
                    videos: { count: 0, size: 0 }
                },
                dailyStats: {},
                lastUpdated: new Date().toISOString()
            };
            await this.saveStats();
        }
    }

    // Save upload statistics
    async saveStats() {
        try {
            this.uploadStats.lastUpdated = new Date().toISOString();
            
            // Don't save stats in development to prevent server restarts
            if (this.isDevelopment && process.env.ENABLE_LOCAL_BACKUPS !== 'true') {
                return;
            }
            
            await fs.writeFile(
                this.statsFilePath,
                JSON.stringify(this.uploadStats, null, 2)
            );
        } catch (error) {
            console.error('Error saving stats:', error);
        }
    }

    // Generate unique backup filename
    generateBackupFilename(originalName, cloudinaryId) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const hash = crypto.createHash('md5').update(cloudinaryId).digest('hex').substring(0, 8);
        const ext = path.extname(originalName);
        const name = path.basename(originalName, ext);
        
        return `${name}_${hash}_${timestamp}${ext}`;
    }

    // Create local backup of file
    async createLocalBackup(fileBuffer, originalName, cloudinaryId, fileType) {
        try {
            // Skip local backups in development unless explicitly enabled
            if (this.isDevelopment && process.env.ENABLE_LOCAL_BACKUPS !== 'true') {
                return {
                    success: true,
                    backupPath: null,
                    backupFilename: null,
                    skipped: true,
                    message: 'Local backup skipped in development mode'
                };
            }
            
            const backupFilename = this.generateBackupFilename(originalName, cloudinaryId);
            
            // Determine backup directory based on file type
            let backupDir;
            switch (fileType) {
                case 'document':
                    backupDir = 'documents';
                    break;
                case 'image':
                    backupDir = 'images';
                    break;
                case 'video':
                    backupDir = 'videos';
                    break;
                default:
                    backupDir = 'documents';
            }
            
            const backupPath = path.join(this.backupBasePath, backupDir, backupFilename);
            await fs.writeFile(backupPath, fileBuffer);
            
            // Update mapping
            this.fileMapping[cloudinaryId] = {
                localBackup: backupPath,
                originalName,
                uploadedAt: new Date().toISOString(),
                fileType,
                size: fileBuffer.length
            };
            
            await this.saveMapping();
            
            return {
                success: true,
                backupPath,
                backupFilename
            };
        } catch (error) {
            console.error('Error creating local backup:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Main upload method - UPDATED: Uses correct upload function based on file type
    async uploadFile(fileBuffer, originalName, options = {}) {
        const uploadStartTime = Date.now();
        
        try {
            console.log(`📤 Uploading file: ${originalName} (${fileBuffer.length} bytes)`);
            
            // Determine if this is a document based on extension
            const fileExt = path.extname(originalName).toLowerCase();
            const isDocument = ['.pdf', '.doc', '.docx', '.txt', '.rtf', '.odt', '.ppt', '.pptx', '.xls', '.xlsx'].includes(fileExt);
            
            let uploadResult;
            
            // Use appropriate upload function
            if (isDocument) {
                console.log('📄 Using document-specific upload function');
                uploadResult = await uploadDocumentToCloudinary(fileBuffer, originalName, options);
            } else {
                console.log('🖼️ Using media upload function');
                uploadResult = await uploadToCloudinary(fileBuffer, originalName, options);
            }
            
            if (!uploadResult.success) {
                throw new Error(uploadResult.error || 'Upload failed');
            }
            
            const { data: cloudinaryData } = uploadResult;
            console.log('📊 Cloudinary upload result:', {
                public_id: cloudinaryData?.public_id,
                secure_url: cloudinaryData?.secure_url,
                resource_type: cloudinaryData?.resource_type,
                format: cloudinaryData?.format,
                bytes: cloudinaryData?.bytes
            });
            
            // 2. Determine file type for backup
            const fileType = cloudinaryData.resource_type === 'raw' ? 'document' : 
                           cloudinaryData.resource_type === 'image' ? 'image' : 'video';
            
            // 3. Create local backup (skipped in development)
            const backupResult = await this.createLocalBackup(
                fileBuffer,
                originalName,
                cloudinaryData.public_id,
                fileType
            );
            
            // 4. Update statistics
            this.updateStats({
                success: true,
                fileType,
                size: fileBuffer.length,
                duration: Date.now() - uploadStartTime
            });
            
            // 5. Generate URLs for documents
            let downloadUrl, viewUrl;
            if (isDocument) {
                downloadUrl = generateDocumentDownloadUrl(cloudinaryData.public_id, originalName);
                viewUrl = generateDocumentViewUrl(cloudinaryData.public_id);
            } else {
                downloadUrl = cloudinaryData.secure_url;
                viewUrl = cloudinaryData.secure_url;
            }
            
            // 6. Return standardized response
            return {
                success: true,
                data: {
                    cloudinary: cloudinaryData,
                    localBackup: backupResult.success && !backupResult.skipped ? {
                        path: backupResult.backupPath,
                        filename: backupResult.backupFilename
                    } : null,
                    metadata: {
                        originalName,
                        size: fileBuffer.length,
                        uploadedAt: new Date().toISOString(),
                        backupCreated: backupResult.success && !backupResult.skipped,
                        fileExtension: fileExt.replace('.', ''),
                        downloadUrl,
                        viewUrl
                    }
                }
            };
            
        } catch (error) {
            // Update failed stats
            this.updateStats({
                success: false,
                size: fileBuffer.length,
                duration: Date.now() - uploadStartTime
            });
            
            console.error('❌ Upload failed:', error.message);
            return {
                success: false,
                error: error.message,
                details: {
                    originalName,
                    size: fileBuffer.length,
                    timestamp: new Date().toISOString()
                }
            };
        }
    }

    // NEW: Document-specific upload method
    async uploadDocument(fileBuffer, originalName, options = {}) {
        console.log(`📄 Uploading document: ${originalName}`);
        
        const uploadResult = await uploadDocumentToCloudinary(
            fileBuffer,
            originalName,
            options
        );
        
        if (!uploadResult.success) {
            return uploadResult;
        }
        
        const { data: cloudinaryData } = uploadResult;
        
        // Generate URLs for documents
        const downloadUrl = generateDocumentDownloadUrl(cloudinaryData.public_id, originalName);
        const viewUrl = generateDocumentViewUrl(cloudinaryData.public_id);
        
        // Create local backup
        const backupResult = await this.createLocalBackup(
            fileBuffer,
            originalName,
            cloudinaryData.public_id,
            'document'
        );
        
        return {
            success: true,
            data: {
                cloudinary: cloudinaryData,
                localBackup: backupResult.success && !backupResult.skipped ? {
                    path: backupResult.backupPath,
                    filename: backupResult.backupFilename
                } : null,
                metadata: {
                    originalName,
                    size: fileBuffer.length,
                    uploadedAt: new Date().toISOString(),
                    backupCreated: backupResult.success && !backupResult.skipped,
                    fileExtension: path.extname(originalName).replace('.', ''),
                    downloadUrl,
                    viewUrl
                }
            }
        };
    }

    // Avatar upload - UPDATED: Fixed URL generation
    async uploadAvatar(fileBuffer, originalName, userId) {
        try {
            console.log(`📤 Uploading avatar to Cloudinary for user: ${userId}`);
            
            const uploadResult = await this.uploadFile(
                fileBuffer,
                originalName,
                {
                    folder: `bananalink/images/avatars/${userId}`,
                    tags: ['avatar', 'profile', 'user', userId],
                    context: {
                        uploadSource: 'avatar_upload',
                        userId: userId,
                        purpose: 'profile_picture'
                    },
                    transformations: [
                        { width: 300, height: 300, crop: 'fill', gravity: 'face' },
                        { quality: 'auto:good' },
                        { fetch_format: 'auto' }
                    ]
                }
            );
            
            if (!uploadResult.success) {
                throw new Error(uploadResult.error || 'Avatar upload failed');
            }
            
            // Generate thumbnail URL
            const secureUrl = uploadResult.data.cloudinary.secure_url;
            const thumbnailUrl = secureUrl.replace('/upload/', '/upload/w_150,h_150,c_fill,g_face/');
            
            return {
                success: true,
                avatar: {
                    originalName: originalName,
                    size: fileBuffer.length,
                    mimetype: 'image/jpeg',
                    cloudinary: uploadResult.data.cloudinary,
                    localBackup: uploadResult.data.localBackup,
                    thumbnailUrl: thumbnailUrl
                }
            };
            
        } catch (error) {
            console.error('❌ Avatar upload to Cloudinary failed:', error);
            return {
                success: false,
                error: error.message,
                details: 'Failed to upload avatar to Cloudinary'
            };
        }
    }

    // Cover photo upload - UPDATED: Fixed URL generation
    async uploadCoverPhoto(fileBuffer, originalName, userId) {
        try {
            console.log(`📤 Uploading cover photo to Cloudinary for user: ${userId}`);
            
            const uploadResult = await this.uploadFile(
                fileBuffer,
                originalName,
                {
                    folder: `bananalink/images/covers/${userId}`,
                    tags: ['cover', 'profile', 'user', userId],
                    context: {
                        uploadSource: 'cover_upload',
                        userId: userId,
                        purpose: 'profile_cover'
                    },
                    transformations: [
                        { width: 1200, height: 400, crop: 'fill' },
                        { quality: 'auto:good' },
                        { fetch_format: 'auto' }
                    ]
                }
            );
            
            if (!uploadResult.success) {
                throw new Error(uploadResult.error || 'Cover photo upload failed');
            }
            
            // Generate thumbnail URL
            const secureUrl = uploadResult.data.cloudinary.secure_url;
            const thumbnailUrl = secureUrl.replace('/upload/', '/upload/w_400,h_150,c_fill/');
            
            return {
                success: true,
                cover: {
                    originalName: originalName,
                    size: fileBuffer.length,
                    mimetype: 'image/jpeg',
                    cloudinary: uploadResult.data.cloudinary,
                    localBackup: uploadResult.data.localBackup,
                    thumbnailUrl: thumbnailUrl
                }
            };
            
        } catch (error) {
            console.error('❌ Cover photo upload to Cloudinary failed:', error);
            return {
                success: false,
                error: error.message,
                details: 'Failed to upload cover photo to Cloudinary'
            };
        }
    }

    // Update upload statistics
    updateStats({ success, fileType, size, duration }) {
        const today = new Date().toISOString().split('T')[0];
        
        // Initialize daily stats if not exists
        if (!this.uploadStats.dailyStats[today]) {
            this.uploadStats.dailyStats[today] = {
                uploads: 0,
                successes: 0,
                failures: 0,
                totalSize: 0
            };
        }
        
        // Update overall stats
        this.uploadStats.totalUploads++;
        
        if (success) {
            this.uploadStats.successfulUploads++;
            this.uploadStats.dailyStats[today].successes++;
            
            // Update type-specific stats
            if (fileType && this.uploadStats.byType[fileType + 's']) {
                this.uploadStats.byType[fileType + 's'].count++;
                this.uploadStats.byType[fileType + 's'].size += size;
            }
            
            this.uploadStats.totalSize += size;
        } else {
            this.uploadStats.failedUploads++;
            this.uploadStats.dailyStats[today].failures++;
        }
        
        this.uploadStats.dailyStats[today].uploads++;
        this.uploadStats.dailyStats[today].totalSize += size;
        
        // Save stats async (skipped in development)
        if (!this.isDevelopment || process.env.ENABLE_LOCAL_BACKUPS === 'true') {
            this.saveStats().catch(console.error);
        }
    }

    // Delete file from Cloudinary and remove backup
    async deleteFile(publicId) {
        try {
            console.log(`🗑️  Deleting file from Cloudinary: ${publicId}`);
            
            // 1. Get file info from mapping
            const fileInfo = this.fileMapping[publicId];
            
            // 2. Delete from Cloudinary
            const deleteResult = await deleteFromCloudinary(
                publicId,
                fileInfo?.fileType === 'document' ? 'raw' : (fileInfo?.fileType || 'auto')
            );
            
            if (!deleteResult.success) {
                throw new Error('Failed to delete from Cloudinary');
            }
            
            // 3. Remove local backup if exists (and we're not in development)
            if (fileInfo?.localBackup && (!this.isDevelopment || process.env.ENABLE_LOCAL_BACKUPS === 'true')) {
                try {
                    await fs.unlink(fileInfo.localBackup);
                    console.log(`🗑️  Deleted local backup: ${fileInfo.localBackup}`);
                } catch (error) {
                    console.warn('Could not delete local backup:', error.message);
                }
            }
            
            // 4. Remove from mapping
            if (fileInfo) {
                delete this.fileMapping[publicId];
                await this.saveMapping();
            }
            
            console.log(`✅ Deleted successfully: ${publicId}`);
            
            return {
                success: true,
                message: 'File deleted successfully',
                details: {
                    publicId,
                    originalName: fileInfo?.originalName || 'Unknown',
                    deletedAt: new Date().toISOString()
                }
            };
            
        } catch (error) {
            console.error('❌ Delete failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Get upload statistics
    getStatistics() {
        return {
            ...this.uploadStats,
            backupCount: Object.keys(this.fileMapping).length,
            backupSize: Object.values(this.fileMapping).reduce((sum, file) => sum + (file.size || 0), 0),
            developmentMode: this.isDevelopment,
            localBackupsEnabled: process.env.ENABLE_LOCAL_BACKUPS === 'true'
        };
    }

    // Get file information
    getFileInfo(publicId) {
        const mappingInfo = this.fileMapping[publicId];
        if (!mappingInfo) {
            return null;
        }
        
        return {
            cloudinaryId: publicId,
            ...mappingInfo,
            backupExists: mappingInfo.localBackup ? true : false
        };
    }

    // List all uploaded files
    listFiles(filter = {}) {
        let files = Object.entries(this.fileMapping).map(([publicId, info]) => ({
            publicId,
            ...info
        }));
        
        // Apply filters
        if (filter.fileType) {
            files = files.filter(file => file.fileType === filter.fileType);
        }
        
        if (filter.startDate) {
            const start = new Date(filter.startDate);
            files = files.filter(file => new Date(file.uploadedAt) >= start);
        }
        
        if (filter.endDate) {
            const end = new Date(filter.endDate);
            files = files.filter(file => new Date(file.uploadedAt) <= end);
        }
        
        return files;
    }
    
    // Clean up old backups (optional method)
    async cleanupOldBackups(daysToKeep = 30) {
        if (this.isDevelopment && process.env.ENABLE_LOCAL_BACKUPS !== 'true') {
            return { success: true, message: 'Cleanup skipped in development mode' };
        }
        
        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
            
            let deletedCount = 0;
            let totalSize = 0;
            
            for (const [publicId, fileInfo] of Object.entries(this.fileMapping)) {
                if (fileInfo.uploadedAt && new Date(fileInfo.uploadedAt) < cutoffDate) {
                    if (fileInfo.localBackup) {
                        try {
                            await fs.unlink(fileInfo.localBackup);
                            deletedCount++;
                            totalSize += fileInfo.size || 0;
                        } catch (error) {
                            console.warn(`Failed to delete backup: ${fileInfo.localBackup}`, error.message);
                        }
                    }
                    delete this.fileMapping[publicId];
                }
            }
            
            await this.saveMapping();
            
            return {
                success: true,
                deletedCount,
                totalSize,
                message: `Cleaned up ${deletedCount} old backups`
            };
        } catch (error) {
            console.error('Cleanup failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
}

// Create singleton instance
const cloudinaryStorageService = new CloudinaryStorageService();

module.exports = cloudinaryStorageService;