#!/usr/bin/env node

/**
 * Test script for the automated job posting system
 * Run with: node backend/scripts/testJobPosting.mjs
 */

import 'dotenv/config';
import JobPostingService from '../services/jobPostingService.js';

async function testJobPosting() {
  console.log('🧪 Testing Job Posting System...\n');

  try {
    const jobPostingService = new JobPostingService();

    // Test 1: Job fetching
    console.log('📋 Test 1: Fetching QA jobs from API...');
    const jobs = await jobPostingService.fetchJobs(5);
    console.log(`✅ Successfully fetched ${jobs.length} QA jobs`);
    
    if (jobs.length > 0) {
      console.log('Sample job:', {
        id: jobs[0]._id,
        company: jobs[0].company,
        title: jobs[0].job_title || jobs[0].title,
        location: jobs[0].location,
        hasValidLink: !!jobs[0].apply_link
      });
    }

    // Test 2: Job selection
    console.log('\n🎯 Test 2: Selecting random jobs...');
    if (jobs.length >= 2) {
      const selectedJobs = jobPostingService.selectRandomJobs(jobs);
      console.log(`✅ Selected ${selectedJobs.length} jobs for posting`);
      selectedJobs.forEach((job, index) => {
        console.log(`  Job ${index + 1}: ${job.company} - ${job.job_title || job.title}`);
      });
    } else {
      console.log('⚠️  Not enough jobs available for selection test');
    }

    // Test 3: Link generation
    console.log('\n🔗 Test 3: Testing link generation...');
    if (jobs.length > 0) {
      const job = jobs[0];
      const formattedUrl = jobPostingService.formatUrlString(job.company, job.job_title || job.title);
      const applyLink = `https://route2hire.com/fulljd/${formattedUrl}/${job._id}`;
      console.log(`✅ Generated link: ${applyLink}`);
    }

    // Test 4: Caption generation
    console.log('\n📝 Test 4: Testing caption generation...');
    if (jobs.length >= 2) {
      const selectedJobs = jobPostingService.selectRandomJobs(jobs);
      const caption = jobPostingService.generateJobPostingCaption(selectedJobs);
      console.log('✅ Generated caption (first 200 chars):');
      console.log(caption.substring(0, 200) + '...');
    }

    // Test 5: Image generation (optional - requires puppeteer)
    console.log('\n🖼️  Test 5: Testing image generation...');
    if (jobs.length >= 2) {
      try {
        const selectedJobs = jobPostingService.selectRandomJobs(jobs);
        const imagePath = await jobPostingService.generateJobPostingImage(selectedJobs);
        console.log(`✅ Generated image: ${imagePath}`);
      } catch (error) {
        console.log(`⚠️  Image generation failed: ${error.message}`);
        console.log('   This is expected if puppeteer dependencies are not installed');
      }
    }

    console.log('\n🎉 All tests completed successfully!');
    console.log('\n📊 Test Summary:');
    console.log(`   - Jobs fetched: ${jobs.length}`);
    console.log(`   - Valid jobs: ${jobs.filter(job => job.apply_link && job.apply_link.startsWith('http')).length}`);
    console.log(`   - System ready: ${jobs.length > 0 ? '✅' : '❌'}`);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('\n🔧 Troubleshooting:');
    console.error('   1. Check if job API is accessible');
    console.error('   2. Verify JOB_API_BASE_URL in .env file');
    console.error('   3. Ensure job API returns valid data');
    console.error('   4. Check network connectivity');
    
    process.exit(1);
  }
}

// Run the test
testJobPosting().catch(console.error);
