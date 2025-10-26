import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';

class InstagramService {
  constructor() {
    this.accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
    this.accountId = process.env.INSTAGRAM_ACCOUNT_ID;
    this.baseUrl = 'https://graph.facebook.com/v18.0';
    
    if (!this.accessToken || !this.accountId) {
      throw new Error('Instagram access token and account ID are required');
    }
  }

  /**
   * Create a media container for single image
   * @param {string} imageUrl - URL of the image
   * @param {string} caption - Caption for the post
   * @returns {Promise<string>} Container ID
   */
  async createMediaContainer(imageUrl, caption) {
    try {
      const response = await axios.post(`${this.baseUrl}/${this.accountId}/media`, {
        image_url: imageUrl,
        caption: caption,
        access_token: this.accessToken
      });

      return response.data.id;
    } catch (error) {
      console.error('Error creating media container:', error.response?.data || error.message);
      throw new Error(`Failed to create media container: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * Create a media container for carousel (multiple images)
   * @param {Array} imageUrls - Array of image URLs
   * @param {string} caption - Caption for the post
   * @returns {Promise<string>} Container ID
   */
  async createCarouselContainer(imageUrls, caption) {
    try {
      const response = await axios.post(`${this.baseUrl}/${this.accountId}/media`, {
        media_type: 'CAROUSEL',
        children: imageUrls.join(','),
        caption: caption,
        access_token: this.accessToken
      });

      return response.data.id;
    } catch (error) {
      console.error('Error creating carousel container:', error.response?.data || error.message);
      throw new Error(`Failed to create carousel container: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * Create individual media containers for carousel items
   * @param {Array} imageUrls - Array of image URLs
   * @returns {Promise<Array>} Array of container IDs
   */
  async createCarouselItemContainers(imageUrls) {
    try {
      const containerPromises = imageUrls.map(imageUrl => 
        axios.post(`${this.baseUrl}/${this.accountId}/media`, {
          image_url: imageUrl,
          access_token: this.accessToken
        })
      );

      const responses = await Promise.all(containerPromises);
      return responses.map(response => response.data.id);
    } catch (error) {
      console.error('Error creating carousel item containers:', error.response?.data || error.message);
      throw new Error(`Failed to create carousel item containers: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * Publish a media container
   * @param {string} containerId - Container ID to publish
   * @returns {Promise<string>} Published media ID
   */
  async publishMedia(containerId) {
    try {
      const response = await axios.post(`${this.baseUrl}/${this.accountId}/media_publish`, {
        creation_id: containerId,
        access_token: this.accessToken
      });

      return response.data.id;
    } catch (error) {
      console.error('Error publishing media:', error.response?.data || error.message);
      throw new Error(`Failed to publish media: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * Check container status
   * @param {string} containerId - Container ID to check
   * @returns {Promise<Object>} Container status
   */
  async checkContainerStatus(containerId) {
    try {
      const response = await axios.get(`${this.baseUrl}/${containerId}`, {
        params: {
          fields: 'status_code',
          access_token: this.accessToken
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error checking container status:', error.response?.data || error.message);
      throw new Error(`Failed to check container status: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * Wait for container to be ready
   * @param {string} containerId - Container ID to wait for
   * @param {number} maxWaitTime - Maximum wait time in milliseconds
   * @returns {Promise<boolean>} True if ready, false if timeout
   */
  async waitForContainerReady(containerId, maxWaitTime = 300000) { // 5 minutes default
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWaitTime) {
      try {
        const status = await this.checkContainerStatus(containerId);
        
        if (status.status_code === 'FINISHED') {
          return true;
        } else if (status.status_code === 'ERROR') {
          throw new Error('Container processing failed');
        }
        
        // Wait 5 seconds before checking again
        await new Promise(resolve => setTimeout(resolve, 5000));
      } catch (error) {
        console.error('Error waiting for container:', error);
        throw error;
      }
    }
    
    throw new Error('Container processing timeout');
  }

  /**
   * Post single image to Instagram
   * @param {string} imageUrl - URL of the image
   * @param {string} caption - Caption for the post
   * @returns {Promise<Object>} Post result
   */
  async postSingleImage(imageUrl, caption) {
    try {
      console.log('Creating media container for single image...');
      const containerId = await this.createMediaContainer(imageUrl, caption);
      
      console.log('Waiting for container to be ready...');
      await this.waitForContainerReady(containerId);
      
      console.log('Publishing media...');
      const mediaId = await this.publishMedia(containerId);
      
      return {
        success: true,
        mediaId: mediaId,
        containerId: containerId,
        type: 'single'
      };
    } catch (error) {
      console.error('Error posting single image:', error);
      throw error;
    }
  }

  /**
   * Post carousel (multiple images) to Instagram
   * @param {Array} imageUrls - Array of image URLs
   * @param {string} caption - Caption for the post
   * @returns {Promise<Object>} Post result
   */
  async postCarousel(imageUrls, caption) {
    try {
      console.log('Creating carousel item containers...');
      const itemContainerIds = await this.createCarouselItemContainers(imageUrls);
      
      console.log('Waiting for item containers to be ready...');
      for (const containerId of itemContainerIds) {
        await this.waitForContainerReady(containerId);
      }
      
      console.log('Creating carousel container...');
      const carouselContainerId = await this.createCarouselContainer(itemContainerIds, caption);
      
      console.log('Waiting for carousel container to be ready...');
      await this.waitForContainerReady(carouselContainerId);
      
      console.log('Publishing carousel...');
      const mediaId = await this.publishMedia(carouselContainerId);
      
      return {
        success: true,
        mediaId: mediaId,
        containerId: carouselContainerId,
        itemContainerIds: itemContainerIds,
        type: 'carousel'
      };
    } catch (error) {
      console.error('Error posting carousel:', error);
      throw error;
    }
  }

  /**
   * Post images to Instagram (single or carousel)
   * @param {Array} imageUrls - Array of image URLs
   * @param {string} caption - Caption for the post
   * @returns {Promise<Object>} Post result
   */
  async postImages(imageUrls, caption) {
    try {
      if (!imageUrls || imageUrls.length === 0) {
        throw new Error('No image URLs provided');
      }

      if (imageUrls.length === 1) {
        return await this.postSingleImage(imageUrls[0], caption);
      } else {
        return await this.postCarousel(imageUrls, caption);
      }
    } catch (error) {
      console.error('Error posting images:', error);
      throw error;
    }
  }

  /**
   * Get media information
   * @param {string} mediaId - Media ID
   * @returns {Promise<Object>} Media information
   */
  async getMediaInfo(mediaId) {
    try {
      const response = await axios.get(`${this.baseUrl}/${mediaId}`, {
        params: {
          fields: 'id,media_type,media_url,permalink,timestamp,caption',
          access_token: this.accessToken
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error getting media info:', error.response?.data || error.message);
      throw new Error(`Failed to get media info: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * Delete a media post
   * @param {string} mediaId - Media ID to delete
   * @returns {Promise<boolean>} Success status
   */
  async deleteMedia(mediaId) {
    try {
      await axios.delete(`${this.baseUrl}/${mediaId}`, {
        params: {
          access_token: this.accessToken
        }
      });

      return true;
    } catch (error) {
      console.error('Error deleting media:', error.response?.data || error.message);
      return false;
    }
  }

  /**
   * Upload image file directly to Instagram (fallback method)
   * @param {string} filePath - Local file path
   * @param {string} caption - Caption for the post
   * @returns {Promise<Object>} Post result
   */
  async uploadImageFile(filePath, caption) {
    try {
      console.log(`Uploading local file to Instagram: ${filePath}`);
      
      if (!fs.existsSync(filePath)) {
        throw new Error(`File does not exist: ${filePath}`);
      }

      // Create FormData for file upload
      const form = new FormData();
      
      form.append('image', fs.createReadStream(filePath));
      form.append('caption', caption);
      form.append('access_token', this.accessToken);

      const response = await axios.post(`${this.baseUrl}/${this.accountId}/media`, form, {
        headers: {
          ...form.getHeaders(),
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      });

      const containerId = response.data.id;
      console.log(`Media container created: ${containerId}`);

      // Wait for container to be ready
      await this.waitForContainerReady(containerId);
      
      // Publish the media
      const mediaId = await this.publishMedia(containerId);
      
      return {
        success: true,
        mediaId: mediaId,
        containerId: containerId,
        type: 'single_image_file'
      };
    } catch (error) {
      console.error('Error uploading image file to Instagram:', error.response?.data || error.message);
      throw new Error(`Failed to upload image file: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * Get account information
   * @returns {Promise<Object>} Account information
   */
  async getAccountInfo() {
    try {
      const response = await axios.get(`${this.baseUrl}/${this.accountId}`, {
        params: {
          fields: 'id,username,account_type,media_count,followers_count,follows_count',
          access_token: this.accessToken
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error getting account info:', error.response?.data || error.message);
      throw new Error(`Failed to get account info: ${error.response?.data?.error?.message || error.message}`);
    }
  }
}

export default InstagramService;
