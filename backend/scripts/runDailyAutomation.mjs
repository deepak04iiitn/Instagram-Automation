import 'dotenv/config';
import mongoose from 'mongoose';
import AutomationController from '../controllers/automationController.js';

async function connectToDatabase() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/instagram-automation';
  await mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
}

async function main() {
  console.log('\n=== Manual Daily Automation Runner (ESM) ===');
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);

  try {
    await connectToDatabase();
    console.log('Connected to MongoDB');

    const automationController = new AutomationController();

    console.log(`\n[${new Date().toLocaleString()}] Starting runDailyAutomation() ...`);
    const result = await automationController.runDailyAutomation();

    console.log('\nAutomation completed successfully');
    console.log('Result summary:', {
      id: result?._id?.toString?.(),
      topic: result?.topic,
      status: result?.status,
      generatedAt: result?.generatedAt,
    });

    process.exit(0);
  } catch (error) {
    console.error('\nAutomation failed:', error?.message || error);
    if (error?.stack) console.error(error.stack);
    process.exit(1);
  } finally {
    try {
      await mongoose.connection.close();
      console.log('MongoDB connection closed');
    } catch {}
  }
}

main();


