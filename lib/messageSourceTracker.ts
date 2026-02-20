/**
 * Webhook Event Source Tracker
 * 
 * Tracks which LINE users/groups/rooms have sent messages to your bot.
 * This enables dynamic discovery of target IDs without manual lookup.
 * 
 * In production, this should be persisted to a database.
 * For MVP, uses in-memory storage.
 */

import { getTargetTypeFromId, type LineTargetInfo } from "./lineTargetId";

/**
 * Information about a message source (who sent the message)
 */
export interface MessageSource extends LineTargetInfo {
  /** The most recent timestamp from this source */
  lastMessageAt: string;
  /** Number of messages from this source */
  messageCount: number;
}

const MAX_TRACKED_SOURCES = 100;

/**
 * In-memory store of message sources
 * Key: target ID, Value: message source info
 */
const messageSources = new Map<string, MessageSource>();

/**
 * Record a message source (add or update in-memory tracking)
 * 
 * Call this when you receive a message from a LINE user/group/room
 * to track that they've communicated with your bot.
 * 
 * @param targetId - The LINE user/group/room ID
 * @returns The updated message source info
 * 
 * @example
 * ```typescript
 * const result = recordMessageSource("Uab12345...");
 * console.log(result.messageCount); // 1 (or more if already tracked)
 * ```
 */
export function recordMessageSource(targetId: string): MessageSource | null {
  if (!targetId) {
    return null;
  }

  const now = new Date().toISOString();
  const type = getTargetTypeFromId(targetId);

  if (!type) {
    return null;
  }

  // Update existing or create new record
  if (messageSources.has(targetId)) {
    const existing = messageSources.get(targetId)!;
    existing.lastMessageAt = now;
    existing.messageCount += 1;
    return existing;
  }

  // New source
  const newSource: MessageSource = {
    id: targetId,
    type,
    discoveredAt: now,
    lastMessageAt: now,
    messageCount: 1,
  };

  messageSources.set(targetId, newSource);

  // Keep bounded size
  if (messageSources.size > MAX_TRACKED_SOURCES) {
    // Remove oldest source
    const oldest = Array.from(messageSources.entries()).sort(
      (a, b) => new Date(a[1].discoveredAt).getTime() - new Date(b[1].discoveredAt).getTime()
    )[0];
    if (oldest) {
      messageSources.delete(oldest[0]);
    }
  }

  return newSource;
}

/**
 * Get all tracked message sources
 * 
 * @returns Array of all discovered target IDs
 * 
 * @example
 * ```typescript
 * const sources = getAllMessageSources();
 * sources.forEach(source => {
 *   console.log(`${source.type}: ${source.id} (${source.messageCount} messages)`);
 * });
 * ```
 */
export function getAllMessageSources(): MessageSource[] {
  return Array.from(messageSources.values()).sort(
    (a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
  );
}

/**
 * Get a specific tracked message source
 * 
 * @param targetId - The LINE ID to look up
 * @returns Message source info or null if not found
 * 
 * @example
 * ```typescript
 * const source = getMessageSource("Uab12345...");
 * if (source) {
 *   console.log(`Last message: ${source.lastMessageAt}`);
 * }
 * ```
 */
export function getMessageSource(targetId: string): MessageSource | null {
  return messageSources.get(targetId) ?? null;
}

/**
 * Get message sources by type
 * 
 * @param type - Type to filter by ("user", "group", or "room")
 * @returns Array of sources matching the type
 * 
 * @example
 * ```typescript
 * const users = getMessageSourcesByType("user");
 * console.log(`${users.length} unique users have messaged`);
 * ```
 */
export function getMessageSourcesByType(type: "user" | "group" | "room"): MessageSource[] {
  return Array.from(messageSources.values())
    .filter((source) => source.type === type)
    .sort(
      (a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
    );
}

/**
 * Clear all tracked sources
 * 
 * Use with caution! This will forget all tracked target IDs.
 * 
 * @example
 * ```typescript
 * clearAllMessageSources();
 * console.log("Tracking reset");
 * ```
 */
export function clearAllMessageSources(): void {
  messageSources.clear();
}

/**
 * Get statistics about tracked sources
 * 
 * @returns Object with counts by type
 * 
 * @example
 * ```typescript
 * const stats = getMessageSourceStats();
 * console.log(`${stats.total} unique sources`);
 * console.log(`${stats.users} individual users`);
 * console.log(`${stats.groups} groups`);
 * console.log(`${stats.rooms} rooms`);
 * ```
 */
export function getMessageSourceStats(): {
  total: number;
  users: number;
  groups: number;
  rooms: number;
  totalMessages: number;
} {
  const sources = Array.from(messageSources.values());

  return {
    total: sources.length,
    users: sources.filter((s) => s.type === "user").length,
    groups: sources.filter((s) => s.type === "group").length,
    rooms: sources.filter((s) => s.type === "room").length,
    totalMessages: sources.reduce((sum, s) => sum + s.messageCount, 0),
  };
}

/**
 * Export sources for backup/storage
 * 
 * Use this to export tracked sources before server restart.
 * In production, save to a database instead.
 * 
 * @returns JSON-serializable array of sources
 * 
 * @example
 * ```typescript
 * const exported = exportMessageSources();
 * await fs.writeFile("sources.json", JSON.stringify(exported, null, 2));
 * ```
 */
export function exportMessageSources(): MessageSource[] {
  return getAllMessageSources();
}

/**
 * Import sources for recovery/restore
 * 
 * Use this to restore tracked sources after server restart.
 * In production, load from a database instead.
 * 
 * @param sources - Array of message sources to import
 * 
 * @example
 * ```typescript
 * const data = JSON.parse(await fs.readFile("sources.json"));
 * importMessageSources(data);
 * console.log("Sources restored");
 * ```
 */
export function importMessageSources(sources: MessageSource[]): void {
  messageSources.clear();

  if (Array.isArray(sources)) {
    sources.forEach((source) => {
      if (source.id && source.type) {
        messageSources.set(source.id, source);
      }
    });
  }
}
