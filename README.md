# LINE Webchat Assignment

## Introduction

LINE Webchat Assignment is a simple webchat app that sends messages from a Next.js UI to a LINE Official Account using the LINE Messaging API (Push Message).

It includes:
- a chat screen at `/chat`
- a send-message API route for LINE push
- an optional webhook route for receiving LINE events

## Tech Stack

- Next.js (App Router)
- TypeScript
- Tailwind CSS

## Getting Started

### 1) Install dependencies

```bash
npm install
```

### 2) Set environment variables

Create a `.env.local` file in the project root:

```bash
LINE_CHANNEL_ACCESS_TOKEN=YOUR_LINE_CHANNEL_ACCESS_TOKEN
LINE_TARGET_USER_ID=YOUR_TARGET_USER_ID
LINE_CHANNEL_SECRET=YOUR_LINE_CHANNEL_SECRET
```

Notes:
- `LINE_CHANNEL_ACCESS_TOKEN` and `LINE_TARGET_USER_ID` are required for sending messages.
- `LINE_CHANNEL_SECRET` is required for webhook signature verification.

### 3) Run development server

```bash
npm run dev
```

Open `http://localhost:3000` in your browser.

## How to use

1. Open `http://localhost:3000/chat`.
2. Type a message in the input box.
3. Click **Send**.
4. The app calls `/api/send-message`, then pushes your text to the LINE Official Account target user.

Optional webhook setup:
- Configure LINE webhook URL to `/api/line/webhook` on your deployed domain.
- Incoming events are validated and logged for debugging.

## Deployment (Vercel)

1. Push this project to a Git repository.
2. Import the repository into Vercel.
3. Add environment variables in Vercel Project Settings (`LINE_CHANNEL_ACCESS_TOKEN`, `LINE_TARGET_USER_ID`, `LINE_CHANNEL_SECRET`).
4. Deploy and use your production URL.

For LINE webhook usage, set the webhook URL in LINE Developers Console to:

`https://<your-domain>/api/line/webhook`
