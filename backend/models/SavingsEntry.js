import mongoose from 'mongoose';

const savingsEntrySchema = new mongoose.Schema({
  typeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SavingsType',
    required: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  }
}, {
  timestamps: true
});

const SavingsEntry = mongoose.model('SavingsEntry', savingsEntrySchema);
export default SavingsEntry; 