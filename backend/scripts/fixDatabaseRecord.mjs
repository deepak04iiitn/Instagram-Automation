#!/usr/bin/env node

/**
 * Fix Database Record Script
 * 
 * This script helps fix database records when Instagram posting succeeds
 * but database record creation fails due to connection issues.
 * 
 * Usage:
 *   node backend/scripts/fixDatabaseRecord.mjs <instagram_post_id>
 * 
 * Example:
 *   node backend/scripts/fixDatabaseRecord.mjs 18044766608665201
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import Post from '../models/Post.js';
import DatabaseUtils from '../utils/databaseUtils.js';

async function fixDatabaseRecord(instagramPostId) {
  console.log('🔧 Fixing Database Record Script\n');
  console.log('=' .repeat(50));
  console.log(`📱 Instagram Post ID: ${instagramPostId}`);
  console.log('=' .repeat(50));

  try {
    // Connect to MongoDB
    console.log('\n🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/instagram-automation', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000, // 30 seconds timeout
    });
    console.log('✅ Connected to MongoDB');

    // Check if record already exists
    console.log('\n🔍 Checking if record already exists...');
    const existingPost = await DatabaseUtils.findOneWithRetry(Post, { instagramPostId: instagramPostId }, {}, 3);
    
    if (existingPost) {
      console.log('✅ Record already exists in database:');
      console.log(`   📝 Post ID: ${existingPost._id}`);
      console.log(`   📊 Status: ${existingPost.status}`);
      console.log(`   ⏰ Posted at: ${existingPost.postedAt}`);
      console.log(`   🏷️  Topic: ${existingPost.topic}`);
      return;
    }

    // Create the missing record
    console.log('\n💾 Creating missing database record...');
    const postData = {
      topic: 'QA Job Opportunities',
      content: 'Manual job post - QA opportunities posted successfully',
      status: 'posted',
      postedAt: new Date(),
      instagramPostId: instagramPostId,
      images: [{
        localPath: 'Manual post - path not available',
        cloudinaryId: 'Manual post - ID not available',
        cloudinaryUrl: 'Manual post - URL not available',
        googleDriveId: null,
        googleDriveUrl: null
      }]
    };

    const post = await DatabaseUtils.createWithRetry(Post, postData, 3);
    console.log(`✅ Database record created successfully!`);
    console.log(`   📝 Post ID: ${post._id}`);
    console.log(`   📊 Status: ${post.status}`);
    console.log(`   ⏰ Posted at: ${post.postedAt}`);

    console.log('\n🎉 Database record fixed successfully!');
    console.log('=' .repeat(50));
    console.log('📊 Summary:');
    console.log(`   • Instagram Post ID: ${instagramPostId}`);
    console.log(`   • Database Record ID: ${post._id}`);
    console.log(`   • Status: ${post.status}`);
    console.log(`   • Fixed at: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST`);
    console.log('=' .repeat(50));

  } catch (error) {
    console.error('\n❌ Failed to fix database record!');
    console.error('=' .repeat(50));
    console.error(`🚨 Error: ${error.message}`);
    console.error('=' .repeat(50));
    
    console.error('\n🔧 Troubleshooting Steps:');
    console.error('   1. Check MongoDB connection string in .env file');
    console.error('   2. Ensure MongoDB server is running');
    console.error('   3. Verify network connectivity to MongoDB');
    console.error('   4. Check MongoDB authentication credentials');
    console.error('   5. Ensure database exists and is accessible');
    
    process.exit(1);
  } finally {
    // Close MongoDB connection
    await mongoose.connection.close();
    console.log('\n🔌 MongoDB connection closed');
  }
}

// Get Instagram Post ID from command line arguments
const instagramPostId = process.argv[2];

if (!instagramPostId) {
  console.error('❌ Error: Instagram Post ID is required');
  console.error('\nUsage:');
  console.error('  node backend/scripts/fixDatabaseRecord.mjs <instagram_post_id>');
  console.error('\nExample:');
  console.error('  node backend/scripts/fixDatabaseRecord.mjs 18044766608665201');
  process.exit(1);
}

// Validate Instagram Post ID format
if (!/^\d+$/.test(instagramPostId)) {
  console.error('❌ Error: Invalid Instagram Post ID format');
  console.error('Instagram Post ID should contain only numbers');
  process.exit(1);
}

// Run the script
fixDatabaseRecord(instagramPostId).catch(console.error);
