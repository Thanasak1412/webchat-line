# Documentation Index

A guide to all documentation files in this project.

---

## 📚 Getting Started

**Start here if you're new:**

1. **[START_HERE.md](./START_HERE.md)** - First steps, setup, deploy (20 min read)
2. **[README.md](./README.md)** - Full documentation with API reference (30 min read)
3. **[SETUP.md](./SETUP.md)** - Detailed setup instructions for each platform

---

## 🎯 Feature Guides

### Target Discovery (NEW!) ✨

Automatically discover user/group/room IDs and send targeted messages.

- **[TARGET_DISCOVERY_OVERVIEW.md](./TARGET_DISCOVERY_OVERVIEW.md)** - High-level feature explanation
- **[LINE_TARGET_DISCOVERY.md](./LINE_TARGET_DISCOVERY.md)** - Complete API + usage guide
- **[EXAMPLES.md](./EXAMPLES.md)** - Practical code examples (cURL, JS, Python)

### Architecture & Design

- **[PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md)** - Technical architecture overview
- **[COMPLETION_SUMMARY.md](./COMPLETION_SUMMARY.md)** - What's been built and tested

---

## 🔧 API Reference

### Core Endpoints

- **`GET /api/messages`** - Get all chat messages
  - See: [README.md § API Documentation](./README.md#-api-documentation)

- **`POST /api/send-message`** - Send message to LINE
  - See: [README.md § API Documentation](./README.md#-api-documentation)

- **`POST /api/webhook`** - Receive messages from LINE
  - See: [README.md § API Documentation](./README.md#-api-documentation)

### Target Discovery APIs (NEW)

- **`GET /api/line/targets`** - Get discovered targets
  - See: [LINE_TARGET_DISCOVERY.md § GET /api/line/targets](./LINE_TARGET_DISCOVERY.md#1-get-apilinetargets)

- **`GET /api/line/targets/stats`** - Get target statistics
  - See: [LINE_TARGET_DISCOVERY.md § GET /api/line/targets/stats](./LINE_TARGET_DISCOVERY.md#2-get-apilinetargetsstats)

- **`POST /api/line/send-to-target`** - Send to specific target
  - See: [LINE_TARGET_DISCOVERY.md § POST /api/line/send-to-target](./LINE_TARGET_DISCOVERY.md#3-post-apilinesend-to-target)

### Examples for Each Endpoint

- **cURL examples** → [EXAMPLES.md § cURL Examples](./EXAMPLES.md#curl-examples)
- **JavaScript examples** → [EXAMPLES.md § JavaScript Examples](./EXAMPLES.md#javascript-examples)
- **Python examples** → [EXAMPLES.md § Python Examples](./EXAMPLES.md#python-examples)
- **Target Discovery examples** → [EXAMPLES.md § Target Discovery Examples](./EXAMPLES.md#target-discovery-examples--new)

---

## 📋 Implementation Guides

### For Developers

1. **Local development** → [START_HERE.md § Local Development](./START_HERE.md#-local-development)
2. **Understanding the code** → [PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md)
3. **Type definitions** → [lib/types.ts](./lib/types.ts)
4. **API implementation** → [app/api/](./app/api/)

### For DevOps

1. **Deployment** → [START_HERE.md § Deployment](./START_HERE.md#-deployment)
2. **Deployment checklist** → [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)
3. **Production setup** → [SETUP.md § Production Deployment](./SETUP.md)
4. **Environment variables** → [.env.local.example](./.env.local.example)

---

## 🎓 Learning Path

### Beginner (Just want to use it)

1. Read: [START_HERE.md](./START_HERE.md) - 20 min
2. Do: Install dependencies, run locally
3. Try: Send/receive messages via web UI
4. Read: [TARGET_DISCOVERY_OVERVIEW.md](./TARGET_DISCOVERY_OVERVIEW.md) - 10 min
5. Try: Use `/api/line/targets` endpoint

### Intermediate (Want to customize)

1. Read: [PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md) - 20 min
2. Read: [LINE_TARGET_DISCOVERY.md](./LINE_TARGET_DISCOVERY.md) - 30 min
3. Check: [EXAMPLES.md](./EXAMPLES.md) for code patterns
4. Modify: Create custom endpoints using examples as templates
5. Deploy: Use [SETUP.md](./SETUP.md) for production

### Advanced (Want to contribute/extend)

1. Read: Full [README.md](./README.md)
2. Study: [PROJECT_SUMMARY.md § Architecture](./PROJECT_SUMMARY.md)
3. Explore: Source code in `lib/` and `app/api/`
4. Review: [COMPLETION_SUMMARY.md](./COMPLETION_SUMMARY.md) for known limitations
5. Propose: New features based on [Future Improvements](#future-improvements)

---

## 🚀 Common Tasks

### "I want to..."

#### Send a message programmatically
→ [EXAMPLES.md § Sending Messages](./EXAMPLES.md#sending-messages)

#### Broadcast to all groups
→ [EXAMPLES.md § Broadcasting](./EXAMPLES.md#broadcasting)

#### Get usage statistics
→ [EXAMPLES.md § Analytics](./EXAMPLES.md#analytics)

#### Deploy to production
→ [START_HERE.md § Deployment](./START_HERE.md#-deployment)

#### Understand the architecture
→ [PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md)

#### Add a new feature
→ [Dev guide](#for-developers)

#### Debug a problem
→ [README.md § Troubleshooting](./README.md#troubleshooting)

---

## 📊 Documentation Structure

```
📦 Documentation Files
├── 🎯 Getting Started
│   ├── START_HERE.md (quick start)
│   ├── SETUP.md (detailed setup)
│   └── README.md (complete reference)
│
├── ✨ Target Discovery Feature (NEW)
│   ├── TARGET_DISCOVERY_OVERVIEW.md (what & why)
│   ├── LINE_TARGET_DISCOVERY.md (how to use)
│   └── EXAMPLES.md (code examples)
│
├── 🏗️ Technical Reference
│   ├── PROJECT_SUMMARY.md (architecture)
│   ├── API.md (detailed API specs)
│   └── COMPLETION_SUMMARY.md (status report)
│
└── ✅ Operations
    ├── DEPLOYMENT_CHECKLIST.md
    └── Documentation Index (this file)
```

---

## 🔍 File Reference

### Documentation Files

| File | Purpose | Read Time | Audience |
|------|---------|-----------|----------|
| START_HERE.md | Quick start guide | 20 min | Everyone |
| README.md | Complete reference | 30 min | Developers |
| SETUP.md | Detailed setup | 15 min | DevOps/Setup |
| API.md | Detailed API specs | 20 min | Developers |
| PROJECT_SUMMARY.md | Architecture overview | 20 min | Architects |
| COMPLETION_SUMMARY.md | What's built & tested | 10 min | Project leads |
| DEPLOYMENT_CHECKLIST.md | Pre-deployment checklist | 5 min | DevOps |
| TARGET_DISCOVERY_OVERVIEW.md | Feature explanation | 15 min | New users |
| LINE_TARGET_DISCOVERY.md | Complete feature guide | 30 min | Feature users |
| EXAMPLES.md | Code examples | 30 min | Developers |
| DOCUMENTATION_INDEX.md | This file | 10 min | Navigation |

### Code Files

| File/Folder | Purpose |
|-------------|---------|
| app/api/ | All API endpoints |
| app/chat/ | Chat UI components |
| lib/ | Shared utilities and types |
| .env.local.example | Environment variable template |

---

## 📞 Quick Links

- **Source Code**: [GitHub](https://github.com/yourusername/webchat-line)
- **LINE Developers**: [https://developers.line.biz/](https://developers.line.biz/)
- **Next.js Docs**: [https://nextjs.org/](https://nextjs.org/)
- **TypeScript**: [https://www.typescriptlang.org/](https://www.typescriptlang.org/)
- **Vercel Deployment**: [https://vercel.com/](https://vercel.com/)

---

## ❓ FAQ

### "Where should I start?"
→ [START_HERE.md](./START_HERE.md)

### "How do I use the new target discovery?"
→ [TARGET_DISCOVERY_OVERVIEW.md](./TARGET_DISCOVERY_OVERVIEW.md)

### "Show me code examples"
→ [EXAMPLES.md](./EXAMPLES.md)

### "How is it built?"
→ [PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md)

### "Is it production-ready?"
→ [COMPLETION_SUMMARY.md](./COMPLETION_SUMMARY.md)

### "How do I deploy?"
→ [START_HERE.md § Deployment](./START_HERE.md#-deployment)

### "What APIs are available?"
→ [README.md § API Documentation](./README.md#-api-documentation)

### "Where's the TypeScript type definitions?"
→ [lib/types.ts](./lib/types.ts)

---

## 🎯 Next Steps

1. **Choose your path** (Beginner/Intermediate/Advanced above)
2. **Read the appropriate docs**
3. **Try the examples**
4. **Build something cool!**
5. **Deploy to production** (See DEPLOYMENT_CHECKLIST.md)

---

## 📝 Documentation Status

- ✅ Getting started guide
- ✅ Complete API documentation
- ✅ Setup instructions
- ✅ Deployment guides
- ✅ Code examples (cURL, JS, Python)
- ✅ Architecture documentation
- ✅ Type definitions
- ✅ target discovery feature documentation (NEW)
- ✅ Project completion summary
- ✅ This navigational index

**All documentation is up-to-date as of this build.**

---

## 🤝 Contributing

To improve documentation:

1. Edit the relevant `.md` file
2. Check formatting with markdown viewer
3. Test all code examples
4. Update this index if adding new docs
5. Submit for review

---

Last updated: February 2026
