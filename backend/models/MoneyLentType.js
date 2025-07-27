import mongoose from 'mongoose';

const moneyLentTypeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  totalAmount: {
    type: Number,
    default: 0
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

const MoneyLentType = mongoose.model('MoneyLentType', moneyLentTypeSchema);
export default MoneyLentType; 