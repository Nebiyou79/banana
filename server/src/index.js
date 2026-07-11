// /server/src/index.js - WITH NOTIFICATION SYSTEM & SOCKET.IO
const path = require('path');
const dotenv = require('dotenv');

const envPath = path.join(__dirname, '..', '.env.production');
console.log('🔍 Looking for env file at:', envPath);

try {
  if (require('fs').existsSync(envPath)) {
    console.log('✅ Found .env.production file');
    dotenv.config({ path: envPath });
  } else {
    console.log('⚠️ .env.production not found, using environment variables');
    dotenv.config();
  }
} catch (error) {
  console.error('❌ Error loading env file:', error.message);
  dotenv.config();
}

console.log('🔍 Cloudinary config check:', {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME ? 'SET' : 'MISSING',
  api_key: process.env.CLOUDINARY_API_KEY ? 'SET' : 'MISSING',
  api_secret: process.env.CLOUDINARY_API_SECRET ? 'SET' : 'MISSING',
  node_env: process.env.NODE_ENV
});

const express = require('express');
const http = require('http');
const { Server: SocketIOServer } = require('socket.io');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');
const fs = require('fs');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const {
  generalLimiter,
  authLimiter,
  adminLimiter,
  socialLimiter,
  followListLimiter,
  followStatusLimiter
} = require('./middleware/rateLimiter');

const cloudinaryStorageService = require('./services/cloudinaryStorageService');

const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingEnvVars.join(', '));
  console.error('Please check your .env file');
  process.exit(1);
}

const countdownService = require('./services/countdownService');

const app = express();

const httpServer = http.createServer(app);

const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN
      ? process.env.CORS_ORIGIN.split(',')
      : [
          'http://localhost:3000',
          'http://localhost:3001',
          'http://127.0.0.1:3000',
          'http://127.0.0.1:3001',
          'http://localhost:19006',
          'exp://127.0.0.1:19000',
          'https://getbananalink.com',
          'https://www.getbananalink.com',
        ],
    credentials: true,
  },
  pingInterval: 25_000,
  pingTimeout: 60_000,
});

// ── Setup Socket.IO singleton for notification service ────────────────
const socketService = require('./services/socketService');
socketService.setIo(io);

const UPLOAD_BASE_PATH = process.env.UPLOAD_BASE_PATH || path.join(process.cwd(), 'uploads');
console.log('📁 Upload base path:', UPLOAD_BASE_PATH);

console.log('☁️ Cloudinary ENV check:', {
  NODE_ENV: process.env.NODE_ENV,
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY ? 'OK' : 'MISSING',
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET ? 'OK' : 'MISSING',
  UPLOAD_BASE_PATH: UPLOAD_BASE_PATH,
  MAX_DOCUMENT_SIZE: process.env.MAX_DOCUMENT_SIZE || '100MB'
});

app.get('/debug/file/:folder/:filename', (req, res) => {
  const { folder, filename } = req.params;
  const decodedFilename = decodeURIComponent(filename);
  const possiblePaths = [
    path.join(process.cwd(), 'uploads', folder, decodedFilename),
    path.join(__dirname, 'uploads', folder, decodedFilename),
    path.join(__dirname, '..', 'uploads', folder, decodedFilename),
    path.join(process.cwd(), 'server', 'uploads', folder, decodedFilename),
    path.join(process.env.UPLOAD_BASE_PATH || './uploads', folder, decodedFilename),
  ];

  const results = possiblePaths.map(filePath => ({
    path: filePath,
    exists: fs.existsSync(filePath),
    isFile: fs.existsSync(filePath) ? fs.statSync(filePath).isFile() : false,
    size: fs.existsSync(filePath) ? fs.statSync(filePath).size : null
  }));

  res.json({
    requested: { folder, filename, decodedFilename },
    possiblePaths: results,
    uploadBasePath: process.env.UPLOAD_BASE_PATH || './uploads',
    cwd: process.cwd(),
    __dirname: __dirname
  });
});

app.use('/uploads', (req, res, next) => {
  console.log(`📁 Static file request: ${req.url}`);
  next();
}, express.static(path.join(process.cwd(), 'uploads'), {
  maxAge: '1y',
  etag: true,
  index: false,
  setHeaders: (res, filePath) => {
    console.log(`✅ Serving file: ${filePath}`);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
}));

app.get('/uploads/download/:folder/:filename', (req, res) => {
  const { folder, filename } = req.params;
  const decodedFilename = decodeURIComponent(filename);
  console.log(`📥 Download request: folder=${folder}, filename=${filename}, decoded=${decodedFilename}`);

  const possiblePaths = [
    path.join(process.cwd(), 'uploads', folder, decodedFilename),
    path.join(__dirname, 'uploads', folder, decodedFilename),
    path.join(__dirname, '..', 'uploads', folder, decodedFilename),
    path.join(process.env.UPLOAD_BASE_PATH || './uploads', folder, decodedFilename),
  ];

  let filePath = null;
  for (const p of possiblePaths) {
    if (fs.existsSync(p) && fs.statSync(p).isFile()) {
      filePath = p;
      console.log(`✅ Found file at: ${filePath}`);
      break;
    }
  }

  if (!filePath) {
    console.error(`❌ File not found in any location: ${decodedFilename}`);
    return res.status(404).json({
      success: false,
      error: 'File not found',
      requested: { folder, filename: decodedFilename },
      searchedPaths: possiblePaths
    });
  }

  res.download(filePath, decodedFilename, (err) => {
    if (err) {
      console.error('❌ Download error:', err);
      if (!res.headersSent) {
        res.status(500).json({ success: false, error: 'Failed to download file' });
      }
    }
  });
});

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    const allowedOrigins = [
      'http://localhost:3000', 'http://localhost:3001',
      'http://127.0.0.1:3000', 'http://127.0.0.1:3001',
      'https://getbananalink.com', 'https://www.getbananalink.com',
      process.env.CORS_ORIGIN
    ].filter(Boolean);
    if (allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'x-view-type', 'X-View-Type']
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:", "http:", "*.cloudinary.com"],
      connectSrc: ["'self'", "*.cloudinary.com"],
      mediaSrc: ["'self'", "*.cloudinary.com"],
    },
  }
}));

app.use(compression());

app.use('/api/v1/auth', (req, res, next) => {
  // Skip rate limiting for Google OAuth routes (no auth required)
  if (req.path.startsWith('/google')) {
    return next();
  }
  authLimiter(req, res, next);
});
app.use('/api/v1/admin', adminLimiter);;
app.use((req, res, next) => {
  if (req.path.startsWith('/api/v1/follow')) return next();
  generalLimiter(req, res, next);
});

app.use(morgan('combined'));
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));
app.use(cookieParser());

app.use((req, _res, next) => {
  req.io = io;
  next();
});

const UPLOADS_DIR = UPLOAD_BASE_PATH;

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  console.log(`📁 Created uploads directory: ${UPLOADS_DIR}`);
  const legacySubdirs = ['cv', 'applications', 'products', 'avatars', 'covers'];
  legacySubdirs.forEach(subdir => {
    const dirPath = path.join(UPLOADS_DIR, subdir);
    if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
  });
  const documentSubdirs = ['cv', 'applications', 'tenders', 'proposals', 'documents'];
  documentSubdirs.forEach(subdir => {
    const dirPath = path.join(UPLOADS_DIR, subdir);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      console.log(`📁 Created document subdirectory: ${dirPath}`);
    }
  });
}

app.use('/uploads', express.static(UPLOADS_DIR, {
  maxAge: '1y',
  etag: true,
  index: false,
  setHeaders: (res, filePath) => {
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Access-Control-Allow-Origin', '*');
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
      '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
      '.gif': 'image/gif', '.webp': 'image/webp', '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.txt': 'text/plain', '.mp4': 'video/mp4', '.mov': 'video/quicktime', '.avi': 'video/x-msvideo'
    };
    if (mimeTypes[ext]) res.setHeader('Content-Type', mimeTypes[ext]);
  }
}));

app.get('/uploads/health', (req, res) => {
  try {
    const cloudinaryStats = cloudinaryStorageService.getStatistics();
    const documentFolders = ['cv', 'applications', 'tenders', 'proposals', 'documents'];
    const localStats = { totalFiles: 0, totalSize: 0, byFolder: {} };
    documentFolders.forEach(folder => {
      const folderPath = path.join(UPLOADS_DIR, folder);
      if (fs.existsSync(folderPath)) {
        const files = fs.readdirSync(folderPath);
        const folderStats = files.map(file => {
          try {
            const filePath = path.join(folderPath, file);
            const stat = fs.statSync(filePath);
            return { name: file, size: stat.size, modified: stat.mtime };
          } catch (err) { return { name: file, error: err.message }; }
        });
        const folderSize = folderStats.reduce((sum, file) => sum + (file.size || 0), 0);
        localStats.byFolder[folder] = { count: files.length, size: folderSize, files: folderStats.slice(0, 10) };
        localStats.totalFiles += files.length;
        localStats.totalSize += folderSize;
      } else {
        localStats.byFolder[folder] = { count: 0, size: 0, files: [] };
      }
    });
    res.json({
      success: true, status: 'healthy', hybridSystem: true,
      storage: {
        cloudinary: { type: 'images/media', totalUploads: cloudinaryStats.totalUploads, successfulUploads: cloudinaryStats.successfulUploads, failedUploads: cloudinaryStats.failedUploads, totalSize: cloudinaryStats.totalSize, backupCount: cloudinaryStats.backupCount, backupSize: cloudinaryStats.backupSize, lastUpdated: cloudinaryStats.lastUpdated },
        local: { type: 'documents (PDF, DOC, DOCX)', basePath: UPLOADS_DIR, totalFiles: localStats.totalFiles, totalSize: localStats.totalSize, humanReadableSize: `${(localStats.totalSize / (1024 * 1024)).toFixed(2)} MB`, maxDocumentSize: process.env.MAX_DOCUMENT_SIZE || '100MB', byFolder: localStats.byFolder }
      },
      dailyStats: cloudinaryStats.dailyStats,
      cloudinaryByType: cloudinaryStats.byType
    });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

app.get('/uploads/documents/health', (req, res) => {
  try {
    const documentFolders = ['cv', 'applications', 'tenders', 'proposals', 'documents'];
    const stats = {}; let totalFiles = 0, totalSize = 0;
    documentFolders.forEach(folder => {
      const folderPath = path.join(UPLOADS_DIR, folder);
      if (fs.existsSync(folderPath)) {
        const files = fs.readdirSync(folderPath);
        const folderStats = files.map(file => {
          try {
            const filePath = path.join(folderPath, file);
            const stat = fs.statSync(filePath);
            return { name: file, size: stat.size, modified: stat.mtime, type: path.extname(file).toLowerCase().replace('.', '') || 'unknown' };
          } catch (err) { return { name: file, error: err.message, type: 'error' }; }
        });
        const folderSize = folderStats.reduce((sum, file) => sum + (file.size || 0), 0);
        stats[folder] = { count: files.length, files: folderStats, totalSize: folderSize, averageSize: files.length > 0 ? folderSize / files.length : 0 };
        totalFiles += files.length; totalSize += folderSize;
      } else { stats[folder] = { count: 0, files: [], totalSize: 0, averageSize: 0 }; }
    });
    res.json({ success: true, status: 'healthy', storage: 'local', basePath: UPLOADS_DIR, totalFiles, totalSize, humanReadableSize: `${(totalSize / (1024 * 1024)).toFixed(2)} MB`, folders: stats, configuration: { maxDocumentSize: process.env.MAX_DOCUMENT_SIZE || '100MB', allowedTypes: ['pdf', 'doc', 'docx'], uploadBasePath: process.env.UPLOAD_BASE_PATH || './uploads' } });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

// ========== ROUTE IMPORTS ==========
const authRoutes = require('./routes/authRoutes');
const candidateRoutes = require('./routes/candidateRoutes');
const freelanceRoutes = require('./routes/freelancerRoutes');
const companyRoutes = require('./routes/companyRoutes');
const jobRoutes = require('./routes/jobRoutes');
const searchRoutes = require('./routes/searchRoutes');
const applicationRoutes = require('./routes/applicationRoutes');
const proposalRoutes = require('./routes/proposalRoutes');
const tenderRoutes = require('./routes/tenderRoutes');
const organizationRoutes = require('./routes/organizationRoutes');
const fileRoutes = require('./routes/fileRoutes');
const productRoutes = require('./routes/productRoutes');
const verificationRoutes = require('./routes/verificationRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const promoCodeRoutes = require('./routes/promoCodeRoutes');
const adminRoutes = require('./routes/adminRoutes');
const jobTemplateRoutes = require('./routes/jobTemplateRoutes');
const cvGeneratorRoutes = require('./routes/cvGeneratorRoutes');
const profileRoutes = require('./routes/profileRoutes');
const roleProfileRoutes = require('./routes/roleProfileRoutes');
const postRoutes = require('./routes/postRoutes');
const likeRoutes = require('./routes/likeRoutes');
const commentRoutes = require('./routes/commentRoutes');
const followRoutes = require('./routes/followRoutes');
const socialSearchRoutes = require('./routes/socialSearchRoutes');
const freelanceTenderRoutes = require('./routes/freelanceTenderRoutes');
const professionalTenderRoutes = require('./routes/professionalTenderRoutes');
const bidRoutes = require('./routes/bidRoutes');
const freelancerMarketplaceRoutes = require('./routes/freelancerMarketplaceRoutes');
const companyShortlistRoutes = require('./routes/companyShortlistRoutes');
const conversationRoutes = require('./routes/conversationRoutes');
const messageRoutes = require('./routes/messageRoutes');
const publicProfileRoutes    = require('./routes/publicProfileRoutes'); 
// ── NOTIFICATION ROUTES ────────────────────────────────────────────
const notificationRoutes = require('./routes/notificationRoutes');
// ========== REGISTER ALL ROUTES ==========
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/candidate', candidateRoutes);
app.use('/api/v1/freelancer', freelanceRoutes);
app.use('/api/v1/freelancers', freelancerMarketplaceRoutes);
app.use('/api/v1/company', companyShortlistRoutes);
app.use('/api/v1/company', companyRoutes);
app.use('/api/v1/job', jobRoutes);
app.use('/api/v1/search', searchRoutes);
app.use('/api/v1/applications', applicationRoutes);
app.use('/api/v1/proposals', proposalRoutes);
app.use('/api/v1/tender', tenderRoutes);
app.use('/api/v1/organization', organizationRoutes);
app.use('/api/v1', fileRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/verification', verificationRoutes);
app.use('/api/v1/appointments', appointmentRoutes);
app.use('/api/v1/promo-codes', promoCodeRoutes);
app.use('/api/v1/bids', bidRoutes);
app.use('/api/v1/candidate', cvGeneratorRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/admin', jobTemplateRoutes);
app.use('/api/v1/profile', profileRoutes);
app.use('/api/v1/role-profile', roleProfileRoutes);
app.use('/api/v1/posts', postRoutes);
app.use('/api/v1/likes', likeRoutes);
app.use('/api/v1/comments', commentRoutes);
app.use('/api/v1/follow', followRoutes);
app.use('/api/v1/social-search', socialSearchRoutes);
app.use('/api/v1/freelance-tenders', freelanceTenderRoutes);
app.use('/api/v1/professional-tenders', professionalTenderRoutes);
app.use('/api/v1/conversations', conversationRoutes);
app.use('/api/v1/messages', messageRoutes);
// ── MOUNT NOTIFICATION ROUTES ──────────────────────────────────────
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/public-profile', publicProfileRoutes);


// ── DEVELOPMENT: Test notification endpoint ─────────────────────────
if (process.env.NODE_ENV === 'development') {
  const { verifyToken } = require('./middleware/authMiddleware');
  const notificationService = require('./services/notificationService');
  app.post('/api/test/notification', verifyToken, async (req, res) => {
    try {
      const { type = 'system_announcement', title = 'Test', body = 'Test notification' } = req.body;
      const notif = await notificationService.create({
        recipient: req.user.userId, actor: null, type, title, body,
        data: { screen: 'Home' }, priority: 'high', channels: { inApp: true, push: true, email: false }
      });
      res.json({ success: true, notification: notif });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
  });
}

app.get('/api/health', async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const dbState = mongoose.connection.readyState;
    const dbStatus = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' }[dbState] || 'unknown';
    const cloudinaryStats = cloudinaryStorageService.getStatistics();
    let localDocStats = { totalFiles: 0, totalSize: 0 };
    try {
      const documentFolders = ['cv', 'applications', 'tenders', 'proposals', 'documents'];
      documentFolders.forEach(folder => {
        const folderPath = path.join(UPLOADS_DIR, folder);
        if (fs.existsSync(folderPath)) { const files = fs.readdirSync(folderPath); localDocStats.totalFiles += files.length; }
      });
    } catch (localError) { console.warn('⚠️ Local storage check error:', localError.message); }
    res.json({
      status: 'OK', message: 'Server is running', environment: process.env.NODE_ENV || 'development', timestamp: new Date().toISOString(), uploadSystem: 'hybrid',
      database: { status: dbStatus, connected: dbState === 1 },
      uploads: {
        cloudinary: { type: 'images/media', status: 'healthy', totalUploads: cloudinaryStats.totalUploads, successfulUploads: cloudinaryStats.successfulUploads, failedUploads: cloudinaryStats.failedUploads, backupCount: cloudinaryStats.backupCount },
        local: { type: 'documents (PDF, DOC, DOCX)', status: 'healthy', basePath: UPLOADS_DIR, totalFiles: localDocStats.totalFiles, maxDocumentSize: process.env.MAX_DOCUMENT_SIZE || '100MB', allowedTypes: ['pdf', 'doc', 'docx'] }
      },
      services: { countdown: 'Active', socketIO: 'Active', notifications: 'Active', cloudinary: { configured: !!process.env.CLOUDINARY_CLOUD_NAME, status: 'active' }, localStorage: { configured: true, status: 'active' } }
    });
  } catch (error) { res.status(500).json({ status: 'ERROR', message: 'Server error', error: error.message, environment: process.env.NODE_ENV || 'development' }); }
});

app.get('/cloudinary/:publicId', (req, res) => {
  const { publicId } = req.params;
  const { width, height, crop, quality, format } = req.query;
  const { cloudinary } = require('./config/cloudinary');
  const options = { resource_type: 'auto', ...(width && { width: parseInt(width) }), ...(height && { height: parseInt(height) }), ...(crop && { crop }), ...(quality && { quality }), ...(format && { format }), secure: true };
  try { const url = cloudinary.url(publicId, options); res.redirect(url); }
  catch (error) { console.error('Cloudinary redirect error:', error); res.status(500).json({ success: false, message: 'Error generating Cloudinary URL' }); }
});

app.get('/api/migration/status', (req, res) => {
  try {
    const cloudinaryStats = cloudinaryStorageService.getStatistics();
    res.json({
      success: true, migration: { status: 'completed', current_phase: 'hybrid_system', uploadSystem: 'hybrid', cloudinary: { type: 'images/media', totalUploads: cloudinaryStats.totalUploads, backupCount: cloudinaryStats.backupCount, storage_types: Object.keys(cloudinaryStats.byType) }, local_storage: { type: 'documents', enabled: true, directories: ['/uploads/cv/', '/uploads/applications/', '/uploads/tenders/', '/uploads/proposals/'], maxDocumentSize: process.env.MAX_DOCUMENT_SIZE || '100MB', allowedTypes: ['pdf', 'doc', 'docx'] }, routes: { image_upload: 'Cloudinary only', document_upload: 'Local storage only', file_download: '/uploads/download/:folder/:filename', file_view: '/uploads/:folder/:filename', cloudinary_direct: '/cloudinary/:publicId', health_check: '/api/health' } }
    });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

app.use((err, req, res, next) => {
  if (err.message === 'Not allowed by CORS') { return res.status(403).json({ success: false, message: 'CORS policy: Request not allowed', allowedOrigins: ['http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000', 'http://127.0.0.1:3001', 'https://getbananalink.com'] }); }
  next(err);
});

// 404 handler for any remaining unmatched /api/* routes — must stay AFTER all real API routes (health, migration/status, etc.)
app.use('/api/*', (req, res) => { res.status(404).json({ success: false, message: `API endpoint not found: ${req.originalUrl}`, timestamp: new Date().toISOString() }); });

app.use((err, req, res, next) => {
  console.error('❌ Server error:', err);
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';
  res.status(statusCode).json({ success: false, message: message, error: process.env.NODE_ENV === 'development' ? err.stack : undefined, timestamp: new Date().toISOString() });
});

// ── DEVELOPMENT: Test notification endpoint ─────────────────────────
if (process.env.NODE_ENV === 'development') {
  const { verifyToken } = require('./middleware/authMiddleware');
  const notificationService = require('./services/notificationService');
  app.post('/api/test/notification', verifyToken, async (req, res) => {
    try {
      const { type = 'system_announcement', title = 'Test', body = 'Test notification' } = req.body;
      const notif = await notificationService.create({
        recipient: req.user.userId, actor: null, type, title, body,
        data: { screen: 'Home' }, priority: 'high', channels: { inApp: true, push: true, email: false }
      });
      res.json({ success: true, notification: notif });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
  });
}

const PORT = process.env.PORT || 4000;

async function startServer() {
  try {
    console.log('🔗 Attempting to connect to MongoDB...');
    console.log('📝 Environment:', process.env.NODE_ENV || 'development');
    await connectDB();
    console.log('⏰ Starting tender countdown service...');
    countdownService.start(1);
    console.log('✅ Countdown service started successfully');
    console.log('☁️  Initializing Cloudinary integration...');
    try { const cloudinaryStats = cloudinaryStorageService.getStatistics(); console.log(`📊 Cloudinary stats: ${cloudinaryStats.totalUploads} total uploads`); console.log('✅ Cloudinary integration ready'); }
    catch (cloudinaryError) { console.warn('⚠️  Cloudinary service may not be fully initialized:', cloudinaryError.message); }
    console.log('💾 Initializing local document storage...');
    try { const documentFolders = ['cv', 'applications', 'tenders', 'proposals', 'documents']; let totalLocalFiles = 0; documentFolders.forEach(folder => { const folderPath = path.join(UPLOADS_DIR, folder); if (fs.existsSync(folderPath)) { const files = fs.readdirSync(folderPath); totalLocalFiles += files.length; console.log(`   📂 ${folder}: ${files.length} files`); } }); console.log(`📊 Local storage: ${totalLocalFiles} total documents`); console.log('✅ Local document storage ready'); }
    catch (localError) { console.warn('⚠️  Local storage may not be fully initialized:', localError.message); }
    console.log('🔌 Wiring up Socket.IO handlers...');
    require('./socket')(io);
    console.log('✅ Socket.IO handlers ready');

    // ── BACKGROUND JOBS (CRON) ──────────────────────────────────────
    if (process.env.DIGEST_CRON_ENABLED === 'true') {
      try {
        const cron = require('node-cron');
        const appointmentReminderJob = require('./jobs/appointmentReminder');
        const notificationDigestJob = require('./jobs/notificationDigest');
        cron.schedule('0 * * * *', async () => { try { await appointmentReminderJob.run(); } catch (err) { console.error('AppointmentReminder job failed:', err.message); } });
        cron.schedule('0 8 * * *', async () => { try { await notificationDigestJob.run(); } catch (err) { console.error('Digest job failed:', err.message); } });
        console.log('✅ Background cron jobs registered');
      } catch (cronErr) { console.warn('⚠️ Could not register cron jobs:', cronErr.message); }
    }

    httpServer.listen(PORT, () => {
      console.log(`\n🚀 Server running on port ${PORT}\n📍 Local: http://localhost:${PORT}\n🌐 Production: https://getbananalink.com\n\n📊 HEALTH & STATUS:\n  • Overall: http://localhost:${PORT}/api/health\n  • Uploads: http://localhost:${PORT}/uploads/health\n  • Test: http://localhost:${PORT}/api/test\n\n🔔 NOTIFICATION SYSTEM: ACTIVE\n  • API: /api/v1/notifications\n  • Socket.IO: ws://localhost:${PORT}\n  • Web Push: ${process.env.VAPID_PUBLIC_KEY ? 'CONFIGURED' : 'NOT CONFIGURED'}\n  • Firebase: ${process.env.FIREBASE_SERVICE_ACCOUNT_JSON ? 'CONFIGURED' : 'NOT CONFIGURED'}\n  • Digest Cron: ${process.env.DIGEST_CRON_ENABLED === 'true' ? 'ENABLED' : 'DISABLED'}\n\n📁 FILE SYSTEM (HYBRID):\n  ☁️  Cloudinary → Images/Media ONLY\n  💾 Local Storage → Documents ONLY\n  • Base Path: ${UPLOADS_DIR}\n  • Max Document Size: ${process.env.MAX_DOCUMENT_SIZE || '100MB'}\n`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    if (process.env.NODE_ENV === 'development') {
      httpServer.listen(PORT, () => { console.log(`🚀 Server running on port ${PORT} (without database)`); });
    } else { process.exit(1); }
  }
}

process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down server gracefully...');
  try { const mongoose = require('mongoose'); if (mongoose.connection.readyState === 1) { await mongoose.connection.close(); console.log('✅ MongoDB connection closed.'); } console.log('✅ Shutdown complete.'); process.exit(0); }
  catch (error) { console.error('Error during shutdown:', error); process.exit(1); }
});
process.on('SIGTERM', async () => { console.log('\n🛑 Received SIGTERM, shutting down...'); process.exit(0); });

startServer();