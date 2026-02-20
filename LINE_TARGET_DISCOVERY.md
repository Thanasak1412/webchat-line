# LINE Target ID Discovery Guide

Complete guide to discovering and managing LINE target IDs (users, groups, rooms) in your webhook.

## Overview

When users, groups, or rooms send messages to your LINE Official Account, they're sending from a specific ID. The LINE Messaging API includes this ID in the webhook event. This guide shows how to discover and use these IDs.

## Why You Need This

**Problem:** The current setup requires you to manually provide `LINE_TARGET_USER_ID` as a static environment variable.

**Solution:** Automatically discover which users/groups/rooms are messaging your bot, and use those IDs dynamically.

**Use Cases:**
- Send messages to users who've previously messaged you
- Broadcast messages to multiple groups
- Analytics: Track which groups/rooms are using your bot
- Dynamic targeting: No need to manually set target IDs

---

## New Library: `lineTargetId.ts`

Utilities for working with LINE target IDs.

### Functions

#### `extractTargetFromEvent(event: LineWebhookEvent)`

Extract the target ID and type from a webhook event.

```typescript
import { extractTargetFromEvent } from "@/lib/lineTargetId";

// In webhook handler
const target = extractTargetFromEvent(event);
if (target.id && target.type) {
  console.log(`Message from ${target.type}: ${target.id}`);
  // target.id = "Uab12345..." or "Cab12345..." or "Rab12345..."
  // target.type = "user" | "group" | "room"
}
```

#### `getConfiguredTargetId()`

Get the target ID from environment variables.

```typescript
const targetId = getConfiguredTargetId();
// Returns: "Uab12345..." or null if not configured
```

#### `getTargetTypeFromId(id: string)`

Determine type by ID prefix (U = user, C = group, R = room).

```typescript
getTargetTypeFromId("Uab12345...") // "user"
getTargetTypeFromId("Cab12345...") // "group"
getTargetTypeFromId("Rab12345...") // "room"
getTargetTypeFromId("invalid")     // null
```

#### `isValidLineId(id: string)`

Validate if a string is a valid LINE ID format.

```typescript
isValidLineId("Uab12345678abcdef1234567890abcd") // true
isValidLineId("invalidid")                        // false
```

#### `getTargetTypeLabel(type)`

Get human-readable label for type.

```typescript
getTargetTypeLabel("user")  // "User"
getTargetTypeLabel("group") // "Group"
getTargetTypeLabel("room")  // "Room"
```

#### `formatTargetId(id)`

Format ID with type for display.

```typescript
formatTargetId("Uab12345...") // "User: Uab12345..."
formatTargetId("Cab12345...") // "Group: Cab12345..."
```

---

## New Library: `messageSourceTracker.ts`

Track which LINE users/groups/rooms have messaged your bot.

### Functions

#### `recordMessageSource(targetId: string)`

Record that a target has sent a message. Updates if already tracked.

```typescript
import { recordMessageSource } from "@/lib/messageSourceTracker";

// When you receive a message
const result = recordMessageSource("Uab12345...");
if (result) {
  console.log(`${result.type} has sent ${result.messageCount} messages`);
}
```

#### `getAllMessageSources()`

Get all tracked targets, sorted by most recent.

```typescript
const allSources = getAllMessageSources();
// Returns: [
//   { id: "Uab...", type: "user", lastMessageAt: "...", messageCount: 5 },
//   { id: "Cab...", type: "group", lastMessageAt: "...", messageCount: 3 }
// ]
```

#### `getMessageSourcesByType(type)`

Get targets of a specific type.

```typescript
const users = getMessageSourcesByType("user");
const groups = getMessageSourcesByType("group");
const rooms = getMessageSourcesByType("room");
```

#### `getMessageSourceStats()`

Get statistics about all tracked targets.

```typescript
const stats = getMessageSourceStats();
// {
//   total: 10,
//   users: 8,
//   groups: 1,
//   rooms: 1,
//   totalMessages: 42
// }
```

---

## New API Endpoints

### 1. GET `/api/line/targets`

Get all configured and discovered target IDs.

**Request:**
```bash
curl http://localhost:3000/api/line/targets
```

**Response:**
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
        "id": "Uab12345...",
        "type": "user",
        "discoveredAt": "2026-02-20T10:30:00.000Z",
        "lastMessageAt": "2026-02-20T10:35:00.000Z",
        "messageCount": 5
      },
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

### 2. GET `/api/line/targets/stats`

Get statistics about discovered targets.

**Request:**
```bash
# Get all statistics
curl http://localhost:3000/api/line/targets/stats

# Get statistics for users only
curl "http://localhost:3000/api/line/targets/stats?type=user"

# Get statistics for groups only
curl "http://localhost:3000/api/line/targets/stats?type=group"
```

**Response (all):**
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

**Response (filtered):**
```json
{
  "success": true,
  "data": {
    "filter": "user",
    "count": 8,
    "messageCount": 35,
    "avgMessagesPerTarget": 4.38
  }
}
```

---

### 3. POST `/api/line/send-to-target`

Send a message to a specific discovered target (user, group, or room).

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

**Response (400 Error):**
```json
{
  "success": false,
  "error": "Invalid LINE ID format. Must start with U, C, or R and be 33+ characters"
}
```

---

## Use Cases

### 1. Display All Users Who've Messaged

```typescript
import { getMessageSourcesByType } from "@/lib/messageSourceTracker";

// Get all users who have messaged
const users = getMessageSourcesByType("user");

users.forEach(user => {
  console.log(`${user.id}: ${user.messageCount} messages`);
  console.log(`  Last message: ${user.lastMessageAt}`);
});
```

### 2. Send Message to All Groups

```typescript
import { getMessageSourcesByType } from "@/lib/messageSourceTracker";
import { pushTextMessage } from "@/lib/lineClient";

const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
const groups = getMessageSourcesByType("group");

for (const group of groups) {
  await pushTextMessage({
    channelAccessToken: token,
    to: group.id,
    text: "Announcement: New feature released!"
  });
}
```

### 3. Get Statistics Dashboard

```typescript
import { getMessageSourceStats } from "@/lib/messageSourceTracker";

const stats = getMessageSourceStats();

console.log("Bot Usage Statistics:");
console.log(`- Unique users: ${stats.users}`);
console.log(`- Groups: ${stats.groups}`);
console.log(`- Rooms: ${stats.rooms}`);
console.log(`- Total messages: ${stats.totalMessages}`);
console.log(`- Avg per target: ${(stats.totalMessages / stats.total).toFixed(2)}`);
```

### 4. Find New Users

```typescript
import { getAllMessageSources } from "@/lib/messageSourceTracker";

const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
const allSources = getAllMessageSources();

const newUsers = allSources.filter(
  source => source.type === "user" && source.discoveredAt > oneHourAgo
);

console.log(`${newUsers.length} new users in the last hour`);
```

### 5. Most Active Groups

```typescript
import { getMessageSourcesByType } from "@/lib/messageSourceTracker";

const groups = getMessageSourcesByType("group");
const sorted = groups.sort((a, b) => b.messageCount - a.messageCount);

console.log("Most active groups:");
sorted.slice(0, 5).forEach((group, i) => {
  console.log(`${i + 1}. ${group.id}: ${group.messageCount} messages`);
});
```

---

## How It Works Behind the Scenes

### 1. Webhook Event Arrives

```
LINE sends webhook to /api/line/webhook
Event includes:
{
  "source": {
    "type": "user",  // or "group", "room"
    "userId": "Uab12345..."
  },
  "message": {
    "type": "text",
    "text": "Hello"
  }
}
```

### 2. Target Extracted & Recorded

```typescript
// In webhook handler
const target = extractTargetFromEvent(event);
recordMessageSource(target.id);  // Store in-memory tracker
```

### 3. Targets Available via API

```bash
curl /api/line/targets
# Returns all discovered targets
```

### 4. Send to Specific Target

```bash
curl -X POST /api/line/send-to-target \
  -d '{"targetId": "Uab12345...", "message": "Hi!"}'
```

---

## ID Format Reference

Every LINE ID has a specific format based on type:

| Type | Prefix | Example | Meaning |
|------|--------|---------|---------|
| User | U | Uab1234...5678 | Individual user |
| Group | C | Cab1234...5678 | Group conversation |
| Room | R | Rab1234...5678 | Room conversation |

### How to Identify:

```typescript
// Check the first character
if (id[0] === 'U') console.log("User");
if (id[0] === 'C') console.log("Group");
if (id[0] === 'R') console.log("Room");

// Or use the utility
getTargetTypeFromId(id) // Returns type
```

### Typical Length:
- All LINE IDs are 33+ characters
- Format: 1 character prefix + 32 alphanumeric characters

---

## Testing

### Test with cURL

```bash
# 1. Get all targets (none discovered yet)
curl http://localhost:3000/api/line/targets

# 2. Send a test message from LINE or webhook test tool

# 3. Get targets again (should show discovered targets)
curl http://localhost:3000/api/line/targets

# 4. Get statistics
curl http://localhost:3000/api/line/targets/stats

# 5. Send to discovered target
curl -X POST http://localhost:3000/api/line/send-to-target \
  -H "Content-Type: application/json" \
  -d '{"targetId": "DISCOVERED_ID", "message": "Test!"}'
```

### Test with ngrok (Webhook)

```bash
# 1. Start tunnel
ngrok http 3000

# 2. Configure webhook in LINE console
# https://your-ngrok-url/api/webhook

# 3. Send messages from different LINE users/groups

# 4. Check discovered targets
curl http://localhost:3000/api/line/targets

# 5. Send to specific target
curl -X POST http://localhost:3000/api/line/send-to-target \
  -H "Content-Type: application/json" \
  -d '{"targetId": "DISCOVERED_ID", "message": "Hello from webhook!"}'
```

---

## Important Notes

### ⚠️ CRITICAL: LINE Privacy Rules

**You CANNOT send push messages to users that haven't previously interacted with your OA.**

This is a LINE privacy restriction:

```
User sends message to your OA
  ↓
Their ID is captured (Uab1234...)
  ↓
✅ You can NOW push messages to them
  ↓
But ONLY while they're following your OA
```

**What this means:**
- ✅ Save discovered user IDs in database
- ✅ Use them in `pushTextMessage()` calls
- ❌ Don't try to send to IDs you haven't discovered via webhook
- ❌ Can't import lists of user IDs and message them
- ⚠️ User must have actively messaged your OA first

**Why:** LINE prevents spam by blocking unsolicited push messages to silent users.

---

### In-Memory Storage

Currently, discovered targets are stored in-memory and will be:
- ✅ Available while server is running
- ❌ Lost when server restarts/redeploys
- ❌ Not shared across server instances

### For Production

Consider:
1. **Save targets to database** (persistent storage)
2. **Export/import targets periodically** (backup)
3. **Use `/api/line/targets/stats` to monitor** discovery
4. **Respect LINE privacy rules** (only message interactive users)

### Max Targets Tracked

Currently tracks up to **100 sources** in-memory. When exceeded, oldest discovery is removed.

---

## Examples

### Example 1: Display All Users in Chat UI

```typescript
// app/api/line/users/route.ts
export async function GET() {
  const targets = getAllMessageSources().filter(t => t.type === "user");
  
  return NextResponse.json({
    success: true,
    data: {
      users: targets.map(t => ({
        id: t.id,
        messageCount: t.messageCount,
        lastMessage: t.lastMessageAt
      }))
    }
  });
}
```

### Example 2: Broadcast Message

```typescript
// app/api/line/broadcast/route.ts
export async function POST(request: Request) {
  const { message } = await request.json();
  const groups = getMessageSourcesByType("group");
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  
  const results = await Promise.all(
    groups.map(group =>
      pushTextMessage({
        channelAccessToken: token,
        to: group.id,
        text: message
      })
    )
  );
  
  const successful = results.filter(r => r.ok).length;
  
  return NextResponse.json({
    success: true,
    sent: successful,
    total: groups.length
  });
}
```

### Example 3: Analytics Dashboard API

```typescript
// app/api/line/analytics/route.ts
export async function GET() {
  const stats = getMessageSourceStats();
  
  return NextResponse.json({
    success: true,
    data: {
      activeUsers: stats.users,
      activeGroups: stats.groups,
      activeRooms: stats.rooms,
      totalInteractions: stats.totalMessages,
      engagement: {
        avgMessagesPerUser: (
          stats.totalMessages / (stats.users || 1)
        ).toFixed(2),
        topType:
          stats.users > stats.groups && stats.users > stats.rooms ? "user" : null
      }
    }
  });
}
```

---

## Common Issues

### "Invalid LINE ID format"

**Cause:** ID doesn't match LINE format (must start with U, C, or R)

**Fix:** Verify the ID with `isValidLineId()` before sending

```typescript
if (!isValidLineId(id)) {
  console.error("Invalid ID:", id);
  return;
}
```

### Targets Not Being Discovered

**Cause:** Webhook not enabled or not receiving events

**Check:**
1. Webhook URL is correct in LINE console
2. Webhook verification passed
3. "Use webhook" is enabled
4. Events are being sent (check server logs)

### Only One Target Discovered

**Cause:** Messages always from same user/group

**Solution:** Test with multiple LINE accounts or groups

---

## Next Steps

1. **Deploy** the new endpoints
2. **Send a message** to your bot from LINE
3. **Check targets** endpoint: `GET /api/line/targets`
4. **Send to target** using discovered ID: `POST /api/line/send-to-target`
5. **Build features** using the target tracking

---

## Reference

- **Utility Files:**
  - `lib/lineTargetId.ts` - ID parsing and validation
  - `lib/messageSourceTracker.ts` - Source tracking

- **API Endpoints:**
  - `GET /api/line/targets` - Get all targets
  - `GET /api/line/targets/stats` - Get statistics
  - `POST /api/line/send-to-target` - Send to specific target

- **Types:**
  - `LineTargetType` - Type of target
  - `LineTargetInfo` - Target information
  - `MessageSource` - Tracked message source
