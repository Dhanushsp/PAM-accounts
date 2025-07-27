const express = require('express');
const router = express.Router();
const Vendor = require('../models/Vendor');
const auth = require('../middleware/auth');

// Get all vendors
router.get('/', auth, async (req, res) => {
  try {
    const vendors = await Vendor.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(vendors);
  } catch (error) {
    console.error('Error fetching vendors:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get vendor by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ _id: req.params.id, user: req.user.id });
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found' });
    }
    res.json(vendor);
  } catch (error) {
    console.error('Error fetching vendor:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new vendor
router.post('/', auth, async (req, res) => {
  try {
    const { name, contact, credit, items } = req.body;

    if (!name || !contact) {
      return res.status(400).json({ message: 'Name and contact are required' });
    }

    const vendor = new Vendor({
      name,
      contact,
      credit: credit || 0,
      items: items || [],
      user: req.user.id
    });

    await vendor.save();
    res.json(vendor);
  } catch (error) {
    console.error('Error creating vendor:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update vendor
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, contact, credit, items } = req.body;

    const vendor = await Vendor.findOne({ _id: req.params.id, user: req.user.id });
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found' });
    }

    if (name) vendor.name = name;
    if (contact) vendor.contact = contact;
    if (credit !== undefined) vendor.credit = credit;
    if (items) vendor.items = items;

    await vendor.save();
    res.json(vendor);
  } catch (error) {
    console.error('Error updating vendor:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete vendor
router.delete('/:id', auth, async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ _id: req.params.id, user: req.user.id });
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found' });
    }

    await vendor.remove();
    res.json({ message: 'Vendor removed' });
  } catch (error) {
    console.error('Error deleting vendor:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 