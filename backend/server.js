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

dotenv.config();
const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 5000;

const uploadDir = resolve(__dirname, 'uploads');
const bugUploadDir = join(uploadDir, 'bugs');
const reportUploadDir = join(uploadDir, 'reports');

[uploadDir, bugUploadDir, reportUploadDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// ============================================
// CORS - Handle ALL preflight OPTIONS first
// ============================================
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false,
  optionsSuccessStatus: 204
}));

app.use((req, res, next) => {
  const ct = req.headers['content-type'] || '';
  if (ct.includes('multipart/')) return next();
  express.json({ limit: '50mb' })(req, res, next);
});
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use('/uploads', express.static(uploadDir));

// ============================================
// HEALTH CHECK (no auth required)
// ============================================
// SMTP TEST (no auth required - for debugging)
// ============================================
app.get('/api/test-smtp', async (req, res) => {
  try {
    const sgMail = (await import('@sendgrid/mail')).default;
    const apiKey = process.env.SENDGRID_API_KEY || process.env.SMTP_PASS;
    const fromEmail = process.env.SMTP_FROM || process.env.SMTP_USER;

    if (!apiKey) {
      return res.json({ success: false, error: 'No API key found (SENDGRID_API_KEY or SMTP_PASS)' });
    }
    if (!fromEmail) {
      return res.json({ success: false, error: 'No from email found (SMTP_FROM or SMTP_USER)' });
    }

    sgMail.setApiKey(apiKey);

    console.log(`📧 Sending test email to ${fromEmail} via SendGrid API...`);

    await sgMail.send({
      to: fromEmail,
      from: fromEmail,
      subject: 'QALogs SMTP Test',
      html: '<h3>SMTP is working!</h3><p>If you received this, email sending is configured correctly.</p>'
    });

    console.log(`✅ Test email sent successfully to ${fromEmail}`);
    res.json({ success: true, message: 'Test email sent to ' + fromEmail });
  } catch (error) {
    console.error('SMTP Test Error:', error.message);
    if (error.response?.body) {
      console.error('SendGrid response:', JSON.stringify(error.response.body));
    }
    res.json({ success: false, error: error.message, details: error.response?.body || null });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Root route
app.get('/', (req, res) => {
  res.status(200).json({ name: 'QA Test Manager API', version: '1.0.0', status: 'running' });
});

// ============================================
// API ROUTES (auth routes MUST come before main router)
// ============================================
app.use('/api/auth', authRouter);
app.use('/api/admin', adminRouter);
app.use('/api', routes);

// Catch-all for unmatched API routes
app.use('/api', (req, res) => {
  res.status(404).json({ success: false, error: `Route not found: ${req.method} ${req.originalUrl}` });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Server Error:', err.message);
  res.status(err.status || 500).json({ success: false, error: err.message || 'Internal server error' });
});

// ============================================
// SERVER STARTUP
// ============================================
async function startServer() {
  try {
    await initializeDatabase();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
