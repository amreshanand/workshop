const fs = require('fs').promises;
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'db.json');
const SIMULATED_DELAY_MS = 1000; // Simulated database latency

// Helper to simulate network / database access delay
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function readAll() {
  await delay(SIMULATED_DELAY_MS);
  try {
    const rawData = await fs.readFile(DB_PATH, 'utf-8');
    return JSON.parse(rawData);
  } catch (err) {
    if (err.code === 'ENOENT') {
      await fs.writeFile(DB_PATH, JSON.stringify([]));
      return [];
    }
    throw err;
  }
}

async function writeAll(data) {
  await delay(100);
  await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

const productDatabase = {
  async findAll() {
    return await readAll();
  },

  async findById(id) {
    const products = await readAll();
    return products.find((p) => p.id === Number(id)) || null;
  },

  async create(productData) {
    const products = await readAll();
    const newId = products.length > 0 ? Math.max(...products.map((p) => p.id || 0)) + 1 : 1;
    const newProduct = {
      id: newId,
      name: productData.name,
      price: productData.price !== undefined ? Number(productData.price) : 0,
      ...productData,
      id: newId // ensure ID is preserved
    };

    products.push(newProduct);
    await writeAll(products);
    return newProduct;
  },

  async update(id, productData) {
    const products = await readAll();
    const targetIndex = products.findIndex((p) => p.id === Number(id));
    if (targetIndex === -1) {
      return null;
    }

    const updatedProduct = {
      id: Number(id),
      name: productData.name,
      price: productData.price !== undefined ? Number(productData.price) : 0,
      ...productData,
      id: Number(id)
    };

    products[targetIndex] = updatedProduct;
    await writeAll(products);
    return updatedProduct;
  },

  async patch(id, partialData) {
    const products = await readAll();
    const targetIndex = products.findIndex((p) => p.id === Number(id));
    if (targetIndex === -1) {
      return null;
    }

    const existingProduct = products[targetIndex];
    const patchedProduct = {
      ...existingProduct,
      ...partialData,
      id: existingProduct.id // protect ID from being overwritten
    };

    if (partialData.price !== undefined) {
      patchedProduct.price = Number(partialData.price);
    }

    products[targetIndex] = patchedProduct;
    await writeAll(products);
    return patchedProduct;
  },

  async delete(id) {
    const products = await readAll();
    const targetIndex = products.findIndex((p) => p.id === Number(id));
    if (targetIndex === -1) {
      return null;
    }

    const [deletedProduct] = products.splice(targetIndex, 1);
    await writeAll(products);
    return deletedProduct;
  }
};

module.exports = productDatabase;
