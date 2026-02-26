import { createClient, RedisClientType } from 'redis';
import { config } from '../config';

let redisClient: RedisClientType | null = null;

export async function getRedisClient(): Promise<RedisClientType> {
  if (!redisClient) {
    redisClient = createClient({ url: config.redis.url });
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

// Pub/Sub for task events
export async function publishTaskEvent(channel: string, message: object): Promise<void> {
  const client = await getRedisClient();
  await client.publish(channel, JSON.stringify(message));
}

export async function subscribeToTaskEvents(
  channel: string,
  callback: (message: string) => void
): Promise<void> {
  const client = await getRedisClient();
  const subscriber = client.duplicate();
  await subscriber.connect();
  
  await subscriber.subscribe(channel, (message) => {
    callback(message);
  });
}
