import cron from 'node-cron';
import moment from 'moment';
import JobPostingService from './jobPostingService.js';

class SchedulerService {
  constructor(automationController) {
    this.automationController = automationController;
    this.jobPostingService = new JobPostingService();
    this.jobs = new Map();
    this.isRunning = false;
  }

  /**
   * Start the scheduler
   */
  start() {
    if (this.isRunning) {
      console.log('Scheduler is already running');
      return;
    }

    console.log('Starting Instagram Automation Scheduler...');
    
    // Schedule daily automation at 10 AM IST (4:30 AM UTC)
    this.scheduleDailyAutomation();
    
    // Schedule job posting at 5 PM IST (11:30 AM UTC)
    this.scheduleJobPosting();
    
    // Schedule cleanup tasks
    this.scheduleCleanupTasks();
    
    this.isRunning = true;
    console.log('Scheduler started successfully');
  }

  /**
   * Stop the scheduler
   */
  stop() {
    if (!this.isRunning) {
      console.log('Scheduler is not running');
      return;
    }

    console.log('Stopping scheduler...');
    
    // Stop all jobs
    this.jobs.forEach((job, name) => {
      job.destroy();
      console.log(`Stopped job: ${name}`);
    });
    
    this.jobs.clear();
    this.isRunning = false;
    console.log('Scheduler stopped');
  }

  /**
   * Schedule daily automation at 10 AM IST
   */
  scheduleDailyAutomation() {
    const jobName = 'daily-automation';
    
    // Run at 10:00 AM IST every day
    const job = cron.schedule('0 10 * * *', async () => {
      console.log(`\n=== Daily Automation Started at ${new Date().toLocaleString()} (IST) ===`);
      
      try {
        await this.automationController.runDailyAutomation();
        console.log('=== Daily Automation Completed Successfully ===\n');
      } catch (error) {
        console.error('=== Daily Automation Failed ===', error);
        
        // Send error notification
        try {
          await this.automationController.sendErrorNotification(error);
        } catch (notificationError) {
          console.error('Failed to send error notification:', notificationError);
        }
      }
    }, {
      scheduled: false,
      timezone: 'Asia/Kolkata'
    });

    this.jobs.set(jobName, job);
    job.start();
    
    console.log(`Scheduled daily automation at 10:00 AM IST (Job: ${jobName})`);
  }

  /**
   * Schedule job posting at 5 PM IST
   */
  scheduleJobPosting() {
    const jobName = 'job-posting';
    
    // Run at 5:00 PM IST every day
    const job = cron.schedule('0 17 * * *', async () => {
      console.log(`\n=== Job Posting Started at ${new Date().toLocaleString()} (IST) ===`);
      
      try {
        await this.jobPostingService.postJobUpdate();
        console.log('=== Job Posting Completed Successfully ===\n');
      } catch (error) {
        console.error('=== Job Posting Failed ===', error);
        
        // Send error notification
        try {
          await this.jobPostingService.emailService.sendNotificationEmail(
            process.env.ADMIN_EMAIL,
            'Job Posting Failed',
            `Job posting failed with error: ${error.message}\n\nTime: ${new Date().toLocaleString()}`
          );
        } catch (notificationError) {
          console.error('Failed to send error notification:', notificationError);
        }
      }
    }, {
      scheduled: false,
      timezone: 'Asia/Kolkata'
    });

    this.jobs.set(jobName, job);
    job.start();
    
    console.log(`Scheduled job posting at 5:00 PM IST (Job: ${jobName})`);
  }

  /**
   * Schedule cleanup tasks
   */
  scheduleCleanupTasks() {
    // Clean up old images every day at 2 AM IST
    this.scheduleImageCleanup();
    
    // Clean up old posts every week on Sunday at 3 AM IST
    this.schedulePostCleanup();
    
    // Clean up posted jobs memory every day at 1 AM IST
    this.scheduleJobMemoryCleanup();
  }

  /**
   * Schedule image cleanup
   */
  scheduleImageCleanup() {
    const jobName = 'image-cleanup';
    
    const job = cron.schedule('0 2 * * *', async () => {
      console.log(`\n=== Image Cleanup Started at ${new Date().toLocaleString()} (IST) ===`);
      
      try {
        await this.automationController.cleanupOldImages();
        console.log('=== Image Cleanup Completed ===\n');
      } catch (error) {
        console.error('=== Image Cleanup Failed ===', error);
      }
    }, {
      scheduled: false,
      timezone: 'Asia/Kolkata'
    });

    this.jobs.set(jobName, job);
    job.start();
    
    console.log(`Scheduled image cleanup at 2:00 AM IST (Job: ${jobName})`);
  }

  /**
   * Schedule post cleanup
   */
  schedulePostCleanup() {
    const jobName = 'post-cleanup';
    
    const job = cron.schedule('0 3 * * 0', async () => {
      console.log(`\n=== Post Cleanup Started at ${new Date().toLocaleString()} (IST) ===`);
      
      try {
        await this.automationController.cleanupOldPosts();
        console.log('=== Post Cleanup Completed ===\n');
      } catch (error) {
        console.error('=== Post Cleanup Failed ===', error);
      }
    }, {
      scheduled: false,
      timezone: 'Asia/Kolkata'
    });

    this.jobs.set(jobName, job);
    job.start();
    
    console.log(`Scheduled post cleanup on Sundays at 3:00 AM IST (Job: ${jobName})`);
  }

  /**
   * Schedule job memory cleanup
   */
  scheduleJobMemoryCleanup() {
    const jobName = 'job-memory-cleanup';
    
    const job = cron.schedule('0 1 * * *', async () => {
      console.log(`\n=== Job Memory Cleanup Started at ${new Date().toLocaleString()} (IST) ===`);
      
      try {
        this.jobPostingService.cleanupPostedJobs();
        console.log('=== Job Memory Cleanup Completed ===\n');
      } catch (error) {
        console.error('=== Job Memory Cleanup Failed ===', error);
      }
    }, {
      scheduled: false,
      timezone: 'Asia/Kolkata'
    });

    this.jobs.set(jobName, job);
    job.start();
    
    console.log(`Scheduled job memory cleanup at 1:00 AM IST (Job: ${jobName})`);
  }

  /**
   * Run automation immediately (for testing)
   */
  async runNow() {
    console.log(`\n=== Manual Automation Run Started at ${new Date().toLocaleString()} ===`);
    
    try {
      await this.automationController.runDailyAutomation();
      console.log('=== Manual Automation Run Completed Successfully ===\n');
    } catch (error) {
      console.error('=== Manual Automation Run Failed ===', error);
      throw error;
    }
  }

  /**
   * Run job posting immediately (for testing)
   */
  async runJobPostingNow() {
    console.log(`\n=== Manual Job Posting Run Started at ${new Date().toLocaleString()} ===`);
    
    try {
      await this.jobPostingService.postJobUpdate();
      console.log('=== Manual Job Posting Run Completed Successfully ===\n');
    } catch (error) {
      console.error('=== Manual Job Posting Run Failed ===', error);
      throw error;
    }
  }

  /**
   * Get scheduler status
   */
  getStatus() {
    const status = {
      isRunning: this.isRunning,
      jobs: []
    };

    this.jobs.forEach((job, name) => {
      status.jobs.push({
        name: name,
        running: job.running,
        nextDate: job.nextDate ? job.nextDate() : null
      });
    });

    return status;
  }

  /**
   * Get next run times
   */
  getNextRuns() {
    const nextRuns = {};

    this.jobs.forEach((job, name) => {
      if (job.nextDate) {
        nextRuns[name] = job.nextDate().toISOString();
      }
    });

    return nextRuns;
  }

  /**
   * Schedule a custom job
   * @param {string} name - Job name
   * @param {string} cronExpression - Cron expression
   * @param {Function} task - Task function
   * @param {Object} options - Cron options
   */
  scheduleCustomJob(name, cronExpression, task, options = {}) {
    if (this.jobs.has(name)) {
      throw new Error(`Job with name '${name}' already exists`);
    }

    const job = cron.schedule(cronExpression, task, {
      scheduled: false,
      timezone: 'UTC',
      ...options
    });

    this.jobs.set(name, job);
    job.start();
    
    console.log(`Scheduled custom job '${name}' with expression '${cronExpression}'`);
  }

  /**
   * Remove a custom job
   * @param {string} name - Job name
   */
  removeCustomJob(name) {
    const job = this.jobs.get(name);
    if (job) {
      job.destroy();
      this.jobs.delete(name);
      console.log(`Removed custom job: ${name}`);
    } else {
      throw new Error(`Job with name '${name}' not found`);
    }
  }

  /**
   * Pause a job
   * @param {string} name - Job name
   */
  pauseJob(name) {
    const job = this.jobs.get(name);
    if (job) {
      job.stop();
      console.log(`Paused job: ${name}`);
    } else {
      throw new Error(`Job with name '${name}' not found`);
    }
  }

  /**
   * Resume a job
   * @param {string} name - Job name
   */
  resumeJob(name) {
    const job = this.jobs.get(name);
    if (job) {
      job.start();
      console.log(`Resumed job: ${name}`);
    } else {
      throw new Error(`Job with name '${name}' not found`);
    }
  }

  /**
   * Get job information
   * @param {string} name - Job name
   */
  getJobInfo(name) {
    const job = this.jobs.get(name);
    if (!job) {
      throw new Error(`Job with name '${name}' not found`);
    }

    return {
      name: name,
      running: job.running,
      nextDate: job.nextDate ? job.nextDate() : null
    };
  }
}

export default SchedulerService;
