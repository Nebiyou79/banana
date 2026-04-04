const path = require('path');
const fs = require('fs');

/**
 * CENTRALIZED UPLOAD CONFIGURATION
 * This ensures consistent paths and URLs across all upload middlewares
 */

class UploadConfig {
  constructor() {
    this.init();
  }

  init() {
    // Base upload directory - works in both Docker and local
    this.BASE_DIR = process.env.UPLOADS_DIR || '/app/public/uploads';
    
    // Ensure base directory exists
    if (!fs.existsSync(this.BASE_DIR)) {
      fs.mkdirSync(this.BASE_DIR, { recursive: true });
      console.log(`📁 Created base upload directory: ${this.BASE_DIR}`);
    }
  }

  /**
   * Directory configurations
   */
  get directories() {
    return {
      avatars: 'avatars',
      covers: 'covers',
      thumbnails: 'thumbnails',
      general: 'general',
      portfolio: 'portfolio',
      products: 'products',
      tender: 'tender/documents',
      cv: 'cv',
      'post-media': 'post-media',
      'cover-photos': 'cover-photos'
    };
  }

  /**
   * Get absolute path for a specific upload type
   */
  getPath(type = 'general') {
    const dirName = this.directories[type] || type;
    const fullPath = path.join(this.BASE_DIR, dirName);
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
      console.log(`📁 Created upload directory: ${fullPath}`);
    }
    
    return fullPath;
  }

  /**
   * Get relative path (for database storage)
   */
  getRelativePath(filename, type = 'general') {
    const dirName = this.directories[type] || type;
    return path.join('uploads', dirName, filename);
  }

  /**
   * Generate URL for a file (for frontend use)
   */
  getUrl(filename, type = 'general') {
    const isProduction = process.env.NODE_ENV === 'production';
    
    // Determine base URL
    let baseUrl;
    if (isProduction) {
      // Always HTTPS in production
      baseUrl = 'https://getbananalink.com';
    } else {
      // Development - use environment variable or default
      baseUrl = process.env.BACKEND_URL || 'http://localhost:4000';
    }
    
    const dirName = this.directories[type] || type;
    return `${baseUrl}/uploads/${dirName}/${filename}`;
  }

  /**
   * Generate all URLs for a file (full URL, relative path, etc.)
   */
  generateFileInfo(file, type = 'general') {
    if (!file || !file.filename) {
      throw new Error('Invalid file object');
    }

    const dirName = this.directories[type] || type;
    const isProduction = process.env.NODE_ENV === 'production';
    const baseUrl = isProduction ? 'https://getbananalink.com' : (process.env.BACKEND_URL || 'http://localhost:4000');
    
    return {
      // Absolute URL for frontend
      url: `${baseUrl}/uploads/${dirName}/${file.filename}`,
      
      // Relative path for database storage
      path: `/uploads/${dirName}/${file.filename}`,
      
      // Storage path (where file is actually saved)
      storagePath: file.path || path.join(this.getPath(type), file.filename),
      
      // File metadata
      filename: file.filename,
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      encoding: file.encoding,
      
      // Additional info
      type: type,
      uploadedAt: new Date().toISOString(),
      environment: isProduction ? 'production' : 'development'
    };
  }

  /**
   * Check if a file exists
   */
  fileExists(filename, type = 'general') {
    const filePath = path.join(this.getPath(type), filename);
    return fs.existsSync(filePath);
  }

  /**
   * Delete a file
   */
  deleteFile(filename, type = 'general') {
    try {
      const filePath = path.join(this.getPath(type), filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`🗑️ Deleted file: ${filePath}`);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error deleting file:', error);
      return false;
    }
  }

  /**
   * List all files in a directory
   */
  listFiles(type = 'general') {
    try {
      const dirPath = this.getPath(type);
      if (fs.existsSync(dirPath)) {
        return fs.readdirSync(dirPath);
      }
      return [];
    } catch (error) {
      console.error('Error listing files:', error);
      return [];
    }
  }

  /**
   * Get storage statistics
   */
  getStats() {
    const stats = {};
    let totalSize = 0;
    let totalFiles = 0;

    Object.keys(this.directories).forEach(type => {
      const dirPath = this.getPath(type);
      if (fs.existsSync(dirPath)) {
        const files = fs.readdirSync(dirPath);
        let dirSize = 0;
        
        files.forEach(file => {
          const filePath = path.join(dirPath, file);
          try {
            const stat = fs.statSync(filePath);
            if (stat.isFile()) {
              dirSize += stat.size;
              totalSize += stat.size;
              totalFiles++;
            }
          } catch (error) {
            console.error(`Error stating file ${filePath}:`, error);
          }
        });

        stats[type] = {
          files: files.length,
          size: this.formatBytes(dirSize),
          sizeBytes: dirSize
        };
      }
    });

    return {
      ...stats,
      total: {
        files: totalFiles,
        size: this.formatBytes(totalSize),
        sizeBytes: totalSize
      },
      baseDirectory: this.BASE_DIR,
      environment: process.env.NODE_ENV || 'development'
    };
  }

  /**
   * Format bytes to human readable format
   */
  formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  /**
   * Validate upload configuration
   */
  validate() {
    const issues = [];
    
    // Check base directory
    if (!fs.existsSync(this.BASE_DIR)) {
      issues.push(`Base upload directory does not exist: ${this.BASE_DIR}`);
    } else {
      // Check write permissions
      try {
        const testFile = path.join(this.BASE_DIR, '.test-write');
        fs.writeFileSync(testFile, 'test');
        fs.unlinkSync(testFile);
      } catch (error) {
        issues.push(`No write permission in base directory: ${this.BASE_DIR}`);
      }
    }
    
    // Check all subdirectories
    Object.keys(this.directories).forEach(type => {
      const dirPath = this.getPath(type);
      if (!fs.existsSync(dirPath)) {
        issues.push(`Directory ${type} does not exist: ${dirPath}`);
      }
    });
    
    return {
      valid: issues.length === 0,
      issues: issues,
      config: {
        baseDir: this.BASE_DIR,
        environment: process.env.NODE_ENV || 'development',
        directories: this.directories
      }
    };
  }
}

// Create singleton instance
const uploadConfig = new UploadConfig();

// Export both the instance and the class
module.exports = {
  uploadConfig,
  UploadConfig,
  
  // Helper functions for backward compatibility
  getPath: (type) => uploadConfig.getPath(type),
  getUrl: (filename, type) => uploadConfig.getUrl(filename, type),
  getRelativePath: (filename, type) => uploadConfig.getRelativePath(filename, type),
  generateFileInfo: (file, type) => uploadConfig.generateFileInfo(file, type),
  fileExists: (filename, type) => uploadConfig.fileExists(filename, type),
  deleteFile: (filename, type) => uploadConfig.deleteFile(filename, type),
  listFiles: (type) => uploadConfig.listFiles(type),
  getStats: () => uploadConfig.getStats(),
  validate: () => uploadConfig.validate(),
  
  // Constants
  UPLOAD_TYPES: Object.keys(uploadConfig.directories),
  MAX_FILE_SIZE: process.env.MAX_FILE_SIZE || '50MB',
  ALLOWED_MIME_TYPES: {
    images: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
    videos: ['video/mp4', 'video/quicktime', 'video/webm', 'video/ogg'],
    documents: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'],
    archives: ['application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed']
  }
};