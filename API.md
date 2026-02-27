# API Reference

This document describes all API endpoints for the LINE Webchat application.

## Base URL

- **Local:** `http://localhost:3000`
- **Production:** `https://<your-domain>.vercel.app`

## Authentication

All requests use server-side environment variables for authentication. No API keys are required in client requests.

---

## Endpoints

### 1. GET /api/messages

Retrieve all chat messages (polling endpoint).

**Description:** Gets the current list of all messages stored in memory.

**Method:** `GET`

**Authentication:** None required

**Query Parameters:** None

**Request Example:**

```bash
curl http://localhost:3000/api/messages
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "messages": [
      {
        "id": "uuid-string",
        "text": "Hello!",
        "sender": "me",
        "createdAt": "2026-02-20T10:30:00.000Z"
      },
      {
        "id": "uuid-string",
        "text": "Hi there!",
        "sender": "line",
        "createdAt": "2026-02-20T10:31:00.000Z"
      },
      {
        "id": "uuid-string",
        "text": "Welcome to the chat",
        "sender": "system",
        "createdAt": "2026-02-20T10:29:00.000Z"
      }
    ]
  }
}
```

**Response (500 Error):**

```json
{
  "success": false,
  "error": "Failed to load messages"
}
```

**Notes:**
- Messages are sorted by `createdAt` in the frontend
- Maximum 200 messages stored in memory
- Messages reset on server restart/redeploy

---

### 2. GET /api/line/profile

Fetch LINE user profile information (name, avatar, status).

**Description:** Retrieves the user's display name, profile picture, and status message from LINE Messaging API. Results are cached for 30 minutes to minimize API calls.

**Method:** `GET`

**Authentication:** Server uses `LINE_CHANNEL_ACCESS_TOKEN` (from environment)

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `userId` | string | Yes | The LINE user ID to fetch profile for |

**Request Example:**

```bash
curl "http://localhost:3000/api/line/profile?userId=Uab1234567890abcdef1234567890ab"
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "userId": "Uab1234567890abcdef1234567890ab",
    "displayName": "John Doe",
    "pictureUrl": "https://example.com/profile.jpg",
    "statusMessage": "Hello, World!"
  }
}
```

**Response (Fallback - if fetch fails):**

```json
{
  "success": true,
  "data": {
    "userId": "Uab1234567890abcdef1234567890ab",
    "displayName": "Uab123...",
    "pictureUrl": "",
    "statusMessage": ""
  }
}
```

**Error Response (400):**

```json
{
  "success": false,
  "error": "userId is required"
}
```

**Caching:**
- Profiles are cached in memory for **30 minutes**
- The cache is reset when the server restarts
- Cache is per-instance (not shared across processes)

**Notes:**
- Returns a graceful fallback with userId if LINE API is unreachable
- Used by the admin dashboard to show user names and avatars in the user list
- Fallback display shows truncated userId instead of raw ID if profile fetch fails

---

### 3. POST /api/send-message

Send a text message to the LINE Official Account.

**Description:** Accepts a message from the user and pushes it to the LINE Messaging API, then stores it locally.

**Method:** `POST`

**Authentication:** Server uses `LINE_CHANNEL_ACCESS_TOKEN` (from environment)

**Content-Type:** `application/json`

**Request Body:**

```json
{
  "message": "Your text message here"
}
```

**Request Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `message` | string | Yes | Text message to send (1-5000 characters) |

**Request Example:**

```bash
curl -X POST http://localhost:3000/api/send-message \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello from webchat!"}'
```

**Response (200 OK):**

```json
{
  "success": true
}
```

**Response (400 Bad Request - Missing Message):**

```json
{
  "success": false,
  "error": "Message is required"
}
```

**Response (400 Bad Request - Invalid JSON):**

```json
{
  "success": false,
  "error": "Invalid request body"
}
```

**Response (500 Internal Server Error - Missing Config):**

```json
{
  "success": false,
  "error": "LINE_CHANNEL_ACCESS_TOKEN or LINE_TARGET_USER_ID is not configured"
}
```

**Response (500 Internal Server Error - LINE API Error):**

```json
{
  "success": false,
  "error": "Invalid channel access token"
}
```

**Implementation Details:**

1. Validates message is not empty or whitespace-only
2. Calls LINE Messaging API v2 `/v2/bot/message/push` endpoint
3. If successful, appends message to local store with `sender: "me"`
4. Returns error if LINE API fails with details

**Notes:**
- Maximum message length: LINE supports up to 5000 characters
- Messages are sent immediately to LINE
- Delivery is guaranteed by LINE if API returns 200
- Local message storage is for UI display only

---

### 4. POST /api/line/push

Alternative endpoint for sending messages (equivalent to `/api/send-message`).

**Description:** Re-exports the POST handler from `/api/send-message`.

**Method:** `POST`

**Request Body:**

```json
{
  "message": "Text message"
}
```

**Response:** Same as `/api/send-message`

**Request Example:**

```bash
curl -X POST http://localhost:3000/api/line/push \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello!"}'
```

**Notes:**
- Use either `/api/send-message` or `/api/line/push`
- Both endpoints are functionally identical
- `/api/line/push` is provided as an alternative

---

### 5. POST /api/webhook

Receive webhook events from LINE Official Account.

**Description:** Receives message events from LINE OA. Validates signature and stores incoming messages.

**Method:** `POST`

**Authentication:** Uses `X-Line-Signature` header verification with `LINE_CHANNEL_SECRET`

**Content-Type:** `application/json`

**Required Headers:**

```
Content-Type: application/json
X-Line-Signature: <HMAC-SHA256 signature>
```

**Request Body (LINE sends this):**

```json
{
  "destination": "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "events": [
    {
      "replyToken": "nHuyWiB7yP5Zw52FIkcQT",
      "type": "message",
      "timestamp": 1462629479859,
      "source": {
        "type": "user",
        "userId": "Uab12345..."
      },
      "message": {
        "type": "text",
        "id": "100001",
        "text": "Hello, this is a test"
      }
    }
  ]
}
```

**Response (200 OK - Webhook successful):**

```json
{
  "received": true,
  "textMessageCount": 1
}
```

**Response (400 Bad Request - Invalid JSON):**

```json
{
  "received": false,
  "error": "Invalid JSON body"
}
```

**Response (401 Unauthorized - Invalid Signature):**

```json
{
  "received": false,
  "error": "Invalid signature"
}
```

**Response (401 Unauthorized - Missing Signature Header):**

```json
{
  "received": false,
  "error": "Missing X-Line-Signature header"
}
```

**Response (500 Internal Server Error - Missing Config):**

```json
{
  "received": false,
  "error": "LINE_CHANNEL_SECRET is not configured"
}
```

**Implementation Details:**

1. Extracts `X-Line-Signature` header
2. Computes HMAC-SHA256 of raw request body using `LINE_CHANNEL_SECRET`
3. Compares computed signature with received signature
4. If valid:
   - Parses JSON body
   - Extracts text messages from events
   - Stores each as message with `sender: "line"`
5. If invalid: Rejects with 401

**Security Notes:**
- Signature verification prevents spoofing
- Always validates before processing
- Raw request body must be preserved for signature verification
- Timing-safe comparison used to prevent timing attacks

**LINE Event Types Supported:**

Currently processes:
- `type: "message"` with `message.type: "text"`

Other event types:
- Received but not processed
- Can be extended in `lib/lineWebhook.ts`

---

### 6. POST /api/webhook (Alias)

**Description:** Alias to `/api/line/webhook`. Same implementation, different URL path.

**Method:** `POST`

**Route:** `/api/webhook` → `/api/line/webhook`

**Response:** Same as `/api/line/webhook`

---

## Common Response Format

All API responses follow this pattern:

**Success:**
```json
{
  "success": true,
  "data": { /* optional data */ }
}
```

**Error:**
```json
{
  "success": false,
  "error": "Error message describing what went wrong"
}
```

---

## Error Codes

| HTTP Code | Meaning | How to Fix |
|-----------|---------|-----------|
| 200 | OK | No action needed |
| 400 | Bad Request | Check request format and parameters |
| 401 | Unauthorized | Verify signature or credentials |
| 500 | Server Error | Check environment variables and logs |
| 502 | Gateway Error | LINE API unreachable - retry later |

---

## Rate Limiting

- No rate limiting currently implemented
- LINE Messaging API has its own rate limits
- See [LINE API Limits](https://developers.line.biz/en/docs/messaging-api/rate-limit/)

---

## Message Format

### ChatMessage Object

```typescript
interface ChatMessage {
  id: string;           // UUID
  text: string;         // Message content
  sender: "me" | "line" | "system";  // Who sent it
  createdAt: string;    // ISO 8601 timestamp
}
```

### Sender Types

- `"me"` - User sent this message
- `"line"` - LINE OA sent this message
- `"system"` - System message (welcome, etc.)

---

## Examples

### Send a Message (JavaScript)

```javascript
async function sendMessage(text) {
  const response = await fetch('/api/send-message', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message: text }),
  });
  
  const data = await response.json();
  if (data.success) {
    console.log('Message sent!');
  } else {
    console.error('Error:', data.error);
  }
}
```

### Get All Messages (JavaScript)

```javascript
async function getMessages() {
  const response = await fetch('/api/messages');
  const data = await response.json();
  
  if (data.success) {
    console.log('Messages:', data.data.messages);
  } else {
    console.error('Error:', data.error);
  }
}
```

### Poll Messages Periodically (JavaScript)

```javascript
setInterval(async () => {
  const response = await fetch('/api/messages');
  const data = await response.json();
  
  if (data.success) {
    const messages = data.data.messages;
    // Update UI with messages
  }
}, 3000); // Poll every 3 seconds
```

---

## Environment Variables

Required for API operations:

```env
LINE_CHANNEL_ACCESS_TOKEN=<from LINE console>
LINE_CHANNEL_SECRET=<from LINE console>
LINE_TARGET_USER_ID=<your user ID>
```

See [Setup Guide](./SETUP.md) for obtaining these values.

---

## Testing Locally

```bash
# 1. Start dev server
npm run dev

# 2. Test getting messages
curl http://localhost:3000/api/messages

# 3. Test sending message
curl -X POST http://localhost:3000/api/send-message \
  -H "Content-Type: application/json" \
  -d '{"message": "Test message"}'

# 4. Test webhook (from another terminal with ngrok)
curl -X POST https://your-ngrok-url/api/webhook \
  -H "Content-Type: application/json" \
  -H "X-Line-Signature: <valid-signature>" \
  -d '{...webhook body...}'
```

---

## Debugging Tips

1. **Check browser console** for client-side errors
2. **Check terminal output** during `npm run dev`
3. **Use Vercel logs**: `vercel logs <project-name> --tail`
4. **Check network tab** in browser DevTools
5. **Enable verbose logging** by adding `console.log()` statements

---

## Further Reading

- [LINE Messaging API Documentation](https://developers.line.biz/en/docs/messaging-api/)
- [LINE Webhook Documentation](https://developers.line.biz/en/docs/messaging-api/webhooks/)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [Next.js Route Handlers](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
