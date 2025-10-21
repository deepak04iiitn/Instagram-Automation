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
   * @param {string} topic - Topic for styling (short, 4 words max from Gemini)
   * @returns {Promise<Array>} Array of generated image paths
   */
  async generateImages(content, topic) {
    try {
      // Topic is already short (max 4 words) from Gemini, just clean for filename
      const filenameTopic = topic.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
      
      const { chunks } = await this.paginateContentByMeasuring(content, topic);
      const imagePaths = [];

      const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });

      try {
        const page = await browser.newPage();
        await page.setViewport({ width: 1080, height: 1080 });
        page.setDefaultNavigationTimeout(120000);
        page.setDefaultTimeout(120000);

        for (let i = 0; i < chunks.length; i++) {
          const htmlContent = this.generateHtmlTemplate(chunks[i], topic, i + 1, chunks.length);
          await page.setContent(htmlContent, { waitUntil: 'domcontentloaded', timeout: 60000 });

          // Use clean topic and timestamp for filename
          const timestamp = Date.now();
          const filename = `post_${filenameTopic}_${timestamp}_${i + 1}.png`;
          const filepath = path.join(this.outputDir, filename);

          await page.screenshot({
            path: filepath,
            type: 'png',
            fullPage: false,
            clip: { x: 0, y: 0, width: 1080, height: 1080 }
          });

          imagePaths.push(filepath);
        }
      } finally {
        await browser.close();
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
   * Split content into small units (sentence/line chunks) preserving newlines
   * @param {string} content
   * @returns {string[]} units
   */
  splitIntoUnits(content) {
    const lines = content.split('\n');
    const units = [];
    const sentenceRegex = /[^.!?\n]+[.!?]?\s*/g;
    for (let li = 0; li < lines.length; li++) {
      const line = lines[li];
      const parts = line.match(sentenceRegex) || [line + ' '];
      for (const p of parts) {
        units.push(p);
      }
      if (li < lines.length - 1) {
        units.push('\n');
      }
    }
    return units;
  }

  /**
   * Measure-based pagination using Puppeteer so content never gets cut
   * @param {string} content
   * @param {string} topic
   * @returns {Promise<{chunks: string[]}>}
   */
  async paginateContentByMeasuring(content, topic) {
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
      const page = await browser.newPage();
      await page.setViewport({ width: 1080, height: 1080 });
      page.setDefaultNavigationTimeout(120000);
      page.setDefaultTimeout(120000);

      const units = this.splitIntoUnits(content);
      const chunks = [];

      let start = 0;
      while (start < units.length) {
        // Greedily add units until overflow, then back off by one
        let end = start;
        let lastFitEnd = start;
        while (end < units.length) {
          const candidate = units.slice(start, end + 1).join('');
          const html = this.generateHtmlTemplate(candidate, topic, chunks.length + 1, 1);
          await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: 60000 });

          const isOverflow = await page.evaluate(() => {
            const el = document.querySelector('.content-text');
            if (!el) return false;
            return el.scrollHeight > el.clientHeight;
          });

          if (isOverflow) {
            break;
          } else {
            lastFitEnd = end + 1;
            end++;
          }
        }

        // If nothing even fits (extremely long word), hard break by character
        if (lastFitEnd === start) {
          const forced = units[start];
          let sliceLen = Math.min(forced.length, 80);
          chunks.push(forced.slice(0, sliceLen));
          units[start] = forced.slice(sliceLen);
          continue;
        }

        const chunkText = units.slice(start, lastFitEnd).join('').trimEnd();
        chunks.push(chunkText);
        start = lastFitEnd;
      }

      return { chunks };
    } finally {
      await browser.close();
    }
  }

  /**
   * Create an image from HTML template
   * @param {string} text - Text content
   * @param {string} topic - Topic for styling (short, 4 words max)
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

      // Generate image with clean filename
      const filenameTopic = topic.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
      const timestamp = Date.now();
      const filename = `post_${filenameTopic}_${timestamp}_${pageNumber}.png`;
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
   * @param {string} topic - Topic for styling (short, 4 words max from Gemini)
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
    <title>SDET Interview Prep</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            width: 1080px;
            height: 1080px;
            position: relative;
            overflow: hidden;
            color: #e6e9ef;
            /* Premium, tech-inspired gradient using blues, greens, and purples */
            background: radial-gradient(1200px 600px at -10% 0%, rgba(14,165,233,0.18) 0%, rgba(14,165,233,0) 60%),
                        radial-gradient(1200px 600px at 110% 100%, rgba(124,58,237,0.18) 0%, rgba(124,58,237,0) 60%),
                        linear-gradient(135deg, #080c18 0%, #0c1224 35%, #0e1622 60%, #080c18 100%);
        }
        
        .bg-grid {
            position: absolute;
            inset: 0;
            background-image: 
              linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px);
            background-size: 36px 36px, 36px 36px;
            mask-image: radial-gradient(circle at 50% 50%, black 25%, transparent 85%);
            pointer-events: none;
            z-index: 0;
        }

        .bg-accent-aurora {
            position: absolute;
            inset: -20% -20% -20% -20%;
            background: radial-gradient(40% 60% at 20% 20%, rgba(34,197,94,0.10) 0%, rgba(34,197,94,0.00) 60%),
                        radial-gradient(35% 55% at 80% 70%, rgba(124,58,237,0.14) 0%, rgba(124,58,237,0.00) 60%),
                        radial-gradient(30% 45% at 70% 20%, rgba(14,165,233,0.10) 0%, rgba(14,165,233,0.00) 60%);
            filter: blur(18px) saturate(110%);
            pointer-events: none;
            z-index: 0;
        }

        .bg-vignette {
            position: absolute;
            inset: 0;
            background: radial-gradient(80% 80% at 50% 50%, rgba(0,0,0,0.18) 0%, rgba(0,0,0,0.35) 100%);
            pointer-events: none;
            z-index: 0;
        }

        .watermark {
            position: absolute;
            inset: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 0.35;
            pointer-events: none;
            mix-blend-mode: normal;
            z-index: 1;
        }

        .watermark img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            transform: scale(1.25);
            filter: brightness(0.28) contrast(1.15) drop-shadow(0 8px 28px rgba(0,0,0,0.45));
        }

        .container {
            width: 100%;
            height: 100%;
            display: flex;
            flex-direction: column;
            position: relative;
            z-index: 2;
        }
        
        .header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 20px 40px;
            background: rgba(2,6,23,0.35);
            border-bottom: 1px solid rgba(148,163,184,0.18);
            min-height: 80px;
            backdrop-filter: blur(10px);
        }

        .header-left {
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .right-actions {
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .follow-btn {
            display: inline-flex;
            align-items: center;
            gap: 10px;
            padding: 10px 16px;
            border-radius: 9999px;
            background: linear-gradient(45deg, #feda75, #fa7e1e, #d62976, #962fbf, #4f5bd5);
            color: #ffffff;
            font-weight: 800;
            letter-spacing: 0.2px;
            text-decoration: none;
            box-shadow: 0 10px 24px rgba(0,0,0,0.35);
            border: 1px solid rgba(255,255,255,0.18);
            transition: transform 0.15s ease, box-shadow 0.2s ease, filter 0.2s ease;
        }

        .follow-btn:hover {
            transform: translateY(-1px);
            box-shadow: 0 12px 28px rgba(0,0,0,0.4);
            filter: saturate(1.05);
        }

        .ig-icon {
            width: 18px;
            height: 18px;
        }
        
        .logo {
            width: 50px;
            height: 50px;
            margin-right: 15px;
            border-radius: 8px;
            box-shadow: 0 8px 24px rgba(0,0,0,0.35);
            background: #ffffff;
            padding: 6px;
            border: 1px solid rgba(0,0,0,0.06);
            object-fit: contain;
        }
        
        .brand-name {
            font-size: 28px;
            font-weight: 800;
            color: #e5e7eb;
            letter-spacing: -0.5px;
            text-transform: none;
        }
        
        .main-content {
            flex: 1;
            padding: 28px 40px 28px 40px;
            display: flex;
            flex-direction: column;
            justify-content: flex-start;
            position: relative;
            gap: 0;
        }
        
        .topic-title {
            font-size: 38px;
            font-weight: 900;
            color: #f8fafc;
            margin: 0 0 18px 0;
            text-align: center;
            line-height: 1.2;
            letter-spacing: -0.02em;
            text-shadow: 0 2px 12px rgba(0,0,0,0.35);
            background: linear-gradient(90deg, #93c5fd 0%, #86efac 30%, #c4b5fd 75%);
            -webkit-background-clip: text;
            background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        
        .content-card {
            position: relative;
            background: rgba(2,6,23,0.0);
            border: 1px solid rgba(148,163,184,0.22);
            box-shadow: 0 12px 44px rgba(0,0,0,0.45);
            border-radius: 18px;
            padding: 28px 28px 32px 28px;
            backdrop-filter: blur(14px) saturate(120%);
            z-index: 3;
            overflow: hidden;
        }

        .content-card::before {
            content: '';
            position: absolute;
            inset: 0;
            border-radius: 18px;
            background: rgba(2,6,23,0.92);
            z-index: -1;
        }

        .content-text {
            font-size: 30px;
            line-height: 1.55;
            color: #f1f5f9;
            text-align: left;
            white-space: pre-line;
            max-height: 650px;
            overflow: visible;
            word-wrap: break-word;
            overflow-wrap: break-word;
            text-shadow: 0 1px 8px rgba(0,0,0,0.45);
        }
        
        .footer {
            padding: 20px 40px;
            background: rgba(2,6,23,0.35);
            border-top: 1px solid rgba(148,163,184,0.18);
            display: flex;
            justify-content: space-between;
            align-items: center;
            min-height: 60px;
            backdrop-filter: blur(10px);
        }
        
        .page-info {
            font-size: 16px;
            color: #cbd5e1;
            font-weight: 600;
        }
        
        .page-dots {
            display: flex;
            gap: 8px;
        }
        
        .dot {
            width: 10px;
            height: 10px;
            border-radius: 50%;
            background: rgba(148,163,184,0.35);
            box-shadow: 0 2px 10px rgba(0,0,0,0.25) inset;
        }
        
        .dot.active {
            background: linear-gradient(135deg, #60a5fa 0%, #34d399 60%, #a78bfa 100%);
            box-shadow: 0 0 0 3px rgba(99,102,241,0.25), 0 4px 14px rgba(0,0,0,0.35);
        }
        
        .footer-text {
            font-size: 16px;
            color: #cbd5e1;
            font-weight: 600;
        }

        .footer-link {
            color: #93c5fd;
            text-decoration: underline;
            font-weight: 700;
            letter-spacing: 0.2px;
        }
        
        .content-wrapper {
            flex: 1;
            display: flex;
            flex-direction: column;
            justify-content: flex-start;
            max-height: 750px;
            padding-top: 0;
            gap: 12px;
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
        <div class="bg-accent-aurora"></div>
        <div class="bg-grid"></div>
        <div class="bg-vignette"></div>
        ${logoBase64 ? `<div class="watermark"><img src="${logoBase64}" alt="Watermark"></div>` : ''}
        <!-- Header with Logo and Brand Name -->
        <div class="header">
            <div class="header-left">
                ${logoBase64 ? `<img src="${logoBase64}" alt="Logo" class="logo">` : ''}
                <div class="brand-name">${this.brandName}</div>
            </div>
            <div class="right-actions">
                <a class="follow-btn" href="https://www.instagram.com/route2hire?utm_source=qr&igsh=ZGk5NTQyY2RiOGF1" target="_blank" rel="noopener noreferrer" title="Follow Us">
                    <svg class="ig-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                        <path d="M7 2h10c2.761 0 5 2.239 5 5v10c0 2.761-2.239 5-5 5H7c-2.761 0-5-2.239-5-5V7c0-2.761 2.239-5 5-5z" stroke="white" stroke-width="1.5"/>
                        <path d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7z" stroke="white" stroke-width="1.5"/>
                        <circle cx="17.5" cy="6.5" r="1.25" fill="white"/>
                    </svg>
                    <span>Follow</span>
                </a>
            </div>
        </div>
        
        <!-- Main Content Area -->
        <div class="main-content">
            <div class="content-wrapper">
                <h1 class="topic-title">${this.escapeHtml(topic)}</h1>
                <div class="content-card">
                    <div class="content-text">${this.escapeHtml(text)}</div>
                </div>
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
            
            <div class="footer-text">Visit <a class="footer-link" href="https://route2hire.com" target="_blank" rel="noopener noreferrer">route2hire.com</a></div>
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