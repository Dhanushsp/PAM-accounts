import express from 'express';
import SavingsType from '../models/SavingsType.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Get all savings types for the user
router.get('/', auth, async (req, res) => {
  try {
    const savingsTypes = await SavingsType.find({ user: req.user.id });
    
    // Calculate total amount for each type by aggregating entries
    const typesWithEntries = await Promise.all(
      savingsTypes.map(async (type) => {
        const SavingsEntry = (await import('../models/SavingsEntry.js')).default;
        const entries = await SavingsEntry.find({ typeId: type._id });
        const totalAmount = entries.reduce((sum, entry) => sum + entry.amount, 0);
        
        return {
          _id: type._id,
          name: type.name,
          totalAmount,
          entries: entries.map(entry => ({
            _id: entry._id,
            date: entry.date,
            amount: entry.amount,
            typeId: entry.typeId
          }))
        };
      })
    );
    
    res.json(typesWithEntries);
  } catch (error) {
    console.error('Error fetching savings types:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new savings type
router.post('/', auth, async (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name || name.trim() === '') {
      return res.status(400).json({ message: 'Name is required' });
    }
    
    const newSavingsType = new SavingsType({
      name: name.trim(),
      user: req.user.id
    });
    
    const savedType = await newSavingsType.save();
    res.json({
      _id: savedType._id,
      name: savedType.name,
      totalAmount: 0,
      entries: []
    });
  } catch (error) {
    console.error('Error creating savings type:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update a savings type
router.put('/:id', auth, async (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name || name.trim() === '') {
      return res.status(400).json({ message: 'Name is required' });
    }
    
    const savingsType = await SavingsType.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { name: name.trim() },
      { new: true }
    );
    
    if (!savingsType) {
      return res.status(404).json({ message: 'Savings type not found' });
    }
    
    res.json(savingsType);
  } catch (error) {
    console.error('Error updating savings type:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a savings type
router.delete('/:id', auth, async (req, res) => {
  try {
    const savingsType = await SavingsType.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id
    });
    
    if (!savingsType) {
      return res.status(404).json({ message: 'Savings type not found' });
    }
    
    // Also delete all entries for this type
    const SavingsEntry = (await import('../models/SavingsEntry.js')).default;
    await SavingsEntry.deleteMany({ typeId: req.params.id });
    
    res.json({ message: 'Savings type deleted' });
  } catch (error) {
    console.error('Error deleting savings type:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router; 