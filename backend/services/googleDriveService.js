import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import moment from 'moment';

class GoogleDriveService {
  constructor() {
    this.clientId = process.env.GOOGLE_DRIVE_CLIENT_ID;
    this.clientSecret = process.env.GOOGLE_DRIVE_CLIENT_SECRET;
    this.refreshToken = process.env.GOOGLE_DRIVE_REFRESH_TOKEN;
    this.folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
    
    // Check if Google Drive is configured
    const isConfigured = this.clientId && this.clientSecret && this.refreshToken && this.folderId;
    
    if (!isConfigured) {
      console.log('ℹ️  Google Drive backup is not configured (optional service)');
    } else {
      console.log('✓ Google Drive credentials found');
    }
    
    if (isConfigured) {
      this.oauth2Client = new google.auth.OAuth2(
        this.clientId,
        this.clientSecret,
        'urn:ietf:wg:oauth:2.0:oob'
      );
      
      this.oauth2Client.setCredentials({
        refresh_token: this.refreshToken
      });
      
      this.drive = google.drive({ version: 'v3', auth: this.oauth2Client });
    } else {
      this.oauth2Client = null;
      this.drive = null;
    }
  }

  /**
   * Test Google Drive connection
   * @returns {Promise<boolean>} Connection status
   */
  async testConnection() {
    try {
      // Check if credentials are configured
      if (!this.drive) {
        return false;
      }

      console.log('Testing Google Drive connection...');
      
      // Try to refresh the token
      await this.oauth2Client.getAccessToken();
      
      const response = await this.drive.about.get({
        fields: 'user,storageQuota'
      });
      console.log('✓ Google Drive connection successful');
      console.log('User:', response.data.user?.displayName);
      return true;
    } catch (error) {
      // Silently handle Google Drive errors as it's a backup service
      if (error.code === 'invalid_grant' || error.message?.includes('Token has been expired or revoked')) {
        console.log('⚠️  Google Drive authentication expired - skipping backup upload');
        console.log('💡 To re-enable Google Drive backup, see GOOGLE_DRIVE_SETUP.md');
      } else {
        console.log('⚠️  Google Drive connection failed - skipping backup');
      }
      return false;
    }
  }

  /**
   * Upload image to Google Drive
   * @param {string} filePath - Local file path
   * @param {string} topic - Topic for folder organization
   * @param {string} postId - Post ID for naming
   * @returns {Promise<Object>} Upload result with file ID and URL
   */
  async uploadImage(filePath, topic, postId) {
    if (!this.drive) {
      console.log('Google Drive not configured - skipping upload');
      return { success: false, fileName: path.basename(filePath), fileId: null };
    }
    
    try {
      console.log(`Uploading to Google Drive: ${filePath}`);
      
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        throw new Error(`File does not exist: ${filePath}`);
      }
      
      const fileName = path.basename(filePath);
      console.log(`Creating topic folder for: ${topic}`);
      const folderId = await this.getOrCreateTopicFolder(topic);
      console.log(`Using folder ID: ${folderId}`);
      
      const fileMetadata = {
        name: fileName,
        parents: [folderId]
      };

      const media = {
        mimeType: 'image/png',
        body: fs.createReadStream(filePath)
      };

      console.log(`Uploading file: ${fileName} to folder: ${folderId}`);
      const response = await this.drive.files.create({
        resource: fileMetadata,
        media: media,
        fields: 'id, webViewLink, webContentLink'
      });

      console.log(`File uploaded successfully. ID: ${response.data.id}`);

      // Make the file publicly accessible for Instagram
      console.log(`Setting public permissions for file: ${response.data.id}`);
      await this.drive.permissions.create({
        fileId: response.data.id,
        resource: {
          role: 'reader',
          type: 'anyone'
        }
      });

      console.log(`Upload completed for: ${fileName}`);
      
      // Generate direct image URL for Instagram
      const directImageUrl = `https://drive.google.com/uc?id=${response.data.id}&export=download`;
      
      return {
        success: true,
        fileId: response.data.id,
        webViewLink: response.data.webViewLink,
        webContentLink: response.data.webContentLink,
        directImageUrl: directImageUrl,
        fileName: fileName
      };
    } catch (error) {
      console.error('Error uploading to Google Drive:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        status: error.status
      });
      throw new Error(`Failed to upload to Google Drive: ${error.message}`);
    }
  }

  /**
   * Upload multiple images to Google Drive
   * @param {Array} filePaths - Array of local file paths
   * @param {string} topic - Topic for folder organization
   * @param {string} postId - Post ID for naming
   * @returns {Promise<Array>} Array of upload results
   */
  async uploadImages(filePaths, topic, postId) {
    if (!this.drive) {
      console.log('Google Drive not configured - skipping upload');
      return [];
    }
    
    try {
      const uploadPromises = filePaths.map((filePath, index) => {
        const fileName = `${postId}_${index + 1}_${path.basename(filePath)}`;
        return this.uploadImageWithCustomName(filePath, fileName, topic);
      });

      const results = await Promise.all(uploadPromises);
      return results;
    } catch (error) {
      console.error('Error uploading multiple images to Google Drive:', error);
      throw new Error(`Failed to upload images to Google Drive: ${error.message}`);
    }
  }

  /**
   * Upload image with custom name
   * @param {string} filePath - Local file path
   * @param {string} fileName - Custom file name
   * @param {string} topic - Topic for folder organization
   * @returns {Promise<Object>} Upload result
   */
  async uploadImageWithCustomName(filePath, fileName, topic) {
    if (!this.drive) {
      return { success: false, fileName, fileId: null };
    }
    
    try {
      const folderId = await this.getOrCreateTopicFolder(topic);
      
      const fileMetadata = {
        name: fileName,
        parents: [folderId]
      };

      const media = {
        mimeType: 'image/png',
        body: fs.createReadStream(filePath)
      };

      const response = await this.drive.files.create({
        resource: fileMetadata,
        media: media,
        fields: 'id, webViewLink, webContentLink'
      });

      // Make the file publicly accessible for Instagram
      await this.drive.permissions.create({
        fileId: response.data.id,
        resource: {
          role: 'reader',
          type: 'anyone'
        }
      });

      // Generate direct image URL for Instagram
      const directImageUrl = `https://drive.google.com/uc?id=${response.data.id}&export=download`;

      return {
        success: true,
        fileId: response.data.id,
        webViewLink: response.data.webViewLink,
        webContentLink: response.data.webContentLink,
        directImageUrl: directImageUrl,
        fileName: fileName
      };
    } catch (error) {
      console.error('Error uploading to Google Drive with custom name:', error);
      throw new Error(`Failed to upload to Google Drive: ${error.message}`);
    }
  }

  /**
   * Get or create folder for topic
   * @param {string} topic - Topic name
   * @returns {Promise<string>} Folder ID
   */
  async getOrCreateTopicFolder(topic) {
    if (!this.drive) {
      throw new Error('Google Drive not configured');
    }
    
    try {
      // First, try to find existing folder
      const existingFolder = await this.findFolderByName(topic, this.folderId);
      if (existingFolder) {
        return existingFolder.id;
      }

      // Create new folder if not found
      const folderMetadata = {
        name: topic,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [this.folderId]
      };

      const folder = await this.drive.files.create({
        resource: folderMetadata,
        fields: 'id'
      });

      return folder.data.id;
    } catch (error) {
      console.error('Error creating topic folder:', error);
      throw new Error(`Failed to create topic folder: ${error.message}`);
    }
  }

  /**
   * Find folder by name within parent folder
   * @param {string} folderName - Name of folder to find
   * @param {string} parentId - Parent folder ID
   * @returns {Promise<Object|null>} Folder object or null
   */
  async findFolderByName(folderName, parentId) {
    if (!this.drive) {
      return null;
    }
    
    try {
      const response = await this.drive.files.list({
        q: `name='${folderName}' and parents in '${parentId}' and mimeType='application/vnd.google-apps.folder'`,
        fields: 'files(id, name)'
      });

      return response.data.files.length > 0 ? response.data.files[0] : null;
    } catch (error) {
      console.error('Error finding folder:', error);
      return null;
    }
  }

  /**
   * Create daily folder within topic folder
   * @param {string} topic - Topic name
   * @param {Date} date - Date for the folder
   * @returns {Promise<string>} Daily folder ID
   */
  async createDailyFolder(topic, date = new Date()) {
    if (!this.drive) {
      throw new Error('Google Drive not configured');
    }
    
    try {
      const topicFolderId = await this.getOrCreateTopicFolder(topic);
      const dateString = moment(date).format('YYYY-MM-DD');
      const dailyFolderName = `${topic} - ${dateString}`;

      // Check if daily folder already exists
      const existingFolder = await this.findFolderByName(dailyFolderName, topicFolderId);
      if (existingFolder) {
        return existingFolder.id;
      }

      // Create daily folder
      const folderMetadata = {
        name: dailyFolderName,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [topicFolderId]
      };

      const folder = await this.drive.files.create({
        resource: folderMetadata,
        fields: 'id'
      });

      return folder.data.id;
    } catch (error) {
      console.error('Error creating daily folder:', error);
      throw new Error(`Failed to create daily folder: ${error.message}`);
    }
  }

  /**
   * Upload images to daily folder
   * @param {Array} filePaths - Array of local file paths
   * @param {string} topic - Topic for folder organization
   * @param {string} postId - Post ID for naming
   * @param {Date} date - Date for daily folder
   * @returns {Promise<Array>} Array of upload results
   */
  async uploadImagesToDailyFolder(filePaths, topic, postId, date = new Date()) {
    if (!this.drive) {
      console.log('Google Drive not configured - skipping upload');
      return [];
    }
    
    try {
      const dailyFolderId = await this.createDailyFolder(topic, date);
      const uploadPromises = filePaths.map((filePath, index) => {
        const fileName = `${postId}_${index + 1}_${path.basename(filePath)}`;
        return this.uploadImageToFolder(filePath, fileName, dailyFolderId);
      });

      const results = await Promise.all(uploadPromises);
      return results;
    } catch (error) {
      console.error('Error uploading to daily folder:', error);
      throw new Error(`Failed to upload to daily folder: ${error.message}`);
    }
  }

  /**
   * Upload image to specific folder
   * @param {string} filePath - Local file path
   * @param {string} fileName - File name
   * @param {string} folderId - Target folder ID
   * @returns {Promise<Object>} Upload result
   */
  async uploadImageToFolder(filePath, fileName, folderId) {
    if (!this.drive) {
      console.log('Google Drive not configured - skipping upload');
      return { success: false, fileName, fileId: null };
    }
    
    try {
      const fileMetadata = {
        name: fileName,
        parents: [folderId]
      };

      const media = {
        mimeType: 'image/png',
        body: fs.createReadStream(filePath)
      };

      const response = await this.drive.files.create({
        resource: fileMetadata,
        media: media,
        fields: 'id, webViewLink, webContentLink'
      });

      // Make the file publicly accessible for Instagram
      await this.drive.permissions.create({
        fileId: response.data.id,
        resource: {
          role: 'reader',
          type: 'anyone'
        }
      });

      // Generate direct image URL for Instagram
      const directImageUrl = `https://drive.google.com/uc?id=${response.data.id}&export=download`;

      return {
        success: true,
        fileId: response.data.id,
        webViewLink: response.data.webViewLink,
        webContentLink: response.data.webContentLink,
        directImageUrl: directImageUrl,
        fileName: fileName
      };
    } catch (error) {
      console.error('Error uploading to specific folder:', error);
      throw new Error(`Failed to upload to folder: ${error.message}`);
    }
  }

  /**
   * Delete file from Google Drive
   * @param {string} fileId - Google Drive file ID
   * @returns {Promise<boolean>} Success status
   */
  async deleteFile(fileId) {
    if (!this.drive) {
      console.log('Google Drive not configured - cannot delete file');
      return false;
    }
    
    try {
      await this.drive.files.delete({
        fileId: fileId
      });
      return true;
    } catch (error) {
      console.error('Error deleting file from Google Drive:', error);
      return false;
    }
  }

  /**
   * Get file information
   * @param {string} fileId - Google Drive file ID
   * @returns {Promise<Object>} File information
   */
  async getFileInfo(fileId) {
    if (!this.drive) {
      throw new Error('Google Drive not configured');
    }
    
    try {
      const response = await this.drive.files.get({
        fileId: fileId,
        fields: 'id, name, webViewLink, webContentLink, createdTime, size'
      });

      return response.data;
    } catch (error) {
      console.error('Error getting file info:', error);
      throw new Error(`Failed to get file info: ${error.message}`);
    }
  }
}

export default GoogleDriveService;
