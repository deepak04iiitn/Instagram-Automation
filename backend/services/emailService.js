import nodemailer from 'nodemailer';
import { v4 as uuidv4 } from 'uuid';

class EmailService {
  constructor() {
    console.log('📧 Initializing EmailService...');
    
    // Try alternative configuration for better reliability
    const isGmail = process.env.EMAIL_HOST === 'smtp.gmail.com';
    
    console.log(`📧 Email configuration:`);
    console.log(`📧 Host: ${process.env.EMAIL_HOST}:${process.env.EMAIL_PORT}`);
    console.log(`📧 User: ${process.env.EMAIL_USER}`);
    console.log(`📧 Admin Email: ${process.env.ADMIN_EMAIL}`);
    console.log(`📧 Provider: ${isGmail ? 'Gmail' : 'Generic SMTP'}`);
    console.log(`📧 Secure: ${isGmail ? false : (process.env.EMAIL_PORT == 465)}`);
    
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: isGmail ? false : (process.env.EMAIL_PORT == 465), // Use STARTTLS for Gmail
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      },
      // Very aggressive timeout settings for faster failure detection
      connectionTimeout: 10000, // 10 seconds
      greetingTimeout: 5000,    // 5 seconds
      socketTimeout: 10000,     // 10 seconds
      pool: false,              // Disable connection pooling
      maxConnections: 1,        // Single connection
      maxMessages: 1,           // One message per connection
      // TLS options optimized for Gmail
      tls: {
        rejectUnauthorized: false,
        ciphers: isGmail ? 'TLSv1.2' : 'SSLv3'
      },
      // Additional Gmail-specific options
      ...(isGmail && {
        service: 'gmail',
        ignoreTLS: false,
        requireTLS: true
      })
    });
    
    this.adminEmail = process.env.ADMIN_EMAIL;
    this.appUrl = process.env.APP_URL || 'http://localhost:3000';
    this.maxRetries = 2; // Reduced from 3 to 2
    this.retryDelay = 3000; // 3 seconds (reduced from 5)
    
    console.log('✅ EmailService initialized successfully');
    console.log(`📧 Retry settings: maxRetries=${this.maxRetries}, retryDelay=${this.retryDelay}ms`);
    console.log(`📧 Timeout settings: connection=${10000}ms, greeting=${5000}ms, socket=${10000}ms`);
  }

  async sendApprovalEmail(post) {
    console.log('📧 Starting approval email process...');
    console.log(`📧 Post ID: ${post._id}`);
    console.log(`📧 Admin Email: ${this.adminEmail}`);
    console.log(`📧 SMTP Host: ${process.env.EMAIL_HOST}:${process.env.EMAIL_PORT}`);
    
    return await this.sendEmailWithRetry(async () => {
      const emailId = uuidv4();
      const approvalUrl = `${this.appUrl}/api/approve/${post._id}/${emailId}`;
      
      console.log(`📧 Generated email ID: ${emailId}`);
      console.log(`📧 Approval URL: ${approvalUrl}`);
      
      const htmlContent = this.generateApprovalEmailHTML(post, approvalUrl);
      
      const mailOptions = {
        from: `"Instagram Automation" <${process.env.EMAIL_USER}>`,
        to: this.adminEmail,
        subject: `📱 Instagram Post Approval Required - ${post.topic}`,
        html: htmlContent,
        text: this.generateApprovalEmailText(post, approvalUrl)
      };

      console.log('📧 Mail options prepared:');
      console.log(`📧 From: ${mailOptions.from}`);
      console.log(`📧 To: ${mailOptions.to}`);
      console.log(`📧 Subject: ${mailOptions.subject}`);
      console.log(`📧 Content length: ${htmlContent.length} characters`);

      // Add timeout wrapper for the sendMail operation
      const sendMailWithTimeout = (options, timeout = 10000) => {
        console.log(`📧 Attempting to send email with ${timeout}ms timeout...`);
        return Promise.race([
          this.transporter.sendMail(options),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Send mail timeout')), timeout)
          )
        ]);
      };

      const result = await sendMailWithTimeout(mailOptions);
      
      console.log('✅ Email sent successfully!');
      console.log(`📧 Message ID: ${result.messageId}`);
      
      return {
        success: true,
        messageId: result.messageId,
        emailId: emailId
      };
    }, 'approval email');
  }

  /**
   * Send email with retry logic (no connection verification)
   * @param {Function} emailFunction - The email sending function
   * @param {string} emailType - Type of email for logging
   * @returns {Promise<any>} Email result
   */
  async sendEmailWithRetry(emailFunction, emailType = 'email') {
    let lastError;
    
    console.log(`📧 Starting ${emailType} with ${this.maxRetries} max retries...`);
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      console.log(`📧 ${emailType} attempt ${attempt}/${this.maxRetries} starting...`);
      
      try {
        // Execute the email function directly without verification
        const result = await emailFunction();
        
        if (attempt > 1) {
          console.log(`✅ ${emailType} sent successfully on attempt ${attempt}`);
        } else {
          console.log(`✅ ${emailType} sent successfully on first attempt`);
        }
        
        return result;
      } catch (error) {
        lastError = error;
        console.warn(`⚠️ ${emailType} attempt ${attempt} failed:`, error.message);
        console.warn(`⚠️ Error code: ${error.code || 'N/A'}`);
        console.warn(`⚠️ Error type: ${error.constructor.name}`);
        
        // Check if it's a connection timeout error
        if (this.isConnectionError(error)) {
          console.log(`🔄 Connection error detected, will retry ${emailType}...`);
          console.log(`🔄 Connection error details: ${JSON.stringify({
            code: error.code,
            message: error.message,
            errno: error.errno,
            syscall: error.syscall
          })}`);
          
          if (attempt < this.maxRetries) {
            // Recreate transporter immediately on first retry for connection issues
            console.log('🔄 Recreating email transporter...');
            this.recreateTransporter();
            
            // Wait before retrying with exponential backoff
            const delay = this.retryDelay * Math.pow(2, attempt - 1);
            console.log(`⏳ Retrying ${emailType} in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
          } else {
            console.log(`❌ Max retries (${this.maxRetries}) reached for ${emailType}`);
          }
        } else {
          // Non-connection errors shouldn't be retried
          console.error(`❌ Non-retryable error for ${emailType}:`, error.message);
          console.error(`❌ Error details: ${JSON.stringify({
            code: error.code,
            message: error.message,
            errno: error.errno,
            syscall: error.syscall
          })}`);
          break;
        }
      }
    }
    
    console.error(`❌ Failed to send ${emailType} after ${this.maxRetries} attempts`);
    console.error(`❌ Final error: ${lastError.message}`);
    throw new Error(`Failed to send ${emailType} after ${this.maxRetries} attempts: ${lastError.message}`);
  }

  /**
   * Check if error is a connection-related error
   * @param {Error} error - The error to check
   * @returns {boolean} True if it's a connection error
   */
  isConnectionError(error) {
    const connectionErrors = [
      'ETIMEDOUT',
      'ECONNRESET',
      'ECONNREFUSED',
      'ENOTFOUND',
      'Connection timeout',
      'Connection closed',
      'Socket timeout',
      'SMTP connection failed'
    ];
    
    return connectionErrors.some(errorType => 
      error.code === errorType || 
      error.message.includes(errorType) ||
      error.message.toLowerCase().includes('connection') ||
      error.message.toLowerCase().includes('timeout')
    );
  }

  /**
   * Recreate the email transporter with alternative configuration
   */
  recreateTransporter() {
    console.log('🔄 Starting transporter recreation...');
    
    try {
      if (this.transporter && this.transporter.close) {
        console.log('🔄 Closing existing transporter...');
        this.transporter.close();
        console.log('✅ Existing transporter closed');
      }
    } catch (error) {
      console.warn('⚠️ Warning: Error closing transporter:', error.message);
    }
    
    // Try alternative configuration for better reliability
    const isGmail = process.env.EMAIL_HOST === 'smtp.gmail.com';
    
    console.log(`🔄 Creating new transporter for ${isGmail ? 'Gmail' : 'Generic SMTP'}...`);
    console.log(`🔄 Host: ${process.env.EMAIL_HOST}:${process.env.EMAIL_PORT}`);
    console.log(`🔄 User: ${process.env.EMAIL_USER}`);
    console.log(`🔄 Secure: ${isGmail ? false : (process.env.EMAIL_PORT == 465)}`);
    
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: isGmail ? false : (process.env.EMAIL_PORT == 465), // Use STARTTLS for Gmail
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      },
      // Very aggressive timeout settings for faster failure detection
      connectionTimeout: 10000, // 10 seconds
      greetingTimeout: 5000,    // 5 seconds
      socketTimeout: 10000,     // 10 seconds
      pool: false,              // Disable connection pooling
      maxConnections: 1,        // Single connection
      maxMessages: 1,           // One message per connection
      // TLS options optimized for Gmail
      tls: {
        rejectUnauthorized: false,
        ciphers: isGmail ? 'TLSv1.2' : 'SSLv3'
      },
      // Additional Gmail-specific options
      ...(isGmail && {
        service: 'gmail',
        ignoreTLS: false,
        requireTLS: true
      })
    });
    
    console.log('✅ Email transporter recreated with optimized settings');
    console.log(`✅ Timeout settings: connection=${10000}ms, greeting=${5000}ms, socket=${10000}ms`);
    console.log(`✅ TLS settings: ciphers=${isGmail ? 'TLSv1.2' : 'SSLv3'}, rejectUnauthorized=false`);
    if (isGmail) {
      console.log('✅ Gmail-specific settings: service=gmail, requireTLS=true');
    }
  }

  /**
   * Clean up email service resources
   */
  cleanup() {
    console.log('🧹 Starting email service cleanup...');
    try {
      if (this.transporter && this.transporter.close) {
        console.log('🧹 Closing email transporter...');
        this.transporter.close();
        console.log('✅ Email service cleaned up successfully');
      } else {
        console.log('🧹 No transporter to close');
      }
    } catch (error) {
      console.warn('⚠️ Warning: Error during email service cleanup:', error.message);
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
    return await this.sendEmailWithRetry(async () => {
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
    }, 'notification email');
  }

  async sendJobPostSuccessNotification(post, instagramPostId, selectedJobs, cloudinaryUrl, isManual = false) {
    return await this.sendEmailWithRetry(async () => {
      const subject = isManual 
        ? `🎉 Manual Job Post Published Successfully!`
        : `🎉 Job Post Published Successfully!`;
      
      const htmlContent = this.generateJobPostSuccessHTML(post, instagramPostId, selectedJobs, cloudinaryUrl, isManual);
      const textContent = this.generateJobPostSuccessText(post, instagramPostId, selectedJobs, cloudinaryUrl, isManual);

      const mailOptions = {
        from: `"Instagram Automation" <${process.env.EMAIL_USER}>`,
        to: this.adminEmail,
        subject: subject,
        html: htmlContent,
        text: textContent
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      return {
        success: true,
        messageId: result.messageId
      };
    }, 'job post success notification');
  }

  generateJobPostSuccessHTML(post, instagramPostId, selectedJobs, cloudinaryUrl, isManual = false) {
    const postType = isManual ? 'Manual Job Post' : 'Job Post';
    const postedAt = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
    
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${postType} Published Successfully</title>
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 700px;
                margin: 0 auto;
                padding: 20px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                min-height: 100vh;
            }
            .container {
                background-color: white;
                padding: 40px;
                border-radius: 20px;
                box-shadow: 0 20px 40px rgba(0,0,0,0.1);
                position: relative;
                overflow: hidden;
            }
            .container::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                height: 5px;
                background: linear-gradient(90deg, #e1306c, #405de6, #5851db, #833ab4, #c13584, #fd1d1d, #f56040, #f77737, #fcaf45, #ffdc80);
            }
            .header {
                text-align: center;
                margin-bottom: 40px;
                padding-bottom: 30px;
                border-bottom: 2px solid #f0f0f0;
            }
            .header h1 {
                color: #e1306c;
                margin: 0;
                font-size: 32px;
                font-weight: 700;
                text-shadow: 2px 2px 4px rgba(0,0,0,0.1);
            }
            .header .subtitle {
                color: #666;
                font-size: 16px;
                margin-top: 10px;
                font-weight: 300;
            }
            .success-badge {
                display: inline-block;
                background: linear-gradient(45deg, #28a745, #20c997);
                color: white;
                padding: 12px 24px;
                border-radius: 50px;
                font-weight: bold;
                font-size: 18px;
                margin: 20px 0;
                box-shadow: 0 4px 15px rgba(40, 167, 69, 0.3);
            }
            .post-details {
                background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
                padding: 30px;
                border-radius: 15px;
                margin: 30px 0;
                border-left: 5px solid #e1306c;
            }
            .detail-row {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 12px 0;
                border-bottom: 1px solid #dee2e6;
            }
            .detail-row:last-child {
                border-bottom: none;
            }
            .detail-label {
                font-weight: 600;
                color: #495057;
                font-size: 14px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            .detail-value {
                font-weight: 500;
                color: #212529;
                font-size: 16px;
            }
            .jobs-section {
                margin: 30px 0;
            }
            .jobs-title {
                font-size: 24px;
                font-weight: 700;
                color: #e1306c;
                margin-bottom: 20px;
                text-align: center;
                position: relative;
            }
            .jobs-title::after {
                content: '';
                position: absolute;
                bottom: -10px;
                left: 50%;
                transform: translateX(-50%);
                width: 60px;
                height: 3px;
                background: linear-gradient(90deg, #e1306c, #405de6);
                border-radius: 2px;
            }
            .job-card {
                background: white;
                border: 2px solid #f0f0f0;
                border-radius: 15px;
                padding: 25px;
                margin: 20px 0;
                box-shadow: 0 5px 15px rgba(0,0,0,0.08);
                transition: all 0.3s ease;
                position: relative;
                overflow: hidden;
            }
            .job-card::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                width: 4px;
                height: 100%;
                background: linear-gradient(180deg, #e1306c, #405de6);
            }
            .job-card:hover {
                transform: translateY(-5px);
                box-shadow: 0 10px 25px rgba(0,0,0,0.15);
            }
            .job-company {
                font-size: 20px;
                font-weight: 700;
                color: #e1306c;
                margin-bottom: 8px;
            }
            .job-title {
                font-size: 18px;
                font-weight: 600;
                color: #495057;
                margin-bottom: 12px;
            }
            .job-details {
                display: flex;
                flex-wrap: wrap;
                gap: 15px;
                margin-top: 15px;
            }
            .job-detail {
                display: flex;
                align-items: center;
                background: #f8f9fa;
                padding: 8px 12px;
                border-radius: 20px;
                font-size: 14px;
                color: #6c757d;
            }
            .job-detail-icon {
                margin-right: 6px;
                font-size: 16px;
            }
            .image-section {
                text-align: center;
                margin: 40px 0;
                padding: 30px;
                background: linear-gradient(135deg, #fff 0%, #f8f9fa 100%);
                border-radius: 20px;
                border: 2px dashed #dee2e6;
            }
            .image-preview {
                max-width: 100%;
                height: auto;
                border-radius: 15px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.1);
                margin: 20px 0;
            }
            .image-link {
                display: inline-block;
                background: linear-gradient(45deg, #e1306c, #405de6);
                color: white;
                padding: 12px 24px;
                text-decoration: none;
                border-radius: 25px;
                font-weight: 600;
                margin-top: 15px;
                transition: all 0.3s ease;
            }
            .image-link:hover {
                transform: translateY(-2px);
                box-shadow: 0 5px 15px rgba(225, 48, 108, 0.3);
            }
            .footer {
                text-align: center;
                margin-top: 40px;
                padding-top: 30px;
                border-top: 2px solid #f0f0f0;
                color: #6c757d;
                font-size: 14px;
            }
            .footer-logo {
                font-size: 24px;
                font-weight: 700;
                color: #e1306c;
                margin-bottom: 10px;
            }
            .stats-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                gap: 20px;
                margin: 30px 0;
            }
            .stat-card {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 20px;
                border-radius: 15px;
                text-align: center;
                box-shadow: 0 5px 15px rgba(102, 126, 234, 0.3);
            }
            .stat-number {
                font-size: 28px;
                font-weight: 700;
                margin-bottom: 5px;
            }
            .stat-label {
                font-size: 12px;
                opacity: 0.9;
                text-transform: uppercase;
                letter-spacing: 1px;
            }
            @media (max-width: 600px) {
                .container {
                    padding: 20px;
                    margin: 10px;
                }
                .header h1 {
                    font-size: 24px;
                }
                .job-details {
                    flex-direction: column;
                }
                .stats-grid {
                    grid-template-columns: 1fr;
                }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🎉 ${postType} Published Successfully!</h1>
                <div class="subtitle">Your QA job opportunities are now live on Instagram</div>
                <div class="success-badge">✅ Successfully Posted</div>
            </div>

            <div class="post-details">
                <div class="detail-row">
                    <span class="detail-label">📱 Instagram Post ID</span>
                    <span class="detail-value">${instagramPostId}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">📝 Database Record ID</span>
                    <span class="detail-value">${post._id}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">⏰ Posted At</span>
                    <span class="detail-value">${postedAt} IST</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">📊 Post Type</span>
                    <span class="detail-value">${postType}</span>
                </div>
            </div>

            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-number">${selectedJobs.length}</div>
                    <div class="stat-label">Jobs Posted</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${selectedJobs.reduce((acc, job) => acc + (job.min_exp || 0), 0)}</div>
                    <div class="stat-label">Total Experience</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${new Set(selectedJobs.map(job => job.company)).size}</div>
                    <div class="stat-label">Companies</div>
                </div>
            </div>

            <div class="jobs-section">
                <h2 class="jobs-title">📋 Posted Jobs</h2>
                ${selectedJobs.map((job, index) => `
                    <div class="job-card">
                        <div class="job-company">${job.company}</div>
                        <div class="job-title">${job.job_title || job.title}</div>
                        <div class="job-details">
                            <div class="job-detail">
                                <span class="job-detail-icon">📍</span>
                                ${Array.isArray(job.location) ? job.location.join(', ') : job.location}
                            </div>
                            <div class="job-detail">
                                <span class="job-detail-icon">📅</span>
                                ${job.min_exp || 0}+ years experience
                            </div>
                            ${job.apply_link ? `
                                <div class="job-detail">
                                    <span class="job-detail-icon">🔗</span>
                                    <a href="${job.apply_link}" style="color: #e1306c; text-decoration: none;">Apply Now</a>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                `).join('')}
            </div>

            <div class="image-section">
                <h3 style="color: #e1306c; margin-bottom: 20px;">🖼️ Generated Image</h3>
                <img src="${cloudinaryUrl}" alt="Job Posting Image" class="image-preview" style="max-width: 400px;">
                <br>
                <a href="${cloudinaryUrl}" class="image-link" target="_blank">View Full Image</a>
            </div>

            <div class="footer">
                <div class="footer-logo">Instagram Automation</div>
                <p>This is an automated notification from your Instagram Automation System</p>
                <p>Generated at: ${postedAt} IST</p>
                <p style="margin-top: 20px; font-size: 12px; color: #adb5bd;">
                    🚀 Powered by Instagram Automation | Made with ❤️ for QA Professionals
                </p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  generateJobPostSuccessText(post, instagramPostId, selectedJobs, cloudinaryUrl, isManual = false) {
    const postType = isManual ? 'Manual Job Post' : 'Job Post';
    const postedAt = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
    
    return `
${postType} Published Successfully!

📱 Instagram Post ID: ${instagramPostId}
📝 Database Record ID: ${post._id}
⏰ Posted at: ${postedAt} IST

📋 Jobs Posted:
${selectedJobs.map((job, index) => `${index + 1}. ${job.company} - ${job.job_title || job.title}`).join('\n')}

🖼️ Image: ${cloudinaryUrl}

This is an automated notification from Instagram Automation System
Generated at: ${postedAt} IST
    `;
  }

  async sendPostSuccessNotification(post) {
    return await this.sendEmailWithRetry(async () => {
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
    }, 'post success notification');
  }

  async sendPostFailureNotification(post, errorMessage) {
    return await this.sendEmailWithRetry(async () => {
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
    }, 'post failure notification');
  }
}

export default EmailService;