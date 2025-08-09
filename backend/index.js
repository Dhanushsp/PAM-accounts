import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import compression from "compression";
import authRoutes from "./routes/auth.js";
import customerRoutes from "./routes/customers.js";
import addproductsRoutes from "./routes/addproducts.js"
import salesRoutes from "./routes/sales.js"
import expensesRoutes from "./routes/expenses.js";
import categoriesRoutes from "./routes/categories.js";
import aiRoutes from "./routes/ai.js";
import bcrypt from "bcrypt";
import Admin from "./models/Admin.js";
import Redis from "ioredis";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());
app.use(compression());

// Optional Redis cache (set REDIS_URL to enable)
let redis = null;
if (process.env.REDIS_URL) {
  try {
    redis = new Redis(process.env.REDIS_URL);
    redis.on('connect', () => console.log('Redis connected'));
    redis.on('error', (e) => console.warn('Redis error', e?.message));
  } catch (e) {
    console.warn('Redis init failed', e?.message);
  }
}

export { redis };

mongoose.connect(process.env.MONGO_URL, {
  maxPoolSize: 20,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
})
  .then(async () => {
    console.log("MongoDB connected");
    await createDefaultAdmin(); // Create default admin after DB connection
  })
  .catch(err => console.error(err));


app.use("/api", authRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/addproducts", addproductsRoutes);
app.use("/api/products", addproductsRoutes)
app.use("/api/sales", salesRoutes);
app.use("/api/expenses", expensesRoutes);
app.use("/api/categories", categoriesRoutes);
app.use("/api/ai", aiRoutes);
import vendorRoutes from './routes/vendors.js';
import purchaseRoutes from './routes/purchases.js';
import savingsTypesRoutes from './routes/savings-types.js';
import savingsEntriesRoutes from './routes/savings-entries.js';
import incomeTypesRoutes from './routes/income-types.js';
import incomeEntriesRoutes from './routes/income-entries.js';
import payableTypesRoutes from './routes/payable-types.js';
import payableEntriesRoutes from './routes/payable-entries.js';
import moneyLentTypesRoutes from './routes/money-lent-types.js';
import moneyLentEntriesRoutes from './routes/money-lent-entries.js';
import priceHistoryRoutes from './routes/price-history.js';

app.use("/api/vendors", vendorRoutes);
app.use("/api/purchases", purchaseRoutes);
app.use("/api/savings-types", savingsTypesRoutes);
app.use("/api/savings-entries", savingsEntriesRoutes);
app.use("/api/income-types", incomeTypesRoutes);
app.use("/api/income-entries", incomeEntriesRoutes);
app.use("/api/payable-types", payableTypesRoutes);
app.use("/api/payable-entries", payableEntriesRoutes);
app.use("/api/money-lent-types", moneyLentTypesRoutes);
app.use("/api/money-lent-entries", moneyLentEntriesRoutes);
app.use("/api/price-history", priceHistoryRoutes);

app.get('/', (req, res) => {
  res.send('API is working');
});

app.listen(5000, '0.0.0.0', () => {
  console.log('Server running on port 5000');
});
// app.listen(process.env.PORT || 5000, () => console.log("Server started on port 5000"));

// Function to create a default admin if none exists
async function createDefaultAdmin() {
  try {
    const existingAdmin = await Admin.findOne({ mobile: process.env.DEFAULT_ADMIN_MOBILE });
    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash(process.env.DEFAULT_ADMIN_PASSWORD, 10);
      const newAdmin = new Admin({
        mobile: process.env.DEFAULT_ADMIN_MOBILE,
        password: hashedPassword
      });
      await newAdmin.save();
      console.log("✅ Default admin created");
    } else {
      console.log("✅ Admin already exists");
    }
  } catch (err) {
    console.error("❌ Error creating default admin:", err);
  }
}
