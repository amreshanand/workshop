// In-memory cache storage: key -> { data, createdAt }
const cache = new Map();

// 1 minute TTL in milliseconds
const DEFAULT_TTL_MS = 60 * 1000;

/**
 * Cache middleware for Express GET endpoints.
 * @param {number} ttl Time to live in milliseconds (default: 60000ms / 1 min)
 */
function cacheMiddleware(ttl = DEFAULT_TTL_MS) {
  return (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    const key = req.originalUrl || req.url;
    const now = Date.now();
    const cachedEntry = cache.get(key);

    if (cachedEntry) {
      const age = now - cachedEntry.createdAt;

      // Check whether cached value is older than 1 minute (TTL)
      if (age < ttl) {
        // Cache HIT: within TTL
        res.setHeader('X-Cache', 'HIT');
        res.setHeader('X-Cache-Created-At', new Date(cachedEntry.createdAt).toISOString());
        res.setHeader('X-Cache-Age-Seconds', Math.floor(age / 1000).toString());
        console.log(`[Cache HIT] key: ${key} (age: ${Math.floor(age / 1000)}s)`);
        return res.json(cachedEntry.data);
      } else {
        // Cache EXPIRED: older than 1 minute, discard entry
        console.log(`[Cache EXPIRED] key: ${key} (age: ${Math.floor(age / 1000)}s > TTL ${ttl / 1000}s) - refreshing from database`);
        cache.delete(key);
      }
    }

    // Cache MISS: not present or expired
    res.setHeader('X-Cache', 'MISS');
    console.log(`[Cache MISS] key: ${key} - fetching latest data from database`);

    // Intercept res.json to capture fresh data and save to cache
    const originalJson = res.json.bind(res);
    res.json = (body) => {
      // Only cache successful responses (2xx)
      if (res.statusCode >= 200 && res.statusCode < 300) {
        cache.set(key, {
          data: body,
          createdAt: Date.now()
        });
        console.log(`[Cache SAVED] key: ${key} at ${new Date().toISOString()}`);
      }
      return originalJson(body);
    };

    next();
  };
}

/**
 * Invalidates cache entries that may contain stale data.
 * If a prefix/filter is given, deletes matching entries; otherwise clears all entries.
 * @param {string} [prefix] Optional key prefix to target specific cache entries
 */
function invalidateCache(prefix = '') {
  if (!prefix) {
    const size = cache.size;
    cache.clear();
    console.log(`[Cache INVALIDATION] Invalided all ${size} cache entries`);
    return;
  }

  let count = 0;
  for (const key of cache.keys()) {
    if (key.startsWith(prefix) || key.includes(prefix)) {
      cache.delete(key);
      count++;
    }
  }
  console.log(`[Cache INVALIDATION] Invalidated ${count} cache entries matching "${prefix}"`);
}

/**
 * Returns raw cache store for inspection or testing.
 */
function getCacheStore() {
  return cache;
}

module.exports = {
  cacheMiddleware,
  invalidateCache,
  getCacheStore,
  DEFAULT_TTL_MS
};
