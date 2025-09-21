import mongoose from 'mongoose';

const clientSchema = new mongoose.Schema({
  telegramId: {
    type: String,
    required: true,
    unique: true
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    trim: true
  },
  username: {
    type: String,
    trim: true
  },
  language: {
    type: String,
    default: 'en',
    trim: true
  },
  languageSelected: {
    type: Boolean,
    default: false
  },
  joinedAt: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for faster queries
clientSchema.index({ telegramId: 1 });
clientSchema.index({ isActive: 1 });

export default mongoose.models.Client || mongoose.model('Client', clientSchema);