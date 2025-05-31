import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  contact: { type: String, required: true },
  credit: { type: Number, required: true },
  date: { type: Date, default: Date.now }
});

export default mongoose.model('Customer', customerSchema);
