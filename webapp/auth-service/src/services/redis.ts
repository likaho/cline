import { createClient, RedisClientType } from 'redis';
import { config } from '../config';

let redisClient: RedisClientType | null = null;

export async function getRedisClient(): Promise<RedisClientType> {
  if (!redisClient) {
    redisClient = createClient({
      url: config.redis.url,
    });
    
    redisClient.on('error', (err) => console.error('Redis error:', err));
    await redisClient.connect();
  }
  return redisClient;
}

export async function closeRedis(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
}

// Session management
export async function storeSession(sessionId: string, data: object, ttlSeconds: number = 3600): Promise<void> {
  const client = await getRedisClient();
  await client.setEx(`session:${sessionId}`, ttlSeconds, JSON.stringify(data));
}

export async function getSession(sessionId: string): Promise<object | null> {
  const client = await getRedisClient();
  const data = await client.get(`session:${sessionId}`);
  return data ? JSON.parse(data) : null;
}

export async function deleteSession(sessionId: string): Promise<void> {
  const client = await getRedisClient();
  await client.del(`session:${sessionId}`);
}

// Rate limiting
export async function checkRateLimit(key: string, limit: number, windowSeconds: number): Promise<boolean> {
  const client = await getRedisClient();
  const current = await client.incr(`ratelimit:${key}`);
  
  if (current === 1) {
    await client.expire(`ratelimit:${key}`, windowSeconds);
  }
  
  return current <= limit;
}

// Token blacklist
export async function blacklistToken(token: string, expiresIn: number): Promise<void> {
  const client = await getRedisClient();
  await client.setEx(`blacklist:${token}`, expiresIn, 'true');
}

export async function isTokenBlacklisted(token: string): Promise<boolean> {
  const client = await getRedisClient();
  const result = await client.get(`blacklist:${token}`);
  return result === 'true';
}
