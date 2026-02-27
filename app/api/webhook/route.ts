import { NextResponse } from "next/server";
import { verifyLineSignature } from "@/lib/lineSignature";
import type { LineWebhookRequestBody } from "@/lib/lineWebhook";
import { appendMessage } from "@/lib/chatStore";

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const headers = req.headers;
    const signature = headers.get("x-line-signature");
    const channelSecret = process.env.LINE_CHANNEL_SECRET;

    if (!channelSecret) {
      console.error("LINE_CHANNEL_SECRET is not set");
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    if (!signature) {
      return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    }

    // 1. Validate signature
    const isValid = verifyLineSignature({ rawBody, signature, channelSecret });

    if (!isValid) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    // 2. Parse the incoming message event
    const body = JSON.parse(rawBody) as LineWebhookRequestBody;

    if (body.events) {
      for (const event of body.events) {
        if (event.type === "message" && event.message?.type === "text") {
          const userId = event.source?.userId;
          const text = event.message.text;

          // 3. Log the userId and message content
          if (userId && text) {
            console.log(`Received message from ${userId}: ${text}`);
            // Save to chat store so it appears in the UI
            appendMessage(userId, text, "line");
          }
        }
      }
    }

    // 4. Return a 200 OK response
    return NextResponse.json({ status: "success" }, { status: 200 });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
