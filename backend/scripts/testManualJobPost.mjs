#!/usr/bin/env node

/**
 * Test Manual Job Post Script
 * 
 * This script tests the manual job posting functionality to ensure
 * the database timeout fix is working correctly.
 * 
 * Usage:
 *   node backend/scripts/testManualJobPost.mjs
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import DatabaseUtils from '../utils/databaseUtils.js';
import Post from '../models/Post.js';

async function testManualJobPost() {
  console.log('🧪 Testing Manual Job Post Database Fix\n');
  console.log('=' .repeat(60));
  console.log(`⏰ Test started at: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST`);
  console.log('=' .repeat(60));

  try {
    // Test database connection
    console.log('\n📋 Test 1: Database Connection');
    console.log('-' .repeat(40));
    
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/instagram-automation';
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 30000,
      maxPoolSize: 10,
      minPoolSize: 5,
      maxIdleTimeMS: 30000,
      bufferCommands: false,
      retryWrites: true,
      retryReads: true,
    });
    
    console.log('✅ Database connection established successfully');

    // Test the exact same database operation that manualJobPost.mjs uses
    console.log('\n📋 Test 2: Manual Job Post Database Operation');
    console.log('-' .repeat(40));
    
    const testPostData = {
      topic: 'QA Job Opportunities',
      content: 'Test manual job post - QA opportunities posted successfully',
      status: 'posted',
      postedAt: new Date(),
      instagramPostId: `test_manual_${Date.now()}`,
      images: [{
        localPath: 'test/manual/path',
        cloudinaryId: 'test_manual_id',
        cloudinaryUrl: 'https://test.manual.url',
        googleDriveId: null,
        googleDriveUrl: null
      }]
    };

    // This is the exact same operation that manualJobPost.mjs now uses
    const testPost = await DatabaseUtils.createWithRetry(Post, testPostData, 3);
    console.log('✅ Manual job post database operation successful');
    console.log(`   📝 Post ID: ${testPost._id}`);
    console.log(`   📊 Status: ${testPost.status}`);
    console.log(`   🏷️  Topic: ${testPost.topic}`);

    // Clean up test post
    console.log('\n📋 Test 3: Clean Up');
    console.log('-' .repeat(40));
    
    await DatabaseUtils.deleteWithRetry(Post, { _id: testPost._id }, {}, 3);
    console.log('✅ Test post deleted successfully');

    console.log('\n🎉 Manual Job Post Database Fix Test Passed!');
    console.log('=' .repeat(60));
    console.log('📊 Test Summary:');
    console.log('   ✅ Database connection: WORKING');
    console.log('   ✅ DatabaseUtils.createWithRetry: WORKING');
    console.log('   ✅ Manual job post database operation: WORKING');
    console.log('=' .repeat(60));
    console.log('🔧 The manualJobPost.mjs script should now work without database timeout errors!');
    console.log('=' .repeat(60));

  } catch (error) {
    console.error('\n❌ Manual Job Post Database Fix Test Failed!');
    console.error('=' .repeat(60));
    console.error(`🚨 Error: ${error.message}`);
    console.error('=' .repeat(60));
    
    console.error('\n🔧 Troubleshooting Steps:');
    console.error('   1. Check MongoDB connection string in .env file');
    console.error('   2. Ensure MongoDB server is running');
    console.error('   3. Verify network connectivity to MongoDB');
    console.error('   4. Check if the databaseUtils.js file is properly imported');
    
    process.exit(1);
  } finally {
    // Close MongoDB connection
    await mongoose.connection.close();
    console.log('\n🔌 MongoDB connection closed');
  }
}

// Run the test
testManualJobPost();
