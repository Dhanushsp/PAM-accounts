import express from "express";
import auth from "../middleware/auth.js";
import Sale from "../models/Sale.js";
import Customer from "../models/Customer.js";

const router = express.Router();

router.post('/', auth, async (req, res) => {
  try {
    const {
      customerId,
      saleType,
      products,
      totalPrice,
      paymentMethod,
      amountReceived,
      updatedCredit,
      date
    } = req.body;

    const sale = new Sale({
      customerId,
      saleType,
      products,
      totalPrice,
      paymentMethod,
      amountReceived,
      date: date ? new Date(date) : new Date()
    });

    const savedSale = await sale.save();

    // Add sale info to customer
    const updatedCustomer = await Customer.findByIdAndUpdate(
      customerId,
      {
        $push: {
          sales: {
            saleId: savedSale._id,
            saleType,
            products,
            totalPrice,
            paymentMethod,
            amountReceived,
            date: savedSale.date
          }
        },
        $set: {
          credit: updatedCredit,
          lastPurchase: savedSale.date
        }
      },
      { new: true }
    );

    console.log('Sale saved with amountReceived:', amountReceived);
    console.log('Updated customer sales:', updatedCustomer.sales);

    res.json({ 
      message: 'Sale recorded and customer updated successfully',
      sale: savedSale,
      customer: updatedCustomer
    });

  } catch (err) {
    console.error("❌ Error saving sale or updating customer:", err);
    res.status(500).json({ error: 'Failed to record sale' });
  }
});

export default router;
