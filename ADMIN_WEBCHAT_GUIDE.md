# Admin Webchat System - Implementation Guide

This is a complete admin-side webchat system for LINE Official Account built with Next.js + TypeScript.

## Architecture Overview

### Components

```
┌─────────────────────────────────────────────────────┐
│                   Admin UI (ChatUI)                 │
│  • Left Panel: List of active LINE users           │
│  • Right Panel: Chat with selected user            │
│  • Real-time updates via SSE                       │
└──────────┬──────────────────────────────────────────┘
           │
     ┌─────┴─────┐
     │           │
  WebSocket    Polling
   (SSE)       (Fallback)
     │           │
     └─────┬─────┘
           │
┌──────────▼──────────────────────────────────────────┐
│                    API Routes                       │
│  • /api/stream - SSE stream for real-time updates │
│  • /api/messages?userId=X - Get messages per user │
│  • /api/send-message - Admin sends message        │
│  • /api/webhook - LINE webhook endpoint           │
└──────────┬──────────────────────────────────────────┘
           │
┌──────────▼──────────────────────────────────────────┐
│               In-Memory Chat Store                  │
│  • Map<userId, ChatMessage[]>                       │
│  • Event listeners for SSE broadcast               │
│  • Per-user message history (max 200 per user)     │
└──────────┬──────────────────────────────────────────┘
           │
      ┌────┴────┬────────────────┐
      │         │                │
   LINE API  Storage    Message Listeners
  (Push API) (None yet) (for SSE)
```

## File Structure

```
app/
├── api/
│   ├── messages/route.ts          # Get messages (per-user or list users)
│   ├── send-message/route.ts      # Admin sends message to user
│   ├── stream/route.ts            # SSE endpoint for real-time updates
│   ├── webhook/route.ts           # Forwards to line/webhook
│   └── line/
│       └── webhook/route.ts       # Receives messages from LINE
├── chat/
│   ├── page.tsx                   # Chat page entry point
│   └── ChatUI.tsx                 # Main chat UI component (2-pane)
└── layout.tsx, page.tsx

lib/
├── chatStore.ts                   # In-memory message storage (multi-user)
├── lineClient.ts                  # LINE Messaging API client
├── lineSignature.ts              # Webhook signature verification
├── lineWebhook.ts                # Webhook types and utilities
├── lineTargetId.ts               # Target ID validation
├── messageSourceTracker.ts       # Track discovered targets
└── types.ts                      # Shared TypeScript types
```

## Setup Instructions

### 1. Environment Variables

Create a `.env.local` file with:

```env
# LINE Channel credentials (from LINE Developers Console)
LINE_CHANNEL_ACCESS_TOKEN=your_channel_access_token_here
LINE_CHANNEL_SECRET=your_channel_secret_here

# Optional: For testing/documentation
LINE_TARGET_USER_ID=U123456...  # Your LINE user ID for testing
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure LINE Official Account

1. Go to [LINE Developers Console](https://developers.line.biz/en/console/)
2. Create a new channel (Messaging API)
3. Get your **Channel Access Token** and **Channel Secret**
4. Set the **Webhook URL** to: `https://your-domain.com/api/webhook`
5. Enable webhook

### 4. Start Development Server

```bash
npm run dev
```

Visit `http://localhost:3000/chat` to see the admin UI.

## API Endpoints

### GET /api/messages

Fetch active users or messages for a specific user.

**Query Parameters:**
- `userId` (optional): If provided, returns messages for that user. If omitted, returns list of active users.

**Response (User List):**
```json
{
  "success": true,
  "data": {
    "users": ["U123...", "U456...", "U789..."],
    "messages": []
  }
}
```

**Response (User Messages):**
```json
{
  "success": true,
  "data": {
    "users": [],
    "messages": [
      {
        "id": "uuid",
        "text": "Hello!",
        "sender": "line",
        "createdAt": "2024-01-01T12:00:00Z"
      }
    ]
  }
}
```

### POST /api/send-message

Send a message from admin to a LINE user.

**Request Body:**
```json
{
  "targetId": "U123456...",
  "message": "Hello user!"
}
```

**Response:**
```json
{ "success": true }
```

### GET /api/stream

Server-Sent Events stream for real-time message updates.

**Connection:**
```javascript
const eventSource = new EventSource('/api/stream');
eventSource.onmessage = (event) => {
  const { userId, message } = JSON.parse(event.data);
  // Handle new message
};
```

**Message Format:**
```json
{
  "userId": "U123456...",
  "message": {
    "id": "uuid",
    "text": "New message",
    "sender": "line",
    "createdAt": "2024-01-01T12:00:00Z"
  }
}
```

### POST /api/webhook

Receives webhook events from LINE Official Account.

**Header:** `X-Line-Signature` (automatically verified)

**Request Body:** LINE Webhook event

**Response:**
```json
{
  "received": true,
  "textMessageCount": 1
}
```

## Features

✅ **Real-time Updates**
- SSE (Server-Sent Events) for instant message delivery
- Automatic reconnection on disconnect
- Fallback polling every 3 seconds

✅ **Multi-User Support**
- Store chat history per LINE user
- Switch between users seamlessly
- Active user list in left sidebar

✅ **Admin Messaging**
- Send replies to LINE users via LINE Messaging API
- Messages saved to chat history
- Sent messages show as "You" in UI

✅ **Message Management**
- Max 200 messages per user in memory
- Chronologically sorted display
- Message timestamps

✅ **Clean UI**
- Two-pane layout (users list + chat)
- Mobile-friendly responsive design
- Real-time status indicators
- Keyboard shortcuts (Enter to send)

## How It Works

### Message Flow (LINE User → Admin)

1. **LINE User sends message**
   - Message goes to LINE servers
   - LINE calls our webhook at `/api/webhook`

2. **Webhook Handler**
   - Verifies signature using `LINE_CHANNEL_SECRET`
   - Extracts user ID and message text
   - Stores message in chatStore per userId

3. **Real-time Broadcast**
   - chatStore triggers event listeners
   - Connected SSE clients receive message instantly
   - UI updates with new message

### Message Flow (Admin → LINE User)

1. **Admin types and sends message**
   - UI calls `POST /api/send-message`
   - Includes targetId (LINE user ID) and message text

2. **Push Message**
   - API route calls LINE Messaging API
   - Uses `LINE_CHANNEL_ACCESS_TOKEN` to authenticate
   - Message delivered to LINE user's app

3. **Store Message**
   - Message saved to chatStore as sender "me"
   - UI updated optimistically (refetches for confirmation)

## Storage

Currently using **in-memory storage** (Map):
- ✅ Fast, no database setup needed
- ❌ Data lost on server restart
- ❌ Not suitable for production with multiple instances

### For Production

Replace the chatStore with a database:

```typescript
// Example with Prisma + PostgreSQL
export async function appendMessage(userId: string, text: string, sender: ChatSender) {
  return await db.message.create({
    data: { userId, text, sender, createdAt: new Date() }
  });
}

export async function getMessages(userId: string) {
  return await db.message.findMany({
    where: { userId },
    orderBy: { createdAt: 'asc' },
    take: 200
  });
}
```

## Troubleshooting

### No messages appearing?

1. Check `LINE_CHANNEL_SECRET` is correct (verification failure)
2. Verify webhook URL in LINE console matches your domain
3. Check browser console for errors
4. The LINE user must send a message first so they appear in the user list

### Can't send messages from admin?

1. Verify `LINE_CHANNEL_ACCESS_TOKEN` is set
2. Verify the userId is correct (copy from user list)
3. Check browser DevTools Network tab for API error response

### SSE connection failing?

1. Check browser console for EventSource errors
2. Verify `/api/stream` endpoint is accessible
3. Some proxies/firewalls block SSE connections (if so, use polling)

### User list not updating?

1. Polling is every 3 seconds - wait a moment
2. Check that LINE user is sending text messages (other types ignored)
3. Check browser console for fetch errors

## Development Tips

### Testing with LINE

1. Add your personal account as admin in LINE Official Account
2. Send yourself messages to test the webhook
3. Use the admin UI to reply

### Local Ngrok Setup (for webhook testing)

```bash
# Install ngrok
brew install ngrok

# Create tunnel
ngrok http 3000

# Output: https://xxxx-10-0-0-1.ngrok-free.app
# Use this URL in LINE console webhook setting
```

### Debug Logging

Add console logs to see what's happening:

```typescript
// Webhook handler
console.log("[LINE Webhook] Received event:", body);

// Chat store
console.log("[ChatStore] Saved message:", userId, text);

// SSE broadcast
console.log("[SSE] Broadcasting to", listeners.size, "clients");
```

## Next Steps / Future Enhancements

- [ ] Database integration (PostgreSQL + Prisma)
- [ ] User online status indicators
- [ ] Typing indicators
- [ ] User profile icons/names (using LINE API)
- [ ] Message search
- [ ] User/conversation archive
- [ ] Admin user authentication
- [ ] Multiple admins/teams support
- [ ] Message read receipts
- [ ] File/image message support (if desired)
- [ ] Conversation tags/labels
- [ ] Message export

## References

- [LINE Messaging API Docs](https://developers.line.biz/en/docs/messaging-api/)
- [LINE Webhook Events](https://developers.line.biz/en/docs/messaging-api/receive-webhook-events/)
- [LINE Push API](https://developers.line.biz/en/docs/messaging-api/using-push-api/)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [Server-Sent Events (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events)
