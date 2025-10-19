import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';

class CloudinaryService {
  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET
    });
  }

  /**
   * Upload image to Cloudinary
   * @param {string} filePath - Local file path
   * @param {string} folder - Cloudinary folder (optional)
   * @returns {Promise<Object>} Upload result with URL
   */
  async uploadImage(filePath, folder = 'instagram-automation') {
    try {
      const result = await cloudinary.uploader.upload(filePath, {
        folder: folder,
        resource_type: 'image',
        quality: 'auto',
        fetch_format: 'auto'
      });

      return {
        success: true,
        publicId: result.public_id,
        url: result.secure_url,
        width: result.width,
        height: result.height
      };
    } catch (error) {
      console.error('Error uploading to Cloudinary:', error);
      throw new Error(`Failed to upload to Cloudinary: ${error.message}`);
    }
  }

  /**
   * Upload multiple images to Cloudinary
   * @param {Array} filePaths - Array of local file paths
   * @param {string} folder - Cloudinary folder (optional)
   * @returns {Promise<Array>} Array of upload results
   */
  async uploadImages(filePaths, folder = 'instagram-automation') {
    try {
      const uploadPromises = filePaths.map((filePath, index) => 
        this.uploadImage(filePath, `${folder}/post-${Date.now()}-${index + 1}`)
      );
      
      const results = await Promise.all(uploadPromises);
      return results;
    } catch (error) {
      console.error('Error uploading multiple images to Cloudinary:', error);
      throw new Error(`Failed to upload images to Cloudinary: ${error.message}`);
    }
  }

  /**
   * Delete image from Cloudinary
   * @param {string} publicId - Cloudinary public ID
   * @returns {Promise<boolean>} Success status
   */
  async deleteImage(publicId) {
    try {
      await cloudinary.uploader.destroy(publicId);
      return true;
    } catch (error) {
      console.error('Error deleting from Cloudinary:', error);
      return false;
    }
  }

  /**
   * Get image information
   * @param {string} publicId - Cloudinary public ID
   * @returns {Promise<Object>} Image information
   */
  async getImageInfo(publicId) {
    try {
      const result = await cloudinary.api.resource(publicId);
      return result;
    } catch (error) {
      console.error('Error getting image info from Cloudinary:', error);
      throw new Error(`Failed to get image info: ${error.message}`);
    }
  }
}

export default CloudinaryService;
