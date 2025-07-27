import express from 'express';
import PayableEntry from '../models/PayableEntry.js';
import PayableType from '../models/PayableType.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Get all payable entries for the user
router.get('/', auth, async (req, res) => {
  try {
    const entries = await PayableEntry.find({ user: req.user.id })
      .populate('typeId', 'name')
      .sort({ date: -1 });
    
    res.json(entries);
  } catch (error) {
    console.error('Error fetching payable entries:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new payable entry
router.post('/', auth, async (req, res) => {
  try {
    const { typeId, date, amount } = req.body;
    
    if (!typeId || !amount || amount <= 0) {
      return res.status(400).json({ message: 'Valid typeId and amount are required' });
    }
    
    // Verify the payable type exists and belongs to the user
    const payableType = await PayableType.findOne({
      _id: typeId,
      user: req.user.id
    });
    
    if (!payableType) {
      return res.status(404).json({ message: 'Payable type not found' });
    }
    
    const newEntry = new PayableEntry({
      typeId,
      date: date || new Date(),
      amount,
      user: req.user.id
    });
    
    const savedEntry = await newEntry.save();
    
    // Update the payable type total amount
    const allEntries = await PayableEntry.find({ typeId });
    const totalAmount = allEntries.reduce((sum, entry) => sum + entry.amount, 0);
    await PayableType.findByIdAndUpdate(typeId, { totalAmount });
    
    res.json(savedEntry);
  } catch (error) {
    console.error('Error creating payable entry:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update a payable entry
router.put('/:id', auth, async (req, res) => {
  try {
    const { typeId, date, amount } = req.body;
    
    if (!typeId || !amount || amount <= 0) {
      return res.status(400).json({ message: 'Valid typeId and amount are required' });
    }
    
    // Verify the payable type exists and belongs to the user
    const payableType = await PayableType.findOne({
      _id: typeId,
      user: req.user.id
    });
    
    if (!payableType) {
      return res.status(404).json({ message: 'Payable type not found' });
    }
    
    const entry = await PayableEntry.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { typeId, date: date || new Date(), amount },
      { new: true }
    );
    
    if (!entry) {
      return res.status(404).json({ message: 'Payable entry not found' });
    }
    
    // Update the payable type total amount
    const allEntries = await PayableEntry.find({ typeId });
    const totalAmount = allEntries.reduce((sum, entry) => sum + entry.amount, 0);
    await PayableType.findByIdAndUpdate(typeId, { totalAmount });
    
    res.json(entry);
  } catch (error) {
    console.error('Error updating payable entry:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a payable entry
router.delete('/:id', auth, async (req, res) => {
  try {
    const entry = await PayableEntry.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id
    });
    
    if (!entry) {
      return res.status(404).json({ message: 'Payable entry not found' });
    }
    
    // Update the payable type total amount
    const allEntries = await PayableEntry.find({ typeId: entry.typeId });
    const totalAmount = allEntries.reduce((sum, entry) => sum + entry.amount, 0);
    await PayableType.findByIdAndUpdate(entry.typeId, { totalAmount });
    
    res.json({ message: 'Payable entry deleted' });
  } catch (error) {
    console.error('Error deleting payable entry:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router; 