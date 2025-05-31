import express from "express";
import auth from "../middleware/auth.js";
import Product from "../models/Product.js";

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
    res.json({ message: 'Product added successfully!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add product' });
  }
});

router.get('/', auth, async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});



export default router;