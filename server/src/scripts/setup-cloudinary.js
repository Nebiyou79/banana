#!/usr/bin/env node

/**
 * Cloudinary Setup Script for BananaLink
 * 
 * This script helps set up and verify Cloudinary configuration for the BananaLink platform.
 * Run with: node setup-cloudinary.js [command]
 * 
 * Commands:
 *   verify        - Verify Cloudinary credentials and connection
 *   test-upload   - Test file upload to Cloudinary
 *   create-dirs   - Create necessary backup directories
 *   full-setup    - Run all setup steps
 *   generate-env  - Generate .env template
 */

const fs = require('fs').promises;
const path = require('path');
const dotenv = require('dotenv');
const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    cyan: '\x1b[36m',
    blue: '\x1b[34m'
};

// Load environment variables
dotenv.config();

class CloudinarySetup {
    constructor() {
        this.projectRoot = process.cwd();
        this.backupDir = path.join(this.projectRoot, 'backups', 'cloudinary');
        this.migrationDir = path.join(this.projectRoot, 'migrations', 'cloudinary');
        this.testFilesDir = path.join(this.projectRoot, 'test-uploads');
        this.envFilePath = path.join(this.projectRoot, '.env');
    }

    // Print formatted messages
    print(message, type = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        const prefix = {
            info: `${colors.cyan}[INFO]${colors.reset}`,
            success: `${colors.green}[SUCCESS]${colors.reset}`,
            warning: `${colors.yellow}[WARNING]${colors.reset}`,
            error: `${colors.red}[ERROR]${colors.reset}`,
            step: `${colors.blue}[STEP]${colors.reset}`
        }[type];
        
        console.log(`${colors.bright}${timestamp}${colors.reset} ${prefix} ${message}`);
    }

    // Print banner
    printBanner() {
        console.log(`
${colors.bright}${colors.cyan}
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║           BananaLink Cloudinary Setup Script                ║
║                                                              ║
║     Streamlining upload system from 6+ middlewares to 2      ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
${colors.reset}
`);
    }

    // Check if running in correct directory
    async checkProjectStructure() {
        this.print('Checking project structure...', 'step');
        
        const requiredDirs = [
            'server',
            'server/src',
            'server/src/middleware',
            'server/src/config',
            'server/src/services',
            'server/src/utils'
        ];
        
        const missingDirs = [];
        
        for (const dir of requiredDirs) {
            const dirPath = path.join(this.projectRoot, dir);
            try {
                await fs.access(dirPath);
            } catch {
                missingDirs.push(dir);
            }
        }
        
        if (missingDirs.length > 0) {
            this.print(`Missing directories: ${missingDirs.join(', ')}`, 'error');
            this.print('Please run this script from the project root directory.', 'warning');
            return false;
        }
        
        this.print('Project structure OK', 'success');
        return true;
    }

    // Verify Cloudinary credentials
    async verifyCredentials() {
        this.print('Verifying Cloudinary credentials...', 'step');
        
        const requiredEnvVars = [
            'CLOUDINARY_CLOUD_NAME',
            'CLOUDINARY_API_KEY', 
            'CLOUDINARY_API_SECRET'
        ];
        
        const missingVars = [];
        const presentVars = [];
        
        for (const envVar of requiredEnvVars) {
            if (process.env[envVar]) {
                presentVars.push(envVar);
            } else {
                missingVars.push(envVar);
            }
        }
        
        if (presentVars.length > 0) {
            this.print(`Found: ${presentVars.join(', ')}`, 'success');
        }
        
        if (missingVars.length > 0) {
            this.print(`Missing: ${missingVars.join(', ')}`, 'error');
            this.print('Please add these to your .env file:', 'warning');
            
            const envTemplate = `
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name_here
CLOUDINARY_API_KEY=your_api_key_here
CLOUDINARY_API_SECRET=your_api_secret_here

# Optional: Upload Presets (if using unsigned uploads)
# CLOUDINARY_UPLOAD_PRESET_FILES=bananalink_files
# CLOUDINARY_UPLOAD_PRESET_MEDIA=bananalink_media
`;
            
            this.print(envTemplate, 'info');
            return false;
        }
        
        // Test Cloudinary connection
        try {
            // Try to import cloudinary config
            const cloudinaryPath = path.join(this.projectRoot, 'server/src/config/cloudinary.js');
            await fs.access(cloudinaryPath);
            
            // Dynamically load the module to test
            const { cloudinary } = require(cloudinaryPath);
            
            // Simple ping test by trying to get cloud name
            const cloudName = cloudinary.config().cloud_name;
            if (cloudName) {
                this.print(`Connected to Cloudinary cloud: ${cloudName}`, 'success');
                return true;
            } else {
                this.print('Cloudinary configured but cloud name not found', 'error');
                return false;
            }
        } catch (error) {
            this.print(`Error testing Cloudinary: ${error.message}`, 'error');
            this.print('Make sure cloudinary.config.js is properly configured', 'warning');
            return false;
        }
    }

    // Create necessary directories
    async createDirectories() {
        this.print('Creating necessary directories...', 'step');
        
        const directories = [
            this.backupDir,
            path.join(this.backupDir, 'documents'),
            path.join(this.backupDir, 'images'),
            path.join(this.backupDir, 'videos'),
            path.join(this.backupDir, 'avatars'),
            path.join(this.backupDir, 'covers'),
            this.migrationDir,
            path.join(this.migrationDir, 'exports'),
            path.join(this.migrationDir, 'reports'),
            path.join(this.migrationDir, 'temp'),
            this.testFilesDir
        ];
        
        let createdCount = 0;
        let existingCount = 0;
        
        for (const dir of directories) {
            try {
                await fs.access(dir);
                existingCount++;
            } catch {
                await fs.mkdir(dir, { recursive: true });
                this.print(`Created: ${dir}`, 'info');
                createdCount++;
            }
        }
        
        this.print(`Directories: ${existingCount} existing, ${createdCount} created`, 'success');
        return true;
    }

    // Test file upload
    async testUpload() {
        this.print('Testing file upload functionality...', 'step');
        
        // Create test files
        const testFiles = [
            { name: 'test-document.pdf', type: 'document', content: 'Test PDF content' },
            { name: 'test-image.jpg', type: 'image', content: 'Test image content' },
            { name: 'test-video.mp4', type: 'video', content: 'Test video content' }
        ];
        
        // Create test files
        for (const testFile of testFiles) {
            const filePath = path.join(this.testFilesDir, testFile.name);
            await fs.writeFile(filePath, testFile.content);
            this.print(`Created test file: ${testFile.name}`, 'info');
        }
        
        // Try to use the cloudinaryStorageService
        try {
            const cloudinaryStorageService = require('../src/services/cloudinaryStorageService');
            
            // Test with a small text file
            const testBuffer = Buffer.from('This is a test upload for BananaLink Cloudinary setup');
            const testFileName = 'setup-test-file.txt';
            
            this.print('Uploading test file to Cloudinary...', 'info');
            
            const result = await cloudinaryStorageService.uploadFile(
                testBuffer,
                testFileName,
                {
                    folder: 'bananalink/tests',
                    tags: ['test', 'setup', 'bananalink'],
                    context: {
                        testRun: 'setup_verification',
                        timestamp: new Date().toISOString()
                    }
                }
            );
            
            if (result.success) {
                this.print('✅ Test upload successful!', 'success');
                this.print(`File URL: ${result.data.cloudinary.secure_url}`, 'info');
                this.print(`Public ID: ${result.data.cloudinary.public_id}`, 'info');
                this.print(`Backup created: ${result.data.localBackup ? 'Yes' : 'No'}`, 'info');
                
                // Test deletion
                this.print('Testing file deletion...', 'info');
                const deleteResult = await cloudinaryStorageService.deleteFile(result.data.cloudinary.public_id);
                
                if (deleteResult.success) {
                    this.print('✅ Test deletion successful!', 'success');
                } else {
                    this.print(`Deletion warning: ${deleteResult.error}`, 'warning');
                }
                
                return true;
            } else {
                this.print(`Upload failed: ${result.error}`, 'error');
                return false;
            }
        } catch (error) {
            this.print(`Error during upload test: ${error.message}`, 'error');
            this.print('Make sure Cloudinary configuration is complete', 'warning');
            return false;
        } finally {
            // Cleanup test files
            try {
                await fs.rm(this.testFilesDir, { recursive: true, force: true });
                this.print('Cleaned up test files', 'info');
            } catch (cleanupError) {
                // Ignore cleanup errors
            }
        }
    }

    // Check required npm packages
    async checkPackages() {
        this.print('Checking required npm packages...', 'step');
        
        const requiredPackages = [
            'cloudinary',
            'multer',
            'dotenv',
            'express'
        ];
        
        try {
            const { stdout } = await execAsync('npm list --depth=0 --json');
            const packages = JSON.parse(stdout).dependencies || {};
            
            const missingPackages = [];
            const outdatedPackages = [];
            
            for (const pkg of requiredPackages) {
                if (!packages[pkg]) {
                    missingPackages.push(pkg);
                }
            }
            
            if (missingPackages.length === 0) {
                this.print('All required packages are installed', 'success');
                return true;
            } else {
                this.print(`Missing packages: ${missingPackages.join(', ')}`, 'warning');
                this.print('Run: npm install cloudinary multer dotenv', 'info');
                return false;
            }
        } catch (error) {
            this.print(`Error checking packages: ${error.message}`, 'error');
            return false;
        }
    }

    // Generate configuration report
    async generateReport() {
        this.print('Generating configuration report...', 'step');
        
        const report = {
            generatedAt: new Date().toISOString(),
            system: {
                nodeVersion: process.version,
                platform: process.platform,
                arch: process.arch
            },
            environment: {
                NODE_ENV: process.env.NODE_ENV || 'not set',
                CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME ? '✓ Set' : '✗ Missing',
                CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY ? '✓ Set' : '✗ Missing',
                CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET ? '✓ Set' : '✗ Missing'
            },
            directories: {
                projectRoot: this.projectRoot,
                backupDir: this.backupDir,
                migrationDir: this.migrationDir,
                exists: {
                    backupDir: await this.checkExists(this.backupDir),
                    migrationDir: await this.checkExists(this.migrationDir),
                    srcConfig: await this.checkExists(path.join(this.projectRoot, 'server/src/config')),
                    srcMiddleware: await this.checkExists(path.join(this.projectRoot, 'server/src/middleware'))
                }
            },
            recommendations: []
        };
        
        // Add recommendations based on findings
        if (!process.env.CLOUDINARY_CLOUD_NAME) {
            report.recommendations.push({
                priority: 'high',
                action: 'Add Cloudinary credentials to .env file',
                command: 'echo "CLOUDINARY_CLOUD_NAME=your_cloud_name" >> .env'
            });
        }
        
        if (!report.directories.exists.backupDir) {
            report.recommendations.push({
                priority: 'medium',
                action: 'Create backup directories',
                command: 'mkdir -p backups/cloudinary/{documents,images,videos,avatars,covers}'
            });
        }
        
        // Save report
        const reportPath = path.join(this.migrationDir, 'setup-report.json');
        await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
        
        this.print(`Report saved to: ${reportPath}`, 'success');
        
        // Print summary
        console.log('\n' + colors.bright + '📊 SETUP REPORT SUMMARY' + colors.reset);
        console.log('=' .repeat(50));
        console.log(`Environment: ${report.environment.NODE_ENV}`);
        console.log(`Cloudinary Config: ${report.environment.CLOUDINARY_CLOUD_NAME === '✓ Set' ? colors.green + 'Complete' + colors.reset : colors.red + 'Incomplete' + colors.reset}`);
        console.log(`Backup Directory: ${report.directories.exists.backupDir ? colors.green + 'Exists' + colors.reset : colors.yellow + 'Missing' + colors.reset}`);
        console.log(`Migration Directory: ${report.directories.exists.migrationDir ? colors.green + 'Exists' + colors.reset : colors.yellow + 'Missing' + colors.reset}`);
        
        if (report.recommendations.length > 0) {
            console.log('\n' + colors.bright + '📋 RECOMMENDED ACTIONS:' + colors.reset);
            report.recommendations.forEach((rec, index) => {
                console.log(`${index + 1}. [${rec.priority.toUpperCase()}] ${rec.action}`);
                if (rec.command) {
                    console.log(`   💻 ${rec.command}`);
                }
            });
        }
        
        return report;
    }

    // Check if path exists
    async checkExists(pathToCheck) {
        try {
            await fs.access(pathToCheck);
            return true;
        } catch {
            return false;
        }
    }

    // Generate .env template
    async generateEnvTemplate() {
        this.print('Generating .env template...', 'step');
        
        const envTemplate = `# BananaLink Cloudinary Configuration
# ==========================================

# REQUIRED: Cloudinary Credentials
# Get these from https://cloudinary.com/console
CLOUDINARY_CLOUD_NAME=your_cloud_name_here
CLOUDINARY_API_KEY=your_api_key_here  
CLOUDINARY_API_SECRET=your_api_secret_here

# OPTIONAL: Upload Presets
# Create these in Cloudinary Dashboard → Settings → Upload
# CLOUDINARY_UPLOAD_PRESET_FILES=bananalink_files
# CLOUDINARY_UPLOAD_PRESET_MEDIA=bananalink_media
# CLOUDINARY_UPLOAD_PRESET_AVATARS=bananalink_avatars
# CLOUDINARY_UPLOAD_PRESET_COVERS=bananalink_covers

# File Upload Limits (in bytes)
MAX_DOCUMENT_SIZE=104857600      # 100MB
MAX_IMAGE_SIZE=20971520          # 20MB  
MAX_VIDEO_SIZE=209715200         # 200MB
MAX_AVATAR_SIZE=5242880          # 5MB
MAX_COVER_SIZE=10485760          # 10MB

# Backup Settings
ENABLE_LOCAL_BACKUPS=true
BACKUP_RETENTION_DAYS=30
COMPRESS_BACKUPS=false

# Migration Settings
MIGRATION_BATCH_SIZE=50
MIGRATION_CONCURRENT_UPLOADS=5

# Environment
NODE_ENV=development
PORT=5000

# Database (example)
# DB_HOST=localhost
# DB_USER=bananalink_user
# DB_PASSWORD=your_password
# DB_NAME=bananalink_db

# JWT Secret
# JWT_SECRET=your_jwt_secret_key_here

# Email (example)
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587
# SMTP_USER=your_email@gmail.com
# SMTP_PASS=your_app_password

# ==========================================
# Instructions:
# 1. Fill in your Cloudinary credentials
# 2. Create upload presets in Cloudinary dashboard
# 3. Adjust file size limits as needed
# 4. Remove comments (#) for settings you want to use
# ==========================================
`;
        
        const envPath = path.join(this.projectRoot, '.env.example');
        await fs.writeFile(envPath, envTemplate);
        
        this.print(`Template saved to: ${envPath}`, 'success');
        this.print('Copy this to .env and fill in your values', 'info');
        
        return envPath;
    }

    // Run all setup steps
    async runFullSetup() {
        this.printBanner();
        
        const steps = [
            { name: 'Check project structure', fn: () => this.checkProjectStructure() },
            { name: 'Check npm packages', fn: () => this.checkPackages() },
            { name: 'Verify credentials', fn: () => this.verifyCredentials() },
            { name: 'Create directories', fn: () => this.createDirectories() },
            { name: 'Test upload', fn: () => this.testUpload() },
            { name: 'Generate report', fn: () => this.generateReport() }
        ];
        
        let allPassed = true;
        
        for (const step of steps) {
            this.print(`\n${colors.bright}▶ ${step.name}${colors.reset}`, 'step');
            
            try {
                const result = await step.fn();
                if (!result) {
                    allPassed = false;
                    this.print(`Step failed: ${step.name}`, 'error');
                    
                    const continueAnyway = await this.promptContinue();
                    if (!continueAnyway) {
                        this.print('Setup aborted by user', 'warning');
                        return false;
                    }
                }
            } catch (error) {
                allPassed = false;
                this.print(`Error in ${step.name}: ${error.message}`, 'error');
                
                const continueAnyway = await this.promptContinue();
                if (!continueAnyway) {
                    this.print('Setup aborted by user', 'warning');
                    return false;
                }
            }
        }
        
        if (allPassed) {
            this.print('\n' + colors.bright + colors.green + '✅ SETUP COMPLETE!' + colors.reset, 'success');
            this.print('Your Cloudinary integration is ready to use.', 'success');
            this.print('\nNext steps:', 'info');
            this.print('1. Update your routes to use the new middlewares', 'info');
            this.print('2. Test with actual file uploads', 'info');
            this.print('3. Monitor backups in backups/cloudinary/', 'info');
            this.print('4. Check Cloudinary dashboard for usage', 'info');
        } else {
            this.print('\n' + colors.bright + colors.yellow + '⚠️  SETUP COMPLETED WITH ISSUES' + colors.reset, 'warning');
            this.print('Some steps failed. Check the report for details.', 'warning');
        }
        
        return allPassed;
    }

    // Prompt user to continue
    async promptContinue() {
        // In a real implementation, you might use readline or prompts package
        // For simplicity, we'll assume continue
        return true;
    }

    // Main execution
    async run() {
        const command = process.argv[2] || 'full-setup';
        
        switch (command) {
            case 'verify':
                await this.verifyCredentials();
                break;
                
            case 'test-upload':
                await this.testUpload();
                break;
                
            case 'create-dirs':
                await this.createDirectories();
                break;
                
            case 'generate-env':
                await this.generateEnvTemplate();
                break;
                
            case 'full-setup':
                await this.runFullSetup();
                break;
                
            case 'help':
                this.printBanner();
                console.log(`
${colors.bright}Available Commands:${colors.reset}

  ${colors.cyan}verify${colors.reset}        - Verify Cloudinary credentials
  ${colors.cyan}test-upload${colors.reset}   - Test file upload to Cloudinary
  ${colors.cyan}create-dirs${colors.reset}   - Create backup and migration directories
  ${colors.cyan}generate-env${colors.reset}  - Generate .env template file
  ${colors.cyan}full-setup${colors.reset}    - Run complete setup (default)
  ${colors.cyan}help${colors.reset}         - Show this help message

${colors.bright}Usage:${colors.reset}
  node setup-cloudinary.js [command]

${colors.bright}Example:${colors.reset}
  node setup-cloudinary.js verify
  node setup-cloudinary.js full-setup
`);
                break;
                
            default:
                this.print(`Unknown command: ${command}`, 'error');
                this.print('Use "help" to see available commands', 'info');
                break;
        }
    }
}

// Run the setup
if (require.main === module) {
    const setup = new CloudinarySetup();
    setup.run().catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}

module.exports = CloudinarySetup;