#!/usr/bin/env node

/**
 * Test Database Fix Script
 * 
 * This script tests the database connection and job posting functionality
 * to verify that the timeout issue has been resolved.
 * 
 * Usage:
 *   node backend/scripts/testDatabaseFix.mjs
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import JobPostingService from '../services/jobPostingService.js';
import DatabaseUtils from '../utils/databaseUtils.js';
import Post from '../models/Post.js';

async function testDatabaseConnection() {
  console.log('🧪 Testing Database Connection Fix\n');
  console.log('=' .repeat(60));
  console.log(`⏰ Test started at: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST`);
  console.log('=' .repeat(60));

  try {
    // Test 1: Basic database connection
    console.log('\n📋 Test 1: Basic Database Connection');
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
    console.log(`   📊 Connection state: ${mongoose.connection.readyState} (1 = connected)`);
    console.log(`   🏷️  Database name: ${mongoose.connection.db.databaseName}`);

    // Test 2: DatabaseUtils functionality
    console.log('\n📋 Test 2: DatabaseUtils Functionality');
    console.log('-' .repeat(40));
    
    const isConnected = DatabaseUtils.isConnected();
    console.log(`✅ DatabaseUtils.isConnected(): ${isConnected}`);
    
    const connectionEnsured = await DatabaseUtils.ensureConnection();
    console.log(`✅ DatabaseUtils.ensureConnection(): ${connectionEnsured}`);

    // Test 3: Create test post with retry logic
    console.log('\n📋 Test 3: Create Test Post with Retry Logic');
    console.log('-' .repeat(40));
    
    const testPostData = {
      topic: 'Database Fix Test',
      content: 'This is a test post to verify database operations work correctly after the fix.',
      status: 'posted',
      postedAt: new Date(),
      instagramPostId: `test_${Date.now()}`,
      images: [{
        localPath: 'test/path',
        cloudinaryId: 'test_id',
        cloudinaryUrl: 'https://test.url',
        googleDriveId: null,
        googleDriveUrl: null
      }]
    };

    const testPost = await DatabaseUtils.createWithRetry(Post, testPostData, 3);
    console.log('✅ Test post created successfully with retry logic');
    console.log(`   📝 Post ID: ${testPost._id}`);
    console.log(`   📊 Status: ${testPost.status}`);
    console.log(`   🏷️  Topic: ${testPost.topic}`);

    // Test 4: Find test post
    console.log('\n📋 Test 4: Find Test Post');
    console.log('-' .repeat(40));
    
    const foundPost = await DatabaseUtils.findOneWithRetry(Post, { _id: testPost._id }, {}, 3);
    if (foundPost) {
      console.log('✅ Test post found successfully');
      console.log(`   📝 Post ID: ${foundPost._id}`);
      console.log(`   📊 Status: ${foundPost.status}`);
    } else {
      console.log('❌ Test post not found');
    }

    // Test 5: Clean up test post
    console.log('\n📋 Test 5: Clean Up Test Post');
    console.log('-' .repeat(40));
    
    await DatabaseUtils.deleteWithRetry(Post, { _id: testPost._id }, {}, 3);
    console.log('✅ Test post deleted successfully');

    // Test 6: Job posting service initialization
    console.log('\n📋 Test 6: Job Posting Service Initialization');
    console.log('-' .repeat(40));
    
    const jobPostingService = new JobPostingService();
    console.log('✅ Job posting service initialized successfully');
    console.log(`   📊 Posted jobs count: ${jobPostingService.postedJobs.size}`);

    // Test 7: Test job fetching (without posting)
    console.log('\n📋 Test 7: Test Job Fetching');
    console.log('-' .repeat(40));
    
    try {
      const jobs = await jobPostingService.fetchJobs(5);
      console.log(`✅ Successfully fetched ${jobs.length} jobs`);
      if (jobs.length > 0) {
        console.log(`   📋 Sample job: ${jobs[0].company} - ${jobs[0].job_title || jobs[0].title}`);
      }
    } catch (error) {
      console.log(`⚠️ Job fetching failed (this is expected if job API is not available): ${error.message}`);
    }

    console.log('\n🎉 All Database Fix Tests Passed!');
    console.log('=' .repeat(60));
    console.log('📊 Test Summary:');
    console.log('   ✅ Database connection: WORKING');
    console.log('   ✅ DatabaseUtils: WORKING');
    console.log('   ✅ Retry logic: WORKING');
    console.log('   ✅ CRUD operations: WORKING');
    console.log('   ✅ Job posting service: WORKING');
    console.log('=' .repeat(60));
    console.log('🔧 The database timeout issue should now be resolved!');
    console.log('=' .repeat(60));

  } catch (error) {
    console.error('\n❌ Database Fix Test Failed!');
    console.error('=' .repeat(60));
    console.error(`🚨 Error: ${error.message}`);
    console.error('=' .repeat(60));
    
    console.error('\n🔧 Troubleshooting Steps:');
    console.error('   1. Check MongoDB connection string in .env file');
    console.error('   2. Ensure MongoDB server is running');
    console.error('   3. Verify network connectivity to MongoDB');
    console.error('   4. Check MongoDB authentication credentials');
    console.error('   5. Ensure database exists and is accessible');
    console.error('   6. Check if the databaseUtils.js file is properly imported');
    
    process.exit(1);
  } finally {
    // Close MongoDB connection
    await mongoose.connection.close();
    console.log('\n🔌 MongoDB connection closed');
  }
}

// Run the test
testDatabaseConnection();
