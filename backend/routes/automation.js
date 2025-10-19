import express from 'express';
const router = express.Router();
import AutomationController from '../controllers/automationController.js';

const automationController = new AutomationController();

// Manual trigger for automation (for testing)
router.post('/run', async (req, res) => {
  try {
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

// Handle post approval - restructured routes
router.get('/approve/:postId/:emailId', async (req, res) => {
  try {
    const { postId, emailId } = req.params;
    const { action } = req.query;

    if (action === 'accept') {
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
    } else if (action === 'decline') {
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
    } else if (action === 'retry') {
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
    } else {
      res.status(400).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Invalid Action</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            .error { color: #dc3545; font-size: 24px; }
          </style>
        </head>
        <body>
          <div class="error">❌ Invalid Action</div>
          <p>Please use: ?action=accept, ?action=decline, or ?action=retry</p>
        </body>
        </html>
      `);
    }
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

// Get automation status
router.get('/status', async (req, res) => {
  try {
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

// Cleanup endpoints
router.post('/cleanup/images', async (req, res) => {
  try {
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

export default router;