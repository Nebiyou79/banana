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

const app = express();

// Security middleware
app.use(helmet());
app.use(compression());

// Rate limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 login requests per windowMs
  message: 'Too many login attempts from this IP, please try again later.'
});

const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // limit each IP to 200 requests per windowMs
  message: 'Too many admin requests from this IP, please try again later.'
});

// Apply rate limiting
app.use('/api/v1/auth', authLimiter);
app.use('/api/v1/admin', adminLimiter);
app.use(generalLimiter);

// Logging
app.use(morgan('combined'));

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(cors({
  origin: process.env.CORS_ORIGIN || "http://localhost:3000",
  credentials: true
}));

// FIX: Serve static files from the correct path
// Serve uploaded files directly from /uploads path
app.use('/uploads', express.static(path.join(process.cwd(), 'public', 'uploads')));
console.log('Serving static files from:', path.join(process.cwd(), 'public', 'uploads'));

// Import routes
const authRoutes = require('./routes/authRoutes');
const candidateRoutes = require('./routes/candidateRoutes');
const freelanceRoutes = require('./routes/freelancerRoutes');
const companyRoutes = require('./routes/companyRoutes');
const jobRoutes = require('./routes/jobRoutes');
const searchRoutes = require('./routes/searchRoutes');
const applicationRoutes = require('./routes/applicationRoutes');
const proposalRoutes = require('./routes/proposalRoutes');
const tenderRoutes = require('./routes/tenderRoutes');

// Import admin routes
const adminRoutes = require('./routes/adminRoutes');
const jobTemplateRoutes = require('./routes/jobTemplateRoutes');

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/candidate', candidateRoutes);
app.use('/api/v1/freelancer', freelanceRoutes);
app.use('/api/v1/company', companyRoutes);
app.use('/api/v1/job', jobRoutes);
app.use('/api/v1/search', searchRoutes);
app.use('/api/v1/applications', applicationRoutes);
app.use('/api/v1/proposals', proposalRoutes);
app.use('/api/v1/tender', tenderRoutes);

// Admin routes
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/admin', jobTemplateRoutes);

// Simple test route
app.get('/api/test', (req, res) => {
  res.json({ 
    success: true,
    message: 'Server is working!',
    timestamp: new Date().toISOString()
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

// Port
const PORT = process.env.PORT || 4000;

// Connect to MongoDB and start server
async function startServer() {
  try {
    console.log('🔗 Attempting to connect to MongoDB...');
    console.log('📝 MongoDB URI:', process.env.MONGODB_URI ? '✓ Set' : '✗ Missing');
    
    await connectDB();
    
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📍 Local: http://localhost:${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
      console.log(`🧪 Test route: http://localhost:${PORT}/api/test`);
      console.log(`🔐 Auth routes: http://localhost:${PORT}/api/v1/auth`);
      console.log(`👑 Admin routes: http://localhost:${PORT}/api/v1/admin`);
      console.log(`📁 Static files: http://localhost:${PORT}/uploads/`);
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
  try {
    const mongoose = require('mongoose');
    await mongoose.connection.close();
    console.log('✅ MongoDB connection closed.');
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
});

// Start the server
startServer();