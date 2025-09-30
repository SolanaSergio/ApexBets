import Redis from 'ioredis';

// Create Redis instance with error handling and graceful fallback
let redis: Redis | null = null;

try {
  if (process.env.REDIS_URL) {
    redis = new Redis(process.env.REDIS_URL);
    
    // Handle Redis connection errors gracefully
    redis.on('error', (error) => {
      console.warn('Redis connection error (continuing without cache):', error.message);
    });
    
    redis.on('connect', () => {
      console.log('Redis connected successfully');
    });
  } else {
    console.warn('REDIS_URL not set, running without Redis cache');
  }
} catch (error) {
  console.warn('Failed to initialize Redis (continuing without cache):', error);
  redis = null;
}

// Cache functions with fallback when Redis is unavailable
export const getCache = async (key: string) => {
  if (!redis) return null;
  try {
    const value = await redis.get(key);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    console.warn('Redis get error:', error);
    return null;
  }
};

export const setCache = async (key: string, value: any, ttl: number) => {
  if (!redis) return;
  try {
    await redis.set(key, JSON.stringify(value), 'EX', ttl);
  } catch (error) {
    console.warn('Redis set error:', error);
  }
};

export const delCache = async (key: string) => {
  if (!redis) return;
  try {
    await redis.del(key);
  } catch (error) {
    console.warn('Redis del error:', error);
  }
};

export const clearCache = async () => {
  if (!redis) return;
  try {
    await redis.flushall();
  } catch (error) {
    console.warn('Redis flushall error:', error);
  }
};

// Health check function
export const isRedisHealthy = async (): Promise<boolean> => {
  if (!redis) return false;
  try {
    await redis.ping();
    return true;
  } catch (error) {
    return false;
  }
};

export default redis;
