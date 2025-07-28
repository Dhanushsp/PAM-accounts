import mongoose from 'mongoose';

const incomeEntrySchema = new mongoose.Schema({
  typeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'IncomeType',
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
  isFromSavings: {
    type: Boolean,
    default: false
  },
  savingsTypeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SavingsType'
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  }
}, {
  timestamps: true
});

const IncomeEntry = mongoose.model('IncomeEntry', incomeEntrySchema);
export default IncomeEntry; 