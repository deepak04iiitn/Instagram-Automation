import mongoose from 'mongoose';

const postSchema = new mongoose.Schema({
  topic: {
    type: String,
    required: true
    // Removed enum restriction to allow dynamic prompts
  },
  content: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'declined', 'retry', 'posted', 'failed'],
    default: 'pending'
  },
  generatedAt: {
    type: Date,
    default: Date.now
  },
  approvedAt: {
    type: Date
  },
  postedAt: {
    type: Date
  },
  instagramPostId: {
    type: String
  },
  images: [{
    localPath: String,
    cloudinaryId: String,
    cloudinaryUrl: String,
    googleDriveId: String,
    googleDriveUrl: String
  }],
  retryCount: {
    type: Number,
    default: 0
  },
  maxRetries: {
    type: Number,
    default: 3
  },
  errorMessage: {
    type: String
  }
}, {
  timestamps: true
});

export default mongoose.model('Post', postSchema);