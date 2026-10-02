const express = require('express');
const { productRoutes } = require('./routes');

const app = express();
const PORT = process.env.PORT || 3000;

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware for workshop demonstration
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    const cacheHeader = res.getHeader('X-Cache');
    const cacheInfo = cacheHeader ? ` [X-Cache: ${cacheHeader}]` : '';
    console.log(`${req.method} ${req.originalUrl} -> ${res.statusCode} (${duration}ms)${cacheInfo}`);
  });
  next();
});

// Mount routes: Layered structure begins at routes
// Route -> Middleware -> Controller -> Service -> Database
app.use('/products', productRoutes);

// Health check / welcome route
app.get('/', (req, res) => {
  res.json({
    message: 'Workshop Product Caching API',
    endpoints: {
      getAllProducts: 'GET /products',
      getProductById: 'GET /products/:id',
      createProduct: 'POST /products',
      updateProduct: 'PUT /products/:id',
      patchProduct: 'PATCH /products/:id',
      deleteProduct: 'DELETE /products/:id'
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Central error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(err.statusCode || 500).json({
    message: err.message || 'Internal Server Error'
  });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

module.exports = app;