// Import required libraries
const express = require('express');
const cors = require('cors');
// Force Vercel redeploy - v2          
  
require('dotenv').config({ path: __dirname + '/.env' });


// Import database connection
const db = require('./db');

// Import routes
const authRoutes = require('./routes/auth');
const preferencesRoutes = require('./routes/preferences');
const newsRoutes = require('./routes/news');
const savedRoutes = require('./routes/saved');

// Create Express application
const app = express();

// MIDDLEWARE SETUP

// 1. CORS - Allow requests from frontend (React app)
const corsOptions = {
  origin: process.env.CLIENT_URL || '*',
  credentials: true
};
app.use(cors(corsOptions));


// 2. JSON Parser - Converts request body to JavaScript object
app.use(express.json());

// 3. Disable caching for all API responses
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  next();
});


// TEST ROUTE - Check if server is running
app.get('/', (req, res) => {
  res.json({ 
    message: ' News Dashboard API is running!',
    timestamp: new Date()
  });
});

// TEST DATABASE ROUTE - Check if database connection works
app.get('/test-db', async (req, res) => {
  try {
    // Run a simple query to test connection
    const result = await db.query('SELECT NOW()');
    
    // Send success response with current database time
    res.json({ 
      success: true,
      message: ' Database connection successful!',
      database_time: result.rows[0].now
    });
  } catch (error) {
    // If query fails, send error response
    console.error('Database test failed:', error);
    res.status(500).json({ 
      success: false,
      message: ' Database connection failed',
      error: error.message 
    });
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/preferences', preferencesRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/saved', savedRoutes);


// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});


// START SERVER
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(` Server is running on http://localhost:${PORT}`);
  console.log(` Test database at http://localhost:${PORT}/test-db`);
  console.log(` Auth routes: /api/auth/*`);
  console.log(`  Preferences routes: /api/preferences/*`);
  console.log(` News routes: /api/news/*`);
  console.log(` Saved routes: /api/saved/*`);
});