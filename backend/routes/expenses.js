import express from 'express';
import Expense from '../models/Expense.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// POST /api/expenses - Add a new expense
router.post('/', auth, async (req, res) => {
  try {
    const { date, amount, category, subcategory, description, photo } = req.body;
    if (!date || !amount || !category || !subcategory) {
      return res.status(400).json({ error: 'Missing required fields.' });
    }
    const expense = new Expense({
      date,
      amount,
      category,
      subcategory,
      description,
      photo,
    });
    await expense.save();
    res.status(201).json({ message: 'Expense added!', expense });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add expense.' });
  }
});

// (Optional) GET /api/expenses - List all expenses for the user
router.get('/', auth, async (req, res) => {
  try {
    const expenses = await Expense.find().sort({ date: -1 });
    res.json(expenses);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch expenses.' });
  }
});

// DELETE /api/expenses/:id - Delete an expense
router.delete('/:id', auth, async (req, res) => {
  try {
    const expense = await Expense.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id
    });
    
    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }
    
    res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    console.error('Error deleting expense:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router; 