import express from 'express';
import cors from 'cors';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import dotenv from 'dotenv';
import { initializeDatabase } from './database.js';
import routes from './routes.js';

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 5000;

// FOLDER SETUP
const uploadDir = join(__dirname, 'uploads');
const bugDir = join(uploadDir, 'bugs');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
if (!fs.existsSync(bugDir)) fs.mkdirSync(bugDir, { recursive: true });

app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// STATIC DIRECTORIES
app.use('/uploads', express.static(uploadDir));
app.use('/uploads/bugs', express.static(bugDir));

app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api', routes);

async function startServer() {
  try {
    await initializeDatabase();
    app.listen(PORT, () => console.log(`🚀 API: http://localhost:${PORT}/api`));
  } catch (error) { console.error(error); process.exit(1); }
}

startServer();