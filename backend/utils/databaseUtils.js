import mongoose from 'mongoose';

/**
 * Database utility functions for improved connection management
 */
class DatabaseUtils {
  /**
   * Check if database connection is ready
   * @returns {boolean} True if connection is ready
   */
  static isConnected() {
    return mongoose.connection.readyState === 1;
  }

  /**
   * Ensure database connection is ready
   * @returns {Promise<boolean>} True if connection is ready or reconnected
   */
  static async ensureConnection() {
    if (this.isConnected()) {
      return true;
    }

    console.warn('⚠️ Database connection not ready, attempting to reconnect...');
    
    try {
      // Close existing connection if any
      if (mongoose.connection.readyState !== 0) {
        await mongoose.connection.close();
      }

      // Reconnect with proper configuration
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/instagram-automation', {
        serverSelectionTimeoutMS: 30000,
        socketTimeoutMS: 45000,
        connectTimeoutMS: 30000,
        maxPoolSize: 10,
        minPoolSize: 5,
        maxIdleTimeMS: 30000,
        bufferCommands: false,
        retryWrites: true,
        retryReads: true,
      });

      console.log('✅ Database reconnected successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to reconnect to database:', error.message);
      return false;
    }
  }

  /**
   * Execute a database operation with connection check
   * @param {Function} operation - The database operation to execute
   * @param {number} maxRetries - Maximum number of retries
   * @returns {Promise<any>} Result of the operation
   */
  static async executeWithRetry(operation, maxRetries = 3) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Ensure connection is ready
        const isConnected = await this.ensureConnection();
        if (!isConnected) {
          throw new Error('Failed to establish database connection');
        }

        // Execute the operation
        return await operation();
      } catch (error) {
        lastError = error;
        console.warn(`⚠️ Database operation attempt ${attempt} failed:`, error.message);
        
        if (attempt < maxRetries) {
          // Wait before retrying (exponential backoff)
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
          console.log(`⏳ Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw new Error(`Database operation failed after ${maxRetries} attempts: ${lastError.message}`);
  }

  /**
   * Save a document with retry logic
   * @param {mongoose.Document} doc - The document to save
   * @param {number} maxRetries - Maximum number of retries
   * @returns {Promise<mongoose.Document>} Saved document
   */
  static async saveWithRetry(doc, maxRetries = 3) {
    return this.executeWithRetry(async () => {
      return await doc.save();
    }, maxRetries);
  }

  /**
   * Create a document with retry logic
   * @param {mongoose.Model} Model - The model to create document in
   * @param {Object} data - The data to create document with
   * @param {number} maxRetries - Maximum number of retries
   * @returns {Promise<mongoose.Document>} Created document
   */
  static async createWithRetry(Model, data, maxRetries = 3) {
    return this.executeWithRetry(async () => {
      return await Model.create(data);
    }, maxRetries);
  }

  /**
   * Find documents with retry logic
   * @param {mongoose.Model} Model - The model to query
   * @param {Object} query - The query object
   * @param {Object} options - Query options
   * @param {number} maxRetries - Maximum number of retries
   * @returns {Promise<Array>} Found documents
   */
  static async findWithRetry(Model, query = {}, options = {}, maxRetries = 3) {
    return this.executeWithRetry(async () => {
      return await Model.find(query, null, options);
    }, maxRetries);
  }

  /**
   * Find one document with retry logic
   * @param {mongoose.Model} Model - The model to query
   * @param {Object} query - The query object
   * @param {Object} options - Query options
   * @param {number} maxRetries - Maximum number of retries
   * @returns {Promise<mongoose.Document|null>} Found document or null
   */
  static async findOneWithRetry(Model, query = {}, options = {}, maxRetries = 3) {
    return this.executeWithRetry(async () => {
      return await Model.findOne(query, null, options);
    }, maxRetries);
  }

  /**
   * Update documents with retry logic
   * @param {mongoose.Model} Model - The model to update
   * @param {Object} query - The query object
   * @param {Object} update - The update object
   * @param {Object} options - Update options
   * @param {number} maxRetries - Maximum number of retries
   * @returns {Promise<mongoose.UpdateWriteOpResult>} Update result
   */
  static async updateWithRetry(Model, query, update, options = {}, maxRetries = 3) {
    return this.executeWithRetry(async () => {
      return await Model.updateMany(query, update, options);
    }, maxRetries);
  }

  /**
   * Delete documents with retry logic
   * @param {mongoose.Model} Model - The model to delete from
   * @param {Object} query - The query object
   * @param {Object} options - Delete options
   * @param {number} maxRetries - Maximum number of retries
   * @returns {Promise<mongoose.DeleteResult>} Delete result
   */
  static async deleteWithRetry(Model, query, options = {}, maxRetries = 3) {
    return this.executeWithRetry(async () => {
      return await Model.deleteMany(query, options);
    }, maxRetries);
  }
}

export default DatabaseUtils;
