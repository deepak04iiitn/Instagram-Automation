import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import path from 'path';
import automationRoutes from './routes/automation.js';
import SchedulerService from './services/schedulerService.js';
import AutomationController from './controllers/automationController.js';

const __dirname = path.resolve();
const app = express();

const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Database connection with improved configuration
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/instagram-automation', {
  serverSelectionTimeoutMS: 30000,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 30000,
  maxPoolSize: 10,
  minPoolSize: 5,
  maxIdleTimeMS: 30000,
  bufferCommands: false,
  retryWrites: true,
  retryReads: true,
})
.then(() => {
  console.log('✅ Connected to MongoDB');
  
  mongoose.connection.on('error', (err) => {
    console.error('❌ MongoDB connection error:', err);
  });
  
  mongoose.connection.on('disconnected', () => {
    console.warn('⚠️ MongoDB disconnected');
  });
  
  mongoose.connection.on('reconnected', () => {
    console.log('🔄 MongoDB reconnected');
  });
})
.catch((error) => {
  console.error('❌ MongoDB connection error:', error);
  process.exit(1);
});

// API Routes - Define these FIRST
app.use('/api', automationRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Root API endpoint
app.get('/api-info', (req, res) => {
  res.json({
    message: 'Instagram Automation API',
    version: '2.0.0',
    features: [
      'Daily content automation (10 AM IST)',
      'Job posting automation (5 PM IST)',
      'Email approval system',
      'Image generation and hosting',
      'Instagram posting',
      'Job deduplication',
      'IST timezone support'
    ],
    endpoints: {
      health: '/health',
      automation: '/api',
      jobPosting: '/api/jobs',
      docs: '/api-docs'
    },
    schedules: {
      dailyAutomation: '10:00 AM IST',
      jobPosting: '5:00 PM IST',
      imageCleanup: '2:00 AM IST',
      postCleanup: '3:00 AM IST (Sundays)',
      jobMemoryCleanup: '1:00 AM IST'
    }
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// Serve frontend static files
app.use(express.static(path.join(__dirname, 'frontend/dist')));

// Handle frontend routes - only catch routes that don't start with /backend
app.get(/^(?!\/backend).*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/dist/index.html'));
});

// Initialize automation controller and scheduler
let automationController;
let schedulerService;

async function initializeServices() {
  try {
    console.log('Initializing services...');
    
    automationController = new AutomationController();
    schedulerService = new SchedulerService(automationController);
    schedulerService.start();
    
    console.log('Services initialized successfully');
  } catch (error) {
    console.error('Error initializing services:', error);
    process.exit(1);
  }
}

// Start server
app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  
  await initializeServices();
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nReceived SIGINT. Graceful shutdown...');
  
  if (schedulerService) {
    schedulerService.stop();
  }
  
  await mongoose.connection.close();
  console.log('MongoDB connection closed');
  
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\nReceived SIGTERM. Graceful shutdown...');
  
  if (schedulerService) {
    schedulerService.stop();
  }
  
  await mongoose.connection.close();
  console.log('MongoDB connection closed');
  
  process.exit(0);
});

export default app;