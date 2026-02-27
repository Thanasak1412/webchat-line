# Testing & Troubleshooting Guide

## Testing Locally

### 1. Using Ngrok for Local Webhook Testing

Since LINE needs to call your webhook, you need an HTTPS URL while developing locally.

```bash
# Install ngrok (one-time)
brew install ngrok

# Start ngrok tunnel
ngrok http 3000

# Output will show:
# Forwarding https://abc-123.ngrok-free.app -> http://localhost:3000
```

Use the ngrok URL in your LINE webhook settings:
```
Webhook URL: https://abc-123.ngrok-free.app/api/webhook
```

### 2. Testing Message Flow

**From LINE User to Admin:**

1. Start dev server:
   ```bash
   npm run dev
   ```

2. Open admin UI:
   ```
   http://localhost:3000/chat
   ```

3. Send message to LINE OA from a real LINE account

4. Check admin UI - message should appear:
   - User appears in left sidebar
   - Chat history shows message from LINE

**From Admin to LINE User:**

1. Admin UI has user list (left pane)
2. Click on a user to select
3. Type message in input field
4. Click Send
5. LINE user should receive message on their phone

### 3. Verifying API Endpoints

Use curl to test endpoints:

```bash
# Get list of active users
curl http://localhost:3000/api/messages

# Get messages for specific user
curl "http://localhost:3000/api/messages?userId=U1234567890abcdef"

# Send a message (requires valid userId)
curl -X POST http://localhost:3000/api/send-message \
  -H "Content-Type: application/json" \
  -d '{
    "targetId": "U1234567890abcdef",
    "message": "Hello from admin!"
  }'

# Test webhook (with valid signature)
curl -X POST http://localhost:3000/api/webhook \
  -H "X-Line-Signature: <signature>" \
  -d '{"events": [...]}'
```

### 4. Monitoring with Browser DevTools

**Network Tab:**
- Watch `/api/stream` connection (green = connected)
- Monitor `/api/messages` polling every 3 seconds
- Check `/api/send-message` POST requests

**Console Tab:**
- Look for JavaScript errors
- Check for API error messages
- Verify EventSource connection

**Application Tab:**
- No local storage/cookies needed for basic usage
- SSE/EventSource is read-only from browser

## Troubleshooting

### Problem: No Users in Admin UI

**Symptoms:**
- Left sidebar shows "No users yet"
- User list empty even after LINE user sends message

**Solutions:**

1. **Check webhook configuration:**
   ```bash
   # Verify webhook is set in LINE console
   # Settings → Messaging API → Webhook
   # Should show "Webhook is enabled"
   ```

2. **Verify ngrok tunnel is active:**
   ```bash
   # Check ngrok running
   ngrok status
   
   # You should see forwarding active
   # https://abc-123.ngrok-free.app -> http://localhost:3000
   ```

3. **Check environment variables:**
   ```bash
   # Make sure .env.local has:
   echo $LINE_CHANNEL_ACCESS_TOKEN
   echo $LINE_CHANNEL_SECRET
   ```

4. **Check webhook logs:**
   ```bash
   # In dev server terminal, look for:
   # [LINE Webhook] Received a webhook event
   # [LINE Webhook] Extracted N text message(s)
   ```

5. **Verify LINE user sends text message:**
   - Stickers, images, etc. are ignored
   - Must be a regular text message
   - Check message is received by the OA (check LINE console logs)

---

### Problem: "Failed to send message" / Admin Can't Reply

**Symptoms:**
- Clicking Send shows error
- Message error message appears

**Solutions:**

1. **Check LINE_CHANNEL_ACCESS_TOKEN:**
   ```bash
   # Verify token is correct
   grep LINE_CHANNEL_ACCESS_TOKEN .env.local
   
   # Token should look like: "xxx...xxx" (long string)
   # Get from LINE Developers Console → Channel Access Token
   ```

2. **Check target userId is correct:**
   - Copy userId directly from left sidebar
   - Make sure it starts with "U" (users) or "C"/"R" (groups/rooms)
   - No typos or extra spaces

3. **Check API response:**
   - Open DevTools → Network tab
   - Click Send message
   - Click `send-message` POST request
   - Check Response tab
   - Should see `{ "success": true }`
   - If not, check error message

4. **Check LINE Messaging API status:**
   - Verify Channel Access Token hasn't expired
   - Verify API is enabled for your channel
   - Check LINE service status page

5. **Enable detailed logging:**
   ```typescript
   // In app/api/send-message/route.ts, add:
   console.log("Token:", channelAccessToken?.slice(0, 10) + "...");
   console.log("Target:", targetId);
   console.log("Message:", message);
   ```

---

### Problem: Messages Not Updating In Real-Time

**Symptoms:**
- Messages appear after delay (3+ seconds)
- SSE not connecting / falling back to polling

**Solutions:**

1. **Check SSE connection:**
   - Open DevTools → Network tab → Filter "stream"
   - Should see GET `/api/stream`
   - Status should be 200 (green)
   - Type should be "eventsource"

2. **If SSE not connected:**
   ```bash
   # Check server logs for SSE errors
   # Look for: [SSE] Broadcasting...
   
   # Restart dev server
   Ctrl+C
   npm run dev
   ```

3. **Check network connectivity:**
   - Some office/corporate networks block SSE
   - Some firewalls close long-lived connections
   - Polling fallback (3 seconds) should still work

4. **Browser compatibility:**
   - EventSource works on all modern browsers
   - Check browser console for warnings

5. **Server-side check:**
   - Verify `/api/stream` endpoint exists
   - Check runtime = "nodejs" is set
   - Verify ReadableStream creation

---

### Problem: Webhook Signature Verification Failed

**Symptoms:**
- Webhook response: "Invalid signature"
- Messages from LINE not received

**Solutions:**

1. **Verify channel secret:**
   ```bash
   # Check in .env.local
   grep LINE_CHANNEL_SECRET .env.local
   
   # Should match LINE console exactly
   # Get from: Settings → Messaging API → Channel Secret
   ```

2. **Webhook URL mismatch:**
   - LINE console should have exact URL
   - If using ngrok: https://abc-123.ngrok-free.app/api/webhook
   - No typos or trailing slashes

3. **Test signature verification:**
   ```bash
   # Create test signature
   npm install crypto
   
   # Use crypto to generate HMAC-SHA256
   # Verify it matches X-Line-Signature header
   ```

4. **Check raw body:**
   - Signature is based on exact raw request body
   - Any modification breaks signature
   - Make sure body isn't parsed/modified before verification

---

### Problem: Server Times Out / SSE Connection Hangs

**Symptoms:**
- Network shows `/api/stream` hanging
- Page becomes unresponsive
- Has to reload to fix

**Solutions:**

1. **Check for memory leaks:**
   ```bash
   # Monitor server memory
   npm install --save-dev clinic
   clinic doctor -- npm run dev
   ```

2. **SSE listener cleanup:**
   - Verify listeners cleaned up on disconnect
   - Check request.signal.addEventListener('abort') works
   - Verify unsubscribe() called

3. **TOO MANY LISTENERS warning:**
   ```bash
   # If you see: "MaxListenersExceededWarning"
   # In app/api/stream/route.ts, check:
   # - messageListeners.size shouldn't grow unbounded
   # - cleanup() should remove listeners
   ```

4. **Increase timeout:**
   ```bash
   # For long-lived SSE, may need higher timeout
   # Set in next.config.ts or server config
   api: {
     bodyTimeout: 120000,
     responseLimit: false,
   }
   ```

---

### Problem: "USER_ID not found" or User Not in Dropdown

**Symptoms:**
- User not showing in left sidebar
- Get error when trying to send to them

**Solutions:**

1. **User must send message first:**
   - Users appear when they send at least one message
   - Empty conversation list if no messages yet

2. **Check user ID format:**
   - Should start with "U" for individual users
   - Starts with "C" for group IDs
   - Starts with "R" for room IDs
   - Must be valid format

3. **Multiple webhook calls:**
   - Sometimes events fire multiple times
   - Duplicate user entries normally filtered automatically
   - Safe to ignore if list has duplicates

---

## Advanced Debugging

### Enable All Console Logs

```typescript
// Uncomment debug logs in:
// lib/chatStore.ts - Log all message saves
// app/api/webhook/route.ts - Log webhook processing
// app/api/stream/route.ts - Log SSE connections
```

### Monitor Message Flow

```bash
# Terminal 1: Start dev server with verbose logging
NODE_DEBUG=* npm run dev

# Terminal 2: Send test message
curl -X POST http://localhost:3000/api/webhook \
  -H "X-Line-Signature: test" \
  -d '{"events": [...]}'
```

### Check Message Store State

```typescript
// Add temporary endpoint to inspect state
// GET /api/debug/store
// Returns all users and message counts
```

### Browser Network Inspector

1. Open DevTools → Network tab
2. Send message from admin
3. Watch request/response cycle:
   ```
   POST /api/send-message → 200 OK
   GET /api/stream receives data event
   UI updates with new message
   ```

---

## Unit Testing

### Test API Routes

```typescript
// Example test for /api/send-message
import { POST } from '@/app/api/send-message/route';

test('sends message successfully', async () => {
  const request = new Request('http://localhost:3000', {
    method: 'POST',
    body: JSON.stringify({
      targetId: 'U123',
      message: 'Hello'
    })
  });
  
  const response = await POST(request);
  expect(response.status).toBe(200);
});
```

### Test Store Functions

```typescript
import { appendMessage, getMessages, getActiveUsers } from '@/lib/chatStore';

test('appendMessage saves per user', () => {
  const msg = appendMessage('U123', 'Hello', 'line');
  const messages = getMessages('U123');
  expect(messages).toContain(msg);
});

test('getActiveUsers returns all users', () => {
  appendMessage('U123', 'msg1', 'line');
  appendMessage('U456', 'msg2', 'line');
  expect(getActiveUsers()).toEqual(['U123', 'U456']);
});
```

---

## Performance Testing

### Load Testing SSE

```bash
# Using artillery for load testing
npm install --save-dev artillery

# Test concurrent SSE connections
artillery run sse-load-test.yml
```

### Memory Profiling

```bash
# Using Node Inspector
node --inspect npm start

# Visit chrome://inspect in Chrome
# Profile memory usage during normal operation
```

---

## Getting Help

1. **Check logs:**
   - Server console for [LINE Webhook] and [SSE] logs
   - Browser console for JavaScript errors

2. **Check configuration:**
   - Verify all environment variables
   - Verify LINE console webhook settings
   - Verify ngrok tunnel is active

3. **Check network:**
   - DevTools Network tab
   - Monitor requests/responses
   - Check HTTP status codes

4. **Restart everything:**
   ```bash
   # Kill ngrok
   Ctrl+C (in ngrok terminal)
   
   # Kill dev server
   Ctrl+C (in npm run dev terminal)
   
   # Restart
   ngrok http 3000
   npm run dev
   ```

5. **Debug mode:**
   ```bash
   # More detailed logging
   export DEBUG=*
   npm run dev
   ```

---

## Next Steps

Once everything is working:
1. Set up database for persistence
2. Add admin authentication
3. Deploy to production (Vercel)
4. Set up monitoring/alerting
5. Configure backup strategy
