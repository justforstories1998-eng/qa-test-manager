import jwt from 'jsonwebtoken';
import { getUserById } from '../database.js';

const JWT_SECRET = process.env.JWT_SECRET || 'qa-test-manager-secret-key-2024';

export const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    console.log(`⛔ No token: ${req.method} ${req.originalUrl}`);
    return res.status(401).json({ success: false, error: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await getUserById(decoded.userId);
    
    if (!user || !user.isActive) {
      console.log(`⛔ Invalid user (id=${decoded.userId}, active=${user?.isActive}): ${req.method} ${req.originalUrl}`);
      return res.status(401).json({ success: false, error: 'Invalid token or user deactivated.' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.log(`⛔ JWT error (${error.message}): ${req.method} ${req.originalUrl}`);
    return res.status(403).json({ success: false, error: 'Invalid or expired token.' });
  }
};

export const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, error: 'Admin access required.' });
  }
  next();
};

export const generateToken = (userId, role) => {
  return jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: '24h' });
};
