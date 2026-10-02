const http = require('http');
const app = require('./server');
const { getCacheStore, invalidateCache } = require('./middleware/cacheMiddleware');

function request(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: body ? JSON.parse(body) : null
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body
          });
        }
      });
    });
    req.on('error', reject);
    if (data) {
      req.write(typeof data === 'string' ? data : JSON.stringify(data));
    }
    req.end();
  });
}

async function runTests() {
  const server = app.listen(0);
  const port = server.address().port;
  console.log(`Test server running on port ${port}`);

  try {
    // Clear cache initially
    invalidateCache();

    console.log('\n--- TEST 1: GET /products (Initial Cache MISS) ---');
    const res1 = await request({ hostname: 'localhost', port, path: '/products', method: 'GET' });
    console.log(`Status: ${res1.statusCode}, X-Cache: ${res1.headers['x-cache']}`);
    if (res1.headers['x-cache'] !== 'MISS') throw new Error('Expected MISS on first call');
    console.log('Result: PASSED');

    console.log('\n--- TEST 2: GET /products (Cache HIT) ---');
    const res2 = await request({ hostname: 'localhost', port, path: '/products', method: 'GET' });
    console.log(`Status: ${res2.statusCode}, X-Cache: ${res2.headers['x-cache']}, Age: ${res2.headers['x-cache-age-seconds']}s`);
    if (res2.headers['x-cache'] !== 'HIT') throw new Error('Expected HIT on second call');
    console.log('Result: PASSED');

    console.log('\n--- TEST 3: GET /products/1 (Initial Cache MISS) ---');
    const res3 = await request({ hostname: 'localhost', port, path: '/products/1', method: 'GET' });
    console.log(`Status: ${res3.statusCode}, X-Cache: ${res3.headers['x-cache']}`);
    if (res3.headers['x-cache'] !== 'MISS') throw new Error('Expected MISS for single product first call');
    console.log('Result: PASSED');

    console.log('\n--- TEST 4: GET /products/1 (Cache HIT) ---');
    const res4 = await request({ hostname: 'localhost', port, path: '/products/1', method: 'GET' });
    console.log(`Status: ${res4.statusCode}, X-Cache: ${res4.headers['x-cache']}`);
    if (res4.headers['x-cache'] !== 'HIT') throw new Error('Expected HIT for single product second call');
    console.log('Result: PASSED');

    console.log('\n--- TEST 5: Verify createdAt timestamp stored in cache ---');
    const cache = getCacheStore();
    const listEntry = cache.get('/products');
    console.log('Stored cache entry for /products:', {
      dataCount: listEntry?.data?.length,
      createdAt: listEntry?.createdAt,
      dateString: new Date(listEntry?.createdAt).toISOString()
    });
    if (!listEntry || !listEntry.createdAt) throw new Error('Cache entry must store createdAt timestamp');
    console.log('Result: PASSED');

    console.log('\n--- TEST 6: POST /products (Invalidates Cache) ---');
    const res5 = await request({
      hostname: 'localhost',
      port,
      path: '/products',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { name: 'Headphones', price: 99.99 });
    console.log(`Status: ${res5.statusCode}, Created Product ID: ${res5.body?.id}`);
    if (res5.statusCode !== 201) throw new Error('Expected 201 Created');
    
    // Check if cache entries for products were invalidated
    if (cache.has('/products') || cache.has('/products/1')) {
      throw new Error('Cache entries should be invalidated after POST');
    }
    console.log('Cache invalidated successfully. Size:', cache.size);
    console.log('Result: PASSED');

    console.log('\n--- TEST 7: GET /products after mutation (Cache MISS with updated data) ---');
    const res6 = await request({ hostname: 'localhost', port, path: '/products', method: 'GET' });
    console.log(`Status: ${res6.statusCode}, X-Cache: ${res6.headers['x-cache']}`);
    if (res6.headers['x-cache'] !== 'MISS') throw new Error('Expected MISS after invalidation');
    const foundNewProduct = res6.body.some(p => p.name === 'Headphones');
    console.log(`Found newly added product: ${foundNewProduct}`);
    if (!foundNewProduct) throw new Error('New product not found in fetched data');
    console.log('Result: PASSED');

    console.log('\n--- TEST 8: PUT /products/:id (Update & Invalidate) ---');
    const res7 = await request({
      hostname: 'localhost',
      port,
      path: `/products/${res5.body.id}`,
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' }
    }, { name: 'Wireless Headphones', price: 129.99 });
    console.log(`Status: ${res7.statusCode}, Name: ${res7.body?.name}`);
    if (cache.has('/products')) throw new Error('Cache should be invalidated after PUT');
    console.log('Result: PASSED');

    console.log('\n--- TEST 9: DELETE /products/:id (Delete & Invalidate) ---');
    const res8 = await request({
      hostname: 'localhost',
      port,
      path: `/products/${res5.body.id}`,
      method: 'DELETE'
    });
    console.log(`Status: ${res8.statusCode}, Deleted: ${res8.body?.product?.name}`);
    if (cache.has('/products')) throw new Error('Cache should be invalidated after DELETE');
    console.log('Result: PASSED');

    console.log('\n--- TEST 10: TTL Expiration (> 1 minute) ---');
    // First, seed the cache with a GET
    await request({ hostname: 'localhost', port, path: '/products', method: 'GET' });
    // Manually manipulate the createdAt timestamp to simulate 61 seconds ago
    const entry = cache.get('/products');
    entry.createdAt = Date.now() - (61 * 1000); // 61 seconds ago (> 1 minute TTL)
    console.log(`Simulated cache entry age: ${Math.floor((Date.now() - entry.createdAt) / 1000)}s (> 60s TTL)`);

    const res9 = await request({ hostname: 'localhost', port, path: '/products', method: 'GET' });
    console.log(`Status: ${res9.statusCode}, X-Cache: ${res9.headers['x-cache']}`);
    if (res9.headers['x-cache'] !== 'MISS') throw new Error('Expected MISS because cache entry expired (> 1 min TTL)');
    
    // Check that entry in cache is now refreshed with current timestamp
    const refreshedEntry = cache.get('/products');
    const refreshedAge = Date.now() - refreshedEntry.createdAt;
    console.log(`Refreshed cache entry age: ${refreshedAge}ms`);
    if (refreshedAge > 1000) throw new Error('Fresh value was not stored properly');
    console.log('Result: PASSED');

    console.log('\nALL 10 TESTS PASSED SUCCESSFULLY! 🎉\n');
  } finally {
    server.close();
  }
}

runTests().catch((err) => {
  console.error('\n❌ Test failed:', err);
  process.exit(1);
});
