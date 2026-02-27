import { NextResponse } from "next/server";
import { appendMessage } from "@/lib/chatStore";

export async function POST(request: Request) {
  try {
    const { userId, text } = await request.json();
    const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;

    if (!channelAccessToken) {
      return NextResponse.json({ error: "LINE_CHANNEL_ACCESS_TOKEN not set" }, { status: 500 });
    }

    if (!userId || !text) {
      return NextResponse.json({ error: "userId and text are required" }, { status: 400 });
    }

    // Call LINE Messaging API directly
    const response = await fetch("https://api.line.me/v2/bot/message/push", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${channelAccessToken}`,
      },
      body: JSON.stringify({
        to: userId,
        messages: [{ type: "text", text }],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json({ error: errorData.message || "Failed to send message" }, { status: response.status });
    }

    // Save to local store
    appendMessage(userId, text, "me");

    return NextResponse.json({ ok: true, userId, text }, { status: 200 });
  } catch (error) {
    console.error("Error sending message:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
