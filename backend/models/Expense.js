import mongoose from 'mongoose';

const ExpenseSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  amount: { type: Number, required: true },
  category: { type: String, required: true },
  subcategory: { type: String, required: true },
  description: { type: String },
  photo: { type: String }, // Cloudinary URL
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('Expense', ExpenseSchema); 