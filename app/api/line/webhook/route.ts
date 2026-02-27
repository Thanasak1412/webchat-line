import { NextResponse } from "next/server";
import { appendMessage } from "@/lib/chatStore";
import { verifyLineSignature } from "@/lib/lineSignature";
import type { LineWebhookRequestBody } from "@/lib/lineWebhook";
import { recordMessageSource } from "@/lib/messageSourceTracker";

type WebhookResponse = {
  received: true;
  textMessageCount: number;
};

type WebhookErrorResponse = {
  received: false;
  error: string;
};

export async function POST(request: Request) {
  const startTime = Date.now();
  console.log("\n╔════════════════════════════════════════════════════════════╗");
  console.log("║         [LINE WEBHOOK] Incoming Event Received             ║");
  console.log("╚════════════════════════════════════════════════════════════╝");
  console.log(`⏰ Timestamp: ${new Date().toISOString()}`);

  try {
    // Step 1: Get channel secret
    const channelSecret = process.env.LINE_CHANNEL_SECRET;
    console.log(`\n📋 Step 1: Channel Configuration`);
    console.log(`   ✓ Channel Secret Configured: ${!!channelSecret}`);

    if (!channelSecret) {
      console.error(`   ✗ ERROR: LINE_CHANNEL_SECRET is not configured!`);
      return NextResponse.json<WebhookErrorResponse>(
        { received: false, error: "LINE_CHANNEL_SECRET is not configured" },
        { status: 500 },
      );
    }

    // Step 2: Get signature header
    const signatureHeader = request.headers.get("X-Line-Signature");
    const rawBody = await request.text();

    console.log(`\n📋 Step 2: Headers & Body`);
    console.log(`   ✓ X-Line-Signature Present: ${!!signatureHeader}`);
    console.log(`   ✓ Raw Body Length: ${rawBody.length} bytes`);
    console.log(`   📄 Raw Body: ${rawBody.substring(0, 200)}${rawBody.length > 200 ? "..." : ""}`);

    if (!signatureHeader) {
      console.error(`   ✗ ERROR: Missing X-Line-Signature header!`);
      return NextResponse.json<WebhookErrorResponse>(
        { received: false, error: "Missing X-Line-Signature header" },
        { status: 401 },
      );
    }

    // Step 3: Verify signature
    console.log(`\n📋 Step 3: Signature Verification`);
    const isValidSignature = verifyLineSignature({
      rawBody,
      signature: signatureHeader,
      channelSecret,
    });

    console.log(`   ${isValidSignature ? "✓" : "✗"} Signature Valid: ${isValidSignature}`);
    console.log(`   🔐 Signature (received): ${signatureHeader.substring(0, 20)}...`);

    if (!isValidSignature) {
      console.error(`   ✗ ERROR: Signature verification failed! Request rejected.`);
      return NextResponse.json<WebhookErrorResponse>(
        { received: false, error: "Invalid signature" },
        { status: 401 },
      );
    }

    // Step 4: Parse JSON body
    console.log(`\n📋 Step 4: Parse JSON Body`);
    const body = JSON.parse(rawBody) as LineWebhookRequestBody;
    console.log(`   ✓ Valid JSON parsed`);
    console.log(`   📊 Destination Bot ID: ${body.destination || "unknown"}`);
    console.log(`   📊 Total Events: ${body.events?.length || 0}`);

    // Step 5: Extract messages
    console.log(`\n📋 Step 5: Extract Messages`);
    const messagesWithUsers: Array<{ userId: string; text: string; timestamp?: number }> = [];
    let textMessageCount = 0;

    if (Array.isArray(body.events)) {
      body.events.forEach((event, eventIndex) => {
        console.log(`\n   Event [${eventIndex}]:`);
        console.log(`   ├─ Type: ${event.type}`);
        console.log(`   ├─ Timestamp: ${event.timestamp} (${new Date(event.timestamp || 0).toISOString()})`);

        // Log source info
        const sourceType = event.source?.type || "unknown";
        const userId =
          event.source?.userId ||
          event.source?.groupId ||
          event.source?.roomId ||
          "unknown";
        console.log(`   ├─ Source Type: ${sourceType}`);
        console.log(`   ├─ Source ID: ${userId}`);
        console.log(`   ├─ Reply Token: ${event.replyToken?.substring(0, 30) || "none"}...`);

        // Process message events
        if (event.type === "message") {
          const messageType = event.message?.type || "unknown";
          console.log(`   ├─ Message Type: ${messageType}`);

          if (messageType === "text") {
            const text = event.message?.text?.trim() || "";
            console.log(`   ├─ Message Text: "${text}"`);
            console.log(`   ├─ Message ID: ${event.message?.id || "none"}`);

            if (text && userId !== "unknown") {
              messagesWithUsers.push({
                userId,
                text,
                timestamp: event.timestamp,
              });
              textMessageCount++;
              console.log(`   ✓ Message extracted and queued`);

              // Record the user as active
              recordMessageSource(userId);
              console.log(`   ✓ User recorded as source`);
            } else {
              console.log(`   ✗ Skipped: Empty text or invalid userId`);
            }
          } else {
            console.log(`   ⊘ Skipped: Non-text message (${messageType})`);
          }
        } else {
          console.log(`   ⊘ Skipped: Non-message event (${event.type})`);
        }
      });
    }

    // Step 6: Save messages to store
    console.log(`\n📋 Step 6: Save to Message Store`);
    console.log(`   📦 Processing ${messagesWithUsers.length} message(s)...`);

    messagesWithUsers.forEach(({ userId, text, timestamp }, index) => {
      const savedMessage = appendMessage(userId, text, "line");
      console.log(`   [${index + 1}/${messagesWithUsers.length}] ✓ Saved`);
      console.log(`       ├─ User: ${userId}`);
      console.log(`       ├─ Text: "${text}"`);
      console.log(`       ├─ Message ID: ${savedMessage.id}`);
      console.log(`       └─ Stored at: ${savedMessage.createdAt}`);
    });

    // Step 7: Success response
    const duration = Date.now() - startTime;
    console.log(`\n📋 Step 7: Send Response`);
    console.log(`   ✓ HTTP 200 Response Ready`);
    console.log(`   📊 Messages Processed: ${textMessageCount}`);
    console.log(`   ⏱️  Total Processing Time: ${duration}ms`);

    console.log("\n╔════════════════════════════════════════════════════════════╗");
    console.log("║                  ✅ WEBHOOK PROCESSED                     ║");
    console.log("╚════════════════════════════════════════════════════════════╝\n");

    return NextResponse.json<WebhookResponse>(
      { received: true, textMessageCount },
      { status: 200 },
    );
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);

    console.error(`\n❌ ERROR CAUGHT`);
    console.error(`   Type: ${error instanceof SyntaxError ? "JSON Parse Error" : "Unexpected Error"}`);
    console.error(`   Message: ${errorMessage}`);
    console.error(`   Processing Time: ${duration}ms`);
    console.error("\n╔════════════════════════════════════════════════════════════╗");
    console.error("║                  ❌ WEBHOOK FAILED                        ║");
    console.error("╚════════════════════════════════════════════════════════════╝\n");

    return NextResponse.json<WebhookErrorResponse>(
      { received: false, error: "Invalid JSON body" },
      { status: 400 },
    );
  }
}
