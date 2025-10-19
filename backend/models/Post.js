import mongoose from 'mongoose';

const postSchema = new mongoose.Schema({
  topic: {
    type: String,
    required: true,
    enum: [
      'Coding question of the day',
      'Interview experience',
      'UI Testing',
      'API Testing',
      'Performance Testing',
      'SDET Tools',
      'AI in Testing'
    ]
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
