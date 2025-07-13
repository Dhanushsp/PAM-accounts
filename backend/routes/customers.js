import express from "express";
import Customer from "../models/Customer.js";
import auth from "../middleware/auth.js";

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
    const customers = await Customer.find(query).sort(sortBy);
    console.log('Customers returned:', customers.length, 'First customer lastPurchase:', customers[0]?.lastPurchase);
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


export default router;
