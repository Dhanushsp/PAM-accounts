const express = require('express');
const router = express.Router();
const Purchase = require('../models/Purchase');
const Vendor = require('../models/Vendor');
const auth = require('../middleware/auth');

// Get all purchases
router.get('/', auth, async (req, res) => {
  try {
    const purchases = await Purchase.find({ user: req.user.id })
      .populate('vendor', 'name')
      .sort({ date: -1 });
    res.json(purchases);
  } catch (error) {
    console.error('Error fetching purchases:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get purchase by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const purchase = await Purchase.findOne({ _id: req.params.id, user: req.user.id })
      .populate('vendor', 'name');
    if (!purchase) {
      return res.status(404).json({ message: 'Purchase not found' });
    }
    res.json(purchase);
  } catch (error) {
    console.error('Error fetching purchase:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new purchase
router.post('/', auth, async (req, res) => {
  try {
    const {
      item,
      vendor,
      vendorName,
      quantity,
      unit,
      pricePerUnit,
      totalPrice,
      amountPaid,
      updatedCredit,
      date
    } = req.body;

    if (!item || !vendor || !quantity || !pricePerUnit) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const purchase = new Purchase({
      item,
      vendor,
      vendorName,
      quantity,
      unit,
      pricePerUnit,
      totalPrice,
      amountPaid: amountPaid || 0,
      updatedCredit,
      date: date || new Date(),
      user: req.user.id
    });

    await purchase.save();

    // Update vendor credit
    await Vendor.findByIdAndUpdate(vendor, { credit: updatedCredit });

    res.json(purchase);
  } catch (error) {
    console.error('Error creating purchase:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update purchase
router.put('/:id', auth, async (req, res) => {
  try {
    const purchase = await Purchase.findOne({ _id: req.params.id, user: req.user.id });
    if (!purchase) {
      return res.status(404).json({ message: 'Purchase not found' });
    }

    const {
      item,
      vendor,
      vendorName,
      quantity,
      unit,
      pricePerUnit,
      totalPrice,
      amountPaid,
      updatedCredit,
      date
    } = req.body;

    if (item) purchase.item = item;
    if (vendor) purchase.vendor = vendor;
    if (vendorName) purchase.vendorName = vendorName;
    if (quantity) purchase.quantity = quantity;
    if (unit) purchase.unit = unit;
    if (pricePerUnit) purchase.pricePerUnit = pricePerUnit;
    if (totalPrice) purchase.totalPrice = totalPrice;
    if (amountPaid !== undefined) purchase.amountPaid = amountPaid;
    if (updatedCredit !== undefined) purchase.updatedCredit = updatedCredit;
    if (date) purchase.date = date;

    await purchase.save();

    // Update vendor credit if changed
    if (updatedCredit !== undefined && vendor) {
      await Vendor.findByIdAndUpdate(vendor, { credit: updatedCredit });
    }

    res.json(purchase);
  } catch (error) {
    console.error('Error updating purchase:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete purchase
router.delete('/:id', auth, async (req, res) => {
  try {
    const purchase = await Purchase.findOne({ _id: req.params.id, user: req.user.id });
    if (!purchase) {
      return res.status(404).json({ message: 'Purchase not found' });
    }

    await purchase.remove();
    res.json({ message: 'Purchase removed' });
  } catch (error) {
    console.error('Error deleting purchase:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 