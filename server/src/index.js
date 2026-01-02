// /server/src/index.js (Updated with Countdown Service)
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const path = require('path');
const rateLimit = require('express-rate-limit');
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
// Load environment variables FIRST
dotenv.config();

// Check if required environment variables are set
const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingEnvVars.join(', '));
  console.error('Please check your .env file');
  process.exit(1);
}

// Import Countdown Service
const countdownService = require('./services/countdownService');

const app = express();

// Enhanced CORS configuration - MOVE THIS TO THE TOP
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001',
      'https://getbananalink.com',
      'https://www.getbananalink.com',
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
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept','x-view-type','X-View-Type' ]
};

// Apply CORS middleware FIRST
app.use(cors(corsOptions));

// Handle preflight requests
app.options('*', cors(corsOptions));

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" } // Allow cross-origin resources
}));
app.use(compression());

// Apply rate limiting
app.use('/api/v1/auth', authLimiter);
app.use('/api/v1/admin', adminLimiter);
app.use((req, res, next) => {
  // Skip rate limiting for follow routes (they'll have their own limiters)
  if (req.path.startsWith('/api/v1/follow')) {
    return next();
  }
  // Apply general limiter to all other routes
  generalLimiter(req, res, next);
});
// Logging
app.use(morgan('combined'));

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

app.use('/uploads', express.static(path.join(process.cwd(), 'public', 'uploads'), {
  maxAge: '1d',
  etag: true,
  index: false
}));

// For thumbnails:
app.use('/thumbnails', express.static(path.join(process.cwd(), 'public', 'uploads', 'thumbnails'), {
  maxAge: '1d',
  etag: true,
  index: false
}));

// Add this for better error handling
app.use('/uploads', (req, res, next) => {
  res.set('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
});

app.use('/uploads', express.static(path.join(process.cwd(), 'public', 'uploads'), {
  maxAge: '1d',
  etag: true,
  index: false
}));

// Add this for better error handling
app.use('/uploads', (req, res, next) => {
  res.set('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
});
console.log('📁 Serving uploads from:', path.join(__dirname, '..', 'uploads'));
console.log('🖼️ Serving thumbnails from:', path.join(__dirname, '..', 'uploads', 'thumbnails'));
console.log('Serving static files from:', path.join(process.cwd(), 'public', 'uploads'));

// Core Routes
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

// Admin Routes
const adminRoutes = require('./routes/adminRoutes');
const jobTemplateRoutes = require('./routes/jobTemplateRoutes');

// ========== SOCIAL NETWORKING ROUTES ==========
// Profile Management Routes
const profileRoutes = require('./routes/profileRoutes');
const roleProfileRoutes = require('./routes/roleProfileRoutes');

// Social Features Routes
const postRoutes = require('./routes/postRoutes');
const likeRoutes = require('./routes/likeRoutes');
const commentRoutes = require('./routes/commentRoutes');
const followRoutes = require('./routes/followRoutes');
const socialSearchRoutes = require('./routes/socialSearchRoutes');

// ========== REGISTER ALL ROUTES ==========
// Core API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/candidate', candidateRoutes);
app.use('/api/v1/freelancer', freelanceRoutes);
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
// Admin Routes
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/admin', jobTemplateRoutes);

// ========== SOCIAL NETWORKING ROUTES ==========
// Profile Management
app.use('/api/v1/profile', profileRoutes);
app.use('/api/v1/role-profile', roleProfileRoutes);

// Social Features
app.use('/api/v1/posts', postRoutes);
app.use('/api/v1/likes', likeRoutes);
app.use('/api/v1/comments', commentRoutes);
app.use('/api/v1/follow', followRoutes);
app.use('/api/v1/social-search', socialSearchRoutes);

// Simple test route
app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'Server is working!',
    timestamp: new Date().toISOString(),
    countdown_service: 'Active'
  });
});

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    // Try to connect to database to check health
    const mongoose = require('mongoose');
    const dbState = mongoose.connection.readyState;

    const dbStatus = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    }[dbState] || 'unknown';

    res.json({
      status: 'OK',
      message: 'Server is running',
      database: dbStatus,
      countdown_service: 'Active',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      message: 'Server error',
      error: error.message
    });
  }
});

// CORS error handling middleware
app.use((err, req, res, next) => {
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({
      success: false,
      message: 'CORS policy: Request not allowed',
      allowedOrigins: [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:3001'
      ]
    });
  }
  next(err);
});

// Port
const PORT = process.env.PORT || 4000;

// Connect to MongoDB and start server
async function startServer() {
  try {
    console.log('🔗 Attempting to connect to MongoDB...');
    console.log('📝 MongoDB URI:', process.env.MONGODB_URI ? '✓ Set' : '✗ Missing');

    await connectDB();
    
    // ✅ START THE COUNTDOWN SERVICE
    console.log('⏰ Starting tender countdown service...');
    countdownService.start(1); // Check every minute
    console.log('✅ Countdown service started successfully');

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📍 Local: http://localhost:${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
      console.log(`🧪 Test route: http://localhost:${PORT}/api/test`);
      console.log(`🔐 Auth routes: http://localhost:${PORT}/api/v1/auth`);
      console.log(`👑 Admin routes: http://localhost:${PORT}/api/v1/admin`);
      console.log(`📁 Static files: http://localhost:${PORT}/uploads/`);
      console.log('🌐 CORS enabled for origins:', [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:3001'
      ]);
      console.log('⏰ Countdown service: ACTIVE (checking every minute)');
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    console.log('💡 Running server without database connection...');

    // Start server without database for development
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT} (without database)`);
      console.log('⚠️  Database connection failed, but API will still work for testing');
      console.log(`📍 Local: http://localhost:${PORT}`);
    });
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down server gracefully...');
  console.log('⏹️  Stopping countdown service...');
  try {
    const mongoose = require('mongoose');
    await mongoose.connection.close();
    console.log('✅ MongoDB connection closed.');
    console.log('✅ Countdown service stopped.');
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
});

// Start the server
startServer();