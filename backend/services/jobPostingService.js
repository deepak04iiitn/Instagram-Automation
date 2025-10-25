import axios from 'axios';
import HtmlImageGenerationService from './htmlImageGenerationService.js';
import InstagramService from './instagramService.js';
import CloudinaryService from './cloudinaryService.js';
import GoogleDriveService from './googleDriveService.js';
import EmailService from './emailService.js';
import Post from '../models/Post.js';
import DatabaseUtils from '../utils/databaseUtils.js';

class JobPostingService {
  constructor() {
    this.htmlImageService = new HtmlImageGenerationService();
    this.instagramService = new InstagramService();
    this.cloudinaryService = new CloudinaryService();
    this.googleDriveService = new GoogleDriveService();
    this.emailService = new EmailService();
    this.jobApiBaseUrl = process.env.JOB_API_BASE_URL || 'https://route2hire.com/backend';
    this.domain = 'https://route2hire.com';
    this.postedJobs = new Set(); // Track recently posted jobs for deduplication
  }

  /**
   * Format company and job title into URL-friendly string
   * @param {string} company - Company name
   * @param {string} title - Job title
   * @returns {string} Formatted URL string
   */
  formatUrlString(company, title) {
    const formatString = (str) => str
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-');

    return `${formatString(company)}-${formatString(title)}`;
  }

  /**
   * Fetch jobs from the job listing API
   * @param {number} limit - Number of jobs to fetch
   * @returns {Promise<Array>} Array of job objects
   */
  async fetchJobs(limit = 10) {
    try {
      console.log(`Fetching ${limit} QA jobs from API...`);
      
      const response = await axios.get(`${this.jobApiBaseUrl}/naukri`, {
        params: {
          limit: limit,
          page: 1,
          category: 'qa'  // Filter for QA jobs only
        },
        timeout: 10000
      });

      const jobs = Array.isArray(response.data) ? response.data : (response.data.items || []);
      
      // Filter out jobs without valid apply links, recently posted jobs, and ensure QA category
      const validJobs = jobs.filter(job => {
        const hasValidLink = job.apply_link && 
          job.apply_link !== 'Not Found' && 
          job.apply_link !== 'about:blank' &&
          job.apply_link.startsWith('http');
        
        const notRecentlyPosted = !this.postedJobs.has(job._id);
        
        const isQACategory = job.category && 
          job.category.toLowerCase() === 'qa';
        
        return hasValidLink && notRecentlyPosted && isQACategory;
      });

      console.log(`Found ${validJobs.length} valid QA jobs out of ${jobs.length} total`);
      return validJobs;
    } catch (error) {
      console.error('Error fetching QA jobs:', error);
      throw new Error(`Failed to fetch QA jobs: ${error.message}`);
    }
  }

  /**
   * Select 2 random jobs for posting
   * @param {Array} jobs - Array of available jobs
   * @returns {Array} Array of 2 selected jobs
   */
  selectRandomJobs(jobs) {
    if (jobs.length === 0) {
      throw new Error('No jobs available for posting');
    }

    if (jobs.length === 1) {
      return [jobs[0]];
    }

    // Shuffle and take first 2
    const shuffled = [...jobs].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 2);
  }

  /**
   * Generate job posting image with 2 jobs
   * @param {Array} jobs - Array of 2 job objects
   * @returns {Promise<string>} Path to generated image
   */
  async generateJobPostingImage(jobs) {
    try {
      console.log('Generating job posting image...');
      
      // Generate image using specialized job posting template
      const imagePaths = await this.htmlImageService.generateJobPostingImages(jobs);
      
      if (imagePaths.length === 0) {
        throw new Error('Failed to generate job posting image');
      }

      return imagePaths[0]; // Return first image
    } catch (error) {
      console.error('Error generating job posting image:', error);
      throw error;
    }
  }

  /**
   * Format jobs data for image generation
   * @param {Array} jobs - Array of job objects
   * @returns {string} Formatted content for image
   */
  formatJobsForImage(jobs) {
    let content = '🚀 New Job Opportunities Available!\n\n';
    
    jobs.forEach((job, index) => {
      const jobNumber = index + 1;
      content += `Job ${jobNumber}:\n`;
      content += `🏢 Company: ${job.company || 'Not specified'}\n`;
      content += `💼 Position: ${job.job_title || job.title || 'Not specified'}\n`;
      content += `📅 Experience: ${job.min_exp || 0} years minimum\n`;
      content += `📍 Location: ${Array.isArray(job.location) ? job.location.join(', ') : (job.location || 'Not specified')}\n`;
      
      if (index < jobs.length - 1) {
        content += '\n---\n\n';
      }
    });

    content += '\n\nApply now and take the next step in your career! 🎯';
    
    return content;
  }

  /**
   * Generate caption for job posting
   * @param {Array} jobs - Array of job objects
   * @returns {string} Instagram caption
   */
  generateJobPostingCaption(jobs) {
    let caption = '🚀 Exciting QA Job Opportunities Alert! 🚀\n\n';
    
    jobs.forEach((job, index) => {
      const jobNumber = index + 1;
      const formattedUrl = this.formatUrlString(job.company, job.job_title || job.title);
      const applyLink = `${this.domain}/fulljd/${formattedUrl}/${job._id}`;
      
      caption += `💼 Job ${jobNumber}:\n`;
      caption += `🏢 ${job.company}\n`;
      caption += `📋 ${job.job_title || job.title}\n`;
      caption += `📅 ${job.min_exp || 0}+ years experience\n`;
      caption += `📍 ${Array.isArray(job.location) ? job.location.join(', ') : job.location}\n`;
      caption += `🔗 Apply: ${applyLink}\n\n`;
    });

    caption += '✨ Don\'t miss out on these amazing QA opportunities!\n';
    caption += '👆 Click the links in bio or visit our website\n';
    caption += '📱 Follow @route2hire for more job updates\n';
    caption += '🌐 For more jobs, visit @https://route2hire.com/\n\n';
    
    // Add clickable links at the end (Instagram makes these clickable)
    caption += '🔗 APPLY LINKS:\n';
    jobs.forEach((job, index) => {
      const jobNumber = index + 1;
      const formattedUrl = this.formatUrlString(job.company, job.job_title || job.title);
      const applyLink = `${this.domain}/fulljd/${formattedUrl}/${job._id}`;
      caption += `Job ${jobNumber}: ${applyLink}\n`;
    });
    
    caption += '\n#QAJobs #QualityAssurance #TestingJobs #SDET #QACareer #TechJobs #SoftwareTesting #JobSearch #CareerGrowth #Route2Hire';

    return caption;
  }

  /**
   * Post job update to Instagram
   * @returns {Promise<Object>} Post result
   */
  async postJobUpdate() {
    try {
      console.log('Starting job update posting process...');
      
      // Step 1: Fetch available jobs
      const availableJobs = await this.fetchJobs(20); // Fetch more to have better selection
      
      if (availableJobs.length === 0) {
        throw new Error('No valid jobs available for posting');
      }

      // Step 2: Select 2 random jobs
      const selectedJobs = this.selectRandomJobs(availableJobs);
      console.log(`Selected ${selectedJobs.length} jobs for posting`);

      // Step 3: Generate image
      const imagePath = await this.generateJobPostingImage(selectedJobs);
      console.log('Job posting image generated successfully');

      // Step 4: Upload to Cloudinary
      const cloudinaryResult = await this.cloudinaryService.uploadImage(imagePath);
      console.log('Image uploaded to Cloudinary');

      // Step 5: Upload to Google Drive as backup
      let driveResult = null;
      try {
        const isConnected = await this.googleDriveService.testConnection();
        if (isConnected) {
          driveResult = await this.googleDriveService.uploadImage(
            imagePath, 
            'Job Posts', 
            `job_post_${Date.now()}`
          );
          console.log('Image uploaded to Google Drive');
        }
      } catch (error) {
        console.warn('Google Drive upload failed:', error.message);
      }

      // Step 6: Generate caption
      const caption = this.generateJobPostingCaption(selectedJobs);

      // Step 7: Post to Instagram
      const instagramResult = await this.instagramService.postImages([cloudinaryResult.url], caption);
      console.log('Job update posted to Instagram successfully');

      // Step 8: Create post record with robust error handling
      let post = null;
      try {
        const postData = {
          topic: 'QA Job Opportunities',
          content: this.formatJobsForImage(selectedJobs),
          type: 'job',
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
        console.log('✅ Post record created successfully');
      } catch (dbError) {
        console.error('⚠️ Database record creation failed:', dbError.message);
        console.log(`📱 Instagram post was successful (ID: ${instagramResult.mediaId})`);
        console.log(`🔧 You can fix this later by running: node backend/scripts/fixDatabaseRecord.mjs ${instagramResult.mediaId}`);
        
        // Create a minimal post object for the return value
        post = {
          _id: 'Database record creation failed',
          instagramPostId: instagramResult.mediaId,
          status: 'posted',
          postedAt: new Date()
        };
      }

      // Step 9: Mark jobs as posted for deduplication
      selectedJobs.forEach(job => {
        this.postedJobs.add(job._id);
      });

      // Step 10: Send success notification
      if (post._id === 'Database record creation failed') {
        // Send simple notification for failed database record
        const emailSubject = 'Job Update Posted (DB Record Failed)';
        const emailBody = `Job update posted successfully with ${selectedJobs.length} jobs.\n\n` +
          `Instagram Post ID: ${instagramResult.mediaId}\n` +
          `Database Record ID: ${post._id}\n` +
          `Posted at: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST\n\n` +
          `Jobs posted:\n${selectedJobs.map(job => `- ${job.company}: ${job.job_title || job.title}`).join('\n')}\n\n` +
          `⚠️  Note: Database record creation failed. To fix this, run:\n` +
          `node backend/scripts/fixDatabaseRecord.mjs ${instagramResult.mediaId}`;

        await this.emailService.sendNotificationEmail(
          process.env.ADMIN_EMAIL,
          emailSubject,
          emailBody
        );
      } else {
        // Send beautiful HTML notification for successful post
        await this.emailService.sendJobPostSuccessNotification(
          post,
          instagramResult.mediaId,
          selectedJobs,
          cloudinaryResult.url,
          false // isManual = false (automated)
        );
      }

      console.log('Job update posting process completed successfully');
      return {
        success: true,
        post,
        instagramResult,
        selectedJobs
      };

    } catch (error) {
      console.error('Error posting job update:', error);
      
      // Send error notification
      try {
        await this.emailService.sendNotificationEmail(
          process.env.ADMIN_EMAIL,
          'Job Update Posting Failed',
          `Job update posting failed with error: ${error.message}\n\nTime: ${new Date().toLocaleString()}`
        );
      } catch (notificationError) {
        console.error('Failed to send error notification:', notificationError);
      }

      throw error;
    }
  }

  /**
   * Clean up old posted jobs from memory (call this periodically)
   */
  cleanupPostedJobs() {
    // Keep only last 50 posted jobs in memory
    if (this.postedJobs.size > 50) {
      const jobsArray = Array.from(this.postedJobs);
      this.postedJobs.clear();
      // Keep the most recent 30 jobs
      jobsArray.slice(-30).forEach(jobId => this.postedJobs.add(jobId));
    }
  }
}

export default JobPostingService;
