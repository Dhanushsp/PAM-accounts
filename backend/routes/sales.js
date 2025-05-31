import express from "express";
import auth from "../middleware/auth.js";
import Sale from "../models/Sale.js";
import Customer from "../models/Customer.js";


const router = express.Router();

router.post('/',auth , async (req, res) => {
  try {
    const {
      customerId,
      saleType,
      products,
      totalPrice,
      paymentMethod,
      amountReceived,
      updatedCredit
    } = req.body;

    const sale = new Sale({
      customerId,
      saleType,
      products,
      totalPrice,
      paymentMethod,
      amountReceived,
      date: new Date()
    });

    await sale.save();

    await Customer.findByIdAndUpdate(customerId, { credit: updatedCredit });

    res.json({ message: 'Sale recorded successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to record sale' });
  }
});


export default router;