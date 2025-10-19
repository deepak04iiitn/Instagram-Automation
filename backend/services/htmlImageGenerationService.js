import { toPng } from 'html-to-image';
import puppeteer from 'puppeteer';
import fs from 'fs';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

class HtmlImageGenerationService {
  constructor() {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    this.outputDir = path.join(__dirname, '../uploads/images');
    this.logoPath = process.env.BRAND_LOGO_PATH || path.join(__dirname, '../../logo/Route2Hire.png');
    this.brandName = process.env.BRAND_NAME || 'Tech Insights';
    this.ensureOutputDirectory();
  }

  /**
   * Ensure the output directory exists
   */
  ensureOutputDirectory() {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  /**
   * Generate images from text content using HTML template
   * @param {string} content - Text content to convert to images
   * @param {string} topic - Topic for styling
   * @returns {Promise<Array>} Array of generated image paths
   */
  async generateImages(content, topic) {
    try {
      // Split content into chunks that fit well on images
      const chunks = this.splitContentIntoChunks(content);
      const imagePaths = [];

      for (let i = 0; i < chunks.length; i++) {
        const imagePath = await this.createImageFromHtml(
          chunks[i], 
          topic, 
          i + 1, 
          chunks.length
        );
        imagePaths.push(imagePath);
      }

      return imagePaths;
    } catch (error) {
      console.error('Error generating images:', error);
      throw new Error(`Failed to generate images: ${error.message}`);
    }
  }

  /**
   * Split content into chunks that fit on images
   * @param {string} content - Full content
   * @returns {Array} Array of content chunks
   */
  splitContentIntoChunks(content) {
    // More conservative character limit to ensure content fits properly
    const maxCharsPerImage = 700;
    const lines = content.split('\n');
    const chunks = [];
    let currentChunk = '';
    let currentLineCount = 0;
    const maxLinesPerImage = 25; // Approximate max lines that fit

    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Skip empty lines but count them
      if (trimmedLine === '') {
        if (currentChunk) {
          currentChunk += '\n';
          currentLineCount++;
        }
        continue;
      }

      // Check if adding this line would exceed limits
      const testChunk = currentChunk + (currentChunk ? '\n' : '') + line;
      const wouldExceedChars = testChunk.length > maxCharsPerImage;
      const wouldExceedLines = currentLineCount >= maxLinesPerImage;
      
      if ((wouldExceedChars || wouldExceedLines) && currentChunk.length > 0) {
        chunks.push(currentChunk.trim());
        currentChunk = line;
        currentLineCount = 1;
      } else {
        currentChunk = testChunk;
        currentLineCount++;
      }
    }

    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }

    // If content is too short, return as single chunk
    if (chunks.length === 0) {
      chunks.push(content);
    }

    return chunks;
  }

  /**
   * Create an image from HTML template
   * @param {string} text - Text content
   * @param {string} topic - Topic for styling
   * @param {number} pageNumber - Current page number
   * @param {number} totalPages - Total number of pages
   * @returns {Promise<string>} Path to generated image
   */
  async createImageFromHtml(text, topic, pageNumber, totalPages) {
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
      const page = await browser.newPage();
      
      // Set viewport for Instagram square format
      await page.setViewport({ width: 1080, height: 1080 });

      // Generate HTML content
      const htmlContent = this.generateHtmlTemplate(text, topic, pageNumber, totalPages);
      
      // Set the HTML content
      await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

      // Generate image
      const filename = `post_${topic.replace(/\s+/g, '_').toLowerCase()}_${Date.now()}_${pageNumber}.png`;
      const filepath = path.join(this.outputDir, filename);
      
      await page.screenshot({
        path: filepath,
        type: 'png',
        fullPage: false,
        clip: { x: 0, y: 0, width: 1080, height: 1080 }
      });

      return filepath;
    } finally {
      await browser.close();
    }
  }

  /**
   * Generate HTML template for the image
   * @param {string} text - Text content
   * @param {string} topic - Topic for styling
   * @param {number} pageNumber - Current page number
   * @param {number} totalPages - Total number of pages
   * @returns {string} HTML content
   */
  generateHtmlTemplate(text, topic, pageNumber, totalPages) {
    const logoBase64 = this.getLogoBase64();
    
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${topic}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: #ffffff;
            color: #000000;
            width: 1080px;
            height: 1080px;
            position: relative;
            overflow: hidden;
        }
        
        .container {
            width: 100%;
            height: 100%;
            display: flex;
            flex-direction: column;
            position: relative;
        }
        
        .header {
            display: flex;
            align-items: center;
            padding: 20px 40px;
            background: #ffffff;
            border-bottom: 2px solid #e5e5e5;
            min-height: 80px;
        }
        
        .logo {
            width: 50px;
            height: 50px;
            margin-right: 15px;
            border-radius: 8px;
        }
        
        .brand-name {
            font-size: 28px;
            font-weight: 700;
            color: #000000;
            letter-spacing: -0.5px;
        }
        
        .main-content {
            flex: 1;
            padding: 40px;
            display: flex;
            flex-direction: column;
            justify-content: center;
        }
        
        .topic-title {
            font-size: 42px;
            font-weight: 800;
            color: #000000;
            margin-bottom: 30px;
            text-align: center;
            line-height: 1.2;
            letter-spacing: -1px;
        }
        
        .content-text {
            font-size: 22px;
            line-height: 1.5;
            color: #333333;
            text-align: left;
            white-space: pre-line;
            max-height: 650px;
            overflow: visible;
            word-wrap: break-word;
            overflow-wrap: break-word;
        }
        
        .footer {
            padding: 20px 40px;
            background: #f8f9fa;
            border-top: 1px solid #e5e5e5;
            display: flex;
            justify-content: space-between;
            align-items: center;
            min-height: 60px;
        }
        
        .page-info {
            font-size: 18px;
            color: #666666;
            font-weight: 500;
        }
        
        .page-dots {
            display: flex;
            gap: 8px;
        }
        
        .dot {
            width: 10px;
            height: 10px;
            border-radius: 50%;
            background: #cccccc;
        }
        
        .dot.active {
            background: #000000;
        }
        
        .footer-text {
            font-size: 16px;
            color: #666666;
            font-weight: 500;
        }
        
        .content-wrapper {
            flex: 1;
            display: flex;
            flex-direction: column;
            justify-content: flex-start;
            max-height: 750px;
            padding-top: 20px;
        }
        
        @media (max-width: 1080px) {
            body {
                width: 100vw;
                height: 100vh;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header with Logo and Brand Name -->
        <div class="header">
            ${logoBase64 ? `<img src="${logoBase64}" alt="Logo" class="logo">` : ''}
            <div class="brand-name">${this.brandName}</div>
        </div>
        
        <!-- Main Content Area -->
        <div class="main-content">
            <div class="content-wrapper">
                <h1 class="topic-title">${topic}</h1>
                <div class="content-text">${this.escapeHtml(text)}</div>
            </div>
        </div>
        
        <!-- Footer -->
        <div class="footer">
            <div class="page-info">
                ${totalPages > 1 ? `Page ${pageNumber} of ${totalPages}` : ''}
            </div>
            
            ${totalPages > 1 ? `
            <div class="page-dots">
                ${Array.from({ length: totalPages }, (_, i) => 
                  `<div class="dot ${i === pageNumber - 1 ? 'active' : ''}"></div>`
                ).join('')}
            </div>
            ` : ''}
            
            <div class="footer-text">Follow for more tech content!</div>
        </div>
    </div>
</body>
</html>`;
  }

  /**
   * Get logo as base64 string
   * @returns {string|null} Base64 encoded logo or null
   */
  getLogoBase64() {
    try {
      if (this.logoPath && fs.existsSync(this.logoPath)) {
        const logoBuffer = fs.readFileSync(this.logoPath);
        const logoBase64 = logoBuffer.toString('base64');
        const mimeType = this.getMimeType(this.logoPath);
        return `data:${mimeType};base64,${logoBase64}`;
      }
    } catch (error) {
      console.warn('Could not load logo:', error.message);
    }
    return null;
  }

  /**
   * Get MIME type based on file extension
   * @param {string} filePath - Path to the file
   * @returns {string} MIME type
   */
  getMimeType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml'
    };
    return mimeTypes[ext] || 'image/png';
  }

  /**
   * Escape HTML special characters
   * @param {string} text - Text to escape
   * @returns {string} Escaped text
   */
  escapeHtml(text) {
    const div = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    };
    return text.replace(/[&<>"']/g, (match) => div[match]);
  }

  /**
   * Clean up old images (optional utility)
   * @param {number} maxAgeHours - Maximum age of images in hours
   */
  async cleanupOldImages(maxAgeHours = 24) {
    try {
      const files = fs.readdirSync(this.outputDir);
      const now = Date.now();
      const maxAge = maxAgeHours * 60 * 60 * 1000;

      for (const file of files) {
        const filepath = path.join(this.outputDir, file);
        const stats = fs.statSync(filepath);
        
        if (now - stats.mtime.getTime() > maxAge) {
          fs.unlinkSync(filepath);
          console.log(`Cleaned up old image: ${file}`);
        }
      }
    } catch (error) {
      console.error('Error cleaning up old images:', error);
    }
  }
}

export default HtmlImageGenerationService;
