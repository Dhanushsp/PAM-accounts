import express from 'express';
import MoneyLentType from '../models/MoneyLentType.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Get all money lent types for the user
router.get('/', auth, async (req, res) => {
  try {
    const moneyLentTypes = await MoneyLentType.find({ user: req.user.id });
    
    // Calculate total amount for each type by aggregating entries
    const typesWithEntries = await Promise.all(
      moneyLentTypes.map(async (type) => {
        const MoneyLentEntry = (await import('../models/MoneyLentEntry.js')).default;
        const entries = await MoneyLentEntry.find({ typeId: type._id });
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
    console.error('Error fetching money lent types:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new money lent type
router.post('/', auth, async (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name || name.trim() === '') {
      return res.status(400).json({ message: 'Name is required' });
    }
    
    const newMoneyLentType = new MoneyLentType({
      name: name.trim(),
      user: req.user.id
    });
    
    const savedType = await newMoneyLentType.save();
    res.json({
      _id: savedType._id,
      name: savedType.name,
      totalAmount: 0,
      entries: []
    });
  } catch (error) {
    console.error('Error creating money lent type:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update a money lent type
router.put('/:id', auth, async (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name || name.trim() === '') {
      return res.status(400).json({ message: 'Name is required' });
    }
    
    const moneyLentType = await MoneyLentType.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { name: name.trim() },
      { new: true }
    );
    
    if (!moneyLentType) {
      return res.status(404).json({ message: 'Money lent type not found' });
    }
    
    res.json(moneyLentType);
  } catch (error) {
    console.error('Error updating money lent type:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a money lent type
router.delete('/:id', auth, async (req, res) => {
  try {
    const moneyLentType = await MoneyLentType.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id
    });
    
    if (!moneyLentType) {
      return res.status(404).json({ message: 'Money lent type not found' });
    }
    
    // Also delete all entries for this type
    const MoneyLentEntry = (await import('../models/MoneyLentEntry.js')).default;
    await MoneyLentEntry.deleteMany({ typeId: req.params.id });
    
    res.json({ message: 'Money lent type deleted' });
  } catch (error) {
    console.error('Error deleting money lent type:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router; 