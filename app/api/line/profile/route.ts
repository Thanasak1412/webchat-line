import { NextResponse } from "next/server";
import { getUserProfile } from "@/lib/lineClient";
import type { ApiErrorResponse, ApiSuccessResponse } from "@/lib/types";

/**
 * GET /api/line/profile?userId=U123...
 * 
 * Fetch LINE user profile info (name, profile picture, status)
 * Used by the admin UI to display user info in the chat list
 */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get("userId");

    if (!userId) {
      return NextResponse.json<ApiErrorResponse>(
        { success: false, error: "userId is required" },
        { status: 400 }
      );
    }

    const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
    if (!channelAccessToken) {
      return NextResponse.json<ApiErrorResponse>(
        { success: false, error: "LINE_CHANNEL_ACCESS_TOKEN not configured" },
        { status: 500 }
      );
    }

    const profile = await getUserProfile(channelAccessToken, userId);

    if (!profile) {
      // Return minimal profile with just userId if fetch fails
      return NextResponse.json<ApiSuccessResponse<{ userId: string; displayName: string; pictureUrl: string; statusMessage: string }>>(
        {
          success: true,
          data: {
            userId,
            displayName: userId.substring(0, 12) + "...",
            pictureUrl: "",
            statusMessage: "",
          },
        },
        { status: 200 }
      );
    }

    return NextResponse.json<ApiSuccessResponse<typeof profile>>(
      {
        success: true,
        data: profile,
      },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json<ApiErrorResponse>(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
