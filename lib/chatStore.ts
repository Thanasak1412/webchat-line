/**
 * Chat Message Store (In-Memory)
 * 
 * Stores chat messages in memory for the duration of the server session.
 * Messages are cleared on server restart/redeploy.
 * 
 * For production use, replace with a database (PostgreSQL + Prisma recommended).
 */

import type { ChatMessage, ChatSender } from "./types";

const MAX_MESSAGES = 200;

/**
 * In-memory message storage
 * Resets whenever the server restarts or redeploys
 * Maximum 200 messages to avoid unbounded memory growth
 */
const messages: ChatMessage[] = [
  {
    id: crypto.randomUUID(),
    text: "This is your LINE webchat starter.",
    sender: "system",
    createdAt: new Date().toISOString(),
  },
];

/**
 * Append a message to the chat store
 * 
 * @param text - Message text content
 * @param sender - Who sent the message
 * @returns The created ChatMessage object
 * 
 * @example
 * ```typescript
 * const msg = appendMessage("Hello!", "me");
 * console.log(msg.id); // UUID of the message
 * ```
 */
export function appendMessage(text: string, sender: ChatSender): ChatMessage {
  const message: ChatMessage = {
    id: crypto.randomUUID(),
    text,
    sender,
    createdAt: new Date().toISOString(),
  };

  messages.push(message);

  // Keep memory bounded by removing oldest messages if we exceed MAX_MESSAGES
  if (messages.length > MAX_MESSAGES) {
    messages.splice(0, messages.length - MAX_MESSAGES);
  }

  return message;
}

/**
 * Get all messages from the chat store
 * 
 * @returns Copy of the messages array (not a reference)
 * 
 * @example
 * ```typescript
 * const allMessages = getMessages();
 * console.log(`Total messages: ${allMessages.length}`);
 * ```
 */
export function getMessages(): ChatMessage[] {
  return [...messages];
}
