import mongoose from 'mongoose';

const promoSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true
  },
  minPrice: {
    type: Number,
    required: true,
    min: 0
  },
  expiresAt: {
    type: Date,
    required: true
  },
  locations: [{
    type: String,
    required: true,
    trim: true
  }],
  store: {
    type: String,
    required: true,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for faster queries
promoSchema.index({ code: 1 });
promoSchema.index({ isActive: 1, expiresAt: 1 });

// Virtual for checking if promo is expired
promoSchema.virtual('isExpired').get(function() {
  return new Date() > this.expiresAt;
});

// Ensure virtual fields are serialized
promoSchema.set('toJSON', { virtuals: true });

export default mongoose.models.Promo || mongoose.model('Promo', promoSchema);