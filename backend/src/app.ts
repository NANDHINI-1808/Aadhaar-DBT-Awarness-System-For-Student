import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';
import apiRouter from './routes/api';
import { initCronJobs } from './services/cronScheduler';

// Initialize environment configurations
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// CORS setup supporting credentials (cookies)
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
app.use(cors({
  origin: frontendUrl,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(cookieParser());

// Static folder for uploaded caste/income files
const uploadsPath = process.env.VERCEL ? '/tmp' : path.join(__dirname, '../uploads');
app.use('/uploads', express.static(uploadsPath));

// Main API Route
app.use('/api', apiRouter);

// Basic health check route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Aadhaar DBT Portal Service is running.' });
});

// Initialize background tasks
initCronJobs();

// Start Server
app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

export default app;
