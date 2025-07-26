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

export default router; 