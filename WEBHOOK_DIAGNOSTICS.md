# LINE Webhook Diagnostics & Troubleshooting Guide

## 1. Quick Verification Checklist

Before diving into troubleshooting, verify these items:

```
✓ LINE_CHANNEL_SECRET configured in .env.local
✓ LINE_CHANNEL_ACCESS_TOKEN configured in .env.local
✓ Webhook URL is publicly accessible (not localhost)
✓ Development server is running: npm run dev
✓ Public tunnel/ngrok endpoint is active
✓ Webhook URL registered in LINE Official Account console
✓ HTTP 200 response is being returned
```

---

## 2. Configure Your Webhook Domain

### 2.1 Local Development with ngrok

**Why?** LINE platform requires a publicly accessible HTTPS endpoint. `localhost` won't work.

**Step 1: Install ngrok**
```bash
# Windows
choco install ngrok

# macOS
brew install ngrok

# Or download from: https://ngrok.com/download
```

**Step 2: Start ngrok tunnel**
```bash
ngrok http 3000
```

Output:
```
Session Status
Version                 3.0.7
Region                  jp (Asia Pacific)
Web Interface          http://127.0.0.1:4040
Forwarding            https://abc123.ngrok.io -> http://localhost:3000
```

**Step 3: Your public webhook URL is:**
```
https://abc123.ngrok.io/api/line/webhook
```

### 2.2 Register Webhook URL in LINE Official Account Console

1. Go to [LINE Official Account Manager](https://manager.line.biz/)
2. Click your OA → **Settings** → **Basic Settings**
3. Find **Webhook URL** section
4. Enter: `https://abc123.ngrok.io/api/line/webhook`
5. Click **Verify** button
6. LINE will send a test POST request to verify connectivity

---

## 3. Verify HTTP 200 Response

### 3.1 Current Implementation

Your webhook already returns HTTP 200 with proper JSON response:

```typescript
return NextResponse.json<WebhookResponse>(
  { received: true, textMessageCount },
  { status: 200 }
);
```

### 3.2 Verify Response Format

LINE expects:
- **Status Code:** `200 OK`
- **Content-Type:** `application/json`
- **Body:** Any valid JSON (can be empty `{}`)

Your endpoint returns:
```json
{
  "received": true,
  "textMessageCount": 3
}
```

✅ This is correct!

---

## 4. View Raw Request Body & Headers

### 4.1 Real-Time Logging (Already Implemented)

When you send a message in LINE, check your terminal:

```
╔════════════════════════════════════════════════════════════╗
║         [LINE WEBHOOK] Incoming Event Received             ║
╚════════════════════════════════════════════════════════════╝
⏰ Timestamp: 2026-02-27T10:30:45.123Z

📋 Step 1: Channel Configuration
   ✓ Channel Secret Configured: true

📋 Step 2: Headers & Body
   ✓ X-Line-Signature Present: true
   ✓ Raw Body Length: 456 bytes
   📄 Raw Body: {"destination":"Cxyz123...","events":[{"type":"message",...
```

### 4.2 Add Custom Raw Request Logging

To see the **complete** raw request, add this at the top of the POST handler:

```typescript
export async function POST(request: Request) {
  // Log ALL request details (add this)
  console.log("\n📨 === RAW REQUEST DEBUG ===");
  console.log(`Method: ${request.method}`);
  console.log(`URL: ${request.url}`);
  console.log(`Headers:`);
  request.headers.forEach((value, key) => {
    console.log(`  ${key}: ${value}`);
  });
  
  // ... rest of handler
}
```

### 4.3 Write Raw Body to File (For Analysis)

Create a helper file to save webhook payloads:

```bash
# Create a logs directory
mkdir -p logs
```

Then add this to your webhook handler:

```typescript
import { appendFileSync } from "fs";
import { resolve } from "path";

const rawBody = await request.text();

// Save to file
const timestamp = new Date().toISOString();
const logPath = resolve("logs/webhooks.jsonl");
appendFileSync(logPath, `${JSON.stringify({ timestamp, rawBody })}\n`);
console.log(`📁 Saved to: ${logPath}`);
```

---

## 5. Test Using curl

### 5.1 Get Your Test Webhook Signature

First, create a test payload:

```json
{
  "destination": "Cxyz1234567890abcdef",
  "events": [
    {
      "type": "message",
      "source": {
        "type": "user",
        "userId": "Uxyz1234567890abcdef"
      },
      "message": {
        "type": "text",
        "id": "100000001",
        "text": "Test message from curl"
      },
      "timestamp": 1614556800000,
      "replyToken": "00000000000000000000000000000000"
    }
  ]
}
```

### 5.2 Calculate Signature (Node.js)

Create `sign-webhook.js`:

```javascript
#!/usr/bin/env node
const crypto = require("crypto");
const fs = require("fs");

const channelSecret = process.env.LINE_CHANNEL_SECRET;
if (!channelSecret) {
  console.error("Error: LINE_CHANNEL_SECRET not set");
  process.exit(1);
}

const payload = fs.readFileSync(0, "utf-8").trim(); // read from stdin

const signature = crypto
  .createHmac("sha256", channelSecret)
  .update(payload)
  .digest("base64");

console.log(signature);
```

### 5.3 Test with curl

**Step 1: Make it executable and sign the payload**
```bash
chmod +x sign-webhook.js

# Save test payload
cat > test-payload.json << 'EOF'
{
  "destination": "Cxyz1234567890abcdef",
  "events": [
    {
      "type": "message",
      "source": {
        "type": "user",
        "userId": "Uxyz1234567890abcdef"
      },
      "message": {
        "type": "text",
        "id": "100000001",
        "text": "Test message from curl"
      },
      "timestamp": 1614556800000,
      "replyToken": "00000000000000000000000000000000"
    }
  ]
}
EOF

# Calculate signature
SIGNATURE=$(cat test-payload.json | node sign-webhook.js)
echo "Signature: $SIGNATURE"
```

**Step 2: Send the test request**
```bash
curl -X POST http://localhost:3000/api/line/webhook \
  -H "Content-Type: application/json" \
  -H "X-Line-Signature: $SIGNATURE" \
  -d @test-payload.json \
  -v
```

**Expected Response:**
```
< HTTP/1.1 200 OK
< Content-Type: application/json
<
{"received":true,"textMessageCount":1}
```

### 5.4 Test to Public Endpoint (ngrok)

```bash
SIGNATURE=$(cat test-payload.json | node sign-webhook.js)

curl -X POST https://abc123.ngrok.io/api/line/webhook \
  -H "Content-Type: application/json" \
  -H "X-Line-Signature: $SIGNATURE" \
  -d @test-payload.json \
  -v
```

---

## 6. Confirm LINE is Sending to Correct Endpoint

### 6.1 Check ngrok Inspector Dashboard

While ngrok is running:

1. Open browser: `http://127.0.0.1:4040`
2. Click **Inspect** tab
3. Look for POST requests to `/api/line/webhook`
4. Click on each request to view:
   - **Headers** (including X-Line-Signature)
   - **Raw body**
   - **Response** (should be HTTP 200)

Example:
```
POST /api/line/webhook HTTP/1.1
Host: abc123.ngrok.io
Content-Type: application/json
X-Line-Signature: abcd1234efgh5678ijkl9012mnop3456...
Content-Length: 456

{"destination":"Cxyz...","events":[...]}

← Response: 200 OK
← Body: {"received":true,"textMessageCount":1}
```

### 6.2 Monitor Your Dev Server Logs

When a message is sent in LINE:

```
╔════════════════════════════════════════════════════════════╗
║         [LINE WEBHOOK] Incoming Event Received             ║
╚════════════════════════════════════════════════════════════╝
⏰ Timestamp: 2026-02-27T10:30:45.123Z

📋 Step 1: Channel Configuration
   ✓ Channel Secret Configured: true

📋 Step 2: Headers & Body
   ✓ X-Line-Signature Present: true
   ✓ Raw Body Length: 456 bytes
   📄 Raw Body: {"destination":"Cxyz123...","events":[{"type":"message",...{

📋 Step 3: Signature Verification
   ✓ Signature Valid: true

📋 Step 4: Parse JSON Body
   ✓ Valid JSON parsed
   📊 Destination Bot ID: Cxyz1234567890abcdef
   📊 Total Events: 1

📋 Step 5: Extract Messages
   Event [0]:
   ├─ Type: message
   ├─ Timestamp: 1614556800000 (2021-03-02T13:20:00.000Z)
   ├─ Source Type: user
   ├─ Source ID: Uxyz1234567890abcdef
   ├─ Reply Token: 00000000000000000000000...
   ├─ Message Type: text
   ├─ Message Text: "Test message from curl"
   ├─ Message ID: 100000001
   ✓ Message extracted and queued
   ✓ User recorded as source

📋 Step 6: Save to Message Store
   📦 Processing 1 message(s)...
   [1/1] ✓ Saved
       ├─ User: Uxyz1234567890abcdef
       ├─ Text: "Test message from curl"
       ├─ Message ID: msg-uuid-abc123
       └─ Stored at: 2026-02-27T10:30:45.123Z

📋 Step 7: Send Response
   ✓ HTTP 200 Response Ready
   📊 Messages Processed: 1
   ⏱️  Total Processing Time: 45ms

╔════════════════════════════════════════════════════════════╗
║                  ✅ WEBHOOK PROCESSED                     ║
╚════════════════════════════════════════════════════════════╝
```

✅ This indicates webhook was **successfully received and processed**!

### 6.3 Verify in Admin UI (ChatUI)

After webhook is processed:

1. Open admin UI: `http://localhost:3000/chat`
2. You should see the user ID appear in the left sidebar
3. Click on it to see the message in the chat window
4. The message should appear with sender = "line" (gray, left-aligned)

If message doesn't appear:
- Check browser DevTools → **Network** tab
- Look for `GET /api/stream` (SSE connection)
- Look for `GET /api/messages` (polling)
- Both should have status `200`

---

## 7. Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| **ngrok tunnel keeps disconnecting** | Session timeout | Use paid ngrok plan or restart tunnel |
| **Webhook verification fails in LINE console** | Wrong URL or endpoint not responding | Verify ngrok URL is correct, check logs |
| **HTTP 401 Unauthorized** | Signature verification failed | Check `LINE_CHANNEL_SECRET` is correct |
| **HTTP 400 Bad Request** | Invalid JSON body | Check request is valid JSON |
| **No logs in terminal** | Request never reached server | Check ngrok tunnel is active and URL is registered |
| **Message appears in logs but not in UI** | SSE not connected | Check `/api/stream` in Network tab |
| **Cannot sign payload with curl** | Missing `LINE_CHANNEL_SECRET` | Set environment variable: `export LINE_CHANNEL_SECRET=your_secret` |

---

## 8. Full Testing Workflow

```bash
# 1. Start dev server
npm run dev

# 2. Start ngrok tunnel (in new terminal)
ngrok http 3000

# 3. Copy ngrok URL from output
# Example: https://abc123.ngrok.io

# 4. Register webhook URL in LINE console
# https://abc123.ngrok.io/api/line/webhook

# 5. Click "Verify" button in LINE console

# 6. Send a test message from LINE app
# → Watch terminal for logs

# 7. Watch ngrok inspector dashboard
# http://127.0.0.1:4040

# 8. Check admin UI
# http://localhost:3000/chat

# 9. If not appearing, test with curl
chmod +x sign-webhook.js
SIGNATURE=$(cat test-payload.json | node sign-webhook.js)
curl -X POST http://localhost:3000/api/line/webhook \
  -H "Content-Type: application/json" \
  -H "X-Line-Signature: $SIGNATURE" \
  -d @test-payload.json \
  -v
```

---

## 9. Environment Variables Checklist

**`.env.local` must contain:**

```env
# LINE Messaging API credentials
LINE_CHANNEL_SECRET=your_channel_secret_here
LINE_CHANNEL_ACCESS_TOKEN=your_channel_access_token_here

# These should match LINE Official Account Manager
```

**Verify they're loaded:**

```bash
# Check if variables are set
echo $LINE_CHANNEL_SECRET
echo $LINE_CHANNEL_ACCESS_TOKEN

# Should output your actual values (not empty)
```

---

## 10. Debug Response Flow

```
┌─────────────────────────────────────────────┐
│ LINE User sends message in app              │
└────────────┬────────────────────────────────┘
             │
             ↓
┌─────────────────────────────────────────────┐
│ LINE servers verify signature                │
│ POST /api/line/webhook (HTTPS)              │
│ Headers: X-Line-Signature: abc123...        │
│ Body: {"destination":"...", "events":[...]}│
└────────────┬────────────────────────────────┘
             │
             ↓
┌─────────────────────────────────────────────┐
│ Your webhook handler receives request       │
│ [LOG] Raw body logged to console            │
│ [VERIFY] Signature matches channel secret   │
│ [PARSE] Extract userId, text, timestamp     │
│ [SAVE] Append to chatStore[userId]          │
│ [BROADCAST] Trigger messageListeners        │
└────────────┬────────────────────────────────┘
             │
             ↓
┌─────────────────────────────────────────────┐
│ Return HTTP 200 { received: true }          │
└────────────┬────────────────────────────────┘
             │
             ↓
┌─────────────────────────────────────────────┐
│ messageListeners trigger                    │
│ → /api/stream broadcasts to all SSE clients │
│ → ChatUI receives real-time update          │
│ → Message appears in admin panel            │
└─────────────────────────────────────────────┘
```

---

## 11. Production Deployment

When deploying to **Vercel**:

1. **No need for ngrok** - use your Vercel domain
   ```
   https://your-app.vercel.app/api/line/webhook
   ```

2. **Set environment variables in Vercel dashboard:**
   - Go to Settings → Environment Variables
   - Add: `LINE_CHANNEL_SECRET`
   - Add: `LINE_CHANNEL_ACCESS_TOKEN`

3. **Register webhook URL in LINE console:**
   ```
   https://your-app.vercel.app/api/line/webhook
   ```

4. **Verify and test:**
   - Click "Verify" in LINE console
   - Send test message from LINE app
   - Check Vercel logs: `vercel logs --follow`

---

## 12. Quick Verification Script

Create `verify-webhook.sh`:

```bash
#!/bin/bash

echo "╔════════════════════════════════════════════╗"
echo "║   LINE WEBHOOK VERIFICATION CHECKLIST      ║"
echo "╚════════════════════════════════════════════╝"
echo ""

# Check environment variables
echo "1️⃣  Environment Variables:"
if [ -z "$LINE_CHANNEL_SECRET" ]; then
  echo "  ❌ LINE_CHANNEL_SECRET not set"
else
  echo "  ✅ LINE_CHANNEL_SECRET configured"
fi

if [ -z "$LINE_CHANNEL_ACCESS_TOKEN" ]; then
  echo "  ❌ LINE_CHANNEL_ACCESS_TOKEN not set"
else
  echo "  ✅ LINE_CHANNEL_ACCESS_TOKEN configured"
fi

# Check if dev server is running
echo ""
echo "2️⃣  Development Server:"
if curl -s http://localhost:3000 > /dev/null; then
  echo "  ✅ Dev server is running (localhost:3000)"
else
  echo "  ❌ Dev server not responding"
fi

# Check if ngrok is running
echo ""
echo "3️⃣  ngrok Tunnel:"
if curl -s http://127.0.0.1:4040 > /dev/null; then
  NGROK_URL=$(curl -s http://127.0.0.1:4040/api/tunnels | grep -o '"public_url":"[^"]*' | cut -d'"' -f4 | head -1)
  echo "  ✅ ngrok is running"
  echo "  📍 Tunnel URL: $NGROK_URL"
else
  echo "  ⚠️  ngrok not found (start with: ngrok http 3000)"
fi

# Check webhook endpoint locally
echo ""
echo "4️⃣  Webhook Endpoint Test:"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:3000/api/line/webhook \
  -H "Content-Type: application/json" \
  -H "X-Line-Signature: test" \
  -d '{}')

if [ "$RESPONSE" = "401" ] || [ "$RESPONSE" = "400" ]; then
  echo "  ✅ Webhook endpoint responds (HTTP $RESPONSE is expected for invalid signature)"
elif [ "$RESPONSE" = "500" ]; then
  echo "  ⚠️  Webhook returns HTTP 500 (check channel secret)"
else
  echo "  ❌ Webhook not responding (HTTP $RESPONSE)"
fi

echo ""
echo "✅ Verification complete!"
echo ""
echo "Next steps:"
echo "1. Send a message from LINE app"
echo "2. Watch terminal for webhook logs"
echo "3. Check admin UI: http://localhost:3000/chat"
echo "4. Monitor ngrok: http://127.0.0.1:4040"
```

Run it:
```bash
chmod +x verify-webhook.sh
./verify-webhook.sh
```

---

**Still having issues?** Share the terminal logs from when LINE sends a message, and I can help debug! 🔍
