import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  messageId: {
    type: String,
    required: true
  },
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['text', 'command', 'photo', 'sticker', 'document', 'voice', 'video', 'location', 'contact']
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  direction: {
    type: String,
    required: true,
    enum: ['incoming', 'outgoing']
  },
  timestamp: {
    type: Date,
    required: true
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Index for faster queries
messageSchema.index({ clientId: 1, timestamp: -1 });
messageSchema.index({ type: 1 });
messageSchema.index({ direction: 1 });

export default mongoose.models.Message || mongoose.model('Message', messageSchema);