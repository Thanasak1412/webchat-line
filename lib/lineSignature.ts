/**
 * LINE Webhook Signature Verification
 * 
 * Verifies that webhook requests are genuinely from LINE using HMAC-SHA256
 * 
 * References:
 * - https://developers.line.biz/en/docs/messaging-api/webhooks/#verify-signature
 */

import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Parameters for verifying LINE webhook signature
 */
type VerifyLineSignatureParams = {
  /** Raw request body (unchanged from HTTP request) */
  rawBody: string;
  /** X-Line-Signature header value from request */
  signature: string;
  /** Channel Secret from LINE Developers Console */
  channelSecret: string;
};

/**
 * Verify that a webhook request genuinely came from LINE
 * 
 * LINE sends an HMAC-SHA256 signature in the X-Line-Signature header.
 * We compute the same signature using the Channel Secret and compare them
 * using timing-safe comparison to prevent timing attacks.
 * 
 * @param params - Verification parameters
 * @returns True if signature is valid, false otherwise
 * 
 * @see https://developers.line.biz/en/docs/messaging-api/webhooks/#how-to-validate-signature
 * 
 * @example
 * ```typescript
 * const isValid = verifyLineSignature({
 *   rawBody: '{"destination":"...", "events":[...]}',
 *   signature: 'aBc123=',
 *   channelSecret: 'your-channel-secret'
 * });
 * 
 * if (isValid) {
 *   console.log("Webhook is authentic");
 * } else {
 *   console.error("Invalid signature - possible spoofing attempt");
 * }
 * ```
 */
export function verifyLineSignature({
  rawBody,
  signature,
  channelSecret,
}: VerifyLineSignatureParams): boolean {
  // Compute HMAC-SHA256 signature
  const computedSignature = createHmac("sha256", channelSecret)
    .update(rawBody, "utf8")
    .digest("base64");

  // Convert both signatures to buffers for timing-safe comparison
  const receivedSignatureBuffer = Buffer.from(signature, "utf8");
  const computedSignatureBuffer = Buffer.from(computedSignature, "utf8");

  // Use timing-safe comparison to prevent timing attacks
  // Timing attacks could allow attackers to forge signatures by measuring
  // how long comparison takes
  return (
    receivedSignatureBuffer.length === computedSignatureBuffer.length &&
    timingSafeEqual(receivedSignatureBuffer, computedSignatureBuffer)
  );
}
