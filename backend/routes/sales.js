import express from "express";
import auth from "../middleware/auth.js";
import Sale from "../models/Sale.js";
import Customer from "../models/Customer.js";

const router = express.Router();

// GET all sales with optional filtering
router.get('/', auth, async (req, res) => {
  try {
    const { 
      customerId, 
      customerName,
      fromDate, 
      toDate, 
      saleType, 
      paymentMethod,
      limit = 50,
      page = 1
    } = req.query;

    let query = {};
    
    // Filter by customer ID or customer name
    if (customerId) {
      query.customerId = customerId;
    } else if (customerName) {
      // Find customers by name and get their IDs
      const customers = await Customer.find({
        name: { $regex: customerName, $options: 'i' }
      }).select('_id');
      const customerIds = customers.map(c => c._id);
      if (customerIds.length > 0) {
        query.customerId = { $in: customerIds };
      } else {
        // If no customers found with that name, return empty results
        return res.json({
          sales: [],
          pagination: {
            currentPage: parseInt(page),
            totalPages: 0,
            totalSales: 0,
            hasNext: false,
            hasPrev: false
          }
        });
      }
    }
    
    // Filter by date range
    if (fromDate || toDate) {
      query.date = {};
      if (fromDate) query.date.$gte = new Date(fromDate);
      if (toDate) query.date.$lte = new Date(toDate);
    }
    
    // Filter by sale type
    if (saleType) {
      query.saleType = saleType;
    }
    
    // Filter by payment method
    if (paymentMethod) {
      query.paymentMethod = paymentMethod;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const sales = await Sale.find(query)
      .populate('customerId', 'name contact')
      .sort({ date: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await Sale.countDocuments(query);

    res.json({
      sales,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalSales: total,
        hasNext: skip + sales.length < total,
        hasPrev: parseInt(page) > 1
      }
    });
  } catch (err) {
    console.error("❌ Error fetching sales:", err);
    res.status(500).json({ error: 'Failed to fetch sales data' });
  }
});

// GET sales summary/statistics
router.get('/summary', auth, async (req, res) => {
  try {
    const { fromDate, toDate } = req.query;
    
    let dateFilter = {};
    if (fromDate || toDate) {
      dateFilter.date = {};
      if (fromDate) dateFilter.date.$gte = new Date(fromDate);
      if (toDate) dateFilter.date.$lte = new Date(toDate);
    }

    const totalSales = await Sale.countDocuments(dateFilter);
    const totalRevenue = await Sale.aggregate([
      { $match: dateFilter },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } }
    ]);
    
    const totalAmountReceived = await Sale.aggregate([
      { $match: dateFilter },
      { $group: { _id: null, total: { $sum: '$amountReceived' } } }
    ]);

    const salesByType = await Sale.aggregate([
      { $match: dateFilter },
      { $group: { _id: '$saleType', count: { $sum: 1 }, total: { $sum: '$totalPrice' } } }
    ]);

    const salesByPaymentMethod = await Sale.aggregate([
      { $match: dateFilter },
      { $group: { _id: '$paymentMethod', count: { $sum: 1 }, total: { $sum: '$totalPrice' } } }
    ]);

    res.json({
      totalSales,
      totalRevenue: totalRevenue[0]?.total || 0,
      totalAmountReceived: totalAmountReceived[0]?.total || 0,
      salesByType,
      salesByPaymentMethod
    });
  } catch (err) {
    console.error("❌ Error fetching sales summary:", err);
    res.status(500).json({ error: 'Failed to fetch sales summary' });
  }
});

// GET a specific sale by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id)
      .populate('customerId', 'name contact credit');
    
    if (!sale) {
      return res.status(404).json({ error: 'Sale not found' });
    }
    
    res.json(sale);
  } catch (err) {
    console.error("❌ Error fetching sale:", err);
    res.status(500).json({ error: 'Failed to fetch sale' });
  }
});

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

    // Ensure the sale date is properly formatted
    const saleDate = date ? new Date(date) : new Date();
    
    console.log('Original date from request:', date);
    console.log('Processed saleDate:', saleDate);
    console.log('SaleDate ISO string:', saleDate.toISOString());
    
    const sale = new Sale({
      customerId,
      saleType,
      products,
      totalPrice,
      paymentMethod,
      amountReceived,
      date: saleDate
    });

    const savedSale = await sale.save();

    // Add sale info to customer and update lastPurchase
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
            date: saleDate
          }
        },
        $set: {
          credit: updatedCredit,
          lastPurchase: saleDate
        }
      },
      { new: true }
    );

    // Double-check that lastPurchase is set to the most recent sale date
    if (updatedCustomer.sales && updatedCustomer.sales.length > 0) {
      const mostRecentSale = updatedCustomer.sales.reduce((latest, sale) => {
        const saleDate = new Date(sale.date);
        const latestDate = new Date(latest.date);
        return saleDate > latestDate ? sale : latest;
      });
      
      if (new Date(mostRecentSale.date).getTime() !== new Date(updatedCustomer.lastPurchase).getTime()) {
        console.log('Correcting lastPurchase date mismatch');
        await Customer.findByIdAndUpdate(customerId, {
          lastPurchase: mostRecentSale.date
        });
      }
    }

    console.log('Sale saved with amountReceived:', amountReceived);
    console.log('Updated customer lastPurchase:', updatedCustomer.lastPurchase);
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
