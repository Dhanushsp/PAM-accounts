import express from 'express';
import SavingsEntry from '../models/SavingsEntry.js';
import SavingsType from '../models/SavingsType.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Get all savings entries for the user
router.get('/', auth, async (req, res) => {
  try {
    const entries = await SavingsEntry.find({ user: req.user.id })
      .populate('typeId', 'name')
      .sort({ date: -1 });
    
    res.json(entries);
  } catch (error) {
    console.error('Error fetching savings entries:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new savings entry
router.post('/', auth, async (req, res) => {
  try {
    const { typeId, date, amount } = req.body;
    
    if (!typeId || !amount || amount <= 0) {
      return res.status(400).json({ message: 'Valid typeId and amount are required' });
    }
    
    // Verify the savings type exists and belongs to the user
    const savingsType = await SavingsType.findOne({
      _id: typeId,
      user: req.user.id
    });
    
    if (!savingsType) {
      return res.status(404).json({ message: 'Savings type not found' });
    }
    
    const newEntry = new SavingsEntry({
      typeId,
      date: date || new Date(),
      amount,
      user: req.user.id
    });
    
    const savedEntry = await newEntry.save();
    
    // Update the savings type total amount
    const allEntries = await SavingsEntry.find({ typeId });
    const totalAmount = allEntries.reduce((sum, entry) => sum + entry.amount, 0);
    await SavingsType.findByIdAndUpdate(typeId, { totalAmount });
    
    res.json(savedEntry);
  } catch (error) {
    console.error('Error creating savings entry:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update a savings entry
router.put('/:id', auth, async (req, res) => {
  try {
    const { typeId, date, amount } = req.body;
    
    if (!typeId || !amount || amount <= 0) {
      return res.status(400).json({ message: 'Valid typeId and amount are required' });
    }
    
    // Verify the savings type exists and belongs to the user
    const savingsType = await SavingsType.findOne({
      _id: typeId,
      user: req.user.id
    });
    
    if (!savingsType) {
      return res.status(404).json({ message: 'Savings type not found' });
    }
    
    const entry = await SavingsEntry.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { typeId, date: date || new Date(), amount },
      { new: true }
    );
    
    if (!entry) {
      return res.status(404).json({ message: 'Savings entry not found' });
    }
    
    // Update the savings type total amount
    const allEntries = await SavingsEntry.find({ typeId });
    const totalAmount = allEntries.reduce((sum, entry) => sum + entry.amount, 0);
    await SavingsType.findByIdAndUpdate(typeId, { totalAmount });
    
    res.json(entry);
  } catch (error) {
    console.error('Error updating savings entry:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a savings entry
router.delete('/:id', auth, async (req, res) => {
  try {
    const entry = await SavingsEntry.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id
    });
    
    if (!entry) {
      return res.status(404).json({ message: 'Savings entry not found' });
    }
    
    // Update the savings type total amount
    const allEntries = await SavingsEntry.find({ typeId: entry.typeId });
    const totalAmount = allEntries.reduce((sum, entry) => sum + entry.amount, 0);
    await SavingsType.findByIdAndUpdate(entry.typeId, { totalAmount });
    
    res.json({ message: 'Savings entry deleted' });
  } catch (error) {
    console.error('Error deleting savings entry:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router; 