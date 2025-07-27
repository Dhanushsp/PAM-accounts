import express from 'express';
import IncomeEntry from '../models/IncomeEntry.js';
import IncomeType from '../models/IncomeType.js';
import SavingsType from '../models/SavingsType.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Get all income entries for the user
router.get('/', auth, async (req, res) => {
  try {
    const entries = await IncomeEntry.find({ user: req.user.id })
      .populate('typeId', 'name')
      .populate('savingsTypeId', 'name')
      .sort({ date: -1 });
    
    res.json(entries);
  } catch (error) {
    console.error('Error fetching income entries:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new income entry
router.post('/', auth, async (req, res) => {
  try {
    const { typeId, date, amount, isFromSavings, savingsTypeId } = req.body;
    
    if (!typeId || !amount || amount <= 0) {
      return res.status(400).json({ message: 'Valid typeId and amount are required' });
    }
    
    // Verify the income type exists and belongs to the user
    const incomeType = await IncomeType.findOne({
      _id: typeId,
      user: req.user.id
    });
    
    if (!incomeType) {
      return res.status(404).json({ message: 'Income type not found' });
    }
    
    // If income is from savings, verify savings type exists and deduct from savings
    if (isFromSavings && savingsTypeId) {
      const savingsType = await SavingsType.findOne({
        _id: savingsTypeId,
        user: req.user.id
      });
      
      if (!savingsType) {
        return res.status(404).json({ message: 'Savings type not found' });
      }
      
      // Deduct amount from savings
      const SavingsEntry = (await import('../models/SavingsEntry.js')).default;
      const savingsEntries = await SavingsEntry.find({ typeId: savingsTypeId });
      const currentSavingsTotal = savingsEntries.reduce((sum, entry) => sum + entry.amount, 0);
      
      if (currentSavingsTotal < amount) {
        return res.status(400).json({ message: 'Insufficient savings balance' });
      }
      
      // Create a negative savings entry to deduct the amount
      const deductionEntry = new SavingsEntry({
        typeId: savingsTypeId,
        date: date || new Date(),
        amount: -amount, // Negative amount to deduct
        user: req.user.id
      });
      
      await deductionEntry.save();
      
      // Update savings type total
      const updatedSavingsEntries = await SavingsEntry.find({ typeId: savingsTypeId });
      const newSavingsTotal = updatedSavingsEntries.reduce((sum, entry) => sum + entry.amount, 0);
      await SavingsType.findByIdAndUpdate(savingsTypeId, { totalAmount: newSavingsTotal });
    }
    
    const newEntry = new IncomeEntry({
      typeId,
      date: date || new Date(),
      amount,
      isFromSavings: isFromSavings || false,
      savingsTypeId: isFromSavings ? savingsTypeId : null,
      user: req.user.id
    });
    
    const savedEntry = await newEntry.save();
    
    // Update the income type total amount
    const allEntries = await IncomeEntry.find({ typeId });
    const totalAmount = allEntries.reduce((sum, entry) => sum + entry.amount, 0);
    await IncomeType.findByIdAndUpdate(typeId, { totalAmount });
    
    res.json(savedEntry);
  } catch (error) {
    console.error('Error creating income entry:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update an income entry
router.put('/:id', auth, async (req, res) => {
  try {
    const { typeId, date, amount, isFromSavings, savingsTypeId } = req.body;
    
    if (!typeId || !amount || amount <= 0) {
      return res.status(400).json({ message: 'Valid typeId and amount are required' });
    }
    
    // Verify the income type exists and belongs to the user
    const incomeType = await IncomeType.findOne({
      _id: typeId,
      user: req.user.id
    });
    
    if (!incomeType) {
      return res.status(404).json({ message: 'Income type not found' });
    }
    
    const entry = await IncomeEntry.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { 
        typeId, 
        date: date || new Date(), 
        amount,
        isFromSavings: isFromSavings || false,
        savingsTypeId: isFromSavings ? savingsTypeId : null
      },
      { new: true }
    );
    
    if (!entry) {
      return res.status(404).json({ message: 'Income entry not found' });
    }
    
    // Update the income type total amount
    const allEntries = await IncomeEntry.find({ typeId });
    const totalAmount = allEntries.reduce((sum, entry) => sum + entry.amount, 0);
    await IncomeType.findByIdAndUpdate(typeId, { totalAmount });
    
    res.json(entry);
  } catch (error) {
    console.error('Error updating income entry:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete an income entry
router.delete('/:id', auth, async (req, res) => {
  try {
    const entry = await IncomeEntry.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id
    });
    
    if (!entry) {
      return res.status(404).json({ message: 'Income entry not found' });
    }
    
    // Update the income type total amount
    const allEntries = await IncomeEntry.find({ typeId: entry.typeId });
    const totalAmount = allEntries.reduce((sum, entry) => sum + entry.amount, 0);
    await IncomeType.findByIdAndUpdate(entry.typeId, { totalAmount });
    
    res.json({ message: 'Income entry deleted' });
  } catch (error) {
    console.error('Error deleting income entry:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router; 