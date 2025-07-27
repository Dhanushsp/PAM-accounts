import express from 'express';
import PayableType from '../models/PayableType.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Get all payable types for the user
router.get('/', auth, async (req, res) => {
  try {
    const payableTypes = await PayableType.find({ user: req.user.id });
    
    // Calculate total amount for each type by aggregating entries
    const typesWithEntries = await Promise.all(
      payableTypes.map(async (type) => {
        const PayableEntry = (await import('../models/PayableEntry.js')).default;
        const entries = await PayableEntry.find({ typeId: type._id });
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
    console.error('Error fetching payable types:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new payable type
router.post('/', auth, async (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name || name.trim() === '') {
      return res.status(400).json({ message: 'Name is required' });
    }
    
    const newPayableType = new PayableType({
      name: name.trim(),
      user: req.user.id
    });
    
    const savedType = await newPayableType.save();
    res.json({
      _id: savedType._id,
      name: savedType.name,
      totalAmount: 0,
      entries: []
    });
  } catch (error) {
    console.error('Error creating payable type:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update a payable type
router.put('/:id', auth, async (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name || name.trim() === '') {
      return res.status(400).json({ message: 'Name is required' });
    }
    
    const payableType = await PayableType.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { name: name.trim() },
      { new: true }
    );
    
    if (!payableType) {
      return res.status(404).json({ message: 'Payable type not found' });
    }
    
    res.json(payableType);
  } catch (error) {
    console.error('Error updating payable type:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a payable type
router.delete('/:id', auth, async (req, res) => {
  try {
    const payableType = await PayableType.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id
    });
    
    if (!payableType) {
      return res.status(404).json({ message: 'Payable type not found' });
    }
    
    // Also delete all entries for this type
    const PayableEntry = (await import('../models/PayableEntry.js')).default;
    await PayableEntry.deleteMany({ typeId: req.params.id });
    
    res.json({ message: 'Payable type deleted' });
  } catch (error) {
    console.error('Error deleting payable type:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router; 