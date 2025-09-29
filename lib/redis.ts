import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

export const getCache = async (key: string) => {
    const value = await redis.get(key);
    return value ? JSON.parse(value) : null;
};

export const setCache = async (key: string, value: any, ttl: number) => {
    await redis.set(key, JSON.stringify(value), 'EX', ttl);
};

export const delCache = async (key: string) => {
    await redis.del(key);
};

export const clearCache = async () => {
    await redis.flushall();
};

export default redis;
