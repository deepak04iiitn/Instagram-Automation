import mongoose from 'mongoose';

const approvalSchema = new mongoose.Schema({
  postId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    required: true
  },
  emailSentAt: {
    type: Date,
    default: Date.now
  },
  action: {
    type: String,
    enum: ['pending', 'accept', 'decline', 'retry'],
    default: 'pending',
    required: true
  },
  actionTakenAt: {
    type: Date,
    default: null
  },
  adminEmail: {
    type: String,
    required: true
  },
  emailId: {
    type: String
  }
}, {
  timestamps: true
});

export default mongoose.model('Approval', approvalSchema);
