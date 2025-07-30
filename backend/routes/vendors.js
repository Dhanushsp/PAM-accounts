import express from 'express';
import Vendor from '../models/Vendor.js'
import auth from '../middleware/auth.js';
import mongoose from 'mongoose';

const router = express.Router();

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
    const { mobile, password } = req.body;
    
    // Validate authentication credentials
    if (!mobile || !password) {
      return res.status(400).json({ message: 'Mobile and password are required for deletion' });
    }

    // Check admin credentials with bcrypt
    const Admin = mongoose.model('Admin');
    const admin = await Admin.findOne({ mobile });
    if (!admin) {
      return res.status(401).json({ message: 'Invalid credentials. Deletion denied.' });
    }

    // Compare password with bcrypt
    const bcrypt = (await import('bcrypt')).default;
    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials. Deletion denied.' });
    }

    const vendor = await Vendor.findOne({ _id: req.params.id, user: req.user.id });
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found' });
    }

    await vendor.deleteOne();
    res.json({ message: 'Vendor deleted successfully' });
  } catch (error) {
    console.error('Error deleting vendor:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;