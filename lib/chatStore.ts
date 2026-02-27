/**
 * Chat Message Store (In-Memory)
 * 
 * Stores chat messages per userId in memory for the duration of the server session.
 * Messages are cleared on server restart/redeploy.
 * 
 * For production use, replace with a database (PostgreSQL + Prisma recommended).
 */

import Redis from "ioredis";
import type { ChatMessage, ChatSender } from "./types";

const MAX_MESSAGES_PER_USER = 200;

// Initialize Redis client if environment variables are available
let redis: Redis | null = null;

// Use 'KV_URL' (Vercel Default) or 'REDIS_URL' (Standard)
const redisUrl = process.env.KV_URL || process.env.REDIS_URL;

if (redisUrl) {
  console.log("Initializing Redis client...");
  try {
    redis = new Redis(redisUrl, {
      // Basic options to handle serverless connection lifecycle better
      maxRetriesPerRequest: 3,
      connectTimeout: 5000,
    });
    
    redis.on("error", (err) => {
      console.error("Redis connection error:", err);
    });
  } catch (error) {
    console.error("Failed to initialize Redis:", error);
  }
}

/**
 * In-memory message storage (fallback)
 */
const messagesByUser = new Map<string, ChatMessage[]>();

/**
 * Listeners for new messages
 */
const messageListeners = new Set<(data: { userId: string; message: ChatMessage }) => void>();

/**
 * Append a message to the chat store for a specific user
 */
export async function appendMessage(userId: string, text: string, sender: ChatSender): Promise<ChatMessage> {
  const message: ChatMessage = {
    id: crypto.randomUUID(),
    text,
    sender,
    createdAt: new Date().toISOString(),
  };

  // 1. Update In-Memory (for immediate local listeners/SSE on this instance)
  if (!messagesByUser.has(userId)) {
    messagesByUser.set(userId, []);
  }
  const userMessages = messagesByUser.get(userId)!;
  userMessages.push(message);
  if (userMessages.length > MAX_MESSAGES_PER_USER) {
    userMessages.splice(0, userMessages.length - MAX_MESSAGES_PER_USER);
  }

  // 2. Persist to Redis (if available)
  if (redis) {
    try {
      const key = `messages:${userId}`;
      await redis.rpush(key, JSON.stringify(message));
      await redis.ltrim(key, -MAX_MESSAGES_PER_USER, -1);
      await redis.sadd("active_users", userId);
      // Set expiry for 30 days to clean up old chats
      await redis.expire(key, 60 * 60 * 24 * 30);
      await redis.expire("active_users", 60 * 60 * 24 * 30); 
    } catch (error) {
      console.error("Redis error in appendMessage:", error);
    }
  }

  // Notify listeners (only works for same-instance connections)
  messageListeners.forEach((listener) => {
    listener({ userId, message });
  });

  return message;
}

/**
 * Get all messages for a specific user
 */
export async function getMessages(userId: string): Promise<ChatMessage[]> {
  // If Redis is available, fetch from there
  if (redis) {
    try {
      const rawMessages = await redis.lrange(`messages:${userId}`, 0, -1);
      const messages = rawMessages.map((msg) => JSON.parse(msg) as ChatMessage);
      
      // Update in-memory cache to sync recent history for this instance
      if (messages && messages.length > 0) {
        messagesByUser.set(userId, messages);
        return messages;
      }
    } catch (error) {
      console.error("Redis error in getMessages:", error);
    }
  }

  // Fallback to in-memory
  return messagesByUser.get(userId) || [];
}

/**
 * Get all active users
 */
export async function getActiveUsers(): Promise<string[]> {
  if (redis) {
    try {
      const users = await redis.smembers("active_users");
      if (users && users.length > 0) {
        // Merge with local memory
        const localUsers = Array.from(messagesByUser.keys());
        const allUsers = new Set([...users, ...localUsers]);
        return Array.from(allUsers);
      }
    } catch (error) {
      console.error("Redis error in getActiveUsers:", error);
    }
  }

  return Array.from(messagesByUser.keys());
}

/**
 * Register a listener for new messages (Same-instance only)
 */
export function onNewMessage(
  listener: (data: { userId: string; message: ChatMessage }) => void
): () => void {
  messageListeners.add(listener);
  return () => {
    messageListeners.delete(listener);
  };
}

