/**
 * LINE Target ID Resolution
 * 
 * Utilities for extracting and managing target IDs (user, group, room)
 * from LINE webhook events and environment configuration.
 * 
 * References:
 * - https://developers.line.biz/en/docs/messaging-api/receive-webhook-events/
 */

import type { LineWebhookEvent } from "./lineWebhook";

/**
 * Types of LINE targets that can receive messages
 */
export type LineTargetType = "user" | "group" | "room";

/**
 * Information about a LINE target ID
 */
export interface LineTargetInfo {
  /** The target ID (user, group, or room ID) */
  id: string;
  /** The type of target */
  type: LineTargetType;
  /** When this was discovered (ISO 8601) */
  discoveredAt: string;
}

/**
 * Extracted target information from a webhook event
 */
export interface LineTargetFromEvent {
  /** The target ID from the event */
  id: string | null;
  /** The type of target (if found) */
  type: LineTargetType | null;
  /** Error message if extraction failed */
  error?: string;
}

/**
 * Extract target ID from a LINE webhook event
 * 
 * When a user sends a message, LINE includes their ID in the event.
 * This function extracts it based on whether it's a user, group, or room.
 * 
 * @param event - The webhook event from LINE
 * @returns Object with target ID and type
 * 
 * @example
 * ```typescript
 * const event = {
 *   type: "message",
 *   source: {
 *     type: "user",
 *     userId: "Uab12345..."
 *   },
 *   message: { type: "text", text: "Hello" }
 * };
 * 
 * const target = extractTargetFromEvent(event);
 * // Returns: { id: "Uab12345...", type: "user" }
 * ```
 */
export function extractTargetFromEvent(event: LineWebhookEvent): LineTargetFromEvent {
  // Check if event has source information
  if (!event.source) {
    return {
      id: null,
      type: null,
      error: "Event has no source information",
    };
  }

  const source = event.source;
  const sourceType = source.type as LineTargetType | undefined;

  // Extract appropriate ID based on source type
  switch (sourceType) {
    case "user":
      if (source.userId) {
        return {
          id: source.userId,
          type: "user",
        };
      }
      return {
        id: null,
        type: null,
        error: "User source has no userId",
      };

    case "group":
      if (source.groupId) {
        return {
          id: source.groupId,
          type: "group",
        };
      }
      return {
        id: null,
        type: null,
        error: "Group source has no groupId",
      };

    case "room":
      if (source.roomId) {
        return {
          id: source.roomId,
          type: "room",
        };
      }
      return {
        id: null,
        type: null,
        error: "Room source has no roomId",
      };

    default:
      return {
        id: null,
        type: null,
        error: `Unknown source type: ${sourceType}`,
      };
  }
}

/**
 * Get the configured target ID from environment variables
 * 
 * The LINE_TARGET_USER_ID can be any type (user, group, or room).
 * This function retrieves it from the environment.
 * 
 * @returns The configured target ID, or null if not set
 * 
 * @example
 * ```typescript
 * const targetId = getConfiguredTargetId();
 * // Returns: "Uab12345..." or "Cab12345..." or "Rab12345..." or null
 * ```
 */
export function getConfiguredTargetId(): string | null {
  const targetId = process.env.LINE_TARGET_USER_ID;
  return targetId?.trim() ? targetId.trim() : null;
}

/**
 * Determine the type of a LINE ID by its prefix
 * 
 * LINE IDs have standard prefixes:
 * - U... = User ID
 * - C... = Group ID (Company/Conversation)
 * - R... = Room ID
 * 
 * @param id - The LINE ID to check
 * @returns The type of target, or null if unknown
 * 
 * @example
 * ```typescript
 * getTargetTypeFromId("Uab12345...") // "user"
 * getTargetTypeFromId("Cab12345...") // "group"
 * getTargetTypeFromId("Rab12345...") // "room"
 * getTargetTypeFromId("invalid")     // null
 * ```
 */
export function getTargetTypeFromId(id: string): LineTargetType | null {
  if (!id || id.length === 0) {
    return null;
  }

  const prefix = id.charAt(0).toUpperCase();

  switch (prefix) {
    case "U":
      return "user";
    case "C":
      return "group";
    case "R":
      return "room";
    default:
      return null;
  }
}

/**
 * Validate if a string is a valid LINE ID format
 * 
 * Valid LINE IDs:
 * - Start with U, C, or R
 * - Followed by alphanumeric characters
 * - Typical length: 33+ characters
 * 
 * @param id - The string to validate
 * @returns True if valid LINE ID format, false otherwise
 * 
 * @example
 * ```typescript
 * isValidLineId("Uab12345678abcdef1234567890abcd") // true
 * isValidLineId("invalidid")                        // false
 * isValidLineId("")                                 // false
 * ```
 */
export function isValidLineId(id: string): boolean {
  if (!id || id.length === 0) {
    return false;
  }

  // LINE IDs must start with U, C, or R
  const prefix = id.charAt(0);
  if (!["U", "C", "R"].includes(prefix)) {
    return false;
  }

  // Must be at least 33 characters (1 prefix + 32 alphanumeric)
  if (id.length < 33) {
    return false;
  }

  // Rest of ID should be alphanumeric
  const rest = id.substring(1);
  return /^[a-zA-Z0-9]{32,}$/.test(rest);
}

/**
 * Get a human-readable description of a target type
 * 
 * @param type - The target type
 * @returns Descriptive string (e.g., "User", "Group", "Room")
 * 
 * @example
 * ```typescript
 * getTargetTypeLabel("user")  // "User"
 * getTargetTypeLabel("group") // "Group"
 * getTargetTypeLabel("room")  // "Room"
 * ```
 */
export function getTargetTypeLabel(type: LineTargetType | null): string {
  switch (type) {
    case "user":
      return "User";
    case "group":
      return "Group";
    case "room":
      return "Room";
    default:
      return "Unknown";
  }
}

/**
 * Format a target ID with type information for display
 * 
 * @param id - The target ID
 * @returns Formatted string (e.g., "User: Uab12345...")
 * 
 * @example
 * ```typescript
 * formatTargetId("Uab12345...") // "User: Uab12345..."
 * formatTargetId("Cab12345...") // "Group: Cab12345..."
 * formatTargetId("invalid")     // "Unknown: invalid"
 * ```
 */
export function formatTargetId(id: string): string {
  const type = getTargetTypeFromId(id);
  const label = getTargetTypeLabel(type);
  return `${label}: ${id}`;
}

/**
 * Collect all unique target IDs from multiple webhook events
 * 
 * Useful for finding all users/groups/rooms that have interacted
 * with your bot. Can be stored for later use.
 * 
 * @param events - Array of webhook events
 * @returns Array of unique target information objects
 * 
 * @example
 * ```typescript
 * const events = [...]; // from webhook
 * const targets = collectTargetsFromEvents(events);
 * // targets = [
 * //   { id: "Uab...", type: "user", discoveredAt: "2026-02-20T..." },
 * //   { id: "Cab...", type: "group", discoveredAt: "2026-02-20T..." }
 * // ]
 * ```
 */
export function collectTargetsFromEvents(events: LineWebhookEvent[]): LineTargetInfo[] {
  if (!Array.isArray(events)) {
    return [];
  }

  const targetMap = new Map<string, LineTargetInfo>();
  const now = new Date().toISOString();

  events.forEach((event) => {
    const target = extractTargetFromEvent(event);
    if (target.id && target.type) {
      // Only add if not already collected (first discovery wins)
      if (!targetMap.has(target.id)) {
        targetMap.set(target.id, {
          id: target.id,
          type: target.type,
          discoveredAt: now,
        });
      }
    }
  });

  return Array.from(targetMap.values());
}
