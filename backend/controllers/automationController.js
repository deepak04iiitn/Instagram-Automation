import { Post, Approval, Configuration } from '../models/index.js';
import GeminiService from '../services/geminiService.js';
import EmailService from '../services/emailService.js';
import ImageGenerationService from '../services/imageGenerationService.js';
import GoogleDriveService from '../services/googleDriveService.js';
import CloudinaryService from '../services/cloudinaryService.js';
import InstagramService from '../services/instagramService.js';
import moment from 'moment';

class AutomationController {
  constructor() {
    this.geminiService = new GeminiService();
    this.emailService = new EmailService();
    this.imageGenerationService = new ImageGenerationService();
    this.googleDriveService = new GoogleDriveService();
    this.cloudinaryService = new CloudinaryService();
    this.instagramService = new InstagramService();
    
    // Array of prompts - one will be randomly selected daily
    this.prompts = [
      "Give one real-world SDET interview question on Java and explain the answer in detail with code example.",
      "Generate a tricky automation testing interview question involving Selenium or Playwright and explain the correct solution.",
      "Create one scenario-based manual testing interview question and provide the step-by-step RCA (Root Cause Analysis).",
      "Share one real API testing interview question for SDETs and explain how to approach it using Postman or Rest Assured.",
      "Give one real coding question asked in an SDET interview with a clean Java solution.",
      "Provide a tough bug-reporting scenario from an interview and explain how a candidate should write the bug report.",
      "Explain one key design principle behind a scalable automation framework used in SDET roles.",
      "Share one powerful concept from TestNG, Cucumber, or PyTest that most testers overlook.",
      "Explain how you would design a hybrid framework for API + UI testing using Rest Assured and Selenium.",
      "Share a daily tip to improve Selenium test performance or stability.",
      "Explain one CI/CD integration example for SDET automation pipelines using Jenkins or GitHub Actions.",
      "Share one common mistake SDETs make during interviews and how to avoid it.",
      "Write a short, motivational tip for someone preparing for SDET interviews while working full-time.",
      "Share one strategy to transition from Manual Tester to SDET in 3 months.",
      "Give a daily learning roadmap task for someone preparing for SDET roles.",
      "Explain one underrated skill that makes an SDET stand out in interviews.",
      "Describe one real-world automation test failure scenario and how you would debug it.",
      "Share one flaky test case debugging example and the best practices to fix it.",
      "Explain how to identify and fix synchronization issues in Selenium tests.",
      "Create a scenario where API and UI test results conflict and how an SDET should investigate.",
      "Create one mini automation challenge for SDETs with expected output.",
      "Share one small automation task idea that helps beginners improve their coding logic.",
      "Write one SQL query challenge for QA/SDET interviews with expected result.",
      "Give one Java code snippet and ask users to find the bug or optimize it.",
      "Share one fact every SDET should know about test automation best practices.",
      "Explain the difference between functional and non-functional testing in simple terms.",
      "Explain one difference between Selenium and Playwright with a real example.",
      "Explain the concept of mocking and stubbing in API testing with an example.",
      "Explain how to handle dynamic elements in Selenium in a clean and reliable way.",
      "Give one must-know software testing principle with a practical example.",
      "Generate one coding question commonly asked in SDET interviews with a clean Java solution and time complexity analysis.",
      "Give one array or string manipulation question asked in an SDET interview and explain the approach step-by-step.",
      "Share one tricky logical question asked to test problem-solving in automation interviews, and solve it in Java.",
      "Create one real-world coding problem involving test data validation using file I/O and explain the solution.",
      "Give one object-oriented programming question asked in SDET interviews and explain with an example.",
      "Provide one question testing knowledge of collections (List, Map, Set) in Java for automation frameworks and explain with output.",
      "Give one Selenium interview question that tests deep understanding of locators and synchronization, with code example.",
      "Generate one interview question testing the difference between implicit, explicit, and fluent waits in Selenium.",
      "Create one interview question about Page Object Model (POM) and show sample code demonstrating its design.",
      "Share one real-time scenario interview question about handling dynamic web elements in automation.",
      "Give one TestNG interview question that tests knowledge of annotations and parallel execution.",
      "Explain one interview scenario involving Cucumber BDD and Gherkin syntax with a real feature file example.",
      "Share one question that tests understanding of Selenium Grid and parallel browser execution.",
      "Give one interview question related to designing a hybrid automation framework using Java, Selenium, and Rest Assured.",
      "Give one API testing interview question focusing on authentication (token or OAuth) and explain the approach.",
      "Generate one Rest Assured coding question testing JSON response validation.",
      "Create one real-world API testing scenario involving chaining requests and explain how to automate it.",
      "Share one interview question testing the difference between PUT, PATCH, and POST requests in REST API.",
      "Give one question testing API response validation using assertions or JSONPath in Rest Assured.",
      "Provide one API error-handling scenario and explain how you would test and validate it.",
      "Explain one high-level interview question about automation framework design patterns and their advantages.",
      "Give one scenario-based interview question about integrating API and UI tests within a single framework.",
      "Generate one interview question testing understanding of framework modularization and reusability.",
      "Provide one interview question testing knowledge of reporting tools like Allure or ExtentReports.",
      "Explain one interview question about using environment variables and configuration files in automation frameworks.",
      "Create one interview question on integrating automation with Jenkins or GitHub Actions.",
      "Give one question testing understanding of how to schedule test jobs and view reports in Jenkins.",
      "Share one Git-related interview question relevant to SDET workflows (branching, merging, pull requests).",
      "Generate one scenario-based interview question on running tests in Dockerized or virtual environments.",
      "Provide one interview question on how to trigger automation after deployment using CI/CD pipelines.",
      "Generate one scenario-based interview question where automation tests fail intermittently — explain RCA and fix.",
      "Give one interview question testing knowledge of debugging failed Selenium tests.",
      "Create one scenario where an API test passes locally but fails in CI, and explain RCA.",
      "Share one interview question testing ability to capture screenshots and logs during test failures.",
      "Explain one interview scenario that involves identifying flaky tests and stabilizing them.",
      "Give one SQL interview question often asked to SDETs to validate data integrity.",
      "Create one scenario where UI data needs to be validated with backend DB and explain the approach.",
      "Generate one interview question testing understanding of JDBC connection in automation frameworks.",
      "Share one SQL join query question that tests basic understanding of relational data validation.",
      "Provide one interview question testing API and DB consistency validation techniques.",
      "Generate one interview question testing basic understanding of performance testing metrics for SDETs.",
      "Give one question testing knowledge of API rate-limit or load-testing concepts.",
      "Share one interview question that tests understanding of test data management and environment stability.",
      "Describe one real-time QA scenario asked in interviews where you need to automate both API and UI flow.",
      "Create one scenario-based SDET interview question involving validation of payment or order workflow.",
      "Generate one question testing knowledge of test prioritization and selective execution in a CI pipeline.",
      "Give one practical interview question about integrating test results with Slack or email notifications.",
      "Share one question testing knowledge of handling test dependencies and data sharing between test methods.",
      "Create one mock interview question testing how an SDET would handle flaky APIs or unstable endpoints.",
      "Give one real-time example of a bug found through automation and how you would report it in the interview."
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
      
      // Step 5: Send approval email
      console.log('Sending approval email...');
      const emailResult = await this.emailService.sendApprovalEmail(post);
      
      // Step 6: Create approval record
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
    const post = new Post({
      topic: prompt.substring(0, 100), // Store first 100 chars of prompt as topic
      content: content,
      status: 'pending'
    });
    
    return await post.save();
  }

  /**
   * Create approval record
   */
  async createApprovalRecord(postId, emailId) {
    const approval = new Approval({
      postId: postId,
      emailId: emailId,
      adminEmail: process.env.ADMIN_EMAIL
    });
    
    return await approval.save();
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
      const newContent = await this.geminiService.generateContentFromPrompt(newPrompt);
      
      // Update post with new content
      post.topic = newPrompt.substring(0, 100);
      post.content = newContent;
      post.retryCount += 1;
      post.status = 'pending';
      await post.save();
      
      // Send new approval email
      console.log('Sending retry approval email...');
      const emailResult = await this.emailService.sendApprovalEmail(post);
      
      // Create new approval record
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
   * Send error notification
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
}

export default AutomationController;