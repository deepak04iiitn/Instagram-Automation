import express from 'express';
const router = express.Router();
import AutomationController from '../controllers/automationController.js';

// Create a new controller instance for each request to avoid connection reuse issues
const getAutomationController = () => new AutomationController();

// Manual trigger for automation (for testing)
router.post('/run', async (req, res) => {
  try {
    const automationController = getAutomationController();
    const result = await automationController.runDailyAutomation();
    res.json({
      success: true,
      message: 'Automation run completed successfully',
      data: result
    });
  } catch (error) {
    console.error('Error running automation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to run automation',
      error: error.message
    });
  }
});

// Handle post approval - accept action
router.get('/approve/:postId/:emailId/accept', async (req, res) => {
  try {
    const { postId, emailId } = req.params;
    const automationController = getAutomationController();
    const result = await automationController.handlePostApproval(postId, emailId);
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Post Approved</title>
        <style>
          body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
          .success { color: #28a745; font-size: 24px; }
          .message { margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="success">✅ Post Approved Successfully!</div>
        <div class="message">Your post has been published to Instagram.</div>
        <p>Post ID: ${postId}</p>
      </body>
      </html>
    `);
  } catch (error) {
    console.error('Error processing approval action:', error);
    res.status(500).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Action Failed</title>
        <style>
          body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
          .error { color: #dc3545; font-size: 24px; }
          .message { margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="error">❌ Action Failed</div>
        <div class="message">${error.message}</div>
      </body>
      </html>
    `);
  }
});

// Handle post approval - decline action
router.get('/approve/:postId/:emailId/decline', async (req, res) => {
  try {
    const { postId, emailId } = req.params;
    const automationController = getAutomationController();
    await automationController.handlePostDecline(postId, emailId);
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Post Declined</title>
        <style>
          body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
          .info { color: #17a2b8; font-size: 24px; }
          .message { margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="info">ℹ️ Post Declined</div>
        <div class="message">This post has been declined and will not be published.</div>
        <p>Post ID: ${postId}</p>
      </body>
      </html>
    `);
  } catch (error) {
    console.error('Error processing decline action:', error);
    res.status(500).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Action Failed</title>
        <style>
          body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
          .error { color: #dc3545; font-size: 24px; }
          .message { margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="error">❌ Action Failed</div>
        <div class="message">${error.message}</div>
      </body>
      </html>
    `);
  }
});

// Handle post approval - retry action
router.get('/approve/:postId/:emailId/retry', async (req, res) => {
  try {
    const { postId, emailId } = req.params;
    const automationController = getAutomationController();
    const result = await automationController.handlePostRetry(postId, emailId);
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Post Retry</title>
        <style>
          body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
          .warning { color: #ffc107; font-size: 24px; }
          .message { margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="warning">🔄 Post Retry Initiated</div>
        <div class="message">New content is being generated and a new approval email will be sent.</div>
        <p>Post ID: ${postId}</p>
        <p>Retry Count: ${result.retryCount}</p>
      </body>
      </html>
    `);
  } catch (error) {
    console.error('Error processing retry action:', error);
    res.status(500).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Action Failed</title>
        <style>
          body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
          .error { color: #dc3545; font-size: 24px; }
          .message { margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="error">❌ Action Failed</div>
        <div class="message">${error.message}</div>
      </body>
      </html>
    `);
  }
});

// Get automation status
router.get('/status', async (req, res) => {
  try {
    const automationController = getAutomationController();
    const status = await automationController.getAutomationStatus();
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('Error getting automation status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get automation status',
      error: error.message
    });
  }
});

// Get posts with pagination
router.get('/posts', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const automationController = getAutomationController();
    const result = await automationController.getPosts(page, limit);
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error getting posts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get posts',
      error: error.message
    });
  }
});

// Get specific post
router.get('/posts/:postId', async (req, res) => {
  try {
    const { postId } = req.params;
    const automationController = getAutomationController();
    const post = await automationController.getPostById(postId);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    res.json({
      success: true,
      data: post
    });
  } catch (error) {
    console.error('Error getting post:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get post',
      error: error.message
    });
  }
});

// Get posts needing manual approval (when emails fail)
router.get('/posts/manual-approval', async (req, res) => {
  try {
    const automationController = getAutomationController();
    const posts = await automationController.getPostsNeedingManualApproval();
    res.json({
      success: true,
      data: posts,
      message: posts.length > 0 ? `${posts.length} posts need manual approval` : 'No posts need manual approval'
    });
  } catch (error) {
    console.error('Error getting posts needing manual approval:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get posts needing manual approval',
      error: error.message
    });
  }
});

// Manual approval endpoint (when emails fail)
router.get('/approve/:postId/manual', async (req, res) => {
  try {
    const { postId } = req.params;
    const automationController = getAutomationController();
    const result = await automationController.handlePostApproval(postId, 'manual');
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Manual Post Approval</title>
        <style>
          body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
          .success { color: #28a745; font-size: 24px; }
          .message { margin: 20px 0; }
          .info { background-color: #e8f4fd; padding: 20px; border-radius: 10px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="success">✅ Post Approved Manually!</div>
        <div class="message">Your post has been published to Instagram.</div>
        <div class="info">
          <p><strong>Note:</strong> This post was approved manually due to email service issues.</p>
          <p>Post ID: ${postId}</p>
        </div>
      </body>
      </html>
    `);
  } catch (error) {
    console.error('Error processing manual approval:', error);
    res.status(500).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Manual Approval Failed</title>
        <style>
          body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
          .error { color: #dc3545; font-size: 24px; }
          .message { margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="error">❌ Manual Approval Failed</div>
        <div class="message">${error.message}</div>
      </body>
      </html>
    `);
  }
});

// Cleanup endpoints
router.post('/cleanup/images', async (req, res) => {
  try {
    const automationController = getAutomationController();
    await automationController.cleanupOldImages();
    res.json({
      success: true,
      message: 'Image cleanup completed successfully'
    });
  } catch (error) {
    console.error('Error during image cleanup:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cleanup images',
      error: error.message
    });
  }
});

router.post('/cleanup/posts', async (req, res) => {
  try {
    const automationController = getAutomationController();
    await automationController.cleanupOldPosts();
    res.json({
      success: true,
      message: 'Post cleanup completed successfully'
    });
  } catch (error) {
    console.error('Error during post cleanup:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cleanup posts',
      error: error.message
    });
  }
});

// Job posting endpoints
router.post('/jobs/post', async (req, res) => {
  try {
    const automationController = getAutomationController();
    const result = await automationController.postJobUpdate();
    res.json({
      success: true,
      message: 'Job update posted successfully',
      data: result
    });
  } catch (error) {
    console.error('Error posting job update:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to post job update',
      error: error.message
    });
  }
});

router.get('/jobs/status', async (req, res) => {
  try {
    const automationController = getAutomationController();
    const status = automationController.getJobPostingStatus();
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('Error getting job posting status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get job posting status',
      error: error.message
    });
  }
});

router.get('/jobs/test', async (req, res) => {
  try {
    const automationController = getAutomationController();
    const result = await automationController.testJobFetching();
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error testing job fetching:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to test job fetching',
      error: error.message
    });
  }
});

export default router;