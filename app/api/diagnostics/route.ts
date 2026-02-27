import { NextResponse } from "next/server";
import type { ChatMessage } from "@/lib/types";
import { getMessages, getActiveUsers } from "@/lib/chatStore";

/**
 * GET /api/diagnostics
 * 
 * Quick health check endpoint that shows:
 * - Webhook is reachable
 * - Stored messages count
 * - Active users
 * - Configuration status
 */
export async function GET() {
  const channelSecret = process.env.LINE_CHANNEL_SECRET;
  const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  const activeUsers = getActiveUsers();

  // Collect all messages for stats
  const allMessages: ChatMessage[] = [];
  activeUsers.forEach((userId) => {
    const userMessages = getMessages(userId);
    if (userMessages) {
      allMessages.push(...userMessages);
    }
  });

  const response = {
    status: "ok" as const,
    timestamp: new Date().toISOString(),
    webhook: {
      endpoint: "/api/line/webhook",
      method: "POST",
      headers_required: ["Content-Type: application/json", "X-Line-Signature: <signature>"],
      config: {
        LINE_CHANNEL_SECRET: !!channelSecret ? "✅ Configured" : "❌ Missing",
        LINE_CHANNEL_ACCESS_TOKEN: !!channelAccessToken ? "✅ Configured" : "❌ Missing",
      },
    },
    chat_store: {
      total_users: activeUsers.length,
      total_messages: allMessages.length,
      active_users: activeUsers,
      messages_per_user: Object.fromEntries(
        activeUsers.map((userId) => {
          const userMsgs = getMessages(userId);
          return [userId, userMsgs?.length || 0];
        })
      ),
    },
    sse: {
      endpoint: "/api/stream",
      method: "GET",
      type: "Server-Sent Events",
      status: "✅ Active",
    },
    api_routes: {
      "/api/messages": { method: "GET", description: "Get users or user messages by userId" },
      "/api/send-message": { method: "POST", description: "Send message to LINE user" },
      "/api/stream": { method: "GET", description: "SSE real-time updates" },
      "/api/line/webhook": { method: "POST", description: "Receive LINE messages" },
    },
    quick_test: {
      curl_webhook_signature: `SIGNATURE=$(echo '{"destination":"Cxyz123","events":[]}' | node -e "const crypto = require('crypto'); const secret = '${channelSecret ? "use_your_secret" : "⚠️ Not configured"}'; const payload = require('fs').readFileSync(0); console.log(crypto.createHmac('sha256', secret).update(payload).digest('base64'))")`,
      curl_test: `curl -X POST http://localhost:3000/api/line/webhook -H "Content-Type: application/json" -H "X-Line-Signature: $SIGNATURE" -d '{"destination":"Cxyz123","events":[]}'`,
    },
  };

  return NextResponse.json(response, { status: 200 });
}

/**
 * POST /api/diagnostics/test-webhook
 * 
 * Test webhook endpoint WITHOUT requiring valid signature
 * This is ONLY for development/testing
 */
export async function POST(request: Request) {
  console.log("\n📋 [DIAGNOSTICS] Test webhook endpoint called");
  console.log(`⏰ Timestamp: ${new Date().toISOString()}`);

  try {
    const rawBody = await request.text();
    console.log(`📄 Raw body received: ${rawBody.substring(0, 200)}${rawBody.length > 200 ? "..." : ""}`);

    // Parse without signature verification (FOR TESTING ONLY)
    const body = JSON.parse(rawBody) as unknown;
    console.log(`✅ JSON parsed successfully`);
    console.log(`📊 Body keys: ${Object.keys(body as object).join(", ")}`);

    // Count text messages
    const data = body as Record<string, unknown>;
    const events = Array.isArray(data.events) ? data.events : [];
    const textMessages = events.filter((e: unknown) => {
      const event = e as Record<string, unknown>;
      return (
        event.type === "message" &&
        (event.message as Record<string, unknown>)?.type === "text"
      );
    });

    console.log(`💬 Text messages found: ${textMessages.length}`);

    return NextResponse.json(
      {
        status: "test_received",
        warning: "⚠️  This endpoint DOES NOT verify LINE signature! Only for development!",
        received: true,
        textMessageCount: textMessages.length,
        bodyKeys: Object.keys(data as object),
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`❌ Error: ${errorMessage}`);

    return NextResponse.json(
      {
        status: "error",
        error: errorMessage,
        timestamp: new Date().toISOString(),
      },
      { status: 400 }
    );
  }
}
