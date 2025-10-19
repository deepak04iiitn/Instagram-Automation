import { createCanvas, loadImage, GlobalFonts } from '@napi-rs/canvas';
import fs from 'fs';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

class ImageGenerationService {
  constructor() {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    this.outputDir = path.join(__dirname, '../uploads/images');
    this.logoPath = process.env.BRAND_LOGO_PATH || path.join(__dirname, '../../frontend/public/logo.png');

    // Try to register a better readable font if provided via env
    const customFontPath = process.env.BRAND_FONT_PATH || '';
    try {
      if (customFontPath && fs.existsSync(customFontPath)) {
        GlobalFonts.registerFromPath(customFontPath, 'BrandFont');
      }
    } catch {}
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
   * Generate images from text content
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
        const imagePath = await this.createImageFromText(
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
    const maxCharsPerImage = 800;
    const lines = content.split('\n');
    const chunks = [];
    let currentChunk = '';

    for (const line of lines) {
      if (currentChunk.length + line.length + 1 > maxCharsPerImage && currentChunk.length > 0) {
        chunks.push(currentChunk.trim());
        currentChunk = line;
      } else {
        currentChunk += (currentChunk ? '\n' : '') + line;
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
   * Create an image from text content
   * @param {string} text - Text content
   * @param {string} topic - Topic for styling
   * @param {number} pageNumber - Current page number
   * @param {number} totalPages - Total number of pages
   * @returns {Promise<string>} Path to generated image
   */
  async createImageFromText(text, topic, pageNumber, totalPages) {
    const width = 1080;
    const height = 1080; // Instagram square
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Theme (monochrome as requested)
    const theme = this.getMonoTheme();

    // Background: solid white
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // Optional brand bar (white background, black text)
    await this.drawBrandBar(ctx, width, theme);

    // Header (topic + pagination) in black
    this.drawHeader(ctx, theme, width, topic, pageNumber, totalPages);

    // Content area (use generous margins)
    const margin = 64;
    const contentX = margin;
    const contentY = 160;
    const contentW = width - margin * 2;
    const contentH = height - contentY - 100;
    this.drawContentPreservingNewlines(ctx, text, contentX, contentY, contentW, contentH, theme);

    // Minimal footer page dots/text (black)
    this.addFooter(ctx, pageNumber, totalPages);

    // Save
    const filename = `post_${topic.replace(/\s+/g, '_').toLowerCase()}_${Date.now()}_${pageNumber}.png`;
    const filepath = path.join(this.outputDir, filename);
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(filepath, buffer);
    return filepath;
  }

  /**
   * Set background based on topic
   * @param {Object} ctx - Canvas context
   * @param {string} topic - Topic name
   */
  setBackground(ctx, topic) {
    const gradients = {
      'Coding question of the day': ['#667eea', '#764ba2'],
      'Interview experience': ['#f093fb', '#f5576c'],
      'UI Testing': ['#4facfe', '#00f2fe'],
      'API Testing': ['#43e97b', '#38f9d7'],
      'Performance Testing': ['#fa709a', '#fee140'],
      'SDET Tools': ['#a8edea', '#fed6e3'],
      'AI in Testing': ['#ff9a9e', '#fecfef']
    };

    const colors = gradients[topic] || ['#667eea', '#764ba2'];
    const gradient = ctx.createLinearGradient(0, 0, 1080, 1080);
    gradient.addColorStop(0, colors[0]);
    gradient.addColorStop(1, colors[1]);

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1080, 1080);

    // Add subtle pattern
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    for (let i = 0; i < 20; i++) {
      ctx.beginPath();
      ctx.arc(
        Math.random() * 1080,
        Math.random() * 1080,
        Math.random() * 3,
        0,
        2 * Math.PI
      );
      ctx.fill();
    }
  }

  getMonoTheme() {
    return {
      textPrimary: '#111111',
      textSecondary: '#333333',
      accent: '#000000'
    };
  }

  drawRoundedRect(ctx, x, y, w, h, r, fillStyle, withFill = true, withShadow = false, shadowColor = 'rgba(0,0,0,0.2)') {
    if (withShadow) {
      ctx.shadowColor = shadowColor;
      ctx.shadowBlur = 24;
      ctx.shadowOffsetY = 8;
    }
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
    if (withFill) {
      ctx.fillStyle = fillStyle;
      ctx.fill();
    } else {
      ctx.stroke();
    }
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
  }

  drawHeader(ctx, theme, width, topic, pageNumber, totalPages) {
    ctx.fillStyle = theme.textPrimary;
    const fontFamily = GlobalFonts.has('BrandFont') ? 'BrandFont' : 'Arial';
    ctx.font = `bold 48px ${fontFamily}`;
    ctx.textAlign = 'center';
    ctx.fillText(topic, width / 2, 130);

    if (totalPages > 1) {
      ctx.font = `500 24px ${fontFamily}`;
      ctx.fillStyle = theme.textSecondary;
      ctx.fillText(`Page ${pageNumber} of ${totalPages}`, width / 2, 170);
    }
  }

  // Preserve newlines from Gemini content. We only soft-wrap lines that exceed maxWidth.
  drawContentPreservingNewlines(ctx, text, x, y, maxWidth, maxHeight, theme) {
    const fontFamily = GlobalFonts.has('BrandFont') ? 'BrandFont' : 'Arial';
    let fontSize = 32;
    ctx.fillStyle = theme.textPrimary;
    ctx.textAlign = 'left';

    const wrapLongLine = (line) => {
      const words = line.split(/\s+/);
      const parts = [];
      let current = '';
      for (const w of words) {
        const test = current ? `${current} ${w}` : w;
        ctx.font = `400 ${fontSize}px ${fontFamily}`;
        if (ctx.measureText(test).width > maxWidth) {
          if (current) parts.push(current);
          current = w;
        } else {
          current = test;
        }
      }
      if (current) parts.push(current);
      return parts;
    };

    const explicitLines = text.split(/\r?\n/);
    const outputLines = [];
    for (const line of explicitLines) {
      if (line.trim() === '') {
        outputLines.push('');
      } else {
        outputLines.push(...wrapLongLine(line));
      }
    }

    // Ensure we don't overflow vertically
    const lineHeight = Math.round(fontSize * 1.5);
    ctx.font = `400 ${fontSize}px ${fontFamily}`;
    let drawn = 0;
    for (let i = 0; i < outputLines.length; i++) {
      const ly = y + drawn * lineHeight;
      if (ly > y + maxHeight) break;
      const textLine = outputLines[i];
      if (textLine === '') {
        drawn += 1; // blank line spacing
        continue;
      }
      ctx.fillText(textLine, x, ly);
      drawn += 1;
    }
  }

  async drawBrandBar(ctx, width, theme) {
    // white bar at top
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, 72);

    const fontFamily = GlobalFonts.has('BrandFont') ? 'BrandFont' : 'Arial';
    ctx.fillStyle = theme.textPrimary;
    ctx.font = `600 28px ${fontFamily}`;
    ctx.textAlign = 'left';
    ctx.fillText(process.env.BRAND_NAME || 'Instagram Automation', 96, 46);

    // draw logo if provided
    try {
      if (this.logoPath && fs.existsSync(this.logoPath)) {
        const img = await loadImage(this.logoPath);
        const size = 48;
        ctx.drawImage(img, 24, 12, size, size);
      }
    } catch {}
  }

  /**
   * Add header to the image
   * @param {Object} ctx - Canvas context
   * @param {string} topic - Topic name
   * @param {number} pageNumber - Current page number
   * @param {number} totalPages - Total number of pages
   */
  addHeader(ctx, topic, pageNumber, totalPages) {
    // Topic title
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(topic, 540, 120);

    // Page indicator
    if (totalPages > 1) {
      ctx.font = '24px Arial';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.fillText(`Page ${pageNumber} of ${totalPages}`, 540, 160);
    }

    // Decorative line
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(200, 180);
    ctx.lineTo(880, 180);
    ctx.stroke();
  }

  /**
   * Add content to the image
   * @param {Object} ctx - Canvas context
   * @param {string} text - Text content
   */
  addContent(ctx, text) {
    const lines = this.wrapText(ctx, text, 1000);
    const lineHeight = 40;
    const startY = 250;
    const maxLines = 18; // Maximum lines that fit in the content area

    ctx.fillStyle = '#ffffff';
    ctx.font = '28px Arial';
    ctx.textAlign = 'left';

    for (let i = 0; i < Math.min(lines.length, maxLines); i++) {
      const y = startY + (i * lineHeight);
      ctx.fillText(lines[i], 40, y);
    }

    // Add ellipsis if content is truncated
    if (lines.length > maxLines) {
      ctx.fillText('...', 40, startY + (maxLines * lineHeight));
    }
  }

  /**
   * Add footer to the image
   * @param {Object} ctx - Canvas context
   * @param {number} pageNumber - Current page number
   * @param {number} totalPages - Total number of pages
   */
  addFooter(ctx, pageNumber, totalPages) {
    // Decorative line
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(200, 980);
    ctx.lineTo(880, 980);
    ctx.stroke();

    // Footer text
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    const fontFamily = GlobalFonts.has('BrandFont') ? 'BrandFont' : 'Arial';
    ctx.font = `500 20px ${fontFamily}`;
    ctx.textAlign = 'center';
    ctx.fillText('Follow for more tech content!', 540, 1020);
    
    // Page dots
    if (totalPages > 1) {
      const dotSize = 8;
      const spacing = 20;
      const totalWidth = (totalPages - 1) * spacing;
      const startX = 540 - (totalWidth / 2);

      for (let i = 0; i < totalPages; i++) {
        ctx.beginPath();
        ctx.arc(startX + (i * spacing), 1050, dotSize, 0, 2 * Math.PI);
        ctx.fillStyle = i === pageNumber - 1 ? '#ffffff' : 'rgba(255, 255, 255, 0.5)';
        ctx.fill();
      }
    }
  }

  /**
   * Wrap text to fit within specified width
   * @param {Object} ctx - Canvas context
   * @param {string} text - Text to wrap
   * @param {number} maxWidth - Maximum width
   * @returns {Array} Array of wrapped lines
   */
  wrapText(ctx, text, maxWidth) {
    const words = text.split(' ');
    const lines = [];
    let currentLine = words[0];

    for (let i = 1; i < words.length; i++) {
      const word = words[i];
      const width = ctx.measureText(currentLine + ' ' + word).width;
      
      if (width < maxWidth) {
        currentLine += ' ' + word;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    }
    
    if (currentLine) {
      lines.push(currentLine);
    }

    return lines;
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

export default ImageGenerationService;
