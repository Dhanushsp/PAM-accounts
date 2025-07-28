import mongoose from 'mongoose';

const savingsTypeSchema = new mongoose.Schema({
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
    ref: 'Admin',
    required: true
  }
}, {
  timestamps: true
});

const SavingsType = mongoose.model('SavingsType', savingsTypeSchema);
export default SavingsType; 