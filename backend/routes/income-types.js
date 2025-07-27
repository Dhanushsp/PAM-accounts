import express from 'express';
import IncomeType from '../models/IncomeType.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Get all income types for the user
router.get('/', auth, async (req, res) => {
  try {
    const incomeTypes = await IncomeType.find({ user: req.user.id });
    
    // Calculate total amount for each type by aggregating entries
    const typesWithEntries = await Promise.all(
      incomeTypes.map(async (type) => {
        const IncomeEntry = (await import('../models/IncomeEntry.js')).default;
        const entries = await IncomeEntry.find({ typeId: type._id });
        const totalAmount = entries.reduce((sum, entry) => sum + entry.amount, 0);
        
        return {
          _id: type._id,
          name: type.name,
          totalAmount,
          entries: entries.map(entry => ({
            _id: entry._id,
            date: entry.date,
            amount: entry.amount,
            typeId: entry.typeId,
            isFromSavings: entry.isFromSavings,
            savingsTypeId: entry.savingsTypeId
          }))
        };
      })
    );
    
    res.json(typesWithEntries);
  } catch (error) {
    console.error('Error fetching income types:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new income type
router.post('/', auth, async (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name || name.trim() === '') {
      return res.status(400).json({ message: 'Name is required' });
    }
    
    const newIncomeType = new IncomeType({
      name: name.trim(),
      user: req.user.id
    });
    
    const savedType = await newIncomeType.save();
    res.json({
      _id: savedType._id,
      name: savedType.name,
      totalAmount: 0,
      entries: []
    });
  } catch (error) {
    console.error('Error creating income type:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update an income type
router.put('/:id', auth, async (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name || name.trim() === '') {
      return res.status(400).json({ message: 'Name is required' });
    }
    
    const incomeType = await IncomeType.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { name: name.trim() },
      { new: true }
    );
    
    if (!incomeType) {
      return res.status(404).json({ message: 'Income type not found' });
    }
    
    res.json(incomeType);
  } catch (error) {
    console.error('Error updating income type:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete an income type
router.delete('/:id', auth, async (req, res) => {
  try {
    const incomeType = await IncomeType.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id
    });
    
    if (!incomeType) {
      return res.status(404).json({ message: 'Income type not found' });
    }
    
    // Also delete all entries for this type
    const IncomeEntry = (await import('../models/IncomeEntry.js')).default;
    await IncomeEntry.deleteMany({ typeId: req.params.id });
    
    res.json({ message: 'Income type deleted' });
  } catch (error) {
    console.error('Error deleting income type:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router; 