# Target Discovery Feature Overview

## What is Target Discovery?

A new automatic system that discovers and tracks all LINE users, groups, and rooms that send messages to your bot. No more manual configuration of target IDs!

---

## The Problem It Solves

### Before Target Discovery ❌
```env
# You had to manually add this to .env
LINE_TARGET_USER_ID=Uab1234567890abcdef1234567890abcd

# And if multiple users messaged you, you had to:
# 1. Manually get each ID from LINE console webhook test
# 2. Update the config
# 3. Restart the server
# 4. Only one target ID was supported
```

### After Target Discovery ✅
```typescript
// Automatically discover all targets
GET /api/line/targets
// Returns: All users/groups/rooms that have ever messaged you

// Send to any discovered target
POST /api/line/send-to-target
{ "targetId": "...", "message": "Hello!" }

// Get statistics
GET /api/line/targets/stats?type=group
// Returns: All groups and their message counts
```

---

## How It Works

### 1. **Automatic Discovery**
Every time someone sends a message via webhook, their target ID is automatically extracted and tracked.

```
Webhook Event (from LINE)
     ↓
Extract target from event.source.userId/groupId/roomId
     ↓
Record in messageSourceTracker (in-memory)
     ↓
Target now available via /api/line/targets
```

### 2. **Three Types of Targets**

| Type | Prefix | Example | Use Case |
|------|--------|---------|----------|
| User | `U` | `Uab12...` | Individual users |
| Group | `C` | `Cab12...` | Group chats |
| Room | `R` | `Rab12...` | Multi-person rooms |

### 3. **Real-Time Synchronization**

- Targets discovered instantly when messages arrive
- No database queries needed
- Available immediately via API
- Statistics updated in real-time

---

## Key Features

### 1. **Automatic Discovery**
```bash
# Users send messages → automatically tracked
# You don't need to do anything
curl /api/line/targets  # See all targets
```

### 2. **Type-Safe Validation**
```javascript
// Every target is validated
isValidLineId("Uab1234567890abcdef1234567890abcd")  // ✅ true
isValidLineId("invalidid")                           // ❌ false

// Determine type automatically
getTargetTypeFromId("Uab...")  // "user"
getTargetTypeFromId("Cab...")  // "group"
getTargetTypeFromId("Rab...")  // "room"
```

### 3. **Three Query APIs**

#### GET /api/line/targets
Get all configured and discovered targets.

**Response:**
```json
{
  "configured": { "id": "Uab...", "type": "user", "isValid": true },
  "discovered": [
    { "id": "Cab...", "type": "group", "messageCount": 5 }
  ],
  "stats": { "total": 2, "users": 1, "groups": 1, "rooms": 0 }
}
```

#### GET /api/line/targets/stats
Get detailed statistics with optional filtering.

**Query params:**
```bash
# No filter: all stats
/api/line/targets/stats

# Filter by type
/api/line/targets/stats?type=user
/api/line/targets/stats?type=group
/api/line/targets/stats?type=room
```

**Response:**
```json
{
  "total": 10,
  "users": 8,
  "groups": 1,
  "rooms": 1,
  "totalMessages": 42,
  "avgMessagesPerTarget": 4.2
}
```

#### POST /api/line/send-to-target
Send message to a specific target.

**Request:**
```bash
curl -X POST /api/line/send-to-target \
  -d '{"targetId": "Uab...", "message": "Hello!"}'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Hello!",
    "targetId": "Uab...",
    "targetType": "User",
    "wasDiscovered": true
  }
}
```

---

## Implementation Details

### Library Files

#### `lib/lineTargetId.ts` (250+ lines)
Utilities for working with LINE target IDs.

**Exports:**
- `extractTargetFromEvent()` - Get target from webhook event
- `getTargetTypeFromId()` - Determine type by ID prefix
- `isValidLineId()` - Validate format
- `getTargetTypeLabel()` - Human-readable type
- `formatTargetId()` - Format for display

#### `lib/messageSourceTracker.ts` (200+ lines)
In-memory tracker for discovered targets.

**Exports:**
- `recordMessageSource()` - Track when someone messages
- `getAllMessageSources()` - Get all targets
- `getMessageSourcesByType()` - Filter by user/group/room
- `getMessageSourceStats()` - Get statistics
- `exportMessageSources()` - Backup to JSON
- `importMessageSources()` - Restore from JSON

### API Routes

#### `app/api/line/targets/route.ts`
GET endpoint returning all targets.

#### `app/api/line/targets/stats/route.ts`
GET endpoint with stats and optional filtering.

#### `app/api/line/send-to-target/route.ts`
POST endpoint for sending to specific targets.

### Modified Files

#### `app/api/line/webhook/route.ts`
Added automatic source tracking:
```typescript
body.events.forEach((event) => {
  const target = extractTargetFromEvent(event);
  if (target.id && target.type) {
    recordMessageSource(target.id);  // Auto-discover
  }
});
```

#### `lib/types.ts`
Added new TypeScript interfaces:
```typescript
interface LineTarget {
  id: string;
  type: "user" | "group" | "room" | null;
  isValid: boolean;
}

interface SendToTargetRequestBody {
  targetId: string;
  message: string;
}
```

---

## Use Cases

### 1. **User Support System**
```javascript
// Get all users who've contacted support
const users = await getMessageSourcesByType("user");
// Send them updates: users.map(u => sendToTarget(u.id, message))
```

### 2. **Group Announcements**
```javascript
// Broadcast to all groups
const groups = await getMessageSourcesByType("group");
// Send announcement: groups.map(g => sendToTarget(g.id, message))
```

### 3. **Customer Engagement Analytics**
```javascript
// Track which groups are most active
const stats = await getMessageSourceStats("group");
// Show: total groups, avg messages per group, etc.
```

### 4. **Targeted Notifications**
```javascript
// Send only to active users (>5 messages)
const sources = await getAllMessageSources();
const active = sources.filter(s => s.messageCount > 5);
// Send special offer: active.map(a => sendToTarget(a.id, offer))
```

### 5. **Migration from Static Config**
```javascript
// Old: 1 hardcoded target in .env
// New: Query /api/line/targets for all targets
// Transition: Auto-discover instead of manual config
```

---

## Advantages vs Static Configuration

| Feature | Static Config | Target Discovery |
|---------|---------------|------------------|
| Multiple targets | ❌ 1 target only | ✅ Unlimited |
| No config needed | ❌ Manual setup | ✅ Automatic |
| Real-time | ❌ Restart required | ✅ Instant |
| Type support | ⚠️ Users only | ✅ Users/Groups/Rooms |
| Analytics | ❌ None | ✅ Full stats |
| Broadcasting | ❌ Can't broadcast | ✅ Built-in |

---

## Deployment Checklist

- [ ] Code deployed to production
- [ ] Webhook still receiving events
- [ ] GET /api/line/targets returns data
- [ ] GET /api/line/targets/stats works
- [ ] POST /api/line/send-to-target works
- [ ] Send test message to confirm discovery
- [ ] Verify multiple targets are discovered
- [ ] Test broadcasting to groups

---

## Security Considerations

### ✅ Safe by Default

1. **Target validation** - All IDs validated against LINE format
2. **Webhook signature** - All webhook events verified with HMAC-SHA256
3. **No external access** - In-memory storage, no exposed database
4. **Rate limiting** - Consider adding for production broadcasts

### ⚠️ CRITICAL: LINE Privacy Rules

**Cannot send push messages to users who haven't interacted with your OA.**

Use discovered targets only for users/groups/rooms that:
- ✅ Have sent a message to your OA
- ✅ Are actively following/in your OA
- ❌ NOT for unsolicited broadcasting to random users
- ❌ NOT for importing external user lists

LINE blocks push messages to protect user privacy.

### ⚠️ For Production Deployment

```typescript
// Consider adding rate limiting
const rateLimiter = new Map();

// Track requests per target
function checkRateLimit(targetId: string): boolean {
  const key = `target_${targetId}`;
  const now = Date.now();
  const last = rateLimiter.get(key) || 0;
  
  if (now - last < 1000) return false; // 1 per second
  
  rateLimiter.set(key, now);
  return true;
}
```

---

## Limitations & Future Improvements

### Current Limitations

1. **In-Memory Storage**
   - Max 100 sources tracked
   - Lost on server restart
   - Not shared across instances

2. **No Persistence**
   - No database backup
   - Statistics reset on restart
   - No historical data

3. **Polling for Chat**
   - 3-second polling interval
   - Not truly real-time for incoming messages

### Future Improvements

1. **Database Persistence**
   - PostgreSQL + Prisma
   - Preserve targets across restarts
   - Historical analytics

2. **WebSocket/SSE**
   - Real-time chat updates
   - Eliminate polling
   - Lower latency

3. **Advanced Analytics**
   - Message patterns
   - Retention rates
   - Engagement trends

4. **Scheduled Broadcasting**
   - Queue messages
   - Schedule time-based sends
   - A/B testing support

5. **Rich Messages**
   - Template messages
   - Buttons & quick replies
   - Image/video support

6. **Multi-Workspace**
   - Multiple bots per instance
   - Separate target tracking
   - Isolated user data

---

## Troubleshooting

### Targets Not Appearing

**Problem:** Sent message but target not in `/api/line/targets`

**Solutions:**
1. Verify webhook is receiving events (check server logs)
2. Confirm webhook URL is correct in LINE console
3. Test with LINE test tool to see webhook payload
4. Verify `LINE_CHANNEL_SECRET` is correct

### Invalid Target ID Error

**Problem:** "Invalid LINE ID format"

**Solutions:**
1. Check ID starts with U, C, or R
2. Confirm ID is 33+ characters
3. Copy directly from webhook payload
4. Don't manually construct IDs

### Targets List Empty After Restart

**Problem:** All discovered targets disappeared

**Solution:** This is expected - in-memory storage resets. When users send new messages, they'll be re-discovered. For persistent storage, see [Future Improvements](#future-improvements).

---

## API Reference Summary

### Base URL
```
http://localhost:3000/api/line
```

### Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/targets` | Get all targets + stats |
| GET | `/targets/stats` | Get statistics only |
| POST | `/send-to-target` | Send to specific target |

### Response Format

All endpoints return:
```json
{
  "success": boolean,
  "data": { ... },
  "error": string  // Only if success: false
}
```

---

## Getting Started

### 1. Understand the Feature
- Read this document
- Check [LINE_TARGET_DISCOVERY.md](./LINE_TARGET_DISCOVERY.md)

### 2. Test Locally
- Run `npm run dev`
- Send message from LINE
- Check `/api/line/targets`

### 3. Use in Your App
- See [EXAMPLES.md](./EXAMPLES.md)
- Copy code samples
- Integrate with your UI

### 4. Deploy to Production
- Use Vercel or your host
- Configure webhook
- Test real targets

### 5. Build Features
- Broadcast system
- Analytics dashboard
- Automated responses

---

## Questions?

Check these files:
- **How to use?** → [LINE_TARGET_DISCOVERY.md](./LINE_TARGET_DISCOVERY.md)
- **Code examples?** → [EXAMPLES.md](./EXAMPLES.md)
- **Full API docs?** → [README.md](./README.md#api-documentation)
- **Types?** → [lib/types.ts](./lib/types.ts)
- **Implementation?** → [lib/lineTargetId.ts](./lib/lineTargetId.ts)
