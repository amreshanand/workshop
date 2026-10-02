const productService = require('../services/productService');
const { invalidateCache } = require('../middleware/cacheMiddleware');

const productController = {
  // GET /products
  async getAllProducts(req, res) {
    try {
      const products = await productService.getAllProducts();
      return res.status(200).json(products);
    } catch (err) {
      console.error('Error fetching products:', err);
      return res.status(err.statusCode || 500).json({
        message: err.message || 'Internal Server Error'
      });
    }
  },

  // GET /products/:id
  async getProductById(req, res) {
    try {
      const product = await productService.getProductById(req.params.id);
      if (!product) {
        return res.status(404).json({
          message: 'Product not found'
        });
      }
      return res.status(200).json(product);
    } catch (err) {
      console.error('Error fetching product by ID:', err);
      return res.status(err.statusCode || 500).json({
        message: err.message || 'Internal Server Error'
      });
    }
  },

  // POST /products
  async createProduct(req, res) {
    try {
      const newProduct = await productService.createProduct(req.body);

      // Invalidate cache entries that may contain stale data
      invalidateCache('/products');

      return res.status(201).json(newProduct);
    } catch (err) {
      console.error('Error creating product:', err);
      return res.status(err.statusCode || 500).json({
        message: err.message || 'Internal Server Error'
      });
    }
  },

  // PUT /products/:id
  async updateProduct(req, res) {
    try {
      const updatedProduct = await productService.updateProduct(req.params.id, req.body);
      if (!updatedProduct) {
        return res.status(404).json({
          message: 'Product not found'
        });
      }

      // Invalidate cache entries that may contain stale data
      invalidateCache('/products');

      return res.status(200).json(updatedProduct);
    } catch (err) {
      console.error('Error updating product:', err);
      return res.status(err.statusCode || 500).json({
        message: err.message || 'Internal Server Error'
      });
    }
  },

  // PATCH /products/:id
  async patchProduct(req, res) {
    try {
      const patchedProduct = await productService.patchProduct(req.params.id, req.body);
      if (!patchedProduct) {
        return res.status(404).json({
          message: 'Product not found'
        });
      }

      // Invalidate cache entries that may contain stale data
      invalidateCache('/products');

      return res.status(200).json(patchedProduct);
    } catch (err) {
      console.error('Error patching product:', err);
      return res.status(err.statusCode || 500).json({
        message: err.message || 'Internal Server Error'
      });
    }
  },

  // DELETE /products/:id
  async deleteProduct(req, res) {
    try {
      const deletedProduct = await productService.deleteProduct(req.params.id);
      if (!deletedProduct) {
        return res.status(404).json({
          message: 'Product not found'
        });
      }

      // Invalidate cache entries that may contain stale data
      invalidateCache('/products');

      return res.status(200).json({
        message: 'Product deleted successfully',
        product: deletedProduct
      });
    } catch (err) {
      console.error('Error deleting product:', err);
      return res.status(err.statusCode || 500).json({
        message: err.message || 'Internal Server Error'
      });
    }
  }
};

module.exports = productController;
