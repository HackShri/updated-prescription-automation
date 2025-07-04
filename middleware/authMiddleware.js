require('dotenv').config();
const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) {
    // console.log('❌ No token provided');
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { userId, role } from JWT payload
    // console.log('✅ Token verified:', decoded);
    next();
  } catch (err) {
    // console.error('❌ Token verification failed:', err);
    res.status(401).json({ message: 'Token is not valid' });
  }
};