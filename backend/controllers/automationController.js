import { Post, Approval, Configuration } from '../models/index.js';
import GeminiService from '../services/geminiService.js';
import EmailService from '../services/emailService.js';
import ImageGenerationService from '../services/imageGenerationService.js';
import GoogleDriveService from '../services/googleDriveService.js';
import CloudinaryService from '../services/cloudinaryService.js';
import InstagramService from '../services/instagramService.js';
import JobPostingService from '../services/jobPostingService.js';
import DatabaseUtils from '../utils/databaseUtils.js';
import moment from 'moment';

class AutomationController {
  constructor() {
    this.geminiService = new GeminiService();
    this.emailService = new EmailService();
    this.imageGenerationService = new ImageGenerationService();
    this.googleDriveService = new GoogleDriveService();
    this.cloudinaryService = new CloudinaryService();
    this.instagramService = new InstagramService();
    this.jobPostingService = new JobPostingService();
    
    // Array of prompts - one will be randomly selected daily
    this.prompts = [
      "Give one real-world SDET interview question on Java and provide a concise, interview-ready explanation with code.",
      "Generate a tricky automation testing interview question involving Selenium or Playwright and share a brief, correct solution.",
      "Create one scenario-based manual testing interview question and give a short Root Cause Analysis (RCA).",
      "Share one real API testing interview question for SDETs and explain briefly how to approach it using Postman or Rest Assured.",
      "Give one real coding question asked in an SDET interview and provide a clean, concise Java solution.",
      "Provide a short bug-reporting scenario from an interview and show how to write an effective bug report.",
      "Explain one key design principle behind a scalable automation framework in a concise way.",
      "Share one overlooked but powerful concept from TestNG, Cucumber, or PyTest in brief.",
      "Explain how to design a hybrid API + UI testing framework using Rest Assured and Selenium with a short example.",
      "Share one quick daily tip to improve Selenium test performance or stability.",
      "Explain one CI/CD integration example for automation pipelines (Jenkins or GitHub Actions) concisely.",
      "Share one common interview mistake SDETs make and a short way to avoid it.",
      "Write one short motivational tip for professionals preparing for SDET interviews.",
      "Share one simple strategy to move from Manual Tester to SDET within 3 months.",
      "Give a short daily learning roadmap task for SDET preparation.",
      "Explain one underrated skill that helps SDETs stand out in interviews, concisely.",
      "Describe one real automation test failure scenario and briefly explain debugging steps.",
      "Share one flaky test debugging example and give short best practices to fix it.",
      "Explain briefly how to identify and fix synchronization issues in Selenium tests.",
      "Create one scenario where API and UI test results conflict and show how to investigate it concisely.",
      "Create one mini automation challenge for SDETs with expected output (short answer).",
      "Share one small automation task idea to improve coding logic (concise).",
      "Write one SQL query challenge for QA/SDET interviews and show expected result briefly.",
      "Give one Java code snippet and ask to find the bug or optimize it, with a concise explanation.",
      "Share one must-know fact about test automation best practices (concise).",
      "Explain functional vs non-functional testing in simple, short terms.",
      "Explain one key difference between Selenium and Playwright with a short real example.",
      "Explain mocking and stubbing in API testing briefly with an example.",
      "Explain how to handle dynamic elements in Selenium in a clean, concise way.",
      "Give one software testing principle and a short practical example.",
      "Generate one coding question asked in SDET interviews with a clean Java solution and short time complexity note.",
      "Give one array or string manipulation question asked in SDET interviews with a step-by-step but concise approach.",
      "Share one tricky logical question from automation interviews and solve it briefly in Java.",
      "Create one coding problem on test data validation using file I/O with a short solution.",
      "Give one OOPs question commonly asked in SDET interviews with a concise explanation.",
      "Provide one Java collections question (List, Map, Set) for automation frameworks with output explained briefly.",
      "Give one Selenium interview question testing locators and synchronization with a short code example.",
      "Generate one question about implicit, explicit, and fluent waits in Selenium and answer briefly.",
      "Create one Page Object Model (POM) interview question with short sample code.",
      "Share one dynamic web element handling scenario with a concise solution.",
      "Give one TestNG question testing annotations and parallel execution with a short solution.",
      "Explain one Cucumber BDD interview scenario with a concise feature file example.",
      "Share one question testing Selenium Grid and parallel execution understanding briefly.",
      "Give one question about designing a hybrid automation framework (Java, Selenium, Rest Assured) concisely.",
      "Give one API testing interview question on authentication (token/OAuth) and explain briefly.",
      "Generate one Rest Assured coding question testing JSON validation with short explanation.",
      "Create one API chaining scenario and explain automation steps briefly.",
      "Share one question on PUT vs PATCH vs POST with short explanation.",
      "Give one API response validation question using assertions or JSONPath, answered concisely.",
      "Provide one API error-handling scenario with a short testing approach.",
      "Explain one high-level automation framework design pattern briefly with its benefit.",
      "Give one scenario question about integrating API and UI tests in one framework (short answer).",
      "Generate one interview question on framework modularization and reusability (concise).",
      "Provide one question testing knowledge of Allure or ExtentReports with brief explanation.",
      "Explain one interview question on environment variables/config files in frameworks concisely.",
      "Create one Jenkins or GitHub Actions integration question with short setup explanation.",
      "Give one question testing scheduling of test jobs and report viewing in Jenkins briefly.",
      "Share one Git-related SDET interview question (branching, merging, PRs) concisely.",
      "Generate one Dockerized or virtual environment scenario question with short solution.",
      "Provide one CI/CD pipeline automation trigger scenario question with brief answer.",
      "Generate one scenario-based flaky test failure question with short RCA and fix.",
      "Give one debugging question for failed Selenium tests with concise steps.",
      "Create one API test failing locally vs CI scenario with short RCA.",
      "Share one question testing screenshot/log capture during test failures briefly.",
      "Explain one flaky test detection and stabilization interview question concisely.",
      "Give one SQL interview question testing data integrity with a short solution.",
      "Create one UI-to-DB data validation scenario with a brief explanation.",
      "Generate one question testing JDBC connection knowledge concisely.",
      "Share one SQL join query question with short explanation.",
      "Provide one interview question testing API-DB consistency validation briefly.",
      "Generate one basic performance testing metrics question for SDETs (concise).",
      "Give one API rate-limiting or load-testing concept question with short answer.",
      "Share one question testing test data management and environment stability (brief).",
      "Describe one real-world QA scenario automating both API and UI flow concisely.",
      "Create one payment/order workflow validation scenario with short explanation.",
      "Generate one test prioritization and selective execution CI question (brief).",
      "Give one interview question about integrating test results with Slack or email (concise).",
      "Share one question testing handling of test dependencies and shared data (brief).",
      "Create one mock interview question on handling flaky APIs or unstable endpoints concisely.",
      "Give one real-time automation bug example and show briefly how to report it."
    ];    
  }

  /**
   * Run the daily automation process
   */
  async runDailyAutomation() {
    try {
      console.log('Starting daily automation process...');
      
      // Step 1: Get random prompt for today
      const prompt = this.getRandomPrompt();
      console.log(`Today's prompt: ${prompt.substring(0, 100)}...`);
      
      // Step 2: Check if post already exists for today
      const existingPost = await this.checkExistingPostToday();
      if (existingPost) {
        console.log('Post already exists for today, skipping generation');
        return existingPost;
      }
      
      // Step 3: Generate content using Gemini (returns { topic, content })
      console.log('Generating content with Gemini...');
      const generated = await this.geminiService.generateContentFromPrompt(prompt);
      console.log(`Generated topic: ${generated.topic}`);
      
      // Step 4: Create post record
      console.log('Creating post record...');
      const post = await this.createPost(generated.topic, generated.content);
      
      // Step 5: Send approval email with fallback handling
      console.log('Sending approval email...');
      let emailResult;
      try {
        emailResult = await this.emailService.sendApprovalEmail(post);
        console.log('✅ Approval email sent successfully');
      } catch (emailError) {
        console.error('❌ Failed to send approval email:', emailError.message);
        
        // Create a fallback email ID for the approval record
        const fallbackEmailId = `fallback_${Date.now()}`;
        emailResult = {
          success: false,
          emailId: fallbackEmailId,
          error: emailError.message
        };
        
        // Log the failure but continue with the process
        console.log('⚠️ Continuing with post creation despite email failure');
        console.log('📧 Manual approval required - Post ID:', post._id);
      }
      
      // Step 6: Create approval record (even if email failed)
      await this.createApprovalRecord(post._id, emailResult.emailId);
      
      console.log('Daily automation process completed successfully');
      return post;
      
    } catch (error) {
      console.error('Error in daily automation:', error);
      throw error;
    }
  }

  /**
   * Get random prompt from the array
   */
  getRandomPrompt() {
    const randomIndex = Math.floor(Math.random() * this.prompts.length);
    return this.prompts[randomIndex];
  }

  /**
   * Check if post already exists for today
   */
  async checkExistingPostToday() {
    const today = moment().startOf('day').toDate();
    const tomorrow = moment().add(1, 'day').startOf('day').toDate();
    
    return await Post.findOne({
      generatedAt: {
        $gte: today,
        $lt: tomorrow
      }
    });
  }

  /**
   * Create a new post record
   */
  async createPost(prompt, content) {
    const postData = {
      topic: prompt.substring(0, 100), // Store first 100 chars of prompt as topic
      content: content,
      status: 'pending'
    };
    
    return await DatabaseUtils.createWithRetry(Post, postData, 3);
  }

  /**
   * Create approval record
   */
  async createApprovalRecord(postId, emailId) {
    const approvalData = {
      postId: postId,
      emailId: emailId,
      adminEmail: process.env.ADMIN_EMAIL
    };
    
    return await DatabaseUtils.createWithRetry(Approval, approvalData, 3);
  }

  /**
   * Handle post approval (Accept)
   */
  async handlePostApproval(postId, emailId) {
    try {
      console.log(`Handling post approval for post ${postId}`);
      
      // Update approval record
      await Approval.findOneAndUpdate(
        { postId: postId, emailId: emailId },
        { action: 'accept', actionTakenAt: new Date() }
      );
      
      // Get post
      const post = await Post.findById(postId);
      if (!post) {
        throw new Error('Post not found');
      }
      
      // Update post status
      post.status = 'approved';
      post.approvedAt = new Date();
      await post.save();
      
      // Generate images
      console.log('Generating images...');
      const imagePaths = await this.imageGenerationService.generateImages(post.content, post.topic);
      
      // Upload images to Cloudinary (primary) and Google Drive (backup)
      console.log('Uploading images to Cloudinary...');
      const cloudinaryResults = await this.cloudinaryService.uploadImages(
        imagePaths, 
        `instagram-automation/sdet-posts`
      );
      
      console.log('Uploading images to Google Drive (backup)...');
      let driveResults = [];
      try {
        const isConnected = await this.googleDriveService.testConnection();
        if (isConnected) {
          driveResults = await this.googleDriveService.uploadImagesToDailyFolder(
            imagePaths, 
            'SDET Posts', 
            post._id.toString()
          );
          console.log('Google Drive upload completed successfully');
        } else {
          console.log('Google Drive connection failed, skipping backup upload');
          driveResults = imagePaths.map(() => ({
            fileId: null,
            webViewLink: null,
            webContentLink: null
          }));
        }
      } catch (error) {
        console.error('Google Drive upload failed:', error.message);
        driveResults = imagePaths.map(() => ({
          fileId: null,
          webViewLink: null,
          webContentLink: null
        }));
      }
      
      // Update post with image information
      post.images = imagePaths.map((path, index) => ({
        localPath: path,
        cloudinaryId: cloudinaryResults[index].publicId,
        cloudinaryUrl: cloudinaryResults[index].url,
        googleDriveId: driveResults[index].fileId,
        googleDriveUrl: driveResults[index].webViewLink
      }));
      await post.save();
      
      // Build clean caption
      const sanitizedContent = this.geminiService.formatContent(post.content);
      const caption = await this.geminiService.generateCaption('SDET Interview Prep', sanitizedContent);

      // Post to Instagram using Cloudinary URLs
      console.log('Posting to Instagram using Cloudinary URLs...');
      const imageUrls = cloudinaryResults.map(result => result.url);
      
      let instagramResult;
      try {
        instagramResult = await this.instagramService.postImages(imageUrls, caption);
      } catch (error) {
        console.log('Cloudinary URLs failed, trying Google Drive URLs as fallback...');
        const validDriveResults = driveResults.filter(result => result && result.webContentLink);
        if (validDriveResults.length > 0) {
          const driveUrls = validDriveResults.map(result => result.webContentLink);
          instagramResult = await this.instagramService.postImages(driveUrls, caption);
        } else {
          console.error('No valid Google Drive URLs available for fallback');
          throw new Error('Both Cloudinary and Google Drive uploads failed');
        }
      }
      
      // Update post with Instagram information
      post.status = 'posted';
      post.postedAt = new Date();
      post.instagramPostId = instagramResult.mediaId;
      await post.save();
      
      // Send success notification
      await this.emailService.sendPostSuccessNotification(post);
      
      console.log('Post approved and published successfully');
      return post;
      
    } catch (error) {
      console.error('Error handling post approval:', error);
      
      // Update post status to failed
      await Post.findByIdAndUpdate(postId, {
        status: 'failed',
        errorMessage: error.message
      });
      
      // Send failure notification
      const post = await Post.findById(postId);
      if (post) {
        await this.emailService.sendPostFailureNotification(post, error.message);
      }
      
      throw error;
    }
  }

  /**
   * Handle post decline
   */
  async handlePostDecline(postId, emailId) {
    try {
      console.log(`Handling post decline for post ${postId}`);
      
      await Approval.findOneAndUpdate(
        { postId: postId, emailId: emailId },
        { action: 'decline', actionTakenAt: new Date() }
      );
      
      await Post.findByIdAndUpdate(postId, {
        status: 'declined'
      });
      
      console.log('Post declined successfully');
      return true;
      
    } catch (error) {
      console.error('Error handling post decline:', error);
      throw error;
    }
  }

  /**
   * Handle post retry
   */
  async handlePostRetry(postId, emailId) {
    try {
      console.log(`Handling post retry for post ${postId}`);
      
      await Approval.findOneAndUpdate(
        { postId: postId, emailId: emailId },
        { action: 'retry', actionTakenAt: new Date() }
      );
      
      const post = await Post.findById(postId);
      if (!post) {
        throw new Error('Post not found');
      }
      
      if (post.retryCount >= post.maxRetries) {
        throw new Error('Maximum retry limit reached');
      }
      
      // Get a new random prompt
      const newPrompt = this.getRandomPrompt();
      console.log('Generating retry content with new prompt...');
      const newContentResult = await this.geminiService.generateContentFromPrompt(newPrompt);
      
      // Update post with new content
      post.topic = newContentResult.topic || newPrompt.substring(0, 100);
      post.content = newContentResult.content;
      post.retryCount += 1;
      post.status = 'pending';
      await post.save();
      
      // Send new approval email with fallback handling
      console.log('Sending retry approval email...');
      let emailResult;
      try {
        emailResult = await this.emailService.sendApprovalEmail(post);
        console.log('✅ Retry approval email sent successfully');
      } catch (emailError) {
        console.error('❌ Failed to send retry approval email:', emailError.message);
        
        // Create a fallback email ID for the approval record
        const fallbackEmailId = `retry_fallback_${Date.now()}`;
        emailResult = {
          success: false,
          emailId: fallbackEmailId,
          error: emailError.message
        };
        
        console.log('⚠️ Continuing with retry despite email failure');
        console.log('📧 Manual approval required for retry - Post ID:', post._id);
      }
      
      // Create new approval record (even if email failed)
      await this.createApprovalRecord(post._id, emailResult.emailId);
      
      console.log('Post retry handled successfully');
      return post;
      
    } catch (error) {
      console.error('Error handling post retry:', error);
      throw error;
    }
  }

  /**
   * Clean up old images
   */
  async cleanupOldImages() {
    try {
      console.log('Starting image cleanup...');
      await this.imageGenerationService.cleanupOldImages(24);
      console.log('Image cleanup completed');
    } catch (error) {
      console.error('Error during image cleanup:', error);
      throw error;
    }
  }

  /**
   * Clean up old posts
   */
  async cleanupOldPosts() {
    try {
      console.log('Starting post cleanup...');
      
      const thirtyDaysAgo = moment().subtract(30, 'days').toDate();
      
      const result = await Post.deleteMany({
        createdAt: { $lt: thirtyDaysAgo },
        status: { $in: ['declined', 'failed'] }
      });
      
      console.log(`Cleaned up ${result.deletedCount} old posts`);
    } catch (error) {
      console.error('Error during post cleanup:', error);
      throw error;
    }
  }

  /**
   * Send error notification with fallback handling
   */
  async sendErrorNotification(error) {
    try {
      const subject = '❌ Instagram Automation Error';
      const content = `
        <h2>⚠️ Automation Error Occurred</h2>
        <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
        <p><strong>Error:</strong> ${error.message}</p>
        <pre style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; overflow-x: auto;">${error.stack}</pre>
      `;
      
      await this.emailService.sendNotificationEmail(process.env.ADMIN_EMAIL, subject, content);
    } catch (notificationError) {
      console.error('Failed to send error notification:', notificationError);
      // Log to console as fallback
      console.error('=== AUTOMATION ERROR (Email notification failed) ===');
      console.error('Time:', new Date().toLocaleString());
      console.error('Error:', error.message);
      console.error('Stack:', error.stack);
      console.error('================================================');
    }
  }

  /**
   * Handle email service failures gracefully
   * @param {Error} emailError - The email error
   * @param {string} context - Context where the error occurred
   * @param {Object} post - The post object (if available)
   */
  async handleEmailFailure(emailError, context, post = null) {
    console.error(`❌ Email failure in ${context}:`, emailError.message);
    
    // Log detailed error information
    console.error('Email Error Details:', {
      code: emailError.code,
      message: emailError.message,
      context: context,
      postId: post?._id,
      timestamp: new Date().toISOString()
    });
    
    // Try to send error notification (with its own fallback)
    try {
      await this.sendErrorNotification(new Error(`Email failure in ${context}: ${emailError.message}`));
    } catch (notificationError) {
      console.error('Failed to send email failure notification:', notificationError.message);
    }
    
    // Return a fallback result
    return {
      success: false,
      error: emailError.message,
      fallback: true,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get posts that need manual approval (when emails fail)
   */
  async getPostsNeedingManualApproval() {
    try {
      const posts = await Post.find({
        status: 'pending',
        $or: [
          { 'approvalRecords.emailId': { $regex: /^fallback_/ } },
          { 'approvalRecords.emailId': { $regex: /^retry_fallback_/ } }
        ]
      }).sort({ createdAt: -1 });
      
      return posts.map(post => ({
        _id: post._id,
        topic: post.topic,
        content: post.content,
        status: post.status,
        createdAt: post.createdAt,
        retryCount: post.retryCount,
        maxRetries: post.maxRetries,
        approvalUrl: `${process.env.APP_URL || 'http://localhost:3000'}/api/approve/${post._id}/manual`
      }));
    } catch (error) {
      console.error('Error getting posts needing manual approval:', error);
      throw error;
    }
  }

  /**
   * Get automation status
   */
  async getAutomationStatus() {
    try {
      const today = moment().startOf('day').toDate();
      const tomorrow = moment().add(1, 'day').startOf('day').toDate();
      
      // Get all posts for statistics
      const allPosts = await Post.find();
      const todayPosts = await Post.find({
        generatedAt: { $gte: today, $lt: tomorrow }
      });
      
      const recentPosts = await Post.find()
        .sort({ createdAt: -1 })
        .limit(10);
      
      // Calculate statistics based on post status
      const stats = {
        totalPosts: allPosts.length,
        posted: allPosts.filter(post => post.status === 'posted').length,
        pending: allPosts.filter(post => post.status === 'pending').length,
        failed: allPosts.filter(post => post.status === 'failed').length,
        declined: allPosts.filter(post => post.status === 'declined').length,
        approved: allPosts.filter(post => post.status === 'approved').length,
        todayPosts: todayPosts.length,
        totalPrompts: this.prompts.length,
        recentPosts: recentPosts.map(post => ({
          _id: post._id,
          topic: post.topic,
          content: post.content,
          status: post.status,
          createdAt: post.createdAt,
          images: post.images || [],
          errorMessage: post.errorMessage,
          postedAt: post.postedAt,
          approvedAt: post.approvedAt
        }))
      };
      
      return stats;
    } catch (error) {
      console.error('Error getting automation status:', error);
      throw error;
    }
  }

  /**
   * Get post by ID
   */
  async getPostById(postId) {
    try {
      return await Post.findById(postId);
    } catch (error) {
      console.error('Error getting post by ID:', error);
      throw error;
    }
  }

  /**
   * Get all posts with pagination
   */
  async getPosts(page = 1, limit = 10) {
    try {
      const skip = (page - 1) * limit;
      
      const posts = await Post.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
      
      const total = await Post.countDocuments();
      
      return {
        posts: posts,
        pagination: {
          page: page,
          limit: limit,
          total: total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('Error getting posts:', error);
      throw error;
    }
  }

  /**
   * Post job update manually
   */
  async postJobUpdate() {
    try {
      console.log('Starting manual job update posting...');
      const result = await this.jobPostingService.postJobUpdate();
      console.log('Manual job update posting completed successfully');
      return result;
    } catch (error) {
      console.error('Error in manual job update posting:', error);
      throw error;
    }
  }

  /**
   * Get job posting service status
   */
  getJobPostingStatus() {
    return {
      postedJobsCount: this.jobPostingService.postedJobs.size,
      isServiceAvailable: true
    };
  }

  /**
   * Test job fetching
   */
  async testJobFetching() {
    try {
      const jobs = await this.jobPostingService.fetchJobs(5);
      return {
        success: true,
        jobsFound: jobs.length,
        sampleJobs: jobs.slice(0, 2).map(job => ({
          id: job._id,
          company: job.company,
          title: job.job_title || job.title,
          location: job.location,
          hasValidLink: !!job.apply_link
        }))
      };
    } catch (error) {
      console.error('Error testing job fetching:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

export default AutomationController;