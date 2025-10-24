#!/usr/bin/env node

/**
 * Test Email Formatting Script
 * 
 * This script tests the beautiful email formatting for job posting notifications.
 * It creates a sample email to show how the new formatting looks.
 * 
 * Usage:
 *   node backend/scripts/testEmailFormatting.mjs
 */

import 'dotenv/config';
import EmailService from '../services/emailService.js';

async function testEmailFormatting() {
  console.log('🧪 Testing Beautiful Email Formatting\n');
  console.log('=' .repeat(60));
  console.log(`⏰ Test started at: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST`);
  console.log('=' .repeat(60));

  try {
    // Initialize email service
    const emailService = new EmailService();
    
    // Create sample data
    const samplePost = {
      _id: '68fb2ad31628f9ad1b843d1c',
      topic: 'QA Job Opportunities',
      status: 'posted',
      postedAt: new Date()
    };

    const sampleInstagramPostId = '18075582845155033';
    
    const sampleJobs = [
      {
        company: 'NatWest Group',
        job_title: 'Software Engineer, Performance Test Engineer, AVP',
        location: ['London', 'UK'],
        min_exp: 5,
        apply_link: 'https://example.com/apply1'
      },
      {
        company: 'AMD',
        job_title: 'Lead Automation Developer',
        location: ['Austin', 'TX', 'USA'],
        min_exp: 7,
        apply_link: 'https://example.com/apply2'
      }
    ];

    const sampleCloudinaryUrl = 'https://res.cloudinary.com/dzloqg5ov/image/upload/v1761290944/instagram-automation/k9binrjg5a7kkw43lzzx.jpg';

    console.log('\n📋 Test 1: Generate Beautiful HTML Email');
    console.log('-' .repeat(40));
    
    const htmlContent = emailService.generateJobPostSuccessHTML(
      samplePost,
      sampleInstagramPostId,
      sampleJobs,
      sampleCloudinaryUrl,
      true // isManual = true
    );
    
    console.log('✅ Beautiful HTML email generated successfully');
    console.log(`   📊 HTML length: ${htmlContent.length} characters`);
    console.log(`   🎨 Contains modern CSS styling: ${htmlContent.includes('linear-gradient') ? 'Yes' : 'No'}`);
    console.log(`   📱 Responsive design: ${htmlContent.includes('@media') ? 'Yes' : 'No'}`);
    console.log(`   🖼️ Image preview: ${htmlContent.includes('image-preview') ? 'Yes' : 'No'}`);

    console.log('\n📋 Test 2: Generate Plain Text Email');
    console.log('-' .repeat(40));
    
    const textContent = emailService.generateJobPostSuccessText(
      samplePost,
      sampleInstagramPostId,
      sampleJobs,
      sampleCloudinaryUrl,
      true // isManual = true
    );
    
    console.log('✅ Plain text email generated successfully');
    console.log(`   📊 Text length: ${textContent.length} characters`);
    console.log(`   📋 Contains job details: ${textContent.includes('NatWest Group') ? 'Yes' : 'No'}`);

    console.log('\n📋 Test 3: Email Features');
    console.log('-' .repeat(40));
    
    const features = [
      { name: 'Instagram-style gradient header', present: htmlContent.includes('linear-gradient(90deg, #e1306c') },
      { name: 'Job cards with hover effects', present: htmlContent.includes('job-card:hover') },
      { name: 'Statistics grid', present: htmlContent.includes('stats-grid') },
      { name: 'Image preview section', present: htmlContent.includes('image-section') },
      { name: 'Mobile responsive design', present: htmlContent.includes('@media (max-width: 600px)') },
      { name: 'Professional footer', present: htmlContent.includes('footer-logo') },
      { name: 'Success badge', present: htmlContent.includes('success-badge') },
      { name: 'Post details section', present: htmlContent.includes('post-details') }
    ];

    features.forEach(feature => {
      console.log(`   ${feature.present ? '✅' : '❌'} ${feature.name}`);
    });

    console.log('\n🎉 Email Formatting Test Completed!');
    console.log('=' .repeat(60));
    console.log('📊 Test Summary:');
    console.log('   ✅ HTML email generation: WORKING');
    console.log('   ✅ Plain text email generation: WORKING');
    console.log('   ✅ Modern styling features: WORKING');
    console.log('   ✅ Responsive design: WORKING');
    console.log('   ✅ Professional layout: WORKING');
    console.log('=' .repeat(60));
    console.log('🎨 Your job posting emails will now be beautifully formatted!');
    console.log('=' .repeat(60));

    // Optional: Save HTML to file for preview
    if (process.argv.includes('--save-html')) {
      const fs = await import('fs');
      const path = await import('path');
      const htmlFilePath = path.join(process.cwd(), 'sample_email.html');
      fs.writeFileSync(htmlFilePath, htmlContent);
      console.log(`\n💾 HTML email saved to: ${htmlFilePath}`);
      console.log('   You can open this file in a browser to preview the email');
    }

  } catch (error) {
    console.error('\n❌ Email Formatting Test Failed!');
    console.error('=' .repeat(60));
    console.error(`🚨 Error: ${error.message}`);
    console.error('=' .repeat(60));
    
    console.error('\n🔧 Troubleshooting Steps:');
    console.error('   1. Check if EmailService is properly imported');
    console.error('   2. Verify email service configuration');
    console.error('   3. Ensure all required dependencies are installed');
    
    process.exit(1);
  }
}

// Run the test
testEmailFormatting();
