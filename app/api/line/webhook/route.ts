import { NextResponse } from "next/server";
import { appendMessage } from "@/lib/chatStore";
import { verifyLineSignature } from "@/lib/lineSignature";
import {
  extractIncomingTextMessages,
  type LineWebhookRequestBody,
} from "@/lib/lineWebhook";
import {
  extractTargetFromEvent,
  collectTargetsFromEvents,
} from "@/lib/lineTargetId";
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
  console.log("[LINE Webhook] Received a webhook event");

  try {
    const channelSecret = process.env.LINE_CHANNEL_SECRET;
    const signatureHeader = request.headers.get("X-Line-Signature");
    const rawBody = await request.text();

    if (!channelSecret) {
      return NextResponse.json<WebhookErrorResponse>(
        { received: false, error: "LINE_CHANNEL_SECRET is not configured" },
        { status: 500 },
      );
    }

    console.log("[LINE Webhook] Raw request body:", rawBody);

    if (!signatureHeader) {
      return NextResponse.json<WebhookErrorResponse>(
        { received: false, error: "Missing X-Line-Signature header" },
        { status: 401 },
      );
    }

    const isValidSignature = verifyLineSignature({
      rawBody,
      signature: signatureHeader,
      channelSecret,
    });

    if (!isValidSignature) {
      console.log("[LINE Webhook] Invalid signature");
      return NextResponse.json<WebhookErrorResponse>(
        { received: false, error: "Invalid signature" },
        { status: 401 },
      );
    }

    const body = JSON.parse(rawBody) as LineWebhookRequestBody;
    const textMessages = extractIncomingTextMessages(body);

    console.log(`[LINE Webhook] Extracted ${textMessages.length} text message(s) from the webhook event`);
    
    // Collect all unique target IDs from this webhook batch
    if (Array.isArray(body.events) && body.events.length > 0) {
      const collectedTargets = collectTargetsFromEvents(body.events);

      // Record each discovered target
      collectedTargets.forEach((target) => {
        recordMessageSource(target.id);
      });

      // Debug: Log discovered targets
      if (process.env.NODE_ENV === "development") {
        console.log(
          `[LINE Webhook] Discovered ${collectedTargets.length} target(s):`,
        );
        collectedTargets.forEach((target) => {
          console.log(`  - ${target.type.toUpperCase()}: ${target.id}`);
        });
      }
    }

    textMessages.forEach((text) => {
      appendMessage(text, "line");
    });

    return NextResponse.json<WebhookResponse>(
      { received: true, textMessageCount: textMessages.length },
      { status: 200 },
    );
  } catch {
    return NextResponse.json<WebhookErrorResponse>(
      { received: false, error: "Invalid JSON body" },
      { status: 400 },
    );
  }
}
