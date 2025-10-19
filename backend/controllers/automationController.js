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
    
    this.topicMapping = {
      0: 'Coding question of the day',    // Sunday
      1: 'Interview experience',          // Monday
      2: 'UI Testing',                    // Tuesday
      3: 'API Testing',                   // Wednesday
      4: 'Performance Testing',           // Thursday
      5: 'SDET Tools',                    // Friday
      6: 'AI in Testing'                  // Saturday
    };
  }

  /**
   * Run the daily automation process
   */
  async runDailyAutomation() {
    try {
      console.log('Starting daily automation process...');
      
      // Step 1: Determine current day and topic
      const topic = this.getTopicForToday();
      console.log(`Today's topic: ${topic}`);
      
      // Step 2: Check if post already exists for today
      const existingPost = await this.checkExistingPost(topic);
      if (existingPost) {
        console.log('Post already exists for today, skipping generation');
        return existingPost;
      }
      
      // Step 3: Generate content using Gemini
      console.log('Generating content with Gemini...');
      const content = await this.geminiService.generateContent(topic);
      
      // Step 4: Create post record
      console.log('Creating post record...');
      const post = await this.createPost(topic, content);
      
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
   * Get topic for today based on day of week
   */
  getTopicForToday() {
    const dayOfWeek = new Date().getDay();
    return this.topicMapping[dayOfWeek] || this.topicMapping[0];
  }

  /**
   * Check if post already exists for today's topic
   */
  async checkExistingPost(topic) {
    const today = moment().startOf('day').toDate();
    const tomorrow = moment().add(1, 'day').startOf('day').toDate();
    
    return await Post.findOne({
      topic: topic,
      generatedAt: {
        $gte: today,
        $lt: tomorrow
      }
    });
  }

  /**
   * Create a new post record
   */
  async createPost(topic, content) {
    const post = new Post({
      topic: topic,
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
        `instagram-automation/${post.topic.replace(/\s+/g, '-').toLowerCase()}`
      );
      
      console.log('Uploading images to Google Drive (backup)...');
      const driveResults = await this.googleDriveService.uploadImagesToDailyFolder(
        imagePaths, 
        post.topic, 
        post._id.toString()
      );
      
      // Update post with image information
      post.images = imagePaths.map((path, index) => ({
        localPath: path,
        cloudinaryId: cloudinaryResults[index].publicId,
        cloudinaryUrl: cloudinaryResults[index].url,
        googleDriveId: driveResults[index].fileId,
        googleDriveUrl: driveResults[index].webViewLink
      }));
      await post.save();
      
      // Post to Instagram using Cloudinary URLs
      console.log('Posting to Instagram using Cloudinary URLs...');
      const imageUrls = cloudinaryResults.map(result => result.url);
      
      let instagramResult;
      try {
        instagramResult = await this.instagramService.postImages(imageUrls, post.content);
      } catch (error) {
        console.log('Cloudinary URLs failed, trying Google Drive URLs as fallback...');
        // Fallback to Google Drive URLs
        const driveUrls = driveResults.map(result => result.webContentLink);
        instagramResult = await this.instagramService.postImages(driveUrls, post.content);
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
      
      // Update approval record
      await Approval.findOneAndUpdate(
        { postId: postId, emailId: emailId },
        { action: 'decline', actionTakenAt: new Date() }
      );
      
      // Update post status
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
      
      // Update approval record
      await Approval.findOneAndUpdate(
        { postId: postId, emailId: emailId },
        { action: 'retry', actionTakenAt: new Date() }
      );
      
      // Get post
      const post = await Post.findById(postId);
      if (!post) {
        throw new Error('Post not found');
      }
      
      // Check retry limit
      if (post.retryCount >= post.maxRetries) {
        throw new Error('Maximum retry limit reached');
      }
      
      // Generate new content
      console.log('Generating retry content...');
      const newContent = await this.geminiService.generateRetryContent(post.topic, post.content);
      
      // Update post with new content
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
      await this.imageGenerationService.cleanupOldImages(24); // 24 hours
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
      
      // Delete posts older than 30 days that are not posted
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
      
      const todayPosts = await Post.find({
        generatedAt: { $gte: today, $lt: tomorrow }
      });
      
      const recentPosts = await Post.find()
        .sort({ createdAt: -1 })
        .limit(10);
      
      const stats = {
        todayPosts: todayPosts.length,
        todayTopic: this.getTopicForToday(),
        recentPosts: recentPosts.map(post => ({
          id: post._id,
          topic: post.topic,
          status: post.status,
          createdAt: post.createdAt
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
