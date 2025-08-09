import express from "express";
import Customer from "../models/Customer.js";
import { redis } from "../index.js";
import auth from "../middleware/auth.js";
import mongoose from "mongoose";

const router = express.Router();

router.use(auth);

// GET customers with optional search and sort
router.get("/", async (req, res) => {
  try {
    const { search, sort } = req.query;

    let query = {};
    if (search) query.name = { $regex: search, $options: "i" };

    let sortBy = {};
    if (sort === "recent") {
      // Sort by lastPurchase descending, with null values last
      sortBy = { lastPurchase: -1 };
    } else if (sort === "oldest") {
      // Sort by lastPurchase ascending, with null values first
      sortBy = { lastPurchase: 1 };
    } else if (sort === "credit") {
      sortBy = { credit: -1 };
    }

    console.log('Sorting by:', sort, 'Sort criteria:', sortBy);

    const cacheKey = redis ? `customers:list:${JSON.stringify({ search, sort })}` : null;
    if (redis && cacheKey) {
      const cached = await redis.get(cacheKey);
      if (cached) return res.json(JSON.parse(cached));
    }

    const customers = await Customer.find(query, 'name contact credit joinDate lastPurchase')
      .sort(sortBy)
      .lean();
    console.log('Customers returned:', customers.length, 'First customer lastPurchase:', customers[0]?.lastPurchase);

    if (redis && cacheKey) {
      await redis.set(cacheKey, JSON.stringify(customers), 'EX', 30);
    }

    res.json(customers);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch customers", error: err });
  }
});

// POST a new customer
router.post("/", async (req, res) => {
  try {
    const { name, contact, credit, joinDate } = req.body;

    if (!name || !contact || credit == null) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const customer = new Customer({
      name,
      contact,
      credit,
      joinDate: joinDate ? new Date(joinDate) : new Date(),
      lastPurchase: new Date()
    });

    await customer.save();
    res.status(201).json(customer);
  } catch (err) {
    res.status(500).json({ message: "Failed to add customer", error: err });
  }
});

// Update credit and lastPurchase via a sale
router.post("/sale", async (req, res) => {
  try {
    const { customerId, amount } = req.body;
    const customer = await Customer.findById(customerId);
    if (!customer) return res.status(404).json({ message: "Customer not found" });

    customer.credit += amount;
    customer.lastPurchase = new Date();
    await customer.save();

    res.json(customer);
  } catch (err) {
    res.status(500).json({ message: "Failed to update sale", error: err });
  }
});

// Utility route to fix lastPurchase dates for all customers
router.post('/fix-last-purchase-dates', auth, async (req, res) => {
  try {
    const customers = await Customer.find({});
    let fixedCount = 0;
    
    for (const customer of customers) {
      if (customer.sales && customer.sales.length > 0) {
        const mostRecentSale = customer.sales.reduce((latest, sale) => {
          const saleDate = new Date(sale.date);
          const latestDate = new Date(latest.date);
          return saleDate > latestDate ? sale : latest;
        });
        
        const mostRecentDate = new Date(mostRecentSale.date);
        const currentLastPurchase = customer.lastPurchase ? new Date(customer.lastPurchase) : null;
        
        if (!currentLastPurchase || mostRecentDate.getTime() !== currentLastPurchase.getTime()) {
          await Customer.findByIdAndUpdate(customer._id, {
            lastPurchase: mostRecentDate
          });
          fixedCount++;
          console.log(`Fixed lastPurchase for customer ${customer.name}: ${mostRecentDate}`);
        }
      }
    }
    
    res.json({ 
      message: `Fixed lastPurchase dates for ${fixedCount} customers`,
      fixedCount 
    });
  } catch (err) {
    console.error('Error fixing lastPurchase dates:', err);
    res.status(500).json({ error: 'Failed to fix lastPurchase dates' });
  }
});

router.get('/customers', auth, async (req, res) => {
  try {
    const customers = await Customer.find();
    res.json(customers);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

// GET /api/customers/:id
router.get('/:id', async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).json({ message: 'Customer not found' });
    res.json(customer);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/customers/:id - Update customer
router.put('/:id', async (req, res) => {
  try {
    const { name, contact, credit, joinDate } = req.body;

    const update = {};
    if (name !== undefined) update.name = name;
    if (contact !== undefined) update.contact = contact;
    if (credit !== undefined) update.credit = credit;
    if (joinDate !== undefined) {
      const parsed = new Date(joinDate);
      update.joinDate = isNaN(parsed.getTime()) ? new Date() : parsed;
    }

    const customer = await Customer.findByIdAndUpdate(
      req.params.id,
      update,
      { new: true }
    );
    if (!customer) return res.status(404).json({ message: 'Customer not found' });
    res.json(customer);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update customer' });
  }
});

// POST /api/customers/:id/amount-received - Record amount received and reduce credit
router.post('/:id/amount-received', async (req, res) => {
  try {
    const { amountReceived = 0, otherAmount = 0, description = 'Amount received', date, paymentMethod } = req.body;
    const amount = Number(amountReceived) || 0;
    const other = Number(otherAmount) || 0;
    const totalAmount = amount + other;

    if (totalAmount <= 0) {
      return res.status(400).json({ message: 'Total amount must be greater than 0' });
    }

    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).json({ message: 'Customer not found' });

    const newCredit = Math.max(0, (Number(customer.credit) || 0) - totalAmount);

    // Update credit and push a payment history entry
    customer.credit = newCredit;
    customer.payments = customer.payments || [];
    customer.payments.push({
      amount,
      otherAmount: other,
      totalAmount,
      description,
      date: date ? new Date(date) : new Date(),
      paymentMethod: paymentMethod || undefined,
    });

    await customer.save();
    res.json({ success: true, customer });
  } catch (err) {
    console.error('Error recording amount received:', err);
    res.status(500).json({ message: 'Failed to record amount received' });
  }
});

// GET /api/customers/payments - List payments (amount received entries) with optional filters
router.get('/payments', async (req, res) => {
  try {
    const { fromDate, toDate, customerId, customerName, limit = 50, page = 1 } = req.query;

    const matchCustomer = {};
    if (customerId) {
      matchCustomer._id = new mongoose.Types.ObjectId(customerId);
    } else if (customerName) {
      matchCustomer.name = { $regex: customerName, $options: 'i' };
    }

    const dateFilter = {};
    if (fromDate) dateFilter.$gte = new Date(fromDate);
    if (toDate) dateFilter.$lte = new Date(toDate);

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const pipeline = [
      Object.keys(matchCustomer).length ? { $match: matchCustomer } : null,
      { $unwind: '$payments' },
      Object.keys(dateFilter).length ? { $match: { 'payments.date': dateFilter } } : null,
      { $sort: { 'payments.date': -1 } },
      {
        $facet: {
          data: [
            { $skip: skip },
            { $limit: parseInt(limit) },
            {
              $project: {
                _id: '$payments._id',
                customerId: '$_id',
                customerName: '$name',
                amount: '$payments.amount',
                otherAmount: '$payments.otherAmount',
                totalAmount: '$payments.totalAmount',
                description: '$payments.description',
                date: '$payments.date',
                paymentMethod: '$payments.paymentMethod',
              }
            }
          ],
          totalCount: [
            { $count: 'count' }
          ]
        }
      }
    ].filter(Boolean);

    const aggResult = await Customer.aggregate(pipeline);
    const data = aggResult[0]?.data || [];
    const total = aggResult[0]?.totalCount?.[0]?.count || 0;

    res.json({
      payments: data,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalPayments: total,
        hasNext: skip + data.length < total,
        hasPrev: parseInt(page) > 1,
      }
    });
  } catch (err) {
    console.error('Error fetching payments:', err);
    res.status(500).json({ message: 'Failed to fetch payments' });
  }
});

// DELETE /api/customers/:id - Delete customer with authentication
router.delete('/:id', async (req, res) => {
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

    const customer = await Customer.findByIdAndDelete(req.params.id);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    
    res.json({ message: 'Customer deleted successfully' });
  } catch (err) {
    console.error('Error deleting customer:', err);
    res.status(500).json({ message: 'Failed to delete customer' });
  }
});

export default router;
