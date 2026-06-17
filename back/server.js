const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { initialize, closePool } = require('./config/db');
const authRoutes = require('./routes/auth');
const studentRoutes = require('./routes/students');
const paymentRoutes = require('./routes/payments');

const app = express();
const PORT = process.env.PORT || 5000;

// ──── Middleware ────
const allowedOrigins = [
  'https://fee-mangement.vercel.app',
  process.env.CLIENT_URL,
  'http://localhost:5173'
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ──── API Routes ────
app.use('/api', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/payments', paymentRoutes);

// ──── Health Check ────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', server: 'Springfield Academy Fee Management API', timestamp: new Date().toISOString() });
});

// ──── Error Handler ────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ──── Start Server ────
async function start() {
  await initialize();

  app.listen(PORT, () => {
    console.log(`\n🚀 Springfield Academy Backend Server`);
    console.log(`   Running on: http://localhost:${PORT}`);
    console.log(`   Health:     http://localhost:${PORT}/api/health`);
    console.log(`   CORS:       ${process.env.CLIENT_URL || 'http://localhost:5173'}\n`);
  });
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nShutting down...');
  await closePool();
  process.exit(0);
});

start();
