/**
 * Chat Application Types
 * Shared TypeScript interfaces used across frontend and backend
 */

/**
 * Who sent a chat message
 */
export type ChatSender = "me" | "line" | "system";

/**
 * A message in the chat
 */
export interface ChatMessage {
  /** Unique identifier (UUID) */
  id: string;
  /** Message text content */
  text: string;
  /** Who sent the message */
  sender: ChatSender;
  /** When it was created (ISO 8601) */
  createdAt: string;
}

/**
 * Request body for sending a message
 */
export interface SendMessageRequestBody {
  /** Text message to send (1-5000 characters) */
  message: string;
}

/**
 * Request body for sending to a specific target
 */
export interface SendToTargetRequestBody {
  /** The LINE target ID (user, group, or room) */
  targetId: string;
  /** Text message to send (1-5000 characters) */
  message: string;
}

/**
 * Successful API response with optional data payload
 */
export type ApiSuccessResponse<T = undefined> = T extends undefined
  ? {
      success: true;
    }
  : {
      success: true;
      data: T;
    };

/**
 * Error API response
 */
export interface ApiErrorResponse {
  success: false;
  /** Human-readable error message */
  error: string;
}

/**
 * Union type for any API response
 */
export type ApiResponse<T = undefined> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * Response from /api/messages endpoint
 */
export interface GetMessagesResponse extends ApiSuccessResponse<{ messages: ChatMessage[] }> {
  // structure guaranteed by success: true and data property
}

/**
 * Response from /api/send-message endpoint
 */
export type SendMessageResponse = ApiSuccessResponse | ApiErrorResponse;

/**
 * Response from /api/webhook endpoint
 */
export interface WebhookResponse {
  received: boolean;
  error?: string;
  textMessageCount?: number;
}

/**
 * Information about a LINE target (user, group, or room)
 */
export interface LineTarget {
  /** The target ID */
  id: string;
  /** Type: user, group, or room */
  type: "user" | "group" | "room";
  /** Is the ID format valid */
  isValid: boolean;
}

/**
 * Response from /api/line/targets endpoint
 */
export interface GetTargetsResponse
  extends ApiSuccessResponse<{
    configured: LineTarget | null;
    discovered: Array<{
      id: string;
      type: string;
      discoveredAt: string;
      lastMessageAt: string;
      messageCount: number;
    }>;
    stats: {
      total: number;
      users: number;
      groups: number;
      rooms: number;
      totalMessages: number;
    };
  }> {
  // structure guaranteed by success: true and data property
}
