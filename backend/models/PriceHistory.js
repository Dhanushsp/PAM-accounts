import mongoose from 'mongoose';

const priceHistorySchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  oldPricePerPack: {
    type: Number,
    required: true
  },
  newPricePerPack: {
    type: Number,
    required: true
  },
  oldPricePerKg: {
    type: Number,
    required: true
  },
  newPricePerKg: {
    type: Number,
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updateDate: {
    type: Date,
    default: Date.now
  },
  reason: {
    type: String,
    default: 'Price update'
  }
}, {
  timestamps: true
});

// Index for efficient queries
priceHistorySchema.index({ productId: 1, updateDate: -1 });

const PriceHistory = mongoose.model('PriceHistory', priceHistorySchema);

export default PriceHistory; 