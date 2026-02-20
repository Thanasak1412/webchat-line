# LINE Webchat - Step-by-Step Setup Guide

This guide walks you through setting up the LINE Webchat application from scratch.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Clone the Repository](#clone-the-repository)
3. [Install Dependencies](#install-dependencies)
4. [Set Up LINE Developer Account](#set-up-line-developer-account)
5. [Configure Environment Variables](#configure-environment-variables)
6. [Test Locally](#test-locally)
7. [Deploy to Vercel](#deploy-to-vercel)
8. [Configure LINE Webhook](#configure-line-webhook)
9. [Test End-to-End](#test-end-to-end)

---

## Prerequisites

- **Node.js** ≥ 18.x ([download](https://nodejs.org/))
- **npm** or **yarn**
- **Git** ([download](https://git-scm.com/))
- **GitHub Account** ([create here](https://github.com/join))
- **Vercel Account** ([signup here](https://vercel.com/signup))
- **LINE Account** ([signup here](https://line.me/))

---

## Clone the Repository

```bash
git clone https://github.com/<your-username>/webchat-line.git
cd webchat-line
```

If this is your first time, fork the repository first:

1. Visit https://github.com/your-repo-url
2. Click **Fork** button
3. Clone your forked repository

---

## Install Dependencies

```bash
npm install
```

This installs:
- Next.js 16.1.6
- React 19.2.3
- Tailwind CSS 4
- TypeScript 5
- ESLint

---

## Set Up LINE Developer Account

### Step 1: Create a LINE Official Account

1. Go to [LINE Official Account Manager](https://manager.line.biz/)
2. Log in with your LINE account (create one if needed)
3. Click **Create** → **Create Official Account**
4. Fill in:
   - **Official Account Name:** Your webchat name (e.g., "Test Chatbot")
   - **Category:** Select appropriate category
   - **Description:** Brief description
5. Accept Terms of Service
6. Verify your account (may require email verification)

**Result:** You now have a LINE Official Account

### Step 2: Create a Messaging API Channel

1. Go to [LINE Developers Console](https://developers.line.biz/console/)
2. Click **Create a new provider** (if you don't have one)
   - Name it (e.g., "My Chatbot Provider")
3. Click **Create a new channel** → **Messaging API**
4. Fill in channel details:
   - **App name:** Your app name
   - **App description:** What your bot does
   - **Category:** Select appropriate category
   - **Icon/Display name:** Upload icon and set display name
5. Accept Terms
6. Complete the creation

**Result:** You now have a Messaging API Channel

### Step 3: Obtain Credentials

You'll need three values. Find them here:

**Channel Access Token:**
1. In Developers Console, go to your channel
2. Navigate to **Messaging API**
3. Find **Channel access token** section
4. Click **Issue** (if not already issued)
5. Copy the entire token (starts with "Channel_")
6. Example: `Channel_abc123def456ghi789jkl000mno`

**Channel Secret:**
1. Still in your channel, go to **Basic settings**
2. Find **Channel secret**
3. Copy the secret code (32 alphanumeric characters)
4. Example: `5a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p`

**Your User ID (for testing):**
1. Add your official account as a friend in LINE
2. Open a chat with your bot account
3. Send any message to it
4. Go back to Developers Console > **Messaging API**
5. Scroll to **Webhook** section
6. Click **Verify** (to test webhook)
7. Check browser console or your app logs
8. Your User ID appears in webhook payload under `events[0].source.userId`
9. It looks like: `Uab1c2d3e4f5g6h7i8j9k0l1m2n3o4p5q`

**Save all three values** - you'll need them in the next step.

---

## Configure Environment Variables

### Create `.env.local`

```bash
cp .env.local.example .env.local
```

### Edit `.env.local`

Open the file in your editor and replace the placeholder values:

```env
LINE_CHANNEL_ACCESS_TOKEN=Channel_abc123def456ghi789jkl000mno
LINE_CHANNEL_SECRET=5a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p
LINE_TARGET_USER_ID=Uab1c2d3e4f5g6h7i8j9k0l1m2n3o4p5q
```

**Important:**
- Keep `.env.local` private (never commit to git)
- The `.gitignore` file already excludes it
- `.env.local.example` is safe to commit

---

## Test Locally

### Start Development Server

```bash
npm run dev
```

Output should show:

```
> next dev

  ▲ Next.js 16.1.6
  - Local:        http://localhost:3000
  - Environments: .env.local

 ✓ Ready in 2.3s
```

### Access the Application

- **Home page:** http://localhost:3000
- **Chat page:** http://localhost:3000/chat

### Test Sending a Message

1. Open http://localhost:3000/chat
2. Type a test message (e.g., "Hello from web")
3. Click **Send** button
4. Verify:
   - Message appears in your chat
   - Message was sent to your LINE OA (open LINE app to see it)
   - No errors in browser console or terminal

### Test Receiving Messages (Optional)

For received message testing without deployment:

1. Use a tunnel tool:
   ```bash
   # Option 1: ngrok (recommended)
   npm install -g ngrok
   ngrok http 3000
   
   # Option 2: LocalTunnel
   npx localtunnel --port 3000
   ```

2. Note the tunnel URL (e.g., `https://abc123.ngrok.io`)

3. Configure in LINE Developers Console:
   - Go to **Messaging API** > **Webhook**
   - Set Webhook URL to: `https://abc123.ngrok.io/api/webhook`
   - Click **Verify**

4. Send a message to your LINE OA from another account
5. Message should appear in your local chat (after 3 seconds)

### Troubleshooting Local Testing

**"Invalid X-Line-Signature header":**
- Ensure `LINE_CHANNEL_SECRET` is correct
- Verify tunnel is working

**"Message is required" error:**
- Check that message input is not empty
- Ensure you're sending valid JSON

**No messages in chat:**
- Check browser DevTools > Network tab
- Verify `/api/messages` endpoint returns data
- Check console for errors

---

## Deploy to Vercel

### Step 1: Push to GitHub

```bash
git add .
git commit -m "Initial LINE webchat commit"
git branch -M main
git remote add origin https://github.com/<your-username>/webchat-line.git
git push -u origin main
```

Replace `<your-username>` with your actual GitHub username.

### Step 2: Create Vercel Project

1. Go to [vercel.com](https://vercel.com)
2. Click **Open Dashboard** (or log in)
3. Click **Add New...** → **Project**
4. Select **Import Git Repository**
5. Paste your GitHub repo URL
6. Click **Import**

### Step 3: Add Environment Variables

In Vercel Dashboard:

1. After importing, you'll see **Configure Project** page
2. Scroll to **Environment Variables**
3. Add three variables (click **Add** for each):

   **Variable 1:**
   - Name: `LINE_CHANNEL_ACCESS_TOKEN`
   - Value: Your channel access token
   - Environments: All environments

   **Variable 2:**
   - Name: `LINE_CHANNEL_SECRET`
   - Value: Your channel secret
   - Environments: All environments

   **Variable 3:**
   - Name: `LINE_TARGET_USER_ID`
   - Value: Your user ID
   - Environments: All environments

4. Click **Deploy**

### Step 4: Wait for Deployment

Vercel builds and deploys your app. You should see:

```
✓ Build successful
✓ Deployments complete
```

Your app is now live! Copy your Vercel domain (e.g., `https://my-webchat.vercel.app`)

### Step 5: Test Deployment

1. Open `https://your-domain.vercel.app/chat`
2. Send a test message
3. Verify it works and message appears in LINE

---

## Configure LINE Webhook

Now that your app is deployed, set up the webhook so your bot can receive messages.

### Step 1: Get Your Webhook URL

Your webhook URL is:
```
https://<your-vercel-domain>/api/webhook
```

Example: `https://my-webchat.vercel.app/api/webhook`

### Step 2: Configure in LINE Developer Console

1. Go to [LINE Developers Console](https://developers.line.biz/console/)
2. Select your channel > **Messaging API**
3. Scroll to **Webhook settings**
4. Paste your webhook URL in the **Webhook URL** field
5. Click **Verify** button
   - LINE sends a test request to verify the URL
   - You should see a green checkmark: ✓ Success

### Step 3: Enable Webhook

1. Still in **Webhook settings**, find **Use webhook** toggle
2. Toggle it **ON** (blue)
3. Click **Save**

### Step 4: Configure Webhook Events

In **Message**  section:

1. Check **Message** checkbox
2. Check **Follow** (optional, for when someone adds your bot)
3. You can also enable:
   - postback
   - join
   - leave
   - See [LINE documentation](https://developers.line.biz/en/docs/messaging-api/webhooks/) for details

### Testing Webhook

The webhook is now active. To test:

1. Open a new LINE account (or ask a friend)
2. Add your official account as a friend
3. Send a message to your bot
4. Check your deployed chat app
5. The message should appear within 3 seconds

---

## Test End-to-End

Complete testing checklist:

### 1. Test Sending Messages

- [ ] Open your chat app: `https://your-domain.vercel.app/chat`
- [ ] Type a message and click Send
- [ ] Message appears in chat window
- [ ] Message appears in LINE app (open your bot account)
- [ ] No errors in Vercel logs

### 2. Test Receiving Messages

- [ ] From another LINE account, send a message to your bot
- [ ] Message appears in chat window within 3 seconds
- [ ] Sender shows as "LINE"
- [ ] Message is properly formatted

### 3. Test Error Handling

- [ ] Try sending empty message (should show "Message is required")
- [ ] Disconnect internet and try sending (should show error message)
- [ ] Check error messages are user-friendly

### 4. Test UI

- [ ] Chat window is responsive (test on mobile)
- [ ] Messages are properly formatted
- [ ] Input field is accessible
- [ ] Send button works on click and Enter key

### 5. Check Logs

```bash
# View deployment logs
vercel logs <your-project-name> --tail

# Should show:
# - Successful POST requests to /api/send-message
# - Successful webhook deliveries
# - No error messages
```

---

## Troubleshooting Deployment

### "Build failed"

```bash
# Check for errors locally
npm run build

# Common issues:
# - TypeScript errors (fix and commit)
# - Missing dependencies (run npm install)
```

### "Webhook verification failed"

- Verify webhook URL in Vercel dashboard is public and accessible
- Check environment variables are correctly set in Vercel
- Verify `LINE_CHANNEL_SECRET` matches exactly

### "Messages not sending to LINE"

- Check `LINE_CHANNEL_ACCESS_TOKEN` is correct
- Check `LINE_TARGET_USER_ID` is correct user ID format
- View Vercel logs: `vercel logs <project-name> --tail`

### "Webhook not receiving messages"

- Verify webhook is enabled (blue toggle) in LINE console
- Check webhook URL is correct
- Verify `LINE_CHANNEL_SECRET` is correct
- Check Vercel logs for webhook errors

---

## Next Steps

1. **Customize UI:** Modify colors and styling in [app/chat/ChatUI.tsx](../app/chat/ChatUI.tsx)
2. **Add More Features:** Implement typing indicators, image support, etc.
3. **Add Database:** Migrate from in-memory storage to PostgreSQL
4. **Add Tests:** Create unit and integration tests
5. **Monitor Performance:** Set up analytics and error tracking

---

## Support

- [LINE Messaging API Docs](https://developers.line.biz/en/docs/messaging-api/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Vercel Docs](https://vercel.com/docs)
- [LINE Developer Community](https://developers.line.biz/en/community/)

Good luck! 🚀
