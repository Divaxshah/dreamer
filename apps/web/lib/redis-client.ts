import { Redis } from "@upstash/redis";

let redis: Redis | null = null;

/** Shared Upstash client for preview links and dashboard session persistence. */
export const getRedis = (): Redis | null => {
  if (redis) {
    return redis;
  }
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    return null;
  }
  redis = new Redis({ url, token });
  return redis;
};

export const hasRedis = (): boolean => getRedis() !== null;
