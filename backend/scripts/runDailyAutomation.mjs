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
  console.log('\n=== Manual Daily Automation Runner (Random Prompt Mode) ===');
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Timestamp: ${new Date().toLocaleString()}`);

  try {
    await connectToDatabase();
    console.log('✓ Connected to MongoDB');

    const automationController = new AutomationController();
    
    // Display prompt pool info
    console.log(`\n📝 Prompt Pool: ${automationController.prompts.length} prompts available`);
    console.log('🎲 A random prompt will be selected for today\'s post\n');

    console.log('─'.repeat(60));
    console.log(`🚀 Starting runDailyAutomation() at ${new Date().toLocaleTimeString()}`);
    console.log('─'.repeat(60));
    
    const result = await automationController.runDailyAutomation();

    console.log('\n' + '─'.repeat(60));
    console.log('✅ Automation completed successfully!');
    console.log('─'.repeat(60));
    
    console.log('\n📊 Result Summary:');
    console.log('  Post ID:', result?._id?.toString?.() || 'N/A');
    console.log('  Prompt/Topic:', result?.topic || 'N/A');
    console.log('  Status:', result?.status || 'N/A');
    console.log('  Generated At:', result?.generatedAt?.toLocaleString?.() || 'N/A');
    console.log('  Content Length:', result?.content?.length || 0, 'characters');
    
    if (result?.retryCount > 0) {
      console.log('  Retry Count:', result.retryCount);
    }

    console.log('\n💡 Next Steps:');
    console.log('  - Check your email for the approval request');
    console.log('  - Review the generated content');
    console.log('  - Click Accept, Decline, or Retry in the email');
    
    console.log('\n✓ Process completed successfully\n');
    process.exit(0);
    
  } catch (error) {
    console.log('\n' + '─'.repeat(60));
    console.error('❌ Automation failed!');
    console.log('─'.repeat(60));
    console.error('\n⚠️  Error Details:');
    console.error('  Message:', error?.message || 'Unknown error');
    
    if (error?.response?.data) {
      console.error('  API Response:', JSON.stringify(error.response.data, null, 2));
    }
    
    if (error?.stack) {
      console.error('\n📋 Stack Trace:');
      console.error(error.stack);
    }
    
    console.error('\n💡 Troubleshooting Tips:');
    console.error('  - Check your .env file has all required credentials');
    console.error('  - Verify MongoDB connection is working');
    console.error('  - Ensure GEMINI_API_KEY is valid');
    console.error('  - Check email service configuration');
    console.error('  - Review the logs above for specific error details\n');
    
    process.exit(1);
    
  } finally {
    try {
      await mongoose.connection.close();
      console.log('🔌 MongoDB connection closed\n');
    } catch (closeError) {
      console.error('Warning: Error closing MongoDB connection:', closeError.message);
    }
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('\n⚠️  Unhandled Rejection at:', promise);
  console.error('Reason:', reason);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('\n⚠️  Uncaught Exception:');
  console.error(error);
  process.exit(1);
});

main();