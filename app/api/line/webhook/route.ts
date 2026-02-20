import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";

type LineWebhookEvent = {
  type: string;
  [key: string]: unknown;
};

type LineWebhookRequestBody = {
  destination?: string;
  events: LineWebhookEvent[];
};

type WebhookResponse = {
  received: true;
};

type WebhookErrorResponse = {
  received: false;
  error: string;
};

function isValidLineSignature({
  rawBody,
  signature,
  channelSecret,
}: {
  rawBody: string;
  signature: string;
  channelSecret: string;
}) {
  const computedSignature = createHmac("sha256", channelSecret)
    .update(rawBody, "utf8")
    .digest("base64");

  const receivedSignatureBuffer = Buffer.from(signature, "utf8");
  const computedSignatureBuffer = Buffer.from(computedSignature, "utf8");

  return (
    receivedSignatureBuffer.length === computedSignatureBuffer.length &&
    timingSafeEqual(receivedSignatureBuffer, computedSignatureBuffer)
  );
}

export async function POST(request: Request) {
  try {
    const channelSecret = process.env.LINE_CHANNEL_SECRET;
    const signatureHeader = request.headers.get("x-line-signature");
    const rawBody = await request.text();

    if (!channelSecret) {
      return NextResponse.json<WebhookErrorResponse>(
        { received: false, error: "LINE_CHANNEL_SECRET is not configured" },
        { status: 500 }
      );
    }

    if (!signatureHeader) {
      return NextResponse.json<WebhookErrorResponse>(
        { received: false, error: "Missing X-Line-Signature header" },
        { status: 401 }
      );
    }

    const isValidSignature = isValidLineSignature({
      rawBody,
      signature: signatureHeader,
      channelSecret,
    });

    if (!isValidSignature) {
      return NextResponse.json<WebhookErrorResponse>(
        { received: false, error: "Invalid signature" },
        { status: 401 }
      );
    }

    const body = JSON.parse(rawBody) as LineWebhookRequestBody;
    const events = Array.isArray(body.events) ? body.events : [];

    console.log("LINE webhook events:", events);

    return NextResponse.json<WebhookResponse>({ received: true }, { status: 200 });
  } catch {
    return NextResponse.json<WebhookErrorResponse>(
      { received: false, error: "Invalid JSON body" },
      { status: 400 }
    );
  }
}