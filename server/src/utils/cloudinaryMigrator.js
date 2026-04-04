const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const cloudinaryStorageService = require('../services/cloudinaryStorageService');
const { cloudinary } = require('../config/cloudinary');

class CloudinaryMigrator {
    constructor() {
        this.migrationBasePath = path.join(process.cwd(), 'migrations', 'cloudinary');
        this.migrationLogPath = path.join(this.migrationBasePath, 'migration-log.json');
        this.backupAnalysisPath = path.join(this.migrationBasePath, 'backup-analysis.json');
        this.rollbackPlanPath = path.join(this.migrationBasePath, 'rollback-plan.json');
        this.ensureMigrationStructure();
    }

    // Initialize migration directory structure
    async ensureMigrationStructure() {
        const directories = [
            this.migrationBasePath,
            path.join(this.migrationBasePath, 'exports'),
            path.join(this.migrationBasePath, 'reports'),
            path.join(this.migrationBasePath, 'temp')
        ];

        for (const dir of directories) {
            try {
                await fs.access(dir);
            } catch {
                await fs.mkdir(dir, { recursive: true });
                console.log(`📁 Created migration directory: ${dir}`);
            }
        }
    }

    // Load migration log
    async loadMigrationLog() {
        try {
            const data = await fs.readFile(this.migrationLogPath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            return {
                migrations: [],
                totalFiles: 0,
                totalSize: 0,
                startDate: null,
                lastUpdated: null,
                status: 'not_started'
            };
        }
    }

    // Save migration log
    async saveMigrationLog(log) {
        try {
            log.lastUpdated = new Date().toISOString();
            await fs.writeFile(this.migrationLogPath, JSON.stringify(log, null, 2));
        } catch (error) {
            console.error('Error saving migration log:', error);
        }
    }

    /**
     * PHASE 1: Analyze existing local uploads
     * Scans local upload directories to understand what needs to be migrated
     */
    async analyzeLocalUploads(uploadDirs = []) {
        console.log('🔍 Analyzing local uploads...');
        
        const defaultDirs = [
            path.join(process.cwd(), 'uploads'),
            path.join(process.cwd(), 'public', 'uploads'),
            path.join(process.cwd(), 'storage', 'uploads')
        ];
        
        const directories = uploadDirs.length > 0 ? uploadDirs : defaultDirs;
        const analysis = {
            timestamp: new Date().toISOString(),
            directories: {},
            summary: {
                totalFiles: 0,
                totalSize: 0,
                byType: {},
                byExtension: {},
                orphanedFiles: []
            }
        };

        for (const dir of directories) {
            try {
                await fs.access(dir);
                const files = await this.scanDirectory(dir);
                analysis.directories[dir] = files;
                
                // Update summary
                files.forEach(file => {
                    analysis.summary.totalFiles++;
                    analysis.summary.totalSize += file.size;
                    
                    // Count by type
                    const type = this.getFileType(file.extension);
                    analysis.summary.byType[type] = (analysis.summary.byType[type] || 0) + 1;
                    
                    // Count by extension
                    analysis.summary.byExtension[file.extension] = (analysis.summary.byExtension[file.extension] || 0) + 1;
                });
                
                console.log(`✅ Scanned ${dir}: ${files.length} files`);
            } catch (error) {
                console.log(`⚠️  Directory not found: ${dir}`);
                analysis.directories[dir] = { error: 'Directory not found' };
            }
        }

        // Save analysis
        await fs.writeFile(this.backupAnalysisPath, JSON.stringify(analysis, null, 2));
        
        console.log('📊 Analysis complete!');
        console.log(`Total files: ${analysis.summary.totalFiles}`);
        console.log(`Total size: ${this.formatBytes(analysis.summary.totalSize)}`);
        
        return analysis;
    }

    // Scan directory recursively
    async scanDirectory(dir, baseDir = dir) {
        const files = [];
        
        try {
            const items = await fs.readdir(dir, { withFileTypes: true });
            
            for (const item of items) {
                const fullPath = path.join(dir, item.name);
                
                if (item.isDirectory()) {
                    const subFiles = await this.scanDirectory(fullPath, baseDir);
                    files.push(...subFiles);
                } else if (item.isFile()) {
                    const stats = await fs.stat(fullPath);
                    const relativePath = path.relative(baseDir, fullPath);
                    const extension = path.extname(item.name).toLowerCase();
                    
                    files.push({
                        name: item.name,
                        path: fullPath,
                        relativePath,
                        size: stats.size,
                        extension,
                        type: this.getFileType(extension),
                        lastModified: stats.mtime,
                        createdAt: stats.birthtime
                    });
                }
            }
        } catch (error) {
            console.error(`Error scanning directory ${dir}:`, error);
        }
        
        return files;
    }

    // Determine file type from extension
    getFileType(extension) {
        const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
        const videoExtensions = ['.mp4', '.mov', '.avi', '.mkv', '.webm'];
        const documentExtensions = ['.pdf', '.doc', '.docx', '.txt', '.rtf', '.odt'];
        
        if (imageExtensions.includes(extension)) return 'image';
        if (videoExtensions.includes(extension)) return 'video';
        if (documentExtensions.includes(extension)) return 'document';
        return 'other';
    }

    // Format bytes to human readable
    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * PHASE 2: Generate migration plan
     * Creates a detailed plan for migrating local files to Cloudinary
     */
    async generateMigrationPlan(analysis, options = {}) {
        console.log('📋 Generating migration plan...');
        
        const plan = {
            timestamp: new Date().toISOString(),
            strategy: {
                batchSize: options.batchSize || 50,
                concurrentUploads: options.concurrentUploads || 5,
                preserveStructure: options.preserveStructure || false,
                backupOriginal: options.backupOriginal || true
            },
            files: [],
            estimated: {
                totalFiles: 0,
                totalSize: 0,
                estimatedTime: 0,
                cloudinaryCost: 0
            },
            steps: []
        };
        
        // Collect all files from analysis
        for (const [dir, dirData] of Object.entries(analysis.directories)) {
            if (Array.isArray(dirData)) {
                dirData.forEach(file => {
                    plan.files.push({
                        ...file,
                        targetFolder: this.generateCloudinaryFolder(file, options.preserveStructure),
                        uploadPreset: this.getUploadPreset(file.type),
                        status: 'pending',
                        migrationId: crypto.randomBytes(8).toString('hex')
                    });
                });
            }
        }
        
        plan.estimated.totalFiles = plan.files.length;
        plan.estimated.totalSize = plan.files.reduce((sum, file) => sum + file.size, 0);
        
        // Estimate time (roughly 5MB/sec upload speed)
        const uploadSpeed = 5 * 1024 * 1024; // 5MB per second
        plan.estimated.estimatedTime = Math.ceil(plan.estimated.totalSize / uploadSpeed);
        
        // Estimate Cloudinary cost (free tier: 25GB storage, 25GB bandwidth)
        // This is just for awareness
        plan.estimated.cloudinaryCost = {
            storage: `${(plan.estimated.totalSize / (1024 * 1024 * 1024)).toFixed(2)} GB`,
            bandwidth: `${(plan.estimated.totalSize * 2 / (1024 * 1024 * 1024)).toFixed(2)} GB (estimated)`,
            note: 'Check Cloudinary pricing for exact costs'
        };
        
        // Define migration steps
        plan.steps = [
            {
                id: 1,
                name: 'Create backup of original files',
                description: 'Copy all files to migration backup directory',
                estimatedTime: '5-10 minutes',
                status: 'pending'
            },
            {
                id: 2,
                name: 'Upload documents to Cloudinary',
                description: 'Upload PDF, DOC, TXT files',
                estimatedTime: `${Math.ceil(plan.files.filter(f => f.type === 'document').length / plan.strategy.batchSize)} batches`,
                status: 'pending'
            },
            {
                id: 3,
                name: 'Upload images to Cloudinary',
                description: 'Upload JPG, PNG, GIF files with optimization',
                estimatedTime: `${Math.ceil(plan.files.filter(f => f.type === 'image').length / plan.strategy.batchSize)} batches`,
                status: 'pending'
            },
            {
                id: 4,
                name: 'Upload videos to Cloudinary',
                description: 'Upload MP4, MOV, AVI files',
                estimatedTime: `${Math.ceil(plan.files.filter(f => f.type === 'video').length / plan.strategy.batchSize)} batches`,
                status: 'pending'
            },
            {
                id: 5,
                name: 'Update database records',
                description: 'Replace local file paths with Cloudinary URLs',
                estimatedTime: 'Varies by database size',
                status: 'pending'
            },
            {
                id: 6,
                name: 'Verify uploads',
                description: 'Check all files uploaded correctly',
                estimatedTime: '10-15 minutes',
                status: 'pending'
            },
            {
                id: 7,
                name: 'Cleanup local files',
                description: 'Remove original files after verification',
                estimatedTime: '5 minutes',
                status: 'pending',
                warning: 'IRREVERSIBLE - Make sure backups exist'
            }
        ];
        
        // Save migration plan
        const planPath = path.join(this.migrationBasePath, 'migration-plan.json');
        await fs.writeFile(planPath, JSON.stringify(plan, null, 2));
        
        console.log('✅ Migration plan generated!');
        console.log(`Files to migrate: ${plan.estimated.totalFiles}`);
        console.log(`Total size: ${this.formatBytes(plan.estimated.totalSize)}`);
        console.log(`Estimated time: ${Math.ceil(plan.estimated.estimatedTime / 60)} minutes`);
        console.log(`Plan saved to: ${planPath}`);
        
        return plan;
    }

    // Generate Cloudinary folder structure
    generateCloudinaryFolder(file, preserveStructure) {
        if (!preserveStructure) {
            return `bananalink/migrated/${file.type}s`;
        }
        
        // Extract meaningful path from relative path
        const safePath = file.relativePath
            .replace(/\\/g, '/') // Convert to forward slashes
            .replace(/[^a-zA-Z0-9\/._-]/g, '_') // Replace special chars
            .replace(/\/+/g, '/') // Remove duplicate slashes
            .replace(/^\/+|\/+$/g, ''); // Trim slashes
        
        return `bananalink/migrated/${safePath}`;
    }

    // Get appropriate upload preset
    getUploadPreset(fileType) {
        const presets = {
            document: 'bananalink_files',
            image: 'bananalink_media',
            video: 'bananalink_media',
            other: 'bananalink_files'
        };
        
        return presets[fileType] || presets.other;
    }

    /**
     * PHASE 3: Execute migration
     * Migrates files in batches with progress tracking
     */
    async executeMigration(planPath, options = {}) {
        console.log('🚀 Starting migration execution...');
        
        // Load migration plan
        const planData = await fs.readFile(planPath, 'utf8');
        const plan = JSON.parse(planData);
        
        // Update migration log
        const migrationLog = await this.loadMigrationLog();
        const migrationId = `migration_${Date.now()}`;
        
        migrationLog.migrations.push({
            id: migrationId,
            startTime: new Date().toISOString(),
            plan: path.basename(planPath),
            totalFiles: plan.estimated.totalFiles,
            status: 'in_progress'
        });
        
        migrationLog.status = 'in_progress';
        migrationLog.startDate = new Date().toISOString();
        await this.saveMigrationLog(migrationLog);
        
        // Create backup of original files
        console.log('💾 Creating backup of original files...');
        await this.backupOriginalFiles(plan.files);
        
        // Group files by type for batch processing
        const filesByType = {
            document: plan.files.filter(f => f.type === 'document'),
            image: plan.files.filter(f => f.type === 'image'),
            video: plan.files.filter(f => f.type === 'video'),
            other: plan.files.filter(f => !['document', 'image', 'video'].includes(f.type))
        };
        
        const results = {
            successful: [],
            failed: [],
            skipped: []
        };
        
        let processedCount = 0;
        const totalFiles = plan.files.length;
        
        // Process each file type
        for (const [type, files] of Object.entries(filesByType)) {
            if (files.length === 0) continue;
            
            console.log(`📤 Uploading ${files.length} ${type} files...`);
            
            // Process in batches
            const batchSize = plan.strategy.batchSize;
            for (let i = 0; i < files.length; i += batchSize) {
                const batch = files.slice(i, i + batchSize);
                console.log(`  Batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(files.length / batchSize)}`);
                
                // Process batch concurrently
                const batchPromises = batch.map(async (file) => {
                    try {
                        // Read file
                        const fileBuffer = await fs.readFile(file.path);
                        
                        // Upload to Cloudinary
                        const uploadResult = await cloudinaryStorageService.uploadFile(
                            fileBuffer,
                            file.name,
                            {
                                folder: file.targetFolder,
                                upload_preset: file.uploadPreset,
                                tags: ['migrated', 'bananalink', type],
                                context: {
                                    migrationId,
                                    originalPath: file.relativePath,
                                    migratedAt: new Date().toISOString()
                                }
                            }
                        );
                        
                        if (uploadResult.success) {
                            file.status = 'completed';
                            file.cloudinaryData = uploadResult.data.cloudinary;
                            file.migratedAt = new Date().toISOString();
                            
                            results.successful.push({
                                originalPath: file.path,
                                cloudinaryId: uploadResult.data.cloudinary.public_id,
                                url: uploadResult.data.cloudinary.secure_url,
                                size: file.size,
                                type
                            });
                            
                            // Update file record
                            const index = plan.files.findIndex(f => f.migrationId === file.migrationId);
                            if (index !== -1) {
                                plan.files[index] = file;
                            }
                            
                            return { success: true, file };
                        } else {
                            throw new Error(uploadResult.error);
                        }
                    } catch (error) {
                        console.error(`Failed to migrate ${file.name}:`, error.message);
                        file.status = 'failed';
                        file.error = error.message;
                        
                        results.failed.push({
                            originalPath: file.path,
                            name: file.name,
                            error: error.message,
                            type
                        });
                        
                        return { success: false, file, error };
                    }
                });
                
                // Wait for batch to complete
                const batchResults = await Promise.all(batchPromises);
                processedCount += batch.length;
                
                // Update progress
                const progress = Math.round((processedCount / totalFiles) * 100);
                console.log(`  Progress: ${progress}% (${processedCount}/${totalFiles})`);
                
                // Save intermediate results every batch
                await this.saveMigrationResults(results, migrationId, progress);
                
                // Small delay between batches to avoid rate limiting
                if (i + batchSize < files.length) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }
        }
        
        // Update migration log with completion
        migrationLog.migrations = migrationLog.migrations.map(mig => 
            mig.id === migrationId 
                ? { 
                    ...mig, 
                    endTime: new Date().toISOString(),
                    status: 'completed',
                    results: {
                        successful: results.successful.length,
                        failed: results.failed.length,
                        skipped: results.skipped.length
                    }
                } 
                : mig
        );
        
        migrationLog.status = 'completed';
        migrationLog.totalFiles = results.successful.length;
        migrationLog.totalSize = results.successful.reduce((sum, file) => sum + (file.size || 0), 0);
        await this.saveMigrationLog(migrationLog);
        
        // Generate migration report
        await this.generateMigrationReport(migrationId, results, plan);
        
        console.log('✅ Migration completed!');
        console.log(`Successful: ${results.successful.length}`);
        console.log(`Failed: ${results.failed.length}`);
        console.log(`Skipped: ${results.skipped.length}`);
        
        return results;
    }

    // Backup original files before migration
    async backupOriginalFiles(files) {
        const backupDir = path.join(this.migrationBasePath, 'original-backup');
        await fs.mkdir(backupDir, { recursive: true });
        
        // Create a manifest of original files
        const manifest = {
            timestamp: new Date().toISOString(),
            totalFiles: files.length,
            totalSize: files.reduce((sum, file) => sum + file.size, 0),
            files: files.map(file => ({
                originalPath: file.path,
                backupPath: path.join(backupDir, file.migrationId + path.extname(file.name)),
                size: file.size,
                type: file.type
            }))
        };
        
        // Save manifest
        await fs.writeFile(
            path.join(backupDir, 'manifest.json'),
            JSON.stringify(manifest, null, 2)
        );
        
        // Copy files (in practice, you might want to copy large files selectively)
        console.log('📝 Created backup manifest. Note: Large-scale file copying is not automated.');
        console.log(`Backup directory: ${backupDir}`);
        
        return backupDir;
    }

    // Save migration results
    async saveMigrationResults(results, migrationId, progress) {
        const resultsDir = path.join(this.migrationBasePath, 'exports');
        const resultsPath = path.join(resultsDir, `${migrationId}_progress.json`);
        
        await fs.writeFile(resultsPath, JSON.stringify({
            migrationId,
            timestamp: new Date().toISOString(),
            progress,
            ...results
        }, null, 2));
    }

    // Generate migration report
    async generateMigrationReport(migrationId, results, plan) {
        const report = {
            migrationId,
            generatedAt: new Date().toISOString(),
            summary: {
                totalFiles: results.successful.length + results.failed.length + results.skipped.length,
                successful: results.successful.length,
                failed: results.failed.length,
                skipped: results.skipped.length,
                successRate: ((results.successful.length / (results.successful.length + results.failed.length)) * 100).toFixed(2) + '%'
            },
            cloudinaryUsage: {
                totalStorage: results.successful.reduce((sum, file) => sum + (file.size || 0), 0),
                byType: this.groupByType(results.successful)
            },
            failedUploads: results.failed,
            recommendations: this.generateRecommendations(results),
            nextSteps: [
                'Update your application code to use Cloudinary URLs',
                'Monitor Cloudinary usage in dashboard',
                'Consider setting up auto-backup to another cloud service',
                'Review failed uploads and retry if necessary'
            ]
        };
        
        const reportPath = path.join(this.migrationBasePath, 'reports', `${migrationId}_report.json`);
        await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
        
        // Also create a CSV export for easy analysis
        await this.createCSVExport(results, migrationId);
        
        return report;
    }

    // Group files by type for reporting
    groupByType(files) {
        const groups = {};
        
        files.forEach(file => {
            const type = file.type || 'unknown';
            if (!groups[type]) {
                groups[type] = {
                    count: 0,
                    totalSize: 0,
                    averageSize: 0
                };
            }
            
            groups[type].count++;
            groups[type].totalSize += file.size || 0;
        });
        
        // Calculate averages
        Object.keys(groups).forEach(type => {
            groups[type].averageSize = Math.round(groups[type].totalSize / groups[type].count);
            groups[type].totalSizeFormatted = this.formatBytes(groups[type].totalSize);
        });
        
        return groups;
    }

    // Generate recommendations based on migration results
    generateRecommendations(results) {
        const recommendations = [];
        
        if (results.failed.length > 0) {
            recommendations.push({
                priority: 'high',
                issue: `${results.failed.length} files failed to upload`,
                action: 'Review failed-uploads in the report and retry manually',
                files: results.failed.map(f => f.name).slice(0, 5) // Show first 5
            });
        }
        
        const largeFiles = results.successful.filter(f => f.size > 50 * 1024 * 1024); // > 50MB
        if (largeFiles.length > 0) {
            recommendations.push({
                priority: 'medium',
                issue: `${largeFiles.length} large files (>50MB) uploaded`,
                action: 'Monitor Cloudinary bandwidth usage as large files may incur costs',
                note: 'Consider compressing videos or using Cloudinary video optimization'
            });
        }
        
        const totalSize = results.successful.reduce((sum, f) => sum + (f.size || 0), 0);
        if (totalSize > 10 * 1024 * 1024 * 1024) { // > 10GB
            recommendations.push({
                priority: 'high',
                issue: 'Large total storage usage',
                action: 'Consider Cloudinary enterprise plan or alternative storage strategy',
                estimatedCost: 'Check Cloudinary pricing calculator for exact costs'
            });
        }
        
        return recommendations;
    }

    // Create CSV export
    async createCSVExport(results, migrationId) {
        const csvDir = path.join(this.migrationBasePath, 'exports');
        const csvPath = path.join(csvDir, `${migrationId}_export.csv`);
        
        let csvContent = 'Status,Type,Original Path,Cloudinary ID,URL,Size,Error\n';
        
        // Add successful files
        results.successful.forEach(file => {
            csvContent += `SUCCESS,${file.type || 'unknown'},"${file.originalPath || ''}","${file.cloudinaryId || ''}","${file.url || ''}",${file.size || 0},\n`;
        });
        
        // Add failed files
        results.failed.forEach(file => {
            csvContent += `FAILED,${file.type || 'unknown'},"${file.originalPath || ''}",,,${file.size || 0},"${(file.error || '').replace(/"/g, '""')}"\n`;
        });
        
        // Add skipped files
        results.skipped.forEach(file => {
            csvContent += `SKIPPED,${file.type || 'unknown'},"${file.originalPath || ''}",,,${file.size || 0},Skipped\n`;
        });
        
        await fs.writeFile(csvPath, csvContent);
        console.log(`📊 CSV export created: ${csvPath}`);
    }

    /**
     * PHASE 4: Rollback utilities
     * Tools to revert migration if needed
     */
    async generateRollbackPlan(migrationId) {
        console.log('🔄 Generating rollback plan...');
        
        // Load migration results
        const resultsPath = path.join(this.migrationBasePath, 'exports', `${migrationId}_progress.json`);
        const results = JSON.parse(await fs.readFile(resultsPath, 'utf8'));
        
        const rollbackPlan = {
            migrationId,
            generatedAt: new Date().toISOString(),
            summary: {
                filesToRestore: results.successful.length,
                cloudinaryFilesToDelete: results.successful.length,
                estimatedTime: 'Varies by file count'
            },
            steps: [
                {
                    id: 1,
                    action: 'Download files from Cloudinary',
                    description: 'Use Cloudinary API to download all migrated files',
                    command: 'node scripts/download-from-cloudinary.js',
                    status: 'pending'
                },
                {
                    id: 2,
                    action: 'Restore to original locations',
                    description: 'Place downloaded files in their original paths',
                    note: 'Requires original path mapping from migration',
                    status: 'pending'
                },
                {
                    id: 3,
                    action: 'Delete from Cloudinary',
                    description: 'Remove files from Cloudinary to avoid duplicate storage',
                    warning: 'This will permanently delete files from Cloudinary',
                    status: 'pending'
                },
                {
                    id: 4,
                    action: 'Update database',
                    description: 'Revert Cloudinary URLs back to local paths',
                    status: 'pending'
                }
            ],
            cloudinaryFiles: results.successful.map(file => ({
                publicId: file.cloudinaryId,
                url: file.url,
                originalPath: file.originalPath,
                size: file.size
            }))
        };
        
        await fs.writeFile(this.rollbackPlanPath, JSON.stringify(rollbackPlan, null, 2));
        
        console.log('✅ Rollback plan generated!');
        console.log(`Plan saved to: ${this.rollbackPlanPath}`);
        
        return rollbackPlan;
    }

    // Verify backup consistency
    async verifyBackups() {
        console.log('🔍 Verifying backup consistency...');
        
        const cloudinaryStorage = cloudinaryStorageService;
        const mapping = await cloudinaryStorage.getFileMapping();
        const stats = await cloudinaryStorage.getStatistics();
        
        const verification = {
            timestamp: new Date().toISOString(),
            cloudinaryFiles: Object.keys(mapping).length,
            localBackups: Object.values(mapping).filter(f => f.localBackup).length,
            backupSize: Object.values(mapping).reduce((sum, file) => sum + (file.size || 0), 0),
            issues: []
        };
        
        // Check each file's backup
        for (const [publicId, fileInfo] of Object.entries(mapping)) {
            if (fileInfo.localBackup) {
                try {
                    await fs.access(fileInfo.localBackup);
                    // Backup exists and is accessible
                } catch (error) {
                    verification.issues.push({
                        publicId,
                        issue: 'Backup file missing or inaccessible',
                        backupPath: fileInfo.localBackup,
                        error: error.message
                    });
                }
            } else {
                verification.issues.push({
                    publicId,
                    issue: 'No local backup exists',
                    originalName: fileInfo.originalName
                });
            }
        }
        
        const reportPath = path.join(this.migrationBasePath, 'reports', `backup-verification_${Date.now()}.json`);
        await fs.writeFile(reportPath, JSON.stringify(verification, null, 2));
        
        console.log('✅ Backup verification complete!');
        console.log(`Issues found: ${verification.issues.length}`);
        console.log(`Report saved to: ${reportPath}`);
        
        return verification;
    }
}

// Export singleton instance
const cloudinaryMigrator = new CloudinaryMigrator();
module.exports = cloudinaryMigrator;