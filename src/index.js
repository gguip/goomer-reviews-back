require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initializeDatabase } = require('./config/database');
const setupSwagger = require('./config/swagger');

// Initialize Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Initialize Database
(async () => {
  try {
    await initializeDatabase();
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing Database:', error);
    process.exit(1);
  }
})();

// Import routes
const reviewsRoutes = require('./routes/reviews.routes');
const authRoutes = require('./routes/auth.routes');

// Setup Swagger
setupSwagger(app);

// Use routes
app.use('/api/reviews', reviewsRoutes);
app.use('/api/auth', authRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Port configuration
const port = process.env.PORT || 3000;
const host = process.env.HOST || '0.0.0.0';

// Start server
app.listen(port, host, () => {
  console.log(`Server is running on ${host}:${port}`);
});
