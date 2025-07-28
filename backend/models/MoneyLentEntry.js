import mongoose from 'mongoose';

const moneyLentEntrySchema = new mongoose.Schema({
  typeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MoneyLentType',
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

const MoneyLentEntry = mongoose.model('MoneyLentEntry', moneyLentEntrySchema);
export default MoneyLentEntry; 