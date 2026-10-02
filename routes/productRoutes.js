const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { cacheMiddleware } = require('../middleware/cacheMiddleware');

// Route -> Middleware -> Controller -> Service -> Database

// GET endpoints with caching middleware (1-minute TTL default)
router.get('/', cacheMiddleware(), productController.getAllProducts);
router.get('/:id', cacheMiddleware(), productController.getProductById);

// Modification endpoints: Controller handles Service invocation and cache invalidation
router.post('/', productController.createProduct);
router.put('/:id', productController.updateProduct);
router.patch('/:id', productController.patchProduct);
router.delete('/:id', productController.deleteProduct);

module.exports = router;
