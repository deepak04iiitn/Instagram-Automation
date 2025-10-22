import nodemailer from 'nodemailer';
import { v4 as uuidv4 } from 'uuid';

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
    
    this.adminEmail = process.env.ADMIN_EMAIL;
    this.appUrl = process.env.APP_URL || 'http://localhost:3000';
  }

  async sendApprovalEmail(post) {
    try {
      const emailId = uuidv4();
      const approvalUrl = `${this.appUrl}/api/approve/${post._id}/${emailId}`;
      
      const htmlContent = this.generateApprovalEmailHTML(post, approvalUrl);
      
      const mailOptions = {
        from: `"Instagram Automation" <${process.env.EMAIL_USER}>`,
        to: this.adminEmail,
        subject: `📱 Instagram Post Approval Required - ${post.topic}`,
        html: htmlContent,
        text: this.generateApprovalEmailText(post, approvalUrl)
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      return {
        success: true,
        messageId: result.messageId,
        emailId: emailId
      };
    } catch (error) {
      console.error('Error sending approval email:', error);
      throw new Error(`Failed to send approval email: ${error.message}`);
    }
  }

  generateApprovalEmailHTML(post, approvalUrl) {
    const acceptUrl = `${approvalUrl}/accept`;
    const declineUrl = `${approvalUrl}/decline`;
    const retryUrl = `${approvalUrl}/retry`;

    // Split content into question and solution
    const [questionPart, solutionPart] = post.content.split('|||SPLIT|||');
    const question = questionPart ? questionPart.trim() : '';
    const solution = solutionPart ? solutionPart.trim() : '';

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Instagram Post Approval</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f4f4f4;
            }
            .container {
                background-color: white;
                padding: 30px;
                border-radius: 10px;
                box-shadow: 0 0 10px rgba(0,0,0,0.1);
            }
            .header {
                text-align: center;
                border-bottom: 2px solid #e1306c;
                padding-bottom: 20px;
                margin-bottom: 30px;
            }
            .header h1 {
                color: #e1306c;
                margin: 0;
                font-size: 24px;
            }
            .post-content {
                background-color: #f8f9fa;
                padding: 20px;
                border-radius: 8px;
                border-left: 4px solid #e1306c;
                margin: 20px 0;
                white-space: pre-wrap;
                font-family: 'Courier New', monospace;
            }
            .content-section {
                margin: 20px 0;
            }
            .section-title {
                font-size: 18px;
                font-weight: bold;
                color: #e1306c;
                margin-bottom: 10px;
                padding: 8px 12px;
                background-color: #fff0f5;
                border-radius: 5px;
            }
            .question-section {
                background-color: #fff3cd;
                border-left: 4px solid #ffc107;
            }
            .solution-section {
                background-color: #d4edda;
                border-left: 4px solid #28a745;
            }
            .post-meta {
                background-color: #e8f4fd;
                padding: 15px;
                border-radius: 8px;
                margin: 20px 0;
            }
            .post-meta p {
                margin: 5px 0;
                font-size: 14px;
            }
            .buttons {
                text-align: center;
                margin: 30px 0;
            }
            .btn {
                display: inline-block;
                padding: 12px 24px;
                margin: 0 10px;
                text-decoration: none;
                border-radius: 25px;
                font-weight: bold;
                font-size: 16px;
                transition: all 0.3s ease;
            }
            .btn-accept {
                background-color: #28a745;
                color: white;
            }
            .btn-accept:hover {
                background-color: #218838;
                transform: translateY(-2px);
            }
            .btn-decline {
                background-color: #dc3545;
                color: white;
            }
            .btn-decline:hover {
                background-color: #c82333;
                transform: translateY(-2px);
            }
            .btn-retry {
                background-color: #ffc107;
                color: #212529;
            }
            .btn-retry:hover {
                background-color: #e0a800;
                transform: translateY(-2px);
            }
            .footer {
                text-align: center;
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #eee;
                color: #666;
                font-size: 12px;
            }
            .warning {
                background-color: #fff3cd;
                border: 1px solid #ffeaa7;
                color: #856404;
                padding: 15px;
                border-radius: 8px;
                margin: 20px 0;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>📱 Instagram Post Approval Required</h1>
            </div>
            
            <div class="post-meta">
                <p><strong>📅 Topic:</strong> ${post.topic}</p>
                <p><strong>🕐 Generated:</strong> ${new Date(post.generatedAt).toLocaleString()}</p>
                <p><strong>📊 Status:</strong> ${post.status}</p>
                <p><strong>🔄 Retry Count:</strong> ${post.retryCount}/${post.maxRetries}</p>
            </div>

            <div class="content-section">
                <div class="section-title question-section">❓ Question</div>
                <div class="post-content">${question || 'No question provided'}</div>
            </div>

            <div class="content-section">
                <div class="section-title solution-section">✓ Solution</div>
                <div class="post-content">${solution || 'No solution provided'}</div>
            </div>

            <div class="warning">
                <strong>⚠️ Note:</strong> This content will be automatically posted to Instagram if approved. 
                Please review carefully before making your decision.
            </div>

            <div class="buttons">
                <a href="${acceptUrl}" class="btn btn-accept">✅ Accept & Post</a>
                <a href="${declineUrl}" class="btn btn-decline">❌ Decline</a>
                <a href="${retryUrl}" class="btn btn-retry">🔄 Retry</a>
            </div>

            <div class="footer">
                <p>This is an automated email from Instagram Automation System</p>
                <p>Post ID: ${post._id}</p>
                <p>Generated at: ${new Date().toLocaleString()}</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  generateApprovalEmailText(post, approvalUrl) {
    const acceptUrl = `${approvalUrl}/accept`;
    const declineUrl = `${approvalUrl}/decline`;
    const retryUrl = `${approvalUrl}/retry`;

    // Split content into question and solution
    const [questionPart, solutionPart] = post.content.split('|||SPLIT|||');
    const question = questionPart ? questionPart.trim() : 'No question provided';
    const solution = solutionPart ? solutionPart.trim() : 'No solution provided';

    return `
Instagram Post Approval Required

Topic: ${post.topic}
Generated: ${new Date(post.generatedAt).toLocaleString()}
Status: ${post.status}
Retry Count: ${post.retryCount}/${post.maxRetries}

QUESTION:
${question}

SOLUTION:
${solution}

Action Required:
- Accept & Post: ${acceptUrl}
- Decline: ${declineUrl}
- Retry: ${retryUrl}

This is an automated email from Instagram Automation System
Post ID: ${post._id}
    `;
  }

  async sendNotificationEmail(to, subject, content) {
    try {
      const mailOptions = {
        from: `"Instagram Automation" <${process.env.EMAIL_USER}>`,
        to: to,
        subject: subject,
        html: content,
        text: content.replace(/<[^>]*>/g, '')
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      return {
        success: true,
        messageId: result.messageId
      };
    } catch (error) {
      console.error('Error sending notification email:', error);
      throw new Error(`Failed to send notification email: ${error.message}`);
    }
  }

  async sendPostSuccessNotification(post) {
    const subject = `✅ Instagram Post Published Successfully - ${post.topic}`;
    
    // Split content for display
    const [questionPart, solutionPart] = post.content.split('|||SPLIT|||');
    const question = questionPart ? questionPart.trim() : '';
    const solution = solutionPart ? solutionPart.trim() : '';
    
    const content = `
      <h2>🎉 Post Published Successfully!</h2>
      <p><strong>Topic:</strong> ${post.topic}</p>
      <p><strong>Posted at:</strong> ${new Date(post.postedAt).toLocaleString()}</p>
      <p><strong>Instagram Post ID:</strong> ${post.instagramPostId}</p>
      
      <h3>Question:</h3>
      <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; white-space: pre-wrap; margin-bottom: 15px;">${question}</div>
      
      <h3>Solution:</h3>
      <div style="background-color: #d4edda; padding: 15px; border-radius: 5px; white-space: pre-wrap;">${solution}</div>
    `;

    return await this.sendNotificationEmail(this.adminEmail, subject, content);
  }

  async sendPostFailureNotification(post, errorMessage) {
    const subject = `❌ Instagram Post Failed - ${post.topic}`;
    
    // Split content for display
    const [questionPart, solutionPart] = post.content.split('|||SPLIT|||');
    const question = questionPart ? questionPart.trim() : '';
    const solution = solutionPart ? solutionPart.trim() : '';
    
    const content = `
      <h2>⚠️ Post Publishing Failed</h2>
      <p><strong>Topic:</strong> ${post.topic}</p>
      <p><strong>Failed at:</strong> ${new Date().toLocaleString()}</p>
      <p><strong>Error:</strong> ${errorMessage}</p>
      
      <h3>Question:</h3>
      <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; white-space: pre-wrap; margin-bottom: 15px;">${question}</div>
      
      <h3>Solution:</h3>
      <div style="background-color: #d4edda; padding: 15px; border-radius: 5px; white-space: pre-wrap;">${solution}</div>
    `;

    return await this.sendNotificationEmail(this.adminEmail, subject, content);
  }
}

export default EmailService;