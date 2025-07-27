import mongoose from 'mongoose';

const incomeTypeSchema = new mongoose.Schema({
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

const IncomeType = mongoose.model('IncomeType', incomeTypeSchema);
export default IncomeType; 