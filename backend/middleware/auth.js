import jwt from "jsonwebtoken";

export default function (req, res, next) {
  const token = req.headers["authorization"];
  console.log('Auth middleware - Token received:', token ? 'Present' : 'Missing');
  console.log('Auth middleware - Full headers:', req.headers);
  
  if (!token) return res.status(403).json("Token missing");
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Auth middleware - Token decoded successfully:', decoded);
    // The decoded token has { id: admin._id }, so we need to structure it properly
    req.user = { id: decoded.id };
    next();
  } catch (error) {
    console.log('Auth middleware - Token verification failed:', error.message);
    res.status(403).json("Invalid token");
  }
}
