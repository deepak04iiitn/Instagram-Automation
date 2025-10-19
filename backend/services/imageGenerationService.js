import HtmlImageGenerationService from './htmlImageGenerationService.js';

class ImageGenerationService {
  constructor() {
    this.htmlImageService = new HtmlImageGenerationService();
  }

  /**
   * Generate images from text content using HTML template
   * @param {string} content - Text content to convert to images
   * @param {string} topic - Topic for styling
   * @returns {Promise<Array>} Array of generated image paths
   */
  async generateImages(content, topic) {
    return await this.htmlImageService.generateImages(content, topic);
  }

  /**
   * Clean up old images (optional utility)
   * @param {number} maxAgeHours - Maximum age of images in hours
   */
  async cleanupOldImages(maxAgeHours = 24) {
    return await this.htmlImageService.cleanupOldImages(maxAgeHours);
  }
}

export default ImageGenerationService;