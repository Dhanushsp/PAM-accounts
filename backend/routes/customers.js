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
    if (sort === "recent") sortBy = { lastPurchase: -1 };
    else if (sort === "oldest") sortBy = { lastPurchase: 1 };
    else if (sort === "credit") sortBy = { credit: -1 };

    const customers = await Customer.find(query).sort(sortBy);
    res.json(customers);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch customers", error: err });
  }
});

// POST a new customer
router.post("/", async (req, res) => {
  try {
    const { name, contact, credit } = req.body;

    if (!name || !contact || credit == null) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const customer = new Customer({
      name,
      contact,
      credit,
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


export default router;
