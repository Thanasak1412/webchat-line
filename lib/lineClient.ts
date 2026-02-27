/**
 * LINE Messaging API Client
 * 
 * Utility functions for interacting with LINE Messaging API v2
 * 
 * References:
 * - https://developers.line.biz/en/docs/messaging-api/
 * - https://developers.line.biz/en/docs/messaging-api/using-push-api/
 * - https://developers.line.biz/en/docs/messaging-api/getting-user-profile/
 */

const LINE_PUSH_ENDPOINT = "https://api.line.me/v2/bot/message/push";
const LINE_GET_PROFILE_ENDPOINT = "https://api.line.me/v2/bot/profile";

/**
 * LINE user profile response
 */
export interface LineUserProfile {
  /** User ID */
  userId: string;
  /** User's display name */
  displayName: string;
  /** URL of the user's profile picture */
  pictureUrl: string;
  /** User's status message (if any) */
  statusMessage: string;
}

/**
 * LINE Push Message API request body
 */
type LinePushMessageRequest = {
  /** User ID, group ID, or room ID to send message to */
  to: string;
  /** Array of message objects */
  messages: Array<{
    type: "text";
    text: string;
  }>;
};

/**
 * LINE API error response body
 */
type LineApiErrorBody = {
  message?: string;
};

/**
 * Parameters for pushing a text message
 */
type PushTextMessageParams = {
  /** Channel Access Token from LINE Developers Console */
  channelAccessToken: string;
  /** Target user/group/room ID */
  to: string;
  /** Text message to send */
  text: string;
};

/**
 * Result of pushing a message to LINE API
 */
export type LinePushResult =
  | {
      ok: true;
    }
  | {
      ok: false;
      status: number;
      error: string;
    };

/**
 * Build the request payload for LINE Push API
 * @param target - User/group/room ID to send to
 * @param text - Text message content
 * @returns Push API request body
 */
function buildPushPayload(target: string, text: string): LinePushMessageRequest {
  return {
    to: target,
    messages: [{ type: "text", text }],
  };
}

/**
 * Parse error message from LINE API error response
 * @param bodyText - Raw response body text
 * @returns Human-readable error message
 */
function parseLineError(bodyText: string): string {
  if (!bodyText) {
    return "LINE push API request failed";
  }

  try {
    const parsed = JSON.parse(bodyText) as LineApiErrorBody;
    if (typeof parsed.message === "string" && parsed.message) {
      return parsed.message;
    }
  } catch {
    return bodyText;
  }

  return bodyText;
}

/**
 * Safely read response text, catching errors
 * @param response - Fetch Response object
 * @returns Text content or empty string if error
 */
async function readTextSafely(response: Response): Promise<string> {
  try {
    return await response.text();
  } catch {
    return "";
  }
}

/**
 * Push a text message to LINE OA using Messaging API v2
 * 
 * @param params - Push message parameters
 * @returns Result object with status and error details
 * 
 * @example
 * ```typescript
 * const result = await pushTextMessage({
 *   channelAccessToken: "Channel_xy...",
 *   to: "Uab...",
 *   text: "Hello from backend!"
 * });
 * 
 * if (result.ok) {
 *   console.log("Message sent successfully");
 * } else {
 *   console.error(`Failed: ${result.error}`);
 * }
 * ```
 */
export async function pushTextMessage({
  channelAccessToken,
  to,
  text,
}: PushTextMessageParams): Promise<LinePushResult> {
  try {
    const response = await fetch(LINE_PUSH_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${channelAccessToken}`,
      },
      body: JSON.stringify(buildPushPayload(to, text)),
      cache: "no-store",
    });

    if (!response.ok) {
      const bodyText = await readTextSafely(response);
      return {
        ok: false,
        status: response.status,
        error: parseLineError(bodyText),
      };
    }

    return { ok: true };
  } catch {
    return {
      ok: false,
      status: 502,
      error: "Failed to reach LINE API",
    };
  }
}
/**
 * Get LINE user profile information (name, avatar, status)
 * 
 * @param channelAccessToken - Channel Access Token from LINE Developers Console
 * @param userId - The LINE user ID to fetch profile for
 * @returns User profile or null if fetch fails
 * 
 * @example
 * ```typescript
 * const profile = await getUserProfile(token, "Uab...");
 * if (profile) {
 *   console.log(`Hello ${profile.displayName}!`);
 * }
 * ```
 */
export async function getUserProfile(
  channelAccessToken: string,
  userId: string
): Promise<LineUserProfile | null> {
  try {
    const response = await fetch(`${LINE_GET_PROFILE_ENDPOINT}/${userId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${channelAccessToken}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      console.warn(`Failed to fetch profile for user ${userId}: ${response.status}`);
      return null;
    }

    const profile = (await response.json()) as LineUserProfile;
    return profile;
  } catch (error) {
    console.error(`Error fetching profile for user ${userId}:`, error);
    return null;
  }
}