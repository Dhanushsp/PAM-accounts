import express from 'express';
import MoneyLentEntry from '../models/MoneyLentEntry.js';
import MoneyLentType from '../models/MoneyLentType.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Get all money lent entries for the user
router.get('/', auth, async (req, res) => {
  try {
    const entries = await MoneyLentEntry.find({ user: req.user.id })
      .populate('typeId', 'name')
      .sort({ date: -1 });
    
    res.json(entries);
  } catch (error) {
    console.error('Error fetching money lent entries:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new money lent entry
router.post('/', auth, async (req, res) => {
  try {
    const { typeId, date, amount } = req.body;
    
    if (!typeId || !amount || amount <= 0) {
      return res.status(400).json({ message: 'Valid typeId and amount are required' });
    }
    
    // Verify the money lent type exists and belongs to the user
    const moneyLentType = await MoneyLentType.findOne({
      _id: typeId,
      user: req.user.id
    });
    
    if (!moneyLentType) {
      return res.status(404).json({ message: 'Money lent type not found' });
    }
    
    const newEntry = new MoneyLentEntry({
      typeId,
      date: date || new Date(),
      amount,
      user: req.user.id
    });
    
    const savedEntry = await newEntry.save();
    
    // Update the money lent type total amount
    const allEntries = await MoneyLentEntry.find({ typeId });
    const totalAmount = allEntries.reduce((sum, entry) => sum + entry.amount, 0);
    await MoneyLentType.findByIdAndUpdate(typeId, { totalAmount });
    
    res.json(savedEntry);
  } catch (error) {
    console.error('Error creating money lent entry:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update a money lent entry
router.put('/:id', auth, async (req, res) => {
  try {
    const { typeId, date, amount } = req.body;
    
    if (!typeId || !amount || amount <= 0) {
      return res.status(400).json({ message: 'Valid typeId and amount are required' });
    }
    
    // Verify the money lent type exists and belongs to the user
    const moneyLentType = await MoneyLentType.findOne({
      _id: typeId,
      user: req.user.id
    });
    
    if (!moneyLentType) {
      return res.status(404).json({ message: 'Money lent type not found' });
    }
    
    const entry = await MoneyLentEntry.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { typeId, date: date || new Date(), amount },
      { new: true }
    );
    
    if (!entry) {
      return res.status(404).json({ message: 'Money lent entry not found' });
    }
    
    // Update the money lent type total amount
    const allEntries = await MoneyLentEntry.find({ typeId });
    const totalAmount = allEntries.reduce((sum, entry) => sum + entry.amount, 0);
    await MoneyLentType.findByIdAndUpdate(typeId, { totalAmount });
    
    res.json(entry);
  } catch (error) {
    console.error('Error updating money lent entry:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a money lent entry
router.delete('/:id', auth, async (req, res) => {
  try {
    const entry = await MoneyLentEntry.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id
    });
    
    if (!entry) {
      return res.status(404).json({ message: 'Money lent entry not found' });
    }
    
    // Update the money lent type total amount
    const allEntries = await MoneyLentEntry.find({ typeId: entry.typeId });
    const totalAmount = allEntries.reduce((sum, entry) => sum + entry.amount, 0);
    await MoneyLentType.findByIdAndUpdate(entry.typeId, { totalAmount });
    
    res.json({ message: 'Money lent entry deleted' });
  } catch (error) {
    console.error('Error deleting money lent entry:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router; 