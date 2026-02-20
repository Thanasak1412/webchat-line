import { NextResponse } from "next/server";
import { appendMessage } from "@/lib/chatStore";
import { pushTextMessage } from "@/lib/lineClient";
import type {
  ApiErrorResponse,
  ApiSuccessResponse,
  SendMessageRequestBody,
} from "@/lib/types";

const MISSING_LINE_ENV_ERROR =
  "LINE_CHANNEL_ACCESS_TOKEN or LINE_TARGET_USER_ID is not configured";

function jsonError(error: string, status: number): NextResponse<ApiErrorResponse> {
  return NextResponse.json<ApiErrorResponse>({ success: false, error }, { status });
}

function jsonSuccess(): NextResponse<ApiSuccessResponse> {
  return NextResponse.json<ApiSuccessResponse>({ success: true }, { status: 200 });
}

function parseMessageFromBody(body: SendMessageRequestBody): string {
  return typeof body.message === "string" ? body.message.trim() : "";
}

export async function POST(
  request: Request
): Promise<NextResponse<ApiSuccessResponse | ApiErrorResponse>> {
  try {
    // Parse and validate incoming body.
    const body = (await request.json()) as SendMessageRequestBody;
    const message = parseMessageFromBody(body);

    if (!message) {
      return jsonError("Message is required", 400);
    }

    const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
    const targetUserId = process.env.LINE_TARGET_USER_ID;

    if (!channelAccessToken || !targetUserId) {
      return jsonError(MISSING_LINE_ENV_ERROR, 500);
    }

    // Push outgoing message to LINE OA target user/group.
    const lineResult = await pushTextMessage({
      channelAccessToken,
      to: targetUserId,
      text: message,
    });

    if (!lineResult.ok) {
      return jsonError(lineResult.error, lineResult.status);
    }

    // Keep local chat history in sync with outbound messages.
    appendMessage(message, "me");
    return jsonSuccess();
  } catch (error) {
    const isInvalidJson = error instanceof SyntaxError;
    return jsonError(
      isInvalidJson ? "Invalid request body" : "Internal server error",
      isInvalidJson ? 400 : 500
    );
  }
}