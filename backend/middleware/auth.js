import jwt from "jsonwebtoken";

export default function (req, res, next) {
  const token = req.headers["authorization"];
  console.log('Auth middleware - Token received:', token ? 'Present' : 'Missing');
  console.log('Auth middleware - Full headers:', req.headers);
  
  if (!token) {
    console.log("Auth middleware - Token missing");
    return res.status(403).json({ message: "Token missing" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Auth middleware - Token decoded successfully:', decoded);
    req.user = { id: decoded.id };
    next();
  } catch (error) {
    console.log('Auth middleware - Token verification failed:', error.message);
    res.status(403).json({ message: "Invalid token" });
  }
}
