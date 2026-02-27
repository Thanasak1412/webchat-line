/**
 * LINE Webhook Event Types and Utilities
 * 
 * References:
 * - https://developers.line.biz/en/docs/messaging-api/receive-webhook-events/
 * - https://developers.line.biz/en/docs/messaging-api/message-event/
 */

import { LineMessage } from "./types";

/**
 * LINE Webhook request body
 * @see https://developers.line.biz/en/docs/messaging-api/receive-webhook-events/
 */
export interface LineWebhookRequestBody {
  /** Bot's user ID */
  destination?: string;
  /** Array of webhook events */
  events?: LineWebhookEvent[];
}

/**
 * LINE Webhook event (message, follow, join, etc.)
 * @see https://developers.line.biz/en/docs/messaging-api/receive-webhook-events/
 */
export interface LineWebhookEvent {
  /** Event type: "message", "follow", "join", "leave", "postback", etc. */
  type: string;
  /** Reply token (use to send reply to specific user) */
  replyToken?: string;
  /** Timestamp when event occurred */
  timestamp?: number;
  /** Source of the event (user, group, room) */
  source?: {
    type: "user" | "group" | "room";
    userId?: string;
    groupId?: string;
    roomId?: string;
  };
  /** Message content (only for message events) */
  message?: LineMessage;
}

/**
 * Extract incoming text messages from webhook body
 * Filters for message events with text type and returns the text content
 * 
 * @param body - The webhook request body from LINE
 * @returns Array of text message strings
 */
export function extractIncomingTextMessages(body: LineWebhookRequestBody): string[] {
  if (!Array.isArray(body.events)) {
    return [];
  }

  return body.events
    .filter((event) => event.type === "message" && event.message?.type === "text")
    .map((event) => event.message?.text?.trim() ?? "")
    .filter((text) => text.length > 0);
}
