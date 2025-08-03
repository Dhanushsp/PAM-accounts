import express from 'express';
import PriceHistory from '../models/PriceHistory.js';
import Product from '../models/Product.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// GET /api/price-history/:productId - Get price history for a product
router.get('/:productId', auth, async (req, res) => {
  try {
    const priceHistory = await PriceHistory.find({ productId: req.params.productId })
      .populate('updatedBy', 'name email')
      .sort({ updateDate: -1 })
      .limit(50); // Limit to last 50 price changes
    
    res.json(priceHistory);
  } catch (error) {
    console.error('Error fetching price history:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/price-history/update-price - Update product price and create history entry
router.post('/update-price', auth, async (req, res) => {
  try {
    const { productId, newPricePerPack, newPricePerKg, reason } = req.body;

    if (!productId || !newPricePerPack || !newPricePerKg) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Find the current product
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check if price actually changed
    if (product.pricePerPack === newPricePerPack && product.pricePerKg === newPricePerKg) {
      return res.status(400).json({ message: 'No price change detected' });
    }

    // Store old prices
    const oldPricePerPack = product.pricePerPack;
    const oldPricePerKg = product.pricePerKg;

    // Update product prices
    product.pricePerPack = newPricePerPack;
    product.pricePerKg = newPricePerKg;
    await product.save();

    // Create price history entry
    const priceHistoryEntry = new PriceHistory({
      productId: product._id,
      oldPricePerPack,
      newPricePerPack,
      oldPricePerKg,
      newPricePerKg,
      updatedBy: req.user.id,
      reason: reason || 'Price update'
    });
    await priceHistoryEntry.save();

    res.json({ 
      message: 'Product price updated successfully',
      product,
      priceHistory: priceHistoryEntry
    });
  } catch (error) {
    console.error('Error updating product price:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router; 