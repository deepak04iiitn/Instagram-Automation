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
    
    // Log configuration (without exposing sensitive data)
    console.log('Instagram Service initialized:');
    console.log(`- Account ID: ${this.accountId}`);
    console.log(`- Access Token: ${this.accessToken ? `${this.accessToken.substring(0, 10)}...` : 'NOT SET'}`);
    console.log(`- Base URL: ${this.baseUrl}`);
  }

  /**
   * Create a media container for single image
   * @param {string} imageUrl - URL of the image
   * @param {string} caption - Caption for the post
   * @returns {Promise<string>} Container ID
   */
  async createMediaContainer(imageUrl, caption) {
    try {
      // Validate URL before sending to Instagram API
      console.log(`Validating single image URL: ${imageUrl}`);
      
      if (!imageUrl || typeof imageUrl !== 'string') {
        throw new Error(`Invalid image URL: ${imageUrl}`);
      }
      
      if (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://')) {
        throw new Error(`Image URL is not a valid HTTP/HTTPS URL: ${imageUrl}`);
      }

      console.log(`Creating single media container for: ${imageUrl}`);
      const response = await axios.post(`${this.baseUrl}/${this.accountId}/media`, {
        image_url: imageUrl,
        caption: caption,
        access_token: this.accessToken
      });

      console.log(`✅ Single media container created successfully: ${response.data.id}`);
      return response.data.id;
    } catch (error) {
      console.error('❌ Error creating media container:');
      console.error('Error type:', error.constructor.name);
      console.error('Error message:', error.message);
      
      if (error.response) {
        console.error('HTTP Status:', error.response.status);
        console.error('Response Data:', JSON.stringify(error.response.data, null, 2));
      }
      
      let errorMessage = 'Failed to create media container';
      if (error.response?.data?.error) {
        const apiError = error.response.data.error;
        errorMessage += `: ${apiError.message || 'Unknown API error'}`;
        if (apiError.code) {
          errorMessage += ` (Code: ${apiError.code})`;
        }
      } else if (error.message) {
        errorMessage += `: ${error.message}`;
      }
      
      throw new Error(errorMessage);
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
      console.log(`Creating carousel container with ${imageUrls.length} items`);
      console.log('Container IDs:', imageUrls);
      
      const response = await axios.post(`${this.baseUrl}/${this.accountId}/media`, {
        media_type: 'CAROUSEL',
        children: imageUrls.join(','),
        caption: caption,
        access_token: this.accessToken
      });

      console.log(`✅ Carousel container created successfully: ${response.data.id}`);
      return response.data.id;
    } catch (error) {
      console.error('❌ Error creating carousel container:');
      console.error('Error type:', error.constructor.name);
      console.error('Error message:', error.message);
      
      if (error.response) {
        console.error('HTTP Status:', error.response.status);
        console.error('Response Data:', JSON.stringify(error.response.data, null, 2));
      }
      
      let errorMessage = 'Failed to create carousel container';
      if (error.response?.data?.error) {
        const apiError = error.response.data.error;
        errorMessage += `: ${apiError.message || 'Unknown API error'}`;
        if (apiError.code) {
          errorMessage += ` (Code: ${apiError.code})`;
        }
      } else if (error.message) {
        errorMessage += `: ${error.message}`;
      }
      
      throw new Error(errorMessage);
    }
  }

  /**
   * Create individual media containers for carousel items
   * @param {Array} imageUrls - Array of image URLs
   * @returns {Promise<Array>} Array of container IDs
   */
  async createCarouselItemContainers(imageUrls) {
    try {
      // Validate URLs before sending to Instagram API
      console.log('Validating image URLs for Instagram API...');
      for (let i = 0; i < imageUrls.length; i++) {
        const url = imageUrls[i];
        console.log(`URL ${i + 1}: ${url}`);
        
        if (!url || typeof url !== 'string') {
          throw new Error(`Invalid URL at index ${i}: ${url}`);
        }
        
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
          throw new Error(`URL at index ${i} is not a valid HTTP/HTTPS URL: ${url}`);
        }
      }

      console.log(`Creating ${imageUrls.length} carousel item containers...`);
      const containerPromises = imageUrls.map(async (imageUrl, index) => {
        try {
          console.log(`Creating container for URL ${index + 1}: ${imageUrl}`);
          const response = await axios.post(`${this.baseUrl}/${this.accountId}/media`, {
            image_url: imageUrl,
            access_token: this.accessToken
          });
          console.log(`✅ Container ${index + 1} created successfully: ${response.data.id}`);
          return response;
        } catch (error) {
          console.error(`❌ Failed to create container ${index + 1} for URL: ${imageUrl}`);
          console.error(`Error details:`, {
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data,
            message: error.message
          });
          throw error;
        }
      });

      const responses = await Promise.all(containerPromises);
      const containerIds = responses.map(response => response.data.id);
      console.log(`✅ All ${containerIds.length} carousel item containers created successfully`);
      return containerIds;
    } catch (error) {
      console.error('❌ Error creating carousel item containers:');
      console.error('Error type:', error.constructor.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      
      if (error.response) {
        console.error('HTTP Status:', error.response.status);
        console.error('HTTP Status Text:', error.response.statusText);
        console.error('Response Data:', JSON.stringify(error.response.data, null, 2));
        console.error('Response Headers:', error.response.headers);
      }
      
      if (error.request) {
        console.error('Request details:', {
          url: error.config?.url,
          method: error.config?.method,
          headers: error.config?.headers
        });
      }
      
      // Provide more specific error messages based on the error type
      let errorMessage = 'Failed to create carousel item containers';
      if (error.response?.data?.error) {
        const apiError = error.response.data.error;
        errorMessage += `: ${apiError.message || 'Unknown API error'}`;
        if (apiError.code) {
          errorMessage += ` (Code: ${apiError.code})`;
        }
        if (apiError.error_subcode) {
          errorMessage += ` (Subcode: ${apiError.error_subcode})`;
        }
      } else if (error.message) {
        errorMessage += `: ${error.message}`;
      }
      
      throw new Error(errorMessage);
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

  /**
   * Test Instagram API connection and validate access token
   * @returns {Promise<Object>} Connection test result
   */
  async testConnection() {
    try {
      console.log('Testing Instagram API connection...');
      
      // Test account info endpoint
      const response = await axios.get(`${this.baseUrl}/${this.accountId}`, {
        params: {
          fields: 'id,username,account_type',
          access_token: this.accessToken
        },
        timeout: 10000
      });
      
      console.log('✅ Instagram API connection successful');
      console.log('Account info:', response.data);
      
      return {
        success: true,
        accountInfo: response.data,
        message: 'Instagram API connection is working'
      };
    } catch (error) {
      console.error('❌ Instagram API connection failed:');
      console.error('Error type:', error.constructor.name);
      console.error('Error message:', error.message);
      
      if (error.response) {
        console.error('HTTP Status:', error.response.status);
        console.error('Response Data:', JSON.stringify(error.response.data, null, 2));
      }
      
      return {
        success: false,
        error: error.message,
        status: error.response?.status,
        responseData: error.response?.data,
        message: 'Instagram API connection failed'
      };
    }
  }

  /**
   * Test if a URL is accessible and returns an image
   * @param {string} url - URL to test
   * @returns {Promise<boolean>} True if accessible
   */
  async testUrlAccessibility(url) {
    try {
      console.log(`Testing URL accessibility: ${url}`);
      const response = await axios.head(url, {
        timeout: 10000,
        maxRedirects: 5
      });
      
      const contentType = response.headers['content-type'];
      const isImage = contentType && contentType.startsWith('image/');
      
      console.log(`URL test result: ${response.status} - Content-Type: ${contentType} - Is Image: ${isImage}`);
      return response.status === 200 && isImage;
    } catch (error) {
      console.error(`URL accessibility test failed for ${url}:`, error.message);
      return false;
    }
  }
}

export default InstagramService;
