# LINE OA Webchat (Next.js + TypeScript)

A production-ready Next.js application that enables **sending messages to and receiving messages from a LINE Official Account**. Built with **Next.js App Router**, **TypeScript**, and **Tailwind CSS**.

## 📋 Table of Contents

1. [Features](#features)
2. [Project Structure](#project-structure)
3. [Prerequisites](#prerequisites)
4. [Environment Setup](#environment-setup)
5. [Local Development](#local-development)
6. [API Documentation](#api-documentation)
7. [Target Discovery Guide](#target-discovery-apis--new)
8. [LINE Developer Setup](#line-developer-setup)
9. [Webhook Configuration](#webhook-configuration)
10. [Deployment on Vercel](#deployment-on-vercel)
11. [TypeScript Types](#typescript-types)
12. [Troubleshooting](#troubleshooting)
13. [Architecture & Improvements](#architecture--improvements)

---

## ✨ Features

### Core Features
- ✅ **Send Messages**: Push text messages from web UI to LINE OA
- ✅ **Receive Messages**: Webhook integration to receive LINE OA replies
- ✅ **Real-time Chat UI**: Responsive chat interface with polling support
- ✅ **Signature Verification**: HMAC-SHA256 verification for webhook security
- ✅ **TypeScript**: Full type safety across frontend and backend
- ✅ **Error Handling**: Graceful error handling with user-friendly messages
- ✅ **Production-Ready**: Vercel-compatible, optimized for serverless

### Target Discovery ✨ (NEW)
- ✅ **Auto-Discovery**: Automatically discover user/group/room IDs from webhook events
- ✅ **Target Management**: Query and list all discovered targets
- ✅ **Dynamic Messaging**: Send messages to specific targets without manual ID configuration
- ✅ **Statistics**: Get engagement metrics by target type
- **[Learn more →](./LINE_TARGET_DISCOVERY.md)**

### Technical Highlights
- In-memory message store with bounded size (200 messages max)
- Automatic target tracking (up to 100 sources)
- Polling-based message synchronization (3-second intervals)
- LINE Messaging API v2 integration
- Webhook signature validation using `X-Line-Signature` header
- Clean separation of concerns (client/server/lib)
- No external database required for MVP

---

## 📁 Project Structure

```
webchat-line/
├── app/
│   ├── api/
│   │   ├── line/
│   │   │   ├── push/route.ts           # Alternative send message endpoint
│   │   │   ├── targets/route.ts        # Get all discovered targets (NEW)
│   │   │   ├── targets/stats/route.ts  # Get target statistics (NEW)
│   │   │   ├── send-to-target/route.ts # Send to specific target (NEW)
│   │   │   └── webhook/route.ts        # Webhook handler with signature verification
│   │   ├── messages/route.ts           # GET polling endpoint
│   │   ├── send-message/route.ts       # POST send message endpoint
│   │   └── webhook/route.ts            # Alias to /api/line/webhook
│   ├── chat/
│   │   ├── ChatUI.tsx                  # Client-side chat UI (React)
│   │   └── page.tsx                    # /chat route
│   ├── globals.css                     # Tailwind CSS styles
│   ├── layout.tsx                      # Root layout wrapper
│   └── page.tsx                        # Home page (/)
├── lib/
│   ├── chatStore.ts                    # In-memory message storage
│   ├── lineClient.ts                   # LINE Messaging API HTTP client
│   ├── lineSignature.ts                # HMAC signature verification
│   ├── lineTargetId.ts                 # Target ID extraction & validation (NEW)
│   ├── lineWebhook.ts                  # Webhook payload parser
│   ├── messageSourceTracker.ts         # Message source tracking (NEW)
│   └── types.ts                        # TypeScript type definitions
├── public/                             # Static assets
├── .env.local.example                  # Environment variables template
├── eslint.config.mjs                   # ESLint configuration
├── next.config.ts                      # Next.js configuration
├── postcss.config.mjs                  # PostCSS configuration
├── tailwind.config.cjs                 # Tailwind CSS configuration
├── tsconfig.json                       # TypeScript configuration
├── package.json                        # Node.js dependencies
├── LINE_TARGET_DISCOVERY.md            # Target discovery feature guide (NEW)
└── README.md                           # This file
```

---

## 📦 Prerequisites

- **Node.js** ≥ 18.x
- **npm** or **yarn**
- **LINE Developer Account** (free at https://developers.line.biz/)
- **Vercel Account** (for deployment)
- **GitHub Account** (to host repository)

---

## 🔐 Environment Setup

### 1. Create `.env.local`

Copy the template file and add your LINE credentials:

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

```env
# Required: LINE Messaging API credentials
LINE_CHANNEL_ACCESS_TOKEN=YOUR_CHANNEL_ACCESS_TOKEN
LINE_CHANNEL_SECRET=YOUR_CHANNEL_SECRET  
LINE_TARGET_USER_ID=YOUR_USER_OR_GROUP_ID

# Optional: For debugging
# NODE_ENV=development
```

### 2. Obtain LINE Credentials

**Channel Access Token:**
1. Go to [LINE Developers Console](https://developers.line.biz/)
2. Select your channel > **Messaging API**
3. Find **Channel access token** section
4. Click **Issue** (if not already issued)
5. Copy the token

**Channel Secret:**
1. Go to your channel
2. Click **Basic settings**
3. Find **Channel secret**
4. Copy the value

**Target User ID:**
1. Add your official account as a friend
2. Send any message from the chat
3. Check the [LINE Developers Console Webhook Test Tool](https://developers.line.biz/console/)
4. Your User ID appears in the test webhook payload under `events[0].source.userId`

Example User ID: `Uab1c2d3e4f5g6h7i8j9k0l1m2n3o4p5q`

---

## 🚀 Local Development

### 1. Install Dependencies

```bash
npm install
```

### 2. Start Development Server

```bash
npm run dev
```

Server runs at `http://localhost:3000`

### 3. Access the Application

- **Home**: http://localhost:3000
- **Chat**: http://localhost:3000/chat
- **Webhook Test**: http://localhost:3000/api/line/webhook (POST only)

### 4. Test Sending a Message

1. Open http://localhost:3000/chat
2. Type a message and click **Send**
3. Verify it appears in the chat and was sent to LINE

### 5. Testing Webhook Reception (Local)

For local webhook testing, use a tunnel tool:

```bash
# Option 1: ngrok (recommended)
npm install -g ngrok
ngrok http 3000

# Option 2: LocalTunnel
npx localtunnel --port 3000
```

Then configure the tunnel URL in LINE Developers Console > Webhook URL.

---

## 📡 API Documentation

### `GET /api/messages`

Retrieve all chat messages (polling endpoint).

**Request:**
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
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "text": "Hello!",
        "sender": "me",
        "createdAt": "2026-02-20T10:30:00.000Z"
      },
      {
        "id": "550e8400-e29b-41d4-a716-446655440001",
        "text": "Hi there!",
        "sender": "line",
        "createdAt": "2026-02-20T10:31:00.000Z"
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

---

### `POST /api/send-message`

Send a text message to the LINE Official Account.

**Request:**
```bash
curl -X POST http://localhost:3000/api/send-message \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello from webchat!"}'
```

**Request Body:**
```json
{
  "message": "Your message text here"
}
```

**Response (200 OK):**
```json
{
  "success": true
}
```

**Response (Error Examples):**
```json
{
  "success": false,
  "error": "Message is required"
}
```

```json
{
  "success": false,
  "error": "LINE_CHANNEL_ACCESS_TOKEN is not configured"
}
```

---

### `POST /api/line/push` (Alternative)

Equivalent to `/api/send-message`. Use either endpoint.

**Request:**
```bash
curl -X POST http://localhost:3000/api/line/push \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello!"}'
```

---

### `POST /api/webhook`

Receive webhook events from LINE Official Account.

**Headers (sent by LINE):**
```
X-Line-Signature: [HMAC-SHA256 signature]
Content-Type: application/json
```

**Request Body (example):**
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

**Response (200 OK):**
```json
{
  "received": true,
  "textMessageCount": 1
}
```

**Response (401 Unauthorized - Invalid Signature):**
```json
{
  "received": false,
  "error": "Invalid signature"
}
```

**Response (500 Error - Missing Config):**
```json
{
  "received": false,
  "error": "LINE_CHANNEL_SECRET is not configured"
}
```

---

### Target Discovery APIs ✨ (NEW)

Automatically discover which users, groups, and rooms have messaged your bot, and send messages to them dynamically. See [LINE_TARGET_DISCOVERY.md](./LINE_TARGET_DISCOVERY.md) for complete documentation.

#### `GET /api/line/targets`

Get all configured and discovered target IDs.

**Request:**
```bash
curl http://localhost:3000/api/line/targets
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "configured": {
      "id": "Uab12345...",
      "type": "user",
      "isValid": true
    },
    "discovered": [
      {
        "id": "Cab67890...",
        "type": "group",
        "discoveredAt": "2026-02-20T10:32:00.000Z",
        "lastMessageAt": "2026-02-20T10:36:00.000Z",
        "messageCount": 2
      }
    ],
    "stats": {
      "total": 2,
      "users": 1,
      "groups": 1,
      "rooms": 0,
      "totalMessages": 7
    }
  }
}
```

---

#### `GET /api/line/targets/stats`

Get statistics about discovered targets with optional filtering.

**Request:**
```bash
# Get all statistics
curl http://localhost:3000/api/line/targets/stats

# Get statistics for users only
curl "http://localhost:3000/api/line/targets/stats?type=user"
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "total": 10,
    "users": 8,
    "groups": 1,
    "rooms": 1,
    "totalMessages": 42,
    "avgMessagesPerTarget": 4.2
  }
}
```

---

#### `POST /api/line/send-to-target`

Send a message to a specific discovered target.

**Request:**
```bash
curl -X POST http://localhost:3000/api/line/send-to-target \
  -H "Content-Type: application/json" \
  -d '{
    "targetId": "Uab12345...",
    "message": "Hello!"
  }'
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "message": "Hello!",
    "targetId": "Uab12345...",
    "targetType": "User",
    "wasDiscovered": true
  }
}
```

**For detailed API documentation, utility functions, and use cases, see [LINE_TARGET_DISCOVERY.md](./LINE_TARGET_DISCOVERY.md).**

---

## 🔗 LINE Developer Setup

### Step 1: Create a LINE Official Account

1. Go to [LINE Official Account Manager](https://manager.line.biz/)
2. Click **Create** > **Official Account**
3. Fill in account details (name, category, etc.)
4. Complete verification

### Step 2: Create a Messaging API Channel

1. Go to [LINE Developers Console](https://developers.line.biz/console/)
2. Create a new **Provider** (if needed)
3. Create a new **Channel** > select **Messaging API**
4. Accept Terms of Service
5. Fill in channel information

### Step 3: Get Channel Credentials

In your channel's **Messaging API** settings:

1. Find **Channel access token** → Click **Issue** and copy
2. Navigate to **Basic settings** tab
3. Find **Channel secret** and copy
4. Note down both values for `.env.local`

### Step 4: Set Response Messages (Optional)

1. In **Messaging API** settings
2. Scroll to **Response messages** section
3. Configure auto-replies (optional)

---

## 🔐 Webhook Configuration

### Prerequisites
- Your Next.js app must be publicly accessible
- Valid SSL/TLS certificate (Vercel provides this)

### Setup Instructions

1. **Deploy your app first** (see Vercel deployment section)

2. **Get your webhook URL:**
   ```
   https://<your-vercel-domain>/api/webhook
   Example: https://my-chat.vercel.app/api/webhook
   ```

3. **Configure in LINE Developers Console:**
   - Go to your channel > **Messaging API**
   - Find **Webhook settings**
   - Paste your webhook URL
   - Click **Verify** (LINE will send a test request)
   - Toggle **Use webhook** to **Enabled**

4. **Configure webhook events:**
   - Enable "Message" events
   - Enable "Follow" events (optional)
   - Save settings

5. **Test the webhook:**
   - Send a message to your official account
   - Check `/api/messages` to see if it appears
   - Check application logs for any errors

### Signature Verification

The webhook handler automatically verifies the `X-Line-Signature` header using:

```typescript
HMAC-SHA256(Channel Secret, Request Body)
```

This ensures requests are genuinely from LINE. If verification fails:
- Request is rejected with 401 Unauthorized
- Error logged to console
- Message is not processed

---

## 🚀 Deployment on Vercel

### Option 1: Using Vercel Dashboard (Recommended)

1. **Push to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/your-username/webchat-line.git
   git push -u origin main
   ```

2. **Import to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Click **Import Project**
   - Select **Import Git Repository**
   - Paste: `https://github.com/your-username/webchat-line.git`
   - Click **Import**

3. **Add Environment Variables:**
   - In Vercel dashboard > **Project Settings** > **Environment Variables**
   - Add each variable:
     - `LINE_CHANNEL_ACCESS_TOKEN`
     - `LINE_CHANNEL_SECRET`
     - `LINE_TARGET_USER_ID`
   - Click **Save**

4. **Deploy:**
   - Click **Deploy**
   - Wait for build to complete (typically 1-2 minutes)
   - Your app is now live!

### Option 2: Using Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Follow prompts to link your project and add environment variables
```

### After Deployment

1. **Update LINE Webhook URL:**
   - Your Vercel domain: `https://your-project.vercel.app`
   - Update webhook URL: `https://your-project.vercel.app/api/webhook`
   - Verify in LINE Developers Console

2. **Test:**
   - Open `https://your-project.vercel.app/chat`
   - Send a message
   - Verify it works end-to-end

3. **Monitor Logs:**
   ```bash
   vercel logs your-project --tail
   ```

---

## 📘 TypeScript Types

### Core Types

```typescript
// lib/types.ts

export type ChatSender = "me" | "line" | "system";

export interface ChatMessage {
  id: string;
  text: string;
  sender: ChatSender;
  createdAt: string; // ISO 8601
}

export interface SendMessageRequestBody {
  message: string;
}

export interface ApiSuccessResponse<T = undefined> {
  success: true;
  data?: T; // Optional if T is undefined
}

export interface ApiErrorResponse {
  success: false;
  error: string;
}
```

### Webhook Types

```typescript
// lib/lineWebhook.ts

export interface LineWebhookRequestBody {
  destination?: string;
  events?: LineWebhookEvent[];
}

export interface LineWebhookEvent {
  type: string; // "message" | "follow" | "join" | etc.
  message?: {
    type?: string; // "text" | "image" | "video" | etc.
    text?: string;
  };
}
```

### LINE Client Types

```typescript
// lib/lineClient.ts

export type LinePushResult = 
  | { ok: true }
  | {
      ok: false;
      status: number;
      error: string;
    };
```

---

## ⚠️ Important: LINE Privacy Rules

**Critical Limitation:** You can only send push messages to users/groups/rooms that have **previously interacted with your OA**.

### How It Works

```
User sends message → Your OA receives webhook
     ↓
Extract user ID from event.source
     ↓
Save to database/tracker: recordMessageSource(id)
     ↓
✅ NOW you can push messages to them
     ↓
pushTextMessage({ to: id, text: "Hello!" })
```

### What LINE Blocks

❌ Cannot send to:
- Users who have never messaged you
- Random user IDs from external sources
- Imported lists of users
- Bot-only conversations

### Why This Rule Exists

LINE's privacy policy prevents spam. You can only send messages to users who've shown interest by initiating contact.

### For Your Implementation

```typescript
// ✅ Correct: Send only to users who messaged you
const allTargets = getAllMessageSources(); // Webhooks only
for (const target of allTargets) {
  await pushTextMessage({
    to: target.id,
    text: "Response to your message"
  });
}

// ❌ Wrong: Trying to message a user ID you found elsewhere
await pushTextMessage({
  to: "Uab1234567890abcdef1234567890abcd", // If they never messaged you
  text: "This will fail (blocked by LINE)"
});
```

### Database Strategy for Production

When upgrading to persistent database:
1. **Only import** targets discovered from webhooks
2. **Never import** external user lists
3. **Track** when each user last interacted
4. **Respect** LINE's recency requirements

---

## 🐛 Troubleshooting

### "Message is required" Error

**Cause:** Empty message sent
**Fix:** Ensure message field is not empty or whitespace-only

### "LINE_CHANNEL_ACCESS_TOKEN is not configured"

**Cause:** Missing environment variable
**Fix:** 
1. Check `.env.local` file exists
2. Verify token is correctly set
3. Restart dev server

### "Invalid signature" on Webhook

**Cause:** Signature verification failed
**Possible fixes:**
1. Ensure `LINE_CHANNEL_SECRET` is correct
2. Verify webhook request wasn't modified in transit
3. Check clock synchronization

### Webhook Not Receiving Messages

**Cause:** Webhook not properly configured
**Debug steps:**
1. Verify webhook URL is correct in LINE console
2. Check webhook is verified (green checkmark)
3. Ensure "Use webhook" is enabled
4. Check application logs: `vercel logs your-project --tail`
5. Use LINE Webhook Test Tool to manually send test events

### CORS Error When Sending Message

**Note:** This should not occur as requests are from server-side
**If encountered:**
1. Check request is made from `/api/send-message` only
2. Verify Content-Type header is set to `application/json`

### Messages Not Appearing in Chat

**Cause:** Polling interval might be too long
**Current behavior:**
- Chat polls `/api/messages` every 3 seconds
- Messages may take up to 3 seconds to appear
- This is by design for MVP
- **Improvement:** Use WebSocket or Server-Sent Events (SSE)

---

## 🏗️ Architecture & Improvements

### Current Architecture (MVP)

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│  Frontend   │         │  Next.js API │         │ LINE Cloud  │
│  (React)    │◄──────► │  (Serverless)│◄──────►│ (Messaging  │
│  ChatUI.tsx │         │  Routes      │        │   API v2)   │
└─────────────┘         └──────────────┘         └─────────────┘
      │                        │                         │
      │ Polls every 3s         │ Stores in RAM           │ Sends text
      │ /api/messages          │ (200 msg max)           │ messages
      │                        │ Validates webhook       │
      └────────────────────────┴─────────────────────────┘
```

**Strengths:**
- Simple, no database setup
- Fast development
- Suitable for MVP/testing
- Easy to deploy

**Limitations:**
- Messages lost on redeploy
- Polling creates unnecessary traffic
- Scalability limited by in-memory storage

---

### Suggested Improvements

#### 1. **Add Database Persistence**

Use Prisma + PostgreSQL:

```typescript
// lib/prisma.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
export default prisma;
```

Benefits:
- Messages persist across deployments
- Unlimited message history
- Query capabilities

#### 2. **Real-time Updates with WebSocket**

Replace polling with Server-Sent Events (SSE):

```typescript
// app/api/messages/sse/route.ts
export async function GET(request: Request) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      // Send updates when messages change
      setInterval(() => {
        const messages = getMessages();
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(messages)}\n\n`));
      }, 1000);
    },
  });
  
  return new Response(stream, {
    headers: { "Content-Type": "text/event-stream" }
  });
}
```

Benefits:
- Lower latency
- Reduced server load
- Better user experience

#### 3. **Add Message Typing Indicators**

Show "User is typing..." in real-time.

#### 4. **Support Rich Messages**

Extend to support:
- Image messages
- Buttons/Quick Replies
- Carousel templates
- Flex messages

#### 5. **Add Unit & Integration Tests**

```typescript
// __tests__/api/send-message.test.ts
import { POST } from "@/app/api/send-message/route";

describe("POST /api/send-message", () => {
  it("should send a message to LINE", async () => {
    // Test implementation
  });
});
```

---

## 📝 License

This project is open source and available under the MIT License.

---

## 🎯 Quick Checklist for Submission

Before deploying, verify:

- [ ] `.env.local` configured with LINE credentials
- [ ] Local development works: `npm run dev` and test `/chat`
- [ ] GitHub repository created and code pushed
- [ ] Vercel project created and deployed
- [ ] Environment variables added to Vercel
- [ ] Webhook URL updated in LINE Developers Console
- [ ] Webhook verification successful
- [ ] Test sending/receiving messages end-to-end

**Your Deliverable URLs:**

- 🌐 Webchat: `https://<your-project>.vercel.app/chat`
- 🔗 GitHub Repo: `https://github.com/<your-username>/webchat-line`
- 💬 LINE Official Account: `https://line.me/R/ti/p/@<your-line-oa-id>`

---

## 📞 Support & Resources

- [LINE Developers Documentation](https://developers.line.biz/en/docs/messaging-api/)
- [LINE Webhook Events](https://developers.line.biz/en/docs/messaging-api/receiving-messages/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Vercel Guides](https://vercel.com/guides)

```bash
LINE_CHANNEL_ACCESS_TOKEN=YOUR_LINE_CHANNEL_ACCESS_TOKEN
LINE_CHANNEL_SECRET=YOUR_LINE_CHANNEL_SECRET
LINE_TARGET_USER_ID=YOUR_LINE_USER_OR_GROUP_ID
```

Notes:
- `LINE_CHANNEL_ACCESS_TOKEN`: from LINE Developers Console (Messaging API)
- `LINE_CHANNEL_SECRET`: from LINE channel basic settings
- `LINE_TARGET_USER_ID`: userId/groupId to receive push messages

## 4) Run Locally

```bash
npm install
npm run dev
```

Open:
- `http://localhost:3000` (landing)
- `http://localhost:3000/chat` (chat page)

## 5) API Contracts

### `POST /api/send-message`

Request body:

```json
{ "message": "Hello from webchat" }
```

Success:

```json
{ "success": true }
```

Error:

```json
{ "success": false, "error": "..." }
```

### `POST /api/webhook`

- Validates `X-Line-Signature`
- Parses webhook payload
- Stores incoming LINE text events as chat messages

### `GET /api/messages`

Returns chat messages for polling in `/chat`.

## 6) LINE OA Webhook Setup

1. Deploy app (or use tunnel for local testing).
2. In LINE Developers Console > Messaging API:
   - set **Webhook URL** to:
     - `https://<your-domain>/api/webhook`
   - enable **Use webhook**
3. Verify webhook from LINE console.

## 7) Deploy on Vercel

1. Push code to a public GitHub repository.
2. Import repository in Vercel.
3. Add environment variables in Vercel project settings:
   - `LINE_CHANNEL_ACCESS_TOKEN`
   - `LINE_CHANNEL_SECRET`
   - `LINE_TARGET_USER_ID`
4. Deploy.
5. Update LINE webhook URL to your Vercel domain:
   - `https://<your-vercel-domain>/api/webhook`

## 8) Final Deliverable Checklist

Fill these before submission:

- LINE OA test URL: `https://line.me/R/ti/p/@<your-line-oa-id>`
- Vercel webchat URL: `https://<your-project>.vercel.app/chat`
- Public GitHub repo URL: `https://github.com/<your-username>/<your-repo>`

## 9) Suggested Polishing Improvements

- Better error handling
  - map LINE API status codes to user-friendly messages
  - structured error codes in API responses
- Separation of concerns
  - move from in-memory store to database (e.g., PostgreSQL + Prisma)
  - add service layer for message persistence
- Optional tests
  - unit tests for `/api/send-message` validation and line client behavior
  - unit tests for webhook signature verification and payload parsing

## 10) Important Note

Current storage is in-memory (`lib/chatStore.ts`) and resets on restart/redeploy.
For production-like behavior, replace it with persistent storage.
