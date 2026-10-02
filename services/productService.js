const { productDatabase } = require('../database');

const productService = {
  async getAllProducts() {
    return await productDatabase.findAll();
  },

  async getProductById(id) {
    if (!id || isNaN(Number(id))) {
      const error = new Error('Invalid product ID');
      error.statusCode = 400;
      throw error;
    }
    return await productDatabase.findById(Number(id));
  },

  async createProduct(productData) {
    if (!productData || !productData.name) {
      const error = new Error('Product name is required');
      error.statusCode = 400;
      throw error;
    }
    return await productDatabase.create(productData);
  },

  async updateProduct(id, productData) {
    if (!id || isNaN(Number(id))) {
      const error = new Error('Invalid product ID');
      error.statusCode = 400;
      throw error;
    }
    if (!productData || !productData.name) {
      const error = new Error('Product name is required');
      error.statusCode = 400;
      throw error;
    }
    return await productDatabase.update(Number(id), productData);
  },

  async patchProduct(id, partialData) {
    if (!id || isNaN(Number(id))) {
      const error = new Error('Invalid product ID');
      error.statusCode = 400;
      throw error;
    }
    if (!partialData || Object.keys(partialData).length === 0) {
      const error = new Error('At least one field is required to update');
      error.statusCode = 400;
      throw error;
    }
    return await productDatabase.patch(Number(id), partialData);
  },

  async deleteProduct(id) {
    if (!id || isNaN(Number(id))) {
      const error = new Error('Invalid product ID');
      error.statusCode = 400;
      throw error;
    }
    return await productDatabase.delete(Number(id));
  }
};

module.exports = productService;
