# API Testing Examples

This file contains ready-to-use examples for testing the LINE Webchat API.

## Table of Contents

1. [cURL Examples](#curl-examples)
2. [JavaScript Examples](#javascript-examples)
3. [Python Examples](#python-examples)
4. [Testing Webhook Locally](#testing-webhook-locally)
5. [Target Discovery Examples ✨ (NEW)](#target-discovery-examples--new)

---

## cURL Examples

### Get All Messages

```bash
curl http://localhost:3000/api/messages
```

**With pretty JSON output:**

```bash
curl http://localhost:3000/api/messages | jq .
```

**With response headers:**

```bash
curl -i http://localhost:3000/api/messages
```

---

### Send a Simple Message

```bash
curl -X POST http://localhost:3000/api/send-message \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello from cURL!"}'
```

---

### Send a Message with Variables

```bash
MESSAGE="My test message"

curl -X POST http://localhost:3000/api/send-message \
  -H "Content-Type: application/json" \
  -d "{\"message\": \"$MESSAGE\"}"
```

---

### Send a Multi-line Message

```bash
curl -X POST http://localhost:3000/api/send-message \
  -H "Content-Type: application/json" \
  -d '{"message": "Line 1\nLine 2\nLine 3"}'
```

---

### Send a Message with Special Characters

```bash
curl -X POST http://localhost:3000/api/send-message \
  -H "Content-Type: application/json" \
  -d '{"message": "Test with emoji: 🎉 and symbols: @#$%"}'
```

---

### Test Error Handling - Empty Message

```bash
curl -X POST http://localhost:3000/api/send-message \
  -H "Content-Type: application/json" \
  -d '{"message": ""}'
```

Expected response (400):
```json
{
  "success": false,
  "error": "Message is required"
}
```

---

### Test Error Handling - Invalid JSON

```bash
curl -X POST http://localhost:3000/api/send-message \
  -H "Content-Type: application/json" \
  -d '{invalid json}'
```

Expected response (400):
```json
{
  "success": false,
  "error": "Invalid request body"
}
```

---

### Test Error Handling - Missing Content-Type

```bash
curl -X POST http://localhost:3000/api/send-message \
  -d '{"message": "Test"}'
```

Expected response (400 or 500 depending on parser)

---

### Save Response to File

```bash
curl http://localhost:3000/api/messages > messages.json
```

---

### Load Message from File

```bash
curl -X POST http://localhost:3000/api/send-message \
  -H "Content-Type: application/json" \
  -d @message.json
```

Where `message.json` contains:
```json
{
  "message": "Message from file"
}
```

---

### Test with Different Domains

**Local:**
```bash
curl http://localhost:3000/api/messages
```

**Production:**
```bash
curl https://your-project.vercel.app/api/messages
```

---

## JavaScript Examples

### Send Message (Async/Await)

```javascript
async function sendMessage(text) {
  try {
    const response = await fetch('/api/send-message', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message: text }),
    });

    const data = await response.json();
    
    if (data.success) {
      console.log('✓ Message sent successfully');
      return true;
    } else {
      console.error('✗ Error:', data.error);
      return false;
    }
  } catch (error) {
    console.error('✗ Network error:', error);
    return false;
  }
}

// Usage
sendMessage('Hello from JavaScript!');
```

---

### Get All Messages

```javascript
async function getMessages() {
  try {
    const response = await fetch('/api/messages');
    const data = await response.json();
    
    if (data.success) {
      console.log('Messages:', data.data.messages);
      return data.data.messages;
    } else {
      console.error('Error:', data.error);
      return [];
    }
  } catch (error) {
    console.error('Network error:', error);
    return [];
  }
}

// Usage
const messages = await getMessages();
console.log(`Found ${messages.length} messages`);
```

---

### Poll Messages Periodically

```javascript
function startPolling(intervalMs = 3000) {
  setInterval(async () => {
    const messages = await getMessages();
    console.log(`[${new Date().toLocaleTimeString()}] Got ${messages.length} messages`);
  }, intervalMs);
}

// Usage
startPolling(3000); // Poll every 3 seconds
```

---

### Send Multiple Messages in Sequence

```javascript
async function sendMessages(messageList) {
  for (const message of messageList) {
    console.log(`Sending: "${message}"`);
    await sendMessage(message);
    
    // Wait 1 second between messages
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  console.log('All messages sent!');
}

// Usage
sendMessages([
  'First message',
  'Second message',
  'Third message',
]);
```

---

### Send Message with Error Handling

```javascript
async function sendMessageWithRetry(text, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch('/api/send-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      });

      const data = await response.json();
      
      if (data.success) {
        console.log(`✓ Success on attempt ${attempt}`);
        return true;
      }
      
      if (response.status === 400) {
        // Don't retry 4xx errors
        console.error(`✗ Client error: ${data.error}`);
        return false;
      }
    } catch (error) {
      console.error(`✗ Attempt ${attempt} failed:`, error);
      
      if (attempt < maxRetries) {
        const delayMs = Math.pow(2, attempt) * 1000; // Exponential backoff
        console.log(`  Retrying in ${delayMs}ms...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  }
  
  console.error(`✗ Failed after ${maxRetries} attempts`);
  return false;
}

// Usage
sendMessageWithRetry('Hello with retry!');
```

---

### Display Messages in Real-time

```javascript
let lastMessageCount = 0;

async function displayNewMessages() {
  const messages = await getMessages();
  
  if (messages.length > lastMessageCount) {
    console.log(`\n📨 New message(s) received:\n`);
    
    messages.slice(lastMessageCount).forEach(msg => {
      const sender = msg.sender === 'me' ? '👤 You' : '🤖 LINE';
      console.log(`${sender}: ${msg.text}`);
      console.log(`  at ${new Date(msg.createdAt).toLocaleString()}\n`);
    });
    
    lastMessageCount = messages.length;
  }
}

// Poll every 2 seconds
setInterval(displayNewMessages, 2000);
```

---

### Filter Messages by Sender

```javascript
async function getMessagesBySender(sender) {
  const messages = await getMessages();
  return messages.filter(msg => msg.sender === sender);
}

// Usage
const myMessages = await getMessagesBySender('me');
const lineMessages = await getMessagesBySender('line');

console.log(`You sent ${myMessages.length} messages`);
console.log(`LINE sent ${lineMessages.length} messages`);
```

---

### Search Messages

```javascript
async function searchMessages(query) {
  const messages = await getMessages();
  return messages.filter(msg =>
    msg.text.toLowerCase().includes(query.toLowerCase())
  );
}

// Usage
const results = await searchMessages('hello');
console.log(`Found ${results.length} messages containing "hello"`);
results.forEach(msg => console.log(msg.text));
```

---

## Python Examples

### Send a Message

```python
import requests
import json

def send_message(text):
    url = "http://localhost:3000/api/send-message"
    headers = {"Content-Type": "application/json"}
    data = {"message": text}
    
    response = requests.post(url, headers=headers, json=data)
    result = response.json()
    
    if result.get("success"):
        print("✓ Message sent successfully")
        return True
    else:
        print(f"✗ Error: {result.get('error')}")
        return False

# Usage
send_message("Hello from Python!")
```

---

### Get All Messages

```python
import requests

def get_messages():
    url = "http://localhost:3000/api/messages"
    response = requests.get(url)
    data = response.json()
    
    if data.get("success"):
        messages = data.get("data", {}).get("messages", [])
        return messages
    else:
        print(f"Error: {data.get('error')}")
        return []

# Usage
messages = get_messages()
print(f"Found {len(messages)} messages")
for msg in messages:
    print(f"{msg['sender']}: {msg['text']}")
```

---

### Poll Messages Periodically

```python
import requests
import time
from datetime import datetime

def poll_messages(interval=3):
    while True:
        messages = get_messages()
        timestamp = datetime.now().strftime("%H:%M:%S")
        print(f"[{timestamp}] Got {len(messages)} messages")
        time.sleep(interval)

# Usage
# poll_messages(3)  # Poll every 3 seconds
```

---

### Batch Send Messages

```python
def send_messages_batch(message_list):
    for i, message in enumerate(message_list, 1):
        print(f"[{i}/{len(message_list)}] Sending: {message}")
        send_message(message)
        time.sleep(1)  # Wait 1 second between messages
    
    print("✓ All messages sent!")

# Usage
messages = [
    "First message",
    "Second message",
    "Third message",
]
send_messages_batch(messages)
```

---

### Send with Error Handling and Retry

```python
import requests
import time

def send_message_with_retry(text, max_retries=3, backoff_factor=2):
    url = "http://localhost:3000/api/send-message"
    headers = {"Content-Type": "application/json"}
    data = {"message": text}
    
    for attempt in range(1, max_retries + 1):
        try:
            response = requests.post(url, headers=headers, json=data, timeout=5)
            result = response.json()
            
            if result.get("success"):
                print(f"✓ Success on attempt {attempt}")
                return True
            
            if response.status_code == 400:
                print(f"✗ Client error: {result.get('error')}")
                return False
        
        except requests.exceptions.RequestException as e:
            print(f"✗ Attempt {attempt} failed: {e}")
            
            if attempt < max_retries:
                delay = backoff_factor ** attempt
                print(f"  Retrying in {delay}s...")
                time.sleep(delay)
    
    print(f"✗ Failed after {max_retries} attempts")
    return False

# Usage
send_message_with_retry("Hello with retry!")
```

---

## Testing Webhook Locally

### Using ngrok

```bash
# 1. Install ngrok (if not already installed)
npm install -g ngrok

# 2. Start your local dev server
npm run dev

# 3. In another terminal, create tunnel
ngrok http 3000

# 4. Copy the forwarding URL (e.g., https://abc123.ngrok.io)

# 5. Set webhook URL in LINE console to:
#    https://abc123.ngrok.io/api/webhook
```

---

### Test Webhook with cURL

```bash
# 1. Get your tunnel URL
TUNNEL_URL="https://abc123.ngrok.io"

# 2. Create a test webhook payload
PAYLOAD='{
  "destination": "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "events": [
    {
      "replyToken": "test-reply-token",
      "type": "message",
      "timestamp": 1462629479859,
      "source": {
        "type": "user",
        "userId": "Uab12345678abcdef1234567890abcd"
      },
      "message": {
        "type": "text",
        "id": "100001",
        "text": "Test message"
      }
    }
  ]
}'

# 3. Send webhook manually (note: signature verification will fail in this simple example)
curl -X POST "$TUNNEL_URL/api/webhook" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD"

# Note: This will likely return "Invalid signature" because we're not computing
# the correct HMAC-SHA256 signature. For proper testing, use LINE's webhook test tool.
```

---

### Using LINE's Webhook Test Tool

Best way to test webhook:

1. Go to [LINE Developers Console](https://developers.line.biz/console/)
2. Select your channel > **Messaging API**
3. Scroll to **Webhook** section
4. Click **Test** button
5. LINE sends a properly signed test event
6. View response in console

---

## Integration Test Script

A complete test script combining multiple tests:

```javascript
async function runIntegrationTests() {
  console.log('🧪 Starting integration tests...\n');
  
  // Test 1: Get initial message count
  console.log('Test 1: Getting initial messages...');
  let messages = await getMessages();
  console.log(`✓ Found ${messages.length} messages\n`);
  
  // Test 2: Send a message
  console.log('Test 2: Sending a test message...');
  const testMessage = `Test message at ${new Date().toLocaleTimeString()}`;
  const sent = await sendMessage(testMessage);
  console.log(sent ? '✓ Message sent\n' : '✗ Failed to send\n');
  
  // Test 3: Verify message was stored
  console.log('Test 3: Verifying message was stored...');
  const updatedMessages = await getMessages();
  const found = updatedMessages.some(m => m.text === testMessage);
  console.log(found ? '✓ Message found in storage\n' : '✗ Message not found\n');
  
  // Test 4: Test error handling
  console.log('Test 4: Testing error handling with empty message...');
  const response = await fetch('/api/send-message', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: '' }),
  });
  const result = await response.json();
  console.log(result.success ? '✗ Should have failed\n' : '✓ Correctly rejected\n');
  
  console.log('✅ Integration tests complete!');
}

// Run tests
runIntegrationTests();
```

---

## Performance Testing

Test API performance:

```javascript
async function performanceTest(messageCount = 10) {
  console.log(`📊 Performance Test: Sending ${messageCount} messages\n`);
  
  const startTime = Date.now();
  
  for (let i = 1; i <= messageCount; i++) {
    const msg = `Performance test message ${i}`;
    await sendMessage(msg);
    console.log(`  Sent ${i}/${messageCount}`);
  }
  
  const endTime = Date.now();
  const totalTime = endTime - startTime;
  const avgTime = totalTime / messageCount;
  
  console.log(`\n📈 Results:`);
  console.log(`  Total time: ${totalTime}ms`);
  console.log(`  Avg per message: ${avgTime.toFixed(2)}ms`);
  console.log(`  Messages/second: ${(1000 / avgTime).toFixed(2)}`);
}

// Run test
performanceTest(10);
```

---

## Target Discovery Examples ✨ (NEW)

### cURL Examples

#### Get All Discovered Targets

```bash
curl http://localhost:3000/api/line/targets
```

**With formatting:**
```bash
curl http://localhost:3000/api/line/targets | jq '.data'
```

---

#### Get Target Statistics

All targets:
```bash
curl http://localhost:3000/api/line/targets/stats
```

Users only:
```bash
curl "http://localhost:3000/api/line/targets/stats?type=user"
```

Groups only:
```bash
curl "http://localhost:3000/api/line/targets/stats?type=group"
```

---

#### Send Message to Specific Target

```bash
curl -X POST http://localhost:3000/api/line/send-to-target \
  -H "Content-Type: application/json" \
  -d '{
    "targetId": "Uab1234567890abcdef1234567890abcd",
    "message": "Hello, specific user!"
  }'
```

---

### JavaScript Examples

#### Get and Display All Targets

```javascript
// Fetch and display targets
async function displayTargets() {
  const response = await fetch('/api/line/targets');
  const data = await response.json();
  
  if (!data.success) {
    console.error('Failed to fetch targets');
    return;
  }
  
  const { configured, discovered, stats } = data.data;
  
  console.log('\n📍 Configured Target:');
  console.log(`  ID: ${configured.id}`);
  console.log(`  Type: ${configured.type}`);
  console.log(`  Valid: ${configured.isValid}`);
  
  console.log('\n📊 Discovered Targets:');
  discovered.forEach((target, i) => {
    console.log(`  ${i + 1}. ${target.type}: ${target.id}`);
    console.log(`     Messages: ${target.messageCount}`);
    console.log(`     Last: ${target.lastMessageAt}`);
  });
  
  console.log('\n📈 Statistics:');
  console.log(`  Total: ${stats.total}`);
  console.log(`  Users: ${stats.users}, Groups: ${stats.groups}, Rooms: ${stats.rooms}`);
  console.log(`  Total Messages: ${stats.totalMessages}`);
}

// Usage
displayTargets();
```

---

#### Get Statistics by Type

```javascript
// Fetch statistics
async function getStats(type = null) {
  const url = new URL('/api/line/targets/stats', window.location.origin);
  if (type) url.searchParams.set('type', type);
  
  const response = await fetch(url);
  const data = await response.json();
  
  return data.data;
}

// Get all stats
console.log(await getStats());

// Get only user stats
const userStats = await getStats('user');
console.log(`Users: ${userStats.count}, Messages: ${userStats.messageCount}`);

// Get only group stats
const groupStats = await getStats('group');
console.log(`Groups: ${groupStats.count}, Messages: ${groupStats.messageCount}`);
```

---

#### Send to Specific Target

```javascript
// Send message to specific target
async function sendToTarget(targetId, message) {
  const response = await fetch('/api/line/send-to-target', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ targetId, message })
  });
  
  const result = await response.json();
  
  if (result.success) {
    console.log(`✅ Sent to ${result.data.targetType}: ${targetId}`);
  } else {
    console.error(`❌ Failed: ${result.error}`);
  }
  
  return result;
}

// Usage
await sendToTarget('Uab1234567890abcdef1234567890abcd', 'Hello!');
```

---

⚠️ **IMPORTANT: LINE Privacy Rules**

You can **only** send push messages to users/groups/rooms that have **previously messaged your OA**. LINE blocks unsolicited messages to protect user privacy.

```javascript
// ✅ CORRECT: Broadcast only to users who messaged you
const targets = getMessageSourcesByType('user'); // From webhooks only
targets.forEach(user => sendToTarget(user.id, 'Your response'));

// ❌ WRONG: Trying to message users who never interacted with you
const randomUserId = 'Uab1234567890abcdef1234567890abcd';
sendToTarget(randomUserId, 'This will be blocked'); // LINE rejects this
```

---

#### Broadcast to All Users

```javascript
// Broadcast message to discovered users (those who messaged you)
async function broadcastToUsers(message) {
  const targetsResponse = await fetch('/api/line/targets');
  const targetsData = await targetsResponse.json();
  
  // Only discovered users - those who have messaged your OA
  const users = targetsData.data.discovered.filter(t => t.type === 'user');
  
  console.log(`📢 Broadcasting to ${users.length} users...`);
  
  const results = await Promise.all(
    users.map(user =>
      fetch('/api/line/send-to-target', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetId: user.id,
          message
        })
      }).then(r => r.json())
    )
  );
  
  const successful = results.filter(r => r.success).length;
  console.log(`✅ Sent to ${successful}/${users.length} users`);
  
  return results;
}

// Usage
await broadcastToUsers('New feature released!');
```

---

#### Most Active Targets

```javascript
// Find and display most active targets
async function getMostActive(limit = 5) {
  const targetsResponse = await fetch('/api/line/targets');
  const targetsData = await targetsResponse.json();
  
  const sorted = targetsData.data.discovered
    .sort((a, b) => b.messageCount - a.messageCount)
    .slice(0, limit);
  
  console.log(`\n🏆 Top ${limit} Most Active:`);
  sorted.forEach((target, i) => {
    const type = target.type[0].toUpperCase() + target.type.slice(1);
    console.log(`  ${i + 1}. ${type}: ${target.messageCount} messages`);
  });
  
  return sorted;
}

// Usage
await getMostActive(10);
```

---

### Python Examples

#### Get All Targets

```python
import requests
import json

def get_all_targets():
    response = requests.get('http://localhost:3000/api/line/targets')
    data = response.json()
    
    if not data['success']:
        print('Failed to fetch targets')
        return None
    
    configs = data['data']
    print(f"\n📍 Configured: {configs['configured']['id']}")
    print(f"\n📊 Discovered ({len(configs['discovered'])} total):")
    
    for target in configs['discovered']:
        print(f"  - {target['type']}: {target['messageCount']} messages")
    
    return data['data']

# Usage
get_all_targets()
```

---

#### Get Statistics by Type

```python
import requests

def get_stats(target_type=None):
    url = 'http://localhost:3000/api/line/targets/stats'
    params = {}
    
    if target_type:
        params['type'] = target_type
    
    response = requests.get(url, params=params)
    data = response.json()
    
    return data['data']

# Get all stats
all_stats = get_stats()
print(f"Total targets: {all_stats['total']}")
print(f"Users: {all_stats['users']}, Groups: {all_stats['groups']}")

# Get user stats
user_stats = get_stats('user')
print(f"Users with stats: {user_stats['count']}")
```

---

#### Send to Specific Target

```python
import requests

def send_to_target(target_id, message):
    url = 'http://localhost:3000/api/line/send-to-target'
    payload = {
        'targetId': target_id,
        'message': message
    }
    
    response = requests.post(url, json=payload)
    result = response.json()
    
    if result['success']:
        print(f"✅ Sent to {result['data']['targetType']}")
    else:
        print(f"❌ Failed: {result['error']}")
    
    return result

# Usage
send_to_target('Uab1234567890abcdef1234567890abcd', 'Hello!')
```

---

#### Broadcast to All Groups

```python
import requests
import time

def broadcast_to_groups(message):
    # Get all targets
    targets_response = requests.get('http://localhost:3000/api/line/targets')
    targets_data = targets_response.json()
    
    # Filter for groups
    groups = [t for t in targets_data['data']['discovered'] if t['type'] == 'group']
    
    print(f"📢 Broadcasting to {len(groups)} groups...")
    
    results = []
    for group in groups:
        result = send_to_target(group['id'], message)
        results.append(result)
        time.sleep(0.1)  # Rate limiting
    
    successful = sum(1 for r in results if r['success'])
    print(f"✅ Sent to {successful}/{len(groups)} groups")
    
    return results

# Usage
broadcast_to_groups('Important announcement!')
```

---

#### Analytics Dashboard

```python
import requests
from datetime import datetime

def print_analytics():
    # Get target list
    targets_response = requests.get('http://localhost:3000/api/line/targets')
    targets_data = targets_response.json()
    
    # Get statistics
    stats_response = requests.get('http://localhost:3000/api/line/targets/stats')
    stats_data = stats_response.json()
    
    config = targets_data['data']
    stats = stats_data['data']
    
    # Display dashboard
    print("\n" + "="*50)
    print("  LINE BOT ANALYTICS DASHBOARD")
    print("="*50)
    
    print(f"\n📊 Overview:")
    print(f"  Total Targets: {stats['total']}")
    print(f"  Total Messages: {stats['totalMessages']}")
    print(f"  Avg/Target: {stats['avgMessagesPerTarget']:.2f}")
    
    print(f"\n👥 Breakdown:")
    print(f"  Users: {stats['users']}")
    print(f"  Groups: {stats['groups']}")
    print(f"  Rooms: {stats['rooms']}")
    
    # Find most active
    if config['discovered']:
        top = sorted(config['discovered'], 
                    key=lambda x: x['messageCount'], 
                    reverse=True)[0]
        print(f"\n🏆 Most Active ({top['type']}):")
        print(f"  {top['messageCount']} messages")
    
    print("\n" + "="*50 + "\n")

# Usage
print_analytics()
```

---

## Load Test: Broadcast to All Users

```bash
# JavaScript version
node -e "
const users = [
  'Uab1234567890abcdef1234567890abcd',
  'Uab1234567890abcdef1234567890abce',
  'Uab1234567890abcdef1234567890abcf'
];

Promise.all(
  users.map(uid => 
    fetch('/api/line/send-to-target', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({targetId: uid, message: 'Test'})
    }).then(r => r.json())
  )
).then(results => {
  console.log(\`Sent: \${results.filter(r => r.success).length}/\${users.length}\`);
});
"
```

---

## Summary

- **Target Discovery**: Automatically find user/group/room IDs from webhook events
- **Broadcasting**: Send messages to multiple targets efficiently
- **Analytics**: Track engagement and activity metrics
- **Dynamic Targeting**: No need to manually configure target IDs

For complete documentation, see [LINE_TARGET_DISCOVERY.md](./LINE_TARGET_DISCOVERY.md).


