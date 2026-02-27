import { NextResponse } from "next/server";
import { getMessages, getActiveUsers } from "@/lib/chatStore";
import type { ApiErrorResponse, ApiSuccessResponse, ChatMessage } from "@/lib/types";

export async function GET(
  request: Request
): Promise<NextResponse<ApiSuccessResponse<{ users: string[]; messages: ChatMessage[] }> | ApiErrorResponse>> {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get("userId");

    // If no userId provided, return list of active users
    if (!userId) {
      const users = await getActiveUsers();
      return NextResponse.json<ApiSuccessResponse<{ users: string[]; messages: ChatMessage[] }>>(
        {
          success: true,
          data: {
            users,
            messages: [],
          },
        },
        { status: 200 }
      );
    }

    // Return messages for specific user
    const messages = await getMessages(userId);
    return NextResponse.json<ApiSuccessResponse<{ users: string[]; messages: ChatMessage[] }>>(
      {
        success: true,
        data: {
          users: [],
          messages,
        },
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json<ApiErrorResponse>(
      {
        success: false,
        error: "Failed to load messages",
      },
      { status: 500 }
    );
  }
}
