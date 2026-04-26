require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');

// Import config
const { initDatabase } = require('./config/database');

// Import routes
const authRoutes = require('./routes/auth');
const articleRoutes = require('./routes/articles');
const categoryRoutes = require('./routes/categories');
const newsletterRoutes = require('./routes/newsletter');
const contactRoutes = require('./routes/contact');
const projectRoutes = require('./routes/projects');
const analyticsRoutes = require('./routes/analytics');

// Import middleware
const { errorHandler } = require('./middleware/errorHandler');
const { apiLimiter } = require('./middleware/rateLimiter');

const app = express();
const PORT = process.env.PORT || 3001;

// ============================================================
// Security Middleware
// ============================================================
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5500'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// ============================================================
// Static Files (uploads + admin dashboard)
// ============================================================
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/admin', express.static(path.join(__dirname, 'public')));

// ============================================================
// API Routes
// ============================================================
app.use('/api/auth', apiLimiter, authRoutes);
app.use('/api/articles', articleRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/newsletter', apiLimiter, newsletterRoutes);
app.use('/api/contact', apiLimiter, contactRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/analytics', analyticsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Admin dashboard fallback
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// ============================================================
// Error Handling
// ============================================================
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});
app.use(errorHandler);

// ============================================================
// Start Server
// ============================================================
initDatabase();
app.listen(PORT, () => {
  console.log(`
  ╔══════════════════════════════════════════════╗
  ║   Arun's Journal — API Server               ║
  ║   Running on: http://localhost:${PORT}          ║
  ║   Admin Panel: http://localhost:${PORT}/admin   ║
  ║   Environment: ${process.env.NODE_ENV || 'development'}                    ║
  ╚══════════════════════════════════════════════╝
  `);
});

module.exports = app;