#!/usr/bin/env node

/**
 * Quick Job Posting Script
 * 
 * A simplified version for quick job posting without detailed logging.
 * 
 * Usage:
 *   node backend/scripts/quickJobPost.mjs
 */

import 'dotenv/config';
import JobPostingService from '../services/jobPostingService.js';

async function quickJobPost() {
  console.log('🚀 Quick Job Post...');
  
  try {
    const jobPostingService = new JobPostingService();
    const result = await jobPostingService.postJobUpdate();
    
    console.log('✅ Success!');
    console.log(`📱 Instagram Post ID: ${result.instagramResult.mediaId}`);
    console.log(`💾 Database Record ID: ${result.post._id}`);
    console.log(`📊 Jobs posted: ${result.selectedJobs.length}`);
    
  } catch (error) {
    console.error('❌ Failed:', error.message);
    process.exit(1);
  }
}

quickJobPost();
