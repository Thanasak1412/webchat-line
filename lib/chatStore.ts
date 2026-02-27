/**
 * Chat Message Store (In-Memory)
 * 
 * Stores chat messages per userId in memory for the duration of the server session.
 * Messages are cleared on server restart/redeploy.
 * 
 * For production use, replace with a database (PostgreSQL + Prisma recommended).
 */

import type { ChatMessage, ChatSender } from "./types";

const MAX_MESSAGES_PER_USER = 200;

/**
 * In-memory message storage organized by userId
 * Resets whenever the server restarts or redeploys
 */
const messagesByUser = new Map<string, ChatMessage[]>();

/**
 * Listeners for new messages (for SSE)
 */
const messageListeners = new Set<(data: { userId: string; message: ChatMessage }) => void>();

/**
 * Append a message to the chat store for a specific user
 * 
 * @param userId - The LINE user ID
 * @param text - Message text content
 * @param sender - Who sent the message ("line" or "me")
 * @returns The created ChatMessage object
 * 
 * @example
 * ```typescript
 * const msg = appendMessage("U1234567890abcdef", "Hello!", "line");
 * console.log(msg.id); // UUID of the message
 * ```
 */
export function appendMessage(userId: string, text: string, sender: ChatSender): ChatMessage {
  if (!messagesByUser.has(userId)) {
    messagesByUser.set(userId, []);
  }

  const message: ChatMessage = {
    id: crypto.randomUUID(),
    text,
    sender,
    createdAt: new Date().toISOString(),
  };

  const userMessages = messagesByUser.get(userId)!;
  userMessages.push(message);

  // Keep memory bounded by removing oldest messages if we exceed MAX_MESSAGES_PER_USER
  if (userMessages.length > MAX_MESSAGES_PER_USER) {
    userMessages.splice(0, userMessages.length - MAX_MESSAGES_PER_USER);
  }

  // Notify listeners
  messageListeners.forEach((listener) => {
    listener({ userId, message });
  });

  return message;
}

/**
 * Get all messages for a specific user
 * 
 * @param userId - The LINE user ID
 * @returns Copy of the messages array for that user
 * 
 * @example
 * ```typescript
 * const userMessages = getMessages("U1234567890abcdef");
 * console.log(`Messages: ${userMessages.length}`);
 * ```
 */
export function getMessages(userId: string): ChatMessage[] {
  const userMessages = messagesByUser.get(userId) || [];
  return [...userMessages];
}

/**
 * Get all active users (users who have at least one message)
 * 
 * @returns Array of user IDs
 * 
 * @example
 * ```typescript
 * const users = getActiveUsers();
 * console.log(`Active users: ${users.length}`);
 * ```
 */
export function getActiveUsers(): string[] {
  return Array.from(messagesByUser.keys());
}

/**
 * Register a listener for new messages
 * 
 * @param listener - Function to call when new messages arrive
 * @returns Unsubscribe function
 * 
 * @example
 * ```typescript
 * const unsubscribe = onNewMessage(({ userId, message }) => {
 *   console.log(`New message from ${userId}: ${message.text}`);
 * });
 * // Later...
 * unsubscribe();
 * ```
 */
export function onNewMessage(
  listener: (data: { userId: string; message: ChatMessage }) => void
): () => void {
  messageListeners.add(listener);
  return () => {
    messageListeners.delete(listener);
  };
}
