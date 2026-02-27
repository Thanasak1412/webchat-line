# Quick Start Guide

Get your admin webchat system running in 5 minutes.

## 1. Install Dependencies

```bash
npm install
```

## 2. Set Environment Variables

Create `.env.local`:

```bash
cp .env.example .env.local
```

Then edit `.env.local` and add your LINE credentials:

```env
LINE_CHANNEL_ACCESS_TOKEN=your_token_from_line_console
LINE_CHANNEL_SECRET=your_secret_from_line_console
```

## 3. Start Development Server

```bash
npm run dev
```

Open http://localhost:3000/chat in your browser.

## 4. Configure Webhook in LINE Console

1. Go to [LINE Developers Console](https://developers.line.biz/en/console/)
2. Select your Messaging API channel
3. Enable **Webhook**
4. Set **Webhook URL** to:
   ```
   https://your-domain.com/api/webhook
   ```
   (For local dev, use ngrok: `https://abc-123.ngrok-free.app/api/webhook`)

## 5. Test It Out

1. Open the admin chat UI at http://localhost:3000/chat
2. Send a message to your LINE Official Account from a real LINE account
3. The message should appear in the admin UI
4. Click on the user and send a reply!

## For Local Development with Ngrok

If you want to test webhooks locally:

```bash
# Install ngrok (one time)
brew install ngrok

# Start ngrok tunnel
ngrok http 3000

# Note the forwarding URL: https://abc-123.ngrok.io
# Use that URL in your LINE webhook settings
```

## Troubleshooting

**No users appearing in the admin UI?**
- Check that webhook is configured in LINE console
- Make sure the webhook endpoint is accessible (ngrok tunnel active)
- Try sending a test message from a LINE account

**Admin can't send messages?**
- Verify `LINE_CHANNEL_ACCESS_TOKEN` is correct
- Check browser console for API errors
- Ensure you've selected a user in the UI

**Messages aren't arriving in real-time?**
- SSE updates every 3 seconds if SSE connection fails
- Check browser's Network tab for `/api/stream` connection
- Some firewalls block SSE - polling is the fallback

## Next Steps

1. Read [ADMIN_WEBCHAT_GUIDE.md](./ADMIN_WEBCHAT_GUIDE.md) for full documentation
2. Review the API endpoints in the guide
3. (Optional) Set up database for persistent storage

## Deploy to Production

```bash
# Build for production
npm run build

# Deploy to Vercel (recommended)
vercel deploy

# Or use any Node.js hosting (Heroku, Railway, AWS, etc.)
```

See [README.md](./README.md) for full deployment instructions.
