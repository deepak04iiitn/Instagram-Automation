#!/usr/bin/env node

/**
 * Manual Job Posting Script
 * 
 * This script allows you to manually post a job update to Instagram
 * outside of the scheduled 5 PM IST time.
 * 
 * Usage:
 *   node backend/scripts/manualJobPost.mjs
 * 
 * The script will:
 * 1. Fetch QA jobs from your API
 * 2. Select 2 random jobs
 * 3. Generate the job posting image
 * 4. Upload to Cloudinary and Google Drive
 * 5. Post to Instagram
 * 6. Create a post record in the database
 * 7. Send success notification email
 */

import 'dotenv/config';
import JobPostingService from '../services/jobPostingService.js';
import Post from '../models/Post.js';
import DatabaseUtils from '../utils/databaseUtils.js';

async function manualJobPost() {
  console.log('🚀 Manual Job Posting Script Started\n');
  console.log('=' .repeat(50));
  console.log(`⏰ Time: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST`);
  console.log('=' .repeat(50));

  try {
    // Initialize the job posting service
    const jobPostingService = new JobPostingService();
    
    console.log('\n📋 Step 1: Fetching QA jobs from API...');
    const availableJobs = await jobPostingService.fetchJobs(20);
    
    if (availableJobs.length === 0) {
      throw new Error('No valid QA jobs available for posting');
    }
    
    console.log(`✅ Found ${availableJobs.length} valid QA jobs`);
    
    console.log('\n🎯 Step 2: Selecting 2 random jobs...');
    const selectedJobs = jobPostingService.selectRandomJobs(availableJobs);
    console.log(`✅ Selected ${selectedJobs.length} jobs for posting:`);
    
    selectedJobs.forEach((job, index) => {
      console.log(`   ${index + 1}. ${job.company} - ${job.job_title || job.title}`);
      console.log(`      📍 ${Array.isArray(job.location) ? job.location.join(', ') : job.location}`);
      console.log(`      📅 ${job.min_exp || 0}+ years experience`);
    });

    console.log('\n🖼️  Step 3: Generating job posting image...');
    const imagePath = await jobPostingService.generateJobPostingImage(selectedJobs);
    console.log(`✅ Image generated: ${imagePath}`);

    console.log('\n☁️  Step 4: Uploading to Cloudinary...');
    const cloudinaryResult = await jobPostingService.cloudinaryService.uploadImage(imagePath);
    console.log(`✅ Uploaded to Cloudinary: ${cloudinaryResult.url}`);

    console.log('\n📁 Step 5: Uploading to Google Drive (backup)...');
    let driveResult = null;
    try {
      const isConnected = await jobPostingService.googleDriveService.testConnection();
      if (isConnected) {
        driveResult = await jobPostingService.googleDriveService.uploadImage(
          imagePath, 
          'Job Posts', 
          `manual_job_post_${Date.now()}`
        );
        console.log(`✅ Uploaded to Google Drive: ${driveResult.webViewLink}`);
      } else {
        console.log('⚠️  Google Drive connection failed, skipping backup upload');
      }
    } catch (error) {
      console.log(`⚠️  Google Drive upload failed: ${error.message}`);
    }

    console.log('\n📝 Step 6: Generating Instagram caption...');
    const caption = jobPostingService.generateJobPostingCaption(selectedJobs);
    console.log('✅ Caption generated (first 200 chars):');
    console.log(`   ${caption.substring(0, 200)}...`);

    console.log('\n📱 Step 7: Posting to Instagram...');
    const instagramResult = await jobPostingService.instagramService.postImages([cloudinaryResult.url], caption);
    console.log(`✅ Posted to Instagram successfully!`);
    console.log(`   📊 Instagram Post ID: ${instagramResult.mediaId}`);

    console.log('\n💾 Step 8: Creating post record in database...');
    let post = null;
    try {
      const postData = {
        topic: 'QA Job Opportunities',
        content: jobPostingService.formatJobsForImage(selectedJobs),
        status: 'posted',
        postedAt: new Date(),
        instagramPostId: instagramResult.mediaId,
        images: [{
          localPath: imagePath,
          cloudinaryId: cloudinaryResult.publicId,
          cloudinaryUrl: cloudinaryResult.url,
          googleDriveId: driveResult?.fileId || null,
          googleDriveUrl: driveResult?.webViewLink || null
        }]
      };

      // Use DatabaseUtils for robust database operations
      post = await DatabaseUtils.createWithRetry(Post, postData, 3);
      console.log(`✅ Post record created with ID: ${post._id}`);
    } catch (dbError) {
      console.log(`⚠️  Database record creation failed: ${dbError.message}`);
      console.log(`📱 Instagram post was successful (ID: ${instagramResult.mediaId})`);
      console.log(`🔧 You can fix this later by running:`);
      console.log(`   node backend/scripts/fixDatabaseRecord.mjs ${instagramResult.mediaId}`);
      
      // Create a minimal post object for the summary
      post = {
        _id: 'Database record creation failed',
        instagramPostId: instagramResult.mediaId
      };
    }

    console.log('\n📧 Step 9: Sending success notification...');
    
    if (post._id === 'Database record creation failed') {
      // Send simple notification for failed database record
      const emailSubject = 'Manual Job Post Published (DB Record Failed)';
      const emailBody = `Manual job post published successfully!\n\n` +
        `📊 Instagram Post ID: ${instagramResult.mediaId}\n` +
        `📝 Post Record ID: ${post._id}\n` +
        `⏰ Posted at: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST\n\n` +
        `Jobs posted:\n${selectedJobs.map(job => `- ${job.company}: ${job.job_title || job.title}`).join('\n')}\n\n` +
        `Image: ${cloudinaryResult.url}\n\n` +
        `⚠️  Note: Database record creation failed. To fix this, run:\n` +
        `node backend/scripts/fixDatabaseRecord.mjs ${instagramResult.mediaId}`;

      await jobPostingService.emailService.sendNotificationEmail(
        process.env.ADMIN_EMAIL,
        emailSubject,
        emailBody
      );
    } else {
      // Send beautiful HTML notification for successful post
      await jobPostingService.emailService.sendJobPostSuccessNotification(
        post,
        instagramResult.mediaId,
        selectedJobs,
        cloudinaryResult.url,
        true // isManual = true
      );
    }
    
    console.log('✅ Success notification sent');

    console.log('\n🎉 Manual Job Posting Completed Successfully!');
    console.log('=' .repeat(50));
    console.log('📊 Summary:');
    console.log(`   • Jobs posted: ${selectedJobs.length}`);
    console.log(`   • Instagram Post ID: ${instagramResult.mediaId}`);
    console.log(`   • Database Record ID: ${post._id}`);
    console.log(`   • Image URL: ${cloudinaryResult.url}`);
    console.log(`   • Posted at: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST`);
    
    if (post._id === 'Database record creation failed') {
      console.log('\n⚠️  Note: Database record creation failed');
      console.log(`🔧 To fix this, run: node backend/scripts/fixDatabaseRecord.mjs ${instagramResult.mediaId}`);
    }
    
    console.log('=' .repeat(50));

  } catch (error) {
    console.error('\n❌ Manual Job Posting Failed!');
    console.error('=' .repeat(50));
    console.error(`🚨 Error: ${error.message}`);
    console.error('=' .repeat(50));
    
    console.error('\n🔧 Troubleshooting Steps:');
    console.error('   1. Check if job API is accessible');
    console.error('   2. Verify JOB_API_BASE_URL in .env file');
    console.error('   3. Ensure Instagram API credentials are valid');
    console.error('   4. Check Cloudinary configuration');
    console.error('   5. Verify email service settings');
    console.error('   6. Check database connection');
    
    // Try to send error notification
    try {
      const jobPostingService = new JobPostingService();
      await jobPostingService.emailService.sendNotificationEmail(
        process.env.ADMIN_EMAIL,
        'Manual Job Post Failed',
        `Manual job posting failed with error: ${error.message}\n\n` +
        `Time: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST\n\n` +
        `Stack trace: ${error.stack}`
      );
      console.error('\n📧 Error notification sent to admin');
    } catch (notificationError) {
      console.error('\n⚠️  Failed to send error notification:', notificationError.message);
    }
    
    process.exit(1);
  }
}

// Handle script interruption
process.on('SIGINT', () => {
  console.log('\n\n⚠️  Script interrupted by user');
  console.log('🛑 Manual job posting cancelled');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n\n⚠️  Script terminated');
  console.log('🛑 Manual job posting cancelled');
  process.exit(0);
});

// Run the script
console.log('🎯 Manual Job Posting Script');
console.log('This script will post QA jobs to Instagram immediately\n');

// Add a small delay to allow user to read the message
setTimeout(() => {
  manualJobPost().catch(console.error);
}, 2000);
