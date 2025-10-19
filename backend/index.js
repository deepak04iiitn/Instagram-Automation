import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Import routes
import automationRoutes from './routes/automation.js';

// Import services
import SchedulerService from './services/schedulerService.js';
import AutomationController from './controllers/automationController.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Resolve __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/instagram-automation', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('Connected to MongoDB');
})
.catch((error) => {
  console.error('MongoDB connection error:', error);
  process.exit(1);
});

// Routes
app.use('/api', automationRoutes);

// Direct approval route alias to ensure availability
app.get('/api/approve/:postId/:emailId/accept', async (req, res) => {
  try {
    const controller = new AutomationController();
    const { postId, emailId } = req.params;
    const result = await controller.handlePostApproval(postId, emailId);
    res.json({ success: true, data: { id: result._id } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Instagram Automation API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      automation: '/api',
      docs: '/api-docs'
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

// 404 handler (catch-all)
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found'
  });
});

// Initialize automation controller and scheduler
let automationController;
let schedulerService;

async function initializeServices() {
  try {
    console.log('Initializing services...');
    
    // Initialize automation controller
    automationController = new AutomationController();
    
    // Initialize scheduler
    schedulerService = new SchedulerService(automationController);
    
    // Start scheduler
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
  
  // Initialize services after server starts
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
