/**
 * LINE Targeted Message Endpoint
 * 
 * Send messages to specific LINE targets (users, groups, rooms) that have
 * previously interacted with your bot.
 * 
 * Useful for:
 * - Sending messages to specific groups or rooms
 * - Broadcasting messages to all users
 * - Replying to specific message sources
 * 
 * @route POST /api/line/send-to-target
 * 
 * Request body:
 * ```json
 * {
 *   "targetId": "Uab12345...",
 *   "message": "Hello!"
 * }
 * ```
 * 
 * @example
 * ```bash
 * curl -X POST http://localhost:3000/api/line/send-to-target \
 *   -H "Content-Type: application/json" \
 *   -d '{"targetId": "Uab12345...", "message": "Hello!"}'
 * ```
 */

import { NextResponse } from "next/server";
import { appendMessage } from "@/lib/chatStore";
import { pushTextMessage } from "@/lib/lineClient";
import { isValidLineId, getTargetTypeLabel } from "@/lib/lineTargetId";
import { getMessageSource } from "@/lib/messageSourceTracker";
import type { ApiErrorResponse, ApiSuccessResponse } from "@/lib/types";

/**
 * Request body for sending to a specific target
 */
interface SendToTargetRequest {
  /** The LINE target ID (user, group, or room) */
  targetId: string;
  /** The message text to send */
  message: string;
}

/**
 * Response data on success
 */
interface SendToTargetResponse {
  /** The message sent */
  message: string;
  /** The target ID */
  targetId: string;
  /** Type of target (user/group/room) */
  targetType: string;
  /** Whether this target was previously discovered */
  wasDiscovered: boolean;
}

/**
 * POST /api/line/send-to-target
 * 
 * Send a message to a specific discovered LINE target.
 */
export async function POST(
  request: Request
): Promise<NextResponse<ApiSuccessResponse<SendToTargetResponse> | ApiErrorResponse>> {
  try {
    const body = (await request.json()) as SendToTargetRequest;

    // Validate
    if (!body.targetId || typeof body.targetId !== "string") {
      return NextResponse.json<ApiErrorResponse>(
        { success: false, error: "targetId is required and must be a string" },
        { status: 400 }
      );
    }

    if (!body.message || typeof body.message !== "string") {
      return NextResponse.json<ApiErrorResponse>(
        { success: false, error: "message is required and must be a string" },
        { status: 400 }
      );
    }

    const targetId = body.targetId.trim();
    const message = body.message.trim();

    if (!targetId) {
      return NextResponse.json<ApiErrorResponse>(
        { success: false, error: "targetId cannot be empty" },
        { status: 400 }
      );
    }

    if (!message) {
      return NextResponse.json<ApiErrorResponse>(
        { success: false, error: "message cannot be empty" },
        { status: 400 }
      );
    }

    // Validate target ID format
    if (!isValidLineId(targetId)) {
      return NextResponse.json<ApiErrorResponse>(
        {
          success: false,
          error: "Invalid LINE ID format. Must start with U, C, or R and be 33+ characters",
        },
        { status: 400 }
      );
    }

    const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
    if (!channelAccessToken) {
      return NextResponse.json<ApiErrorResponse>(
        { success: false, error: "LINE_CHANNEL_ACCESS_TOKEN is not configured" },
        { status: 500 }
      );
    }

    // Check if this target was previously discovered
    const source = getMessageSource(targetId);
    const wasDiscovered = source !== null;

    // Send message via LINE API
    const lineResult = await pushTextMessage({
      channelAccessToken,
      to: targetId,
      text: message,
    });

    if (!lineResult.ok) {
      return NextResponse.json<ApiErrorResponse>(
        { success: false, error: lineResult.error },
        { status: lineResult.status }
      );
    }

    // Store in local chat history
    // Note: We can't easily track which target this came from in the current chatStore
    // Consider extending chatStore to track target IDs
    // For now, we associate it with the targetId so it shows up in that chat context
    appendMessage(targetId, `[To ${getTargetTypeLabel(source?.type ?? null)}] ${message}`, "me");

    const targetTypeLabel = source ? getTargetTypeLabel(source.type) : "Unknown";

    return NextResponse.json<ApiSuccessResponse<SendToTargetResponse>>(
      {
        success: true,
        data: {
          message,
          targetId,
          targetType: targetTypeLabel,
          wasDiscovered,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    const isInvalidJson = error instanceof SyntaxError;
    return NextResponse.json<ApiErrorResponse>(
      {
        success: false,
        error: isInvalidJson ? "Invalid request body" : "Internal server error",
      },
      { status: isInvalidJson ? 400 : 500 }
    );
  }
}
