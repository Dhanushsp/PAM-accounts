import express from "express";
import auth from "../middleware/auth.js";
import Product from "../models/Product.js";
import { redis } from "../index.js";
import mongoose from "mongoose";

const router = express.Router();

// Express.js route
router.post('/', auth, async (req, res) => {
  try {
    const { productName, pricePerPack, kgsPerPack, pricePerKg } = req.body;

    const newProduct = new Product({
      productName,
      pricePerPack,
      kgsPerPack,
      pricePerKg
    });

    await newProduct.save();
    if (redis) await redis.del('products:list');
    res.json({ message: 'Product added successfully!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add product' });
  }
});

router.get('/', auth, async (req, res) => {
  try {
    if (redis) {
      const cached = await redis.get('products:list');
      if (cached) return res.json(JSON.parse(cached));
    }
    const products = await Product.find({}, 'productName pricePerPack kgsPerPack pricePerKg').lean();
    if (redis) await redis.set('products:list', JSON.stringify(products), 'EX', 60);
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// PUT /api/products/:id - Update product
router.put('/:id', auth, async (req, res) => {
  try {
    const { productName, pricePerPack, kgsPerPack, pricePerKg } = req.body;
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { productName, pricePerPack, kgsPerPack, pricePerKg },
      { new: true }
    );
    if (!product) return res.status(404).json({ message: 'Product not found' });
    if (redis) await redis.del('products:list');
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update product' });
  }
});

// DELETE /api/products/:id - Delete product with authentication
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

    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    if (redis) await redis.del('products:list');
    res.json({ message: 'Product deleted successfully' });
  } catch (err) {
    console.error('Error deleting product:', err);
    res.status(500).json({ message: 'Failed to delete product' });
  }
});

export default router;