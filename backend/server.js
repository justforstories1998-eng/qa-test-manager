import express from 'express';
import cors from 'cors';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import dotenv from 'dotenv';
import { initializeDatabase } from './database.js';
import routes from './routes.js';
import authRouter from './routes/authRoutes.js';
import adminRouter from './routes/adminRoutes.js';

// Configuration
dotenv.config();
const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 5000;

// ============================================
// DIRECTORY SETUP (Important for Render)
// ============================================
const uploadDir = resolve(__dirname, 'uploads');
const bugUploadDir = join(uploadDir, 'bugs');
const reportUploadDir = join(uploadDir, 'reports');

// Ensure all required folders exist
[uploadDir, bugUploadDir, reportUploadDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`📁 Created directory: ${dir}`);
  }
});

// ============================================
// MIDDLEWARE
// ============================================
// Explicit CORS config to ensure preflight (OPTIONS) is handled correctly
const corsOptions = {
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false,
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// STATIC FILE SERVING
// This allows: https://your-app.onrender.com/uploads/bugs/filename.mp4
app.use('/uploads', express.static(uploadDir));

// ============================================
// ROUTES
// ============================================

// Health Check for Deployment
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Auth Routes
app.use('/api/auth', authRouter);

// Admin Routes
app.use('/api/admin', adminRouter);

// API Routes
app.use('/api', routes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err.message);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error'
  });
});

// ============================================
// SERVER STARTUP
// ============================================
async function startServer() {
  try {
    await initializeDatabase();
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🌐 Static files served from: ${uploadDir}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();