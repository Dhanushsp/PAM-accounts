import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import authRoutes from "./routes/auth.js";
import customerRoutes from "./routes/customers.js";
import addproductsRoutes from "./routes/addproducts.js"
import salesRoutes from "./routes/sales.js"
import expensesRoutes from "./routes/expenses.js";
import bcrypt from "bcrypt";
import Admin from "./models/Admin.js";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URL)
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
app.use("/api/vendors", require('./routes/vendors'));
app.use("/api/purchases", require('./routes/purchases'));

app.get('/', (req, res) => {
  res.send('API is working');
});

// app.listen(5000, '0.0.0.0', () => {
//   console.log('Server running on port 5000');
// });
app.listen(process.env.PORT || 5000, () => console.log("Server started on port 5000"));

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
