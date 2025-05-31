import express from "express";
import Admin from "../models/Admin.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const router = express.Router();

router.post("/login", async (req, res) => {
  const { mobile, password } = req.body;
  const admin = await Admin.findOne({ mobile });
  if (!admin) return res.status(404).json("Admin not found");

  const isMatch = await bcrypt.compare(password, admin.password);
  if (!isMatch) return res.status(401).json("Invalid credentials");

  const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET);
  res.json({ token });
});

export default router;
