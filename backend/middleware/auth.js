import jwt from "jsonwebtoken";

export default function (req, res, next) {
  const token = req.headers["authorization"];
  if (!token) return res.status(403).json("Token missing");
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.admin = decoded;
    next();
  } catch {
    res.status(403).json("Invalid token");
  }
}
