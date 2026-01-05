import express from 'express';
import cors from 'cors';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs'; // ADD THIS
import dotenv from 'dotenv';
import { initializeDatabase } from './database.js';
import routes from './routes.js';

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();

// --- ADD THIS BLOCK TO CREATE FOLDERS ---
const uploadDir = join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log('📁 Created uploads directory');
}
// ----------------------------------------

app.use(cors({ origin: '*' })); // Allows frontend to talk to backend
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use('/uploads', express.static(uploadDir));

app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api', routes);

async function startServer() {
  try {
    await initializeDatabase();
    app.listen(process.env.PORT || 5000, () => console.log(`🚀 Server Ready`));
  } catch (error) {
    console.error(error);
  }
}
startServer();