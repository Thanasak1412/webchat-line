import { NextResponse } from "next/server";
import { getMessages } from "@/lib/chatStore";
import type { ApiErrorResponse, ApiSuccessResponse, ChatMessage } from "@/lib/types";

export async function GET(): Promise<
  NextResponse<ApiSuccessResponse<{ messages: ChatMessage[] }> | ApiErrorResponse>
> {
  try {
    return NextResponse.json<ApiSuccessResponse<{ messages: ChatMessage[] }>>(
      {
        success: true,
        data: {
          messages: getMessages(),
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
