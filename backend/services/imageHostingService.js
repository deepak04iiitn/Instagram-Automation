import FormData from 'form-data';
import axios from 'axios';
import fs from 'fs';

class ImageHostingService {
  constructor() {
    this.fallbackUrls = [];
  }

  /**
   * Upload image to a free hosting service
   * @param {string} filePath - Local file path
   * @returns {Promise<string>} Public URL
   */
  async uploadImage(filePath) {
    try {
      // Try imgbb.com (free image hosting)
      const formData = new FormData();
      formData.append('image', fs.createReadStream(filePath));
      
      const response = await axios.post('https://api.imgbb.com/1/upload', formData, {
        headers: {
          ...formData.getHeaders(),
        },
        params: {
          key: process.env.IMGBB_API_KEY || 'your-imgbb-api-key' // You'll need to get this from imgbb.com
        }
      });

      if (response.data.success) {
        return response.data.data.url;
      }
      throw new Error('ImgBB upload failed');
    } catch (error) {
      console.error('Image hosting failed:', error.message);
      
      // Fallback: return a placeholder or throw error
      throw new Error(`Failed to upload image: ${error.message}`);
    }
  }

  /**
   * Upload multiple images
   * @param {Array} filePaths - Array of local file paths
   * @returns {Promise<Array>} Array of public URLs
   */
  async uploadImages(filePaths) {
    const uploadPromises = filePaths.map(filePath => this.uploadImage(filePath));
    return await Promise.all(uploadPromises);
  }
}

export default ImageHostingService;
