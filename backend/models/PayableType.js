import mongoose from 'mongoose';

const payableTypeSchema = new mongoose.Schema({
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

const PayableType = mongoose.model('PayableType', payableTypeSchema);
export default PayableType; 