import puppeteer from 'puppeteer';
import fs from 'fs';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';

class HtmlImageGenerationService {
  constructor() {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    this.outputDir = path.join(__dirname, '../uploads/images');
    this.logoPath = process.env.BRAND_LOGO_PATH || path.join(__dirname, '../../logo/Route2Hire.png');
    this.brandName = process.env.BRAND_NAME || 'Tech Insights';
    this.ensureOutputDirectory();
  }

  ensureOutputDirectory() {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  async generateImages(content, topic) {
    try {
      const filenameTopic = topic.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
      
      const [questionPart, solutionPart] = content.split('|||SPLIT|||');
      
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
  
        if (questionPart && questionPart.trim()) {
          const { chunks: questionChunks } = await this.paginateContentByMeasuring(
            questionPart.trim(), 
            topic,
            'Question'
          );
          
          for (let i = 0; i < questionChunks.length; i++) {
            const htmlContent = this.generateHtmlTemplate(
              questionChunks[i], 
              topic, 
              'Question',
              i + 1, 
              questionChunks.length
            );
            await page.setContent(htmlContent, { waitUntil: 'domcontentloaded', timeout: 60000 });
  
            const timestamp = Date.now();
            const filename = `post_${filenameTopic}_${timestamp}_question_${i + 1}.png`;
            const filepath = path.join(this.outputDir, filename);
  
            await page.screenshot({
              path: filepath,
              type: 'png',
              fullPage: false,
              clip: { x: 0, y: 0, width: 1080, height: 1080 }
            });
  
            imagePaths.push(filepath);
          }
        }
  
        if (solutionPart && solutionPart.trim()) {
          const { chunks: solutionChunks } = await this.paginateContentByMeasuring(
            solutionPart.trim(), 
            topic,
            'Solution'
          );
          
          for (let i = 0; i < solutionChunks.length; i++) {
            const htmlContent = this.generateHtmlTemplate(
              solutionChunks[i], 
              topic, 
              'Solution',
              i + 1, 
              solutionChunks.length
            );
            await page.setContent(htmlContent, { waitUntil: 'domcontentloaded', timeout: 60000 });
  
            const timestamp = Date.now();
            const filename = `post_${filenameTopic}_${timestamp}_solution_${i + 1}.png`;
            const filepath = path.join(this.outputDir, filename);
  
            await page.screenshot({
              path: filepath,
              type: 'png',
              fullPage: false,
              clip: { x: 0, y: 0, width: 1080, height: 1080 }
            });
  
            imagePaths.push(filepath);
          }
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

  async paginateContentByMeasuring(content, topic, contentType = 'Content') {
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
        let end = start;
        let lastFitEnd = start;
        
        while (end < units.length) {
          const candidate = units.slice(start, end + 1).join('');
          const html = this.generateHtmlTemplate(
            candidate, 
            topic, 
            contentType,
            chunks.length + 1, 
            1
          );
          await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: 60000 });

          // Check if content overflows
          const isOverflow = await page.evaluate(() => {
            const el = document.querySelector('.content-text');
            const card = document.querySelector('.content-card');
            if (!el || !card) return false;
            
            const buffer = 30;
            return (el.scrollHeight + buffer) > card.clientHeight;
          });

          if (isOverflow) {
            break;
          } else {
            lastFitEnd = end + 1;
            end++;
          }
        }

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
   * Convert plain text to HTML preserving exact formatting, bullets, and numbers
   */
  formatTextToHtml(text) {
    const lines = text.split('\n');
    let html = '';
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmedLine = line.trim();
      
      // Calculate leading spaces for indentation
      const leadingSpaces = line.length - line.trimStart().length;
      const indentLevel = Math.floor(leadingSpaces / 2); // 2 spaces = 1 indent level
      
      if (!trimmedLine) {
        // Empty line - preserve spacing
        html += '<div class="empty-line"></div>';
        continue;
      }
      
      // Check for bullet point (•, -, *)
      const bulletMatch = trimmedLine.match(/^[•\-*]\s+(.+)/);
      // Check for numbered list (1., 2., etc)
      const numberMatch = trimmedLine.match(/^(\d+)\.\s+(.+)/);
      
      if (bulletMatch) {
        // Bullet point with indentation
        html += `<div class="bullet-item" style="padding-left: ${indentLevel * 20}px;">
          <span class="bullet">•</span>
          <span class="bullet-text">${this.escapeHtml(bulletMatch[1])}</span>
        </div>`;
      } else if (numberMatch) {
        // Numbered item with indentation
        html += `<div class="number-item" style="padding-left: ${indentLevel * 20}px;">
          <span class="number">${numberMatch[1]}.</span>
          <span class="number-text">${this.escapeHtml(numberMatch[2])}</span>
        </div>`;
      } else {
        // Regular text - check if it's a heading (ends with colon)
        if (trimmedLine.endsWith(':') && trimmedLine.length < 60) {
          html += `<div class="section-heading" style="padding-left: ${indentLevel * 20}px;">${this.escapeHtml(trimmedLine)}</div>`;
        } else {
          html += `<div class="text-line" style="padding-left: ${indentLevel * 20}px;">${this.escapeHtml(trimmedLine)}</div>`;
        }
      }
    }
    
    return html;
  }

  generateHtmlTemplate(text, topic, contentType, pageNumber, totalPages) {
    const logoBase64 = this.getLogoBase64();

    const typeBadge = contentType === 'Solution' 
    ? '<div style="display:inline-block;background:linear-gradient(135deg,#22c55e,#16a34a);color:#fff;padding:8px 20px;border-radius:20px;font-size:20px;font-weight:700;margin-bottom:12px;box-shadow:0 4px 12px rgba(34,197,94,0.4);">✓ Solution</div>'
    : '';

    const displayTopic = contentType === 'Question' ? topic : '';
    
    // Convert text to formatted HTML preserving exact spacing
    const formattedContent = this.formatTextToHtml(text);
    
    // Different alignment for Question vs Solution
    const isQuestion = contentType === 'Question';
    const contentAlignment = isQuestion ? 'center' : 'flex-start';
    const textAlign = isQuestion ? 'center' : 'left';
    const cardHeight = isQuestion ? 'auto' : 'auto';
    const cardMaxHeight = isQuestion ? 'none' : '800px';
    
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
            color: #1e293b;
            background: radial-gradient(1200px 600px at -10% 0%, rgba(14,165,233,0.15) 0%, rgba(14,165,233,0) 60%),
                        radial-gradient(1200px 600px at 110% 100%, rgba(124,58,237,0.12) 0%, rgba(124,58,237,0) 60%),
                        linear-gradient(135deg, #f8fafc 0%, #f1f5f9 35%, #e2e8f0 60%, #f8fafc 100%);
        }
        
        .bg-grid {
            position: absolute;
            inset: 0;
            background-image: 
              linear-gradient(rgba(0,0,0,0.04) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0,0,0,0.04) 1px, transparent 1px);
            background-size: 36px 36px, 36px 36px;
            mask-image: radial-gradient(circle at 50% 50%, black 25%, transparent 85%);
            pointer-events: none;
            z-index: 0;
        }

        .bg-accent-aurora {
            position: absolute;
            inset: -20% -20% -20% -20%;
            background: radial-gradient(40% 60% at 20% 20%, rgba(34,197,94,0.08) 0%, rgba(34,197,94,0.00) 60%),
                        radial-gradient(35% 55% at 80% 70%, rgba(124,58,237,0.10) 0%, rgba(124,58,237,0.00) 60%),
                        radial-gradient(30% 45% at 70% 20%, rgba(14,165,233,0.08) 0%, rgba(14,165,233,0.00) 60%);
            filter: blur(18px) saturate(110%);
            pointer-events: none;
            z-index: 0;
        }

        .bg-vignette {
            position: absolute;
            inset: 0;
            background: radial-gradient(80% 80% at 50% 50%, rgba(255,255,255,0.08) 0%, rgba(0,0,0,0.08) 100%);
            pointer-events: none;
            z-index: 0;
        }

        .watermark {
            position: absolute;
            inset: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 0.15;
            pointer-events: none;
            mix-blend-mode: normal;
            z-index: 1;
        }

        .watermark img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            transform: scale(1.25);
            filter: brightness(0.9) contrast(0.8) drop-shadow(0 8px 28px rgba(0,0,0,0.1));
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
            background: rgba(255,255,255,0.7);
            border-bottom: 1px solid rgba(148,163,184,0.3);
            min-height: 80px;
            max-height: 80px;
            backdrop-filter: blur(10px);
            flex-shrink: 0;
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
            box-shadow: 0 10px 24px rgba(0,0,0,0.25);
            border: 1px solid rgba(255,255,255,0.18);
            transition: transform 0.15s ease, box-shadow 0.2s ease, filter 0.2s ease;
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
            box-shadow: 0 8px 24px rgba(0,0,0,0.15);
            background: #ffffff;
            padding: 6px;
            border: 1px solid rgba(0,0,0,0.06);
            object-fit: contain;
        }
        
        .brand-name {
            font-size: 28px;
            font-weight: 800;
            color: #1e293b;
            letter-spacing: -0.5px;
            text-transform: none;
        }
        
        .main-content {
            flex: 1;
            padding: 24px 40px;
            display: flex;
            flex-direction: column;
            justify-content: ${contentAlignment};
            align-items: ${isQuestion ? 'center' : 'stretch'};
            position: relative;
            gap: 0;
            min-height: 0;
            overflow: hidden;
        }
        
        .topic-title {
            font-size: 38px;
            font-weight: 900;
            color: #0f172a;
            margin: 0 0 16px 0;
            text-align: center;
            line-height: 1.2;
            letter-spacing: -0.02em;
            text-shadow: 0 2px 12px rgba(0,0,0,0.08);
            background: linear-gradient(90deg, #0ea5e9 0%, #22c55e 30%, #8b5cf6 75%);
            -webkit-background-clip: text;
            background-clip: text;
            -webkit-text-fill-color: transparent;
            flex-shrink: 0;
        }
        
        .content-card {
            position: relative;
            background: rgba(255,255,255,0.0);
            border: 1px solid rgba(148,163,184,0.35);
            box-shadow: 0 12px 44px rgba(0,0,0,0.15);
            border-radius: 18px;
            padding: 30px 40px;
            backdrop-filter: blur(14px) saturate(120%);
            z-index: 3;
            overflow: hidden;
            width: ${isQuestion ? 'auto' : '100%'};
            max-width: ${isQuestion ? '900px' : '100%'};
            height: ${cardHeight};
            max-height: ${cardMaxHeight};
            display: flex;
            flex-direction: column;
        }

        .content-card::before {
            content: '';
            position: absolute;
            inset: 0;
            border-radius: 18px;
            background: rgba(255,255,255,0.85);
            z-index: -1;
        }

        .content-text {
            font-size: 26px;
            line-height: 1.7;
            color: #1e293b;
            text-align: ${textAlign};
            overflow-y: ${isQuestion ? 'visible' : 'auto'};
            overflow-x: hidden;
            padding-right: ${isQuestion ? '0' : '10px'};
        }

        /* Preserve exact formatting as from Gemini */
        .content-text .empty-line {
            height: 1.7em;
        }

        .content-text .text-line {
            margin: 6px 0;
            line-height: 1.7;
        }

        .content-text .section-heading {
            font-size: 28px;
            font-weight: 700;
            color: #0ea5e9;
            margin: 20px 0 12px 0;
            line-height: 1.5;
        }

        .content-text .bullet-item {
            display: flex;
            align-items: flex-start;
            margin: 8px 0;
            line-height: 1.7;
            gap: 12px;
        }

        .content-text .bullet-item .bullet {
            color: #22c55e;
            font-size: 28px;
            font-weight: bold;
            flex-shrink: 0;
            margin-top: -2px;
        }

        .content-text .bullet-item .bullet-text {
            flex: 1;
            padding-top: 2px;
        }

        .content-text .number-item {
            display: flex;
            align-items: flex-start;
            margin: 8px 0;
            line-height: 1.7;
            gap: 10px;
        }

        .content-text .number-item .number {
            color: #0ea5e9;
            font-size: 26px;
            font-weight: 700;
            flex-shrink: 0;
            min-width: 30px;
        }

        .content-text .number-item .number-text {
            flex: 1;
            padding-top: 1px;
        }

        /* Custom scrollbar for solution only */
        .content-text::-webkit-scrollbar {
            width: 8px;
        }

        .content-text::-webkit-scrollbar-track {
            background: rgba(148,163,184,0.2);
            border-radius: 4px;
        }

        .content-text::-webkit-scrollbar-thumb {
            background: rgba(148,163,184,0.5);
            border-radius: 4px;
        }

        .content-text::-webkit-scrollbar-thumb:hover {
            background: rgba(148,163,184,0.7);
        }
        
        .footer {
            padding: 20px 40px;
            background: rgba(255,255,255,0.7);
            border-top: 1px solid rgba(148,163,184,0.3);
            display: flex;
            justify-content: space-between;
            align-items: center;
            min-height: 60px;
            max-height: 60px;
            backdrop-filter: blur(10px);
            flex-shrink: 0;
        }
        
        .page-info {
            font-size: 16px;
            color: #475569;
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
            background: rgba(148,163,184,0.4);
            box-shadow: 0 2px 10px rgba(0,0,0,0.1) inset;
        }
        
        .dot.active {
            background: linear-gradient(135deg, #0ea5e9 0%, #22c55e 60%, #8b5cf6 100%);
            box-shadow: 0 0 0 3px rgba(14,165,233,0.25), 0 4px 14px rgba(0,0,0,0.2);
        }
        
        .footer-text {
            font-size: 16px;
            color: #475569;
            font-weight: 600;
        }

        .footer-link {
            color: #0ea5e9;
            text-decoration: underline;
            font-weight: 700;
            letter-spacing: 0.2px;
        }
        
        .content-wrapper {
            display: flex;
            flex-direction: column;
            justify-content: ${contentAlignment};
            align-items: ${isQuestion ? 'center' : 'stretch'};
            gap: 10px;
            width: 100%;
            height: 100%;
        }

        .badge-wrapper {
            flex-shrink: 0;
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="bg-accent-aurora"></div>
        <div class="bg-grid"></div>
        <div class="bg-vignette"></div>
        ${logoBase64 ? `<div class="watermark"><img src="${logoBase64}" alt="Watermark"></div>` : ''}
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
        
        <div class="main-content">
            <div class="content-wrapper">
                ${displayTopic ? `<h1 class="topic-title">${this.escapeHtml(displayTopic)}</h1>` : ''}
                ${typeBadge ? `<div class="badge-wrapper">${typeBadge}</div>` : ''}
                <div class="content-card">
                    <div class="content-text">
                        ${formattedContent}
                    </div>
                </div>
            </div>
        </div>
        
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

  /**
   * Generate job posting image with 2 jobs
   * @param {Array} jobs - Array of 2 job objects
   * @returns {Promise<Array>} Array of generated image paths
   */
  async generateJobPostingImages(jobs) {
    try {
      const timestamp = Date.now();
      const filenameTopic = 'job_opportunities';
      
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

        const htmlContent = this.generateJobPostingHtmlTemplate(jobs);
        await page.setContent(htmlContent, { waitUntil: 'domcontentloaded', timeout: 60000 });

        const filename = `job_post_${filenameTopic}_${timestamp}.png`;
        const filepath = path.join(this.outputDir, filename);

        await page.screenshot({
          path: filepath,
          type: 'png',
          fullPage: false,
          clip: { x: 0, y: 0, width: 1080, height: 1080 }
        });

        imagePaths.push(filepath);
      } finally {
        await browser.close();
      }

      return imagePaths;
    } catch (error) {
      console.error('Error generating job posting images:', error);
      throw new Error(`Failed to generate job posting images: ${error.message}`);
    }
  }

  /**
   * Generate HTML template for job posting
   * @param {Array} jobs - Array of job objects
   * @returns {string} HTML template
   */
  generateJobPostingHtmlTemplate(jobs) {
    const logoBase64 = this.getLogoBase64();

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Job Opportunities</title>
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
            color: #1e293b;
            background: radial-gradient(1200px 600px at -10% 0%, rgba(14,165,233,0.15) 0%, rgba(14,165,233,0) 60%),
                        radial-gradient(1200px 600px at 110% 100%, rgba(124,58,237,0.12) 0%, rgba(124,58,237,0) 60%),
                        linear-gradient(135deg, #f8fafc 0%, #f1f5f9 35%, #e2e8f0 60%, #f8fafc 100%);
        }
        
        .bg-grid {
            position: absolute;
            inset: 0;
            background-image: 
              linear-gradient(rgba(0,0,0,0.04) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0,0,0,0.04) 1px, transparent 1px);
            background-size: 36px 36px, 36px 36px;
            mask-image: radial-gradient(circle at 50% 50%, black 25%, transparent 85%);
            pointer-events: none;
            z-index: 0;
        }

        .bg-accent-aurora {
            position: absolute;
            inset: -20% -20% -20% -20%;
            background: radial-gradient(40% 60% at 20% 20%, rgba(34,197,94,0.08) 0%, rgba(34,197,94,0.00) 60%),
                        radial-gradient(35% 55% at 80% 70%, rgba(124,58,237,0.10) 0%, rgba(124,58,237,0.00) 60%),
                        radial-gradient(30% 45% at 70% 20%, rgba(14,165,233,0.08) 0%, rgba(14,165,233,0.00) 60%);
            filter: blur(18px) saturate(110%);
            pointer-events: none;
            z-index: 0;
        }

        .bg-vignette {
            position: absolute;
            inset: 0;
            background: radial-gradient(80% 80% at 50% 50%, rgba(255,255,255,0.08) 0%, rgba(0,0,0,0.08) 100%);
            pointer-events: none;
            z-index: 0;
        }

        .watermark {
            position: absolute;
            inset: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 0.15;
            pointer-events: none;
            mix-blend-mode: normal;
            z-index: 1;
        }

        .watermark img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            transform: scale(1.25);
            filter: brightness(0.9) contrast(0.8) drop-shadow(0 8px 28px rgba(0,0,0,0.1));
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
            background: rgba(255,255,255,0.7);
            border-bottom: 1px solid rgba(148,163,184,0.3);
            min-height: 80px;
            max-height: 80px;
            backdrop-filter: blur(10px);
            flex-shrink: 0;
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
            box-shadow: 0 10px 24px rgba(0,0,0,0.25);
            border: 1px solid rgba(255,255,255,0.18);
            transition: transform 0.15s ease, box-shadow 0.2s ease, filter 0.2s ease;
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
            box-shadow: 0 8px 24px rgba(0,0,0,0.15);
            background: #ffffff;
            padding: 6px;
            border: 1px solid rgba(0,0,0,0.06);
            object-fit: contain;
        }
        
        .brand-name {
            font-size: 28px;
            font-weight: 800;
            color: #1e293b;
            letter-spacing: -0.5px;
            text-transform: none;
        }
        
        .main-content {
            flex: 1;
            padding: 30px 40px;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            position: relative;
            gap: 20px;
            min-height: 0;
            overflow: hidden;
        }
        
        .title {
            font-size: 42px;
            font-weight: 900;
            color: #0f172a;
            margin: 0 0 20px 0;
            text-align: center;
            line-height: 1.2;
            letter-spacing: -0.02em;
            text-shadow: 0 2px 12px rgba(0,0,0,0.08);
            background: linear-gradient(90deg, #0ea5e9 0%, #22c55e 30%, #8b5cf6 75%);
            -webkit-background-clip: text;
            background-clip: text;
            -webkit-text-fill-color: transparent;
            flex-shrink: 0;
        }

        .jobs-container {
            display: flex;
            flex-direction: column;
            gap: 25px;
            width: 100%;
            max-width: 900px;
        }

        .job-card {
            position: relative;
            background: rgba(255,255,255,0.9);
            border: 1px solid rgba(148,163,184,0.35);
            box-shadow: 0 12px 44px rgba(0,0,0,0.15);
            border-radius: 18px;
            padding: 25px 30px;
            backdrop-filter: blur(14px) saturate(120%);
            z-index: 3;
            overflow: hidden;
        }

        .job-card::before {
            content: '';
            position: absolute;
            inset: 0;
            border-radius: 18px;
            background: rgba(255,255,255,0.95);
            z-index: -1;
        }

        .job-header {
            display: flex;
            align-items: center;
            gap: 15px;
            margin-bottom: 15px;
        }

        .job-number {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: linear-gradient(135deg, #0ea5e9 0%, #22c55e 60%, #8b5cf6 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: 800;
            font-size: 18px;
            flex-shrink: 0;
        }

        .job-title {
            font-size: 24px;
            font-weight: 800;
            color: #1e293b;
            line-height: 1.3;
        }

        .job-details {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin-top: 15px;
        }

        .job-detail {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 16px;
            color: #475569;
        }

        .job-detail-icon {
            width: 18px;
            height: 18px;
            color: #0ea5e9;
            flex-shrink: 0;
        }

        .job-detail-text {
            font-weight: 600;
        }

        .company-name {
            color: #0ea5e9;
            font-weight: 700;
        }

        .experience-text {
            color: #22c55e;
            font-weight: 700;
        }

        .location-text {
            color: #8b5cf6;
            font-weight: 700;
        }
        
        .footer {
            padding: 20px 40px;
            background: rgba(255,255,255,0.7);
            border-top: 1px solid rgba(148,163,184,0.3);
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 60px;
            max-height: 60px;
            backdrop-filter: blur(10px);
            flex-shrink: 0;
        }
        
        .footer-text {
            font-size: 16px;
            color: #475569;
            font-weight: 600;
        }

        .footer-link {
            color: #0ea5e9;
            text-decoration: underline;
            font-weight: 700;
            letter-spacing: 0.2px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="bg-accent-aurora"></div>
        <div class="bg-grid"></div>
        <div class="bg-vignette"></div>
        ${logoBase64 ? `<div class="watermark"><img src="${logoBase64}" alt="Watermark"></div>` : ''}
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
        
        <div class="main-content">
            <h1 class="title">🚀 New QA Job Opportunities!</h1>
            
            <div class="jobs-container">
                ${jobs.map((job, index) => `
                    <div class="job-card">
                        <div class="job-header">
                            <div class="job-number">${index + 1}</div>
                            <div class="job-title">${this.escapeHtml(job.job_title || job.title || 'Position Available')}</div>
                        </div>
                        <div class="job-details">
                            <div class="job-detail">
                                <svg class="job-detail-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                                </svg>
                                <span class="job-detail-text"><span class="company-name">${this.escapeHtml(job.company || 'Company')}</span></span>
                            </div>
                            <div class="job-detail">
                                <svg class="job-detail-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                </svg>
                                <span class="job-detail-text"><span class="experience-text">${job.min_exp || 0}+ years</span></span>
                            </div>
                            <div class="job-detail">
                                <svg class="job-detail-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                </svg>
                                <span class="job-detail-text"><span class="location-text">${this.escapeHtml(Array.isArray(job.location) ? job.location.join(', ') : (job.location || 'Location'))}</span></span>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
        
        <div class="footer">
            <div class="footer-text">Apply now at <a class="footer-link" href="https://route2hire.com" target="_blank" rel="noopener noreferrer">route2hire.com</a></div>
        </div>
    </div>
</body>
</html>`;
  }
}

export default HtmlImageGenerationService;