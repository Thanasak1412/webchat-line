# Deployment Checklist

Complete this checklist before deploying your LINE Webchat to production.

## Pre-Deployment

### Code Quality
- [ ] All TypeScript errors fixed (`npm run build`)
- [ ] Linting passes (`npm run lint`)
- [ ] No console errors in development (`npm run dev`)
- [ ] No unfinished comments or TODOs in code
- [ ] Sensitive values not hardcoded (use environment variables)
- [ ] `.env.local` file not committed to git

### Testing
- [ ] Tested locally: send-message endpoint works
- [ ] Tested locally: receive messages via webhook (with tunnel)
- [ ] Tested error cases (empty message, invalid JSON, etc.)
- [ ] UI responsive on mobile devices (test in DevTools)
- [ ] Message polling works (3-second refresh)
- [ ] No memory leaks (check with DevTools Profiler if needed)

### Documentation
- [ ] README.md is up-to-date
- [ ] SETUP.md completed with your details
- [ ] API.md reviewed for accuracy
- [ ] EXAMPLES.md verified with your domain
- [ ] LICENSE file present (matching your project)

### Environment Setup
- [ ] `.env.local.example` has correct field names
- [ ] All required variables documented
- [ ] No example values left in production `.env` files

---

## GitHub Setup

### Repository
- [ ] Repository created on GitHub
- [ ] Code pushed to `main` branch
- [ ] `.gitignore` includes `.env.local`
- [ ] `.gitignore` includes `node_modules/`
- [ ] Initial commit message is clear
- [ ] README visible on repository homepage

### GitHub Settings
- [ ] Repository description set
- [ ] Topics added (e.g., "line-bot", "nextjs", "typescript")
- [ ] README displayed as homepage
- [ ] Branch protection (optional, for production)

---

## LINE Developer Console

### Channel Setup
- [ ] Messaging API channel created
- [ ] Channel access token issued
- [ ] Channel secret copied
- [ ] User ID obtained for testing

### Message Type Settings
- [ ] Basic settings verified (app name, icon, etc.)
- [ ] Conversation settings configured (if needed)

### Webhook Setup (Pre-Deployment)
- [ ] Webhook URL format understood: `/api/webhook`
- [ ] Plan for webhook URL will be: `https://your-domain/api/webhook`
- [ ] "Use webhook" checkbox located
- [ ] Webhook test tool understood

---

## Vercel Setup

### Preparation
- [ ] GitHub repository public (or Vercel has access)
- [ ] Vercel account created
- [ ] Project name chosen
- [ ] Custom domain planned (optional)

### Deployment
- [ ] Vercel project created and linked
- [ ] Environment variables added:
  - [ ] `LINE_CHANNEL_ACCESS_TOKEN`
  - [ ] `LINE_CHANNEL_SECRET`
  - [ ] `LINE_TARGET_USER_ID`
- [ ] Variables set for all environments (Production, Preview, Development)
- [ ] Deployment initiated
- [ ] Build successful (check logs if needed)
- [ ] Preview deployment URL available
- [ ] Production domain configured

### Vercel Settings
- [ ] Git branch is `main` (or your chosen branch)
- [ ] Auto-deploy on push enabled
- [ ] Environment variables visible in dashboard
- [ ] Production domain aliases set up

---

## Post-Deployment Testing

### Basic Functionality
- [ ] Open production URL in browser
- [ ] Chat page loads (no 404 error)
- [ ] Message API endpoint responds
- [ ] Loading states work correctly

### Send Message Test
- [ ] Type message in chat UI
- [ ] Click Send button
- [ ] Message appears in chat
- [ ] Message appears in LINE app
- [ ] No errors in browser console
- [ ] No errors in Vercel logs

### Webhook Configuration
- [ ] Update LINE Developers Console webhook URL:
  - Old: (unused)
  - New: `https://your-vercel-domain.vercel.app/api/webhook`
- [ ] Click "Verify" in LINE console
- [ ] Verification succeeds (green checkmark)
- [ ] Toggle "Use webhook" ON

### Receive Message Test
- [ ] Send test message from another LINE account
- [ ] Message appears in production chat within 3 seconds
- [ ] Message sender shows as "LINE"
- [ ] Vercel logs show successful webhook delivery

### Error Handling
- [ ] Try sending empty message (should show error)
- [ ] Check browser DevTools Console for JavaScript errors
- [ ] View Vercel logs for server errors: `vercel logs`
- [ ] Verify error messages are user-friendly

---

## Final Verification

### URLs & Links
- [ ] Webchat URL works: `https://your-domain/chat`
- [ ] Home page URL works: `https://your-domain`
- [ ] API endpoints respond: `https://your-domain/api/messages`
- [ ] All links in README work

### Performance
- [ ] Page loads in < 3 seconds
- [ ] No console warnings or errors
- [ ] No memory leaks detected
- [ ] Images/assets load correctly

### Monitoring
- [ ] Vercel analytics enabled
- [ ] Can view logs: `vercel logs your-project --tail`
- [ ] Understand how to check for errors

### Documentation
- [ ] README has deployment instructions
- [ ] SETUP.md has all steps documented
- [ ] URLs section completed:
  - Webchat URL: `https://your-project.vercel.app/chat`
  - GitHub repo: `https://github.com/your-username/webchat-line`
  - LINE OA: `https://line.me/R/ti/p/@your-oa-id`

---

## Optional Improvements

- [ ] Add database (PostgreSQL + Prisma)
- [ ] Add real-time updates (WebSocket or SSE)
- [ ] Add rich message support (buttons, images)
- [ ] Add unit tests
- [ ] Add error tracking (Sentry)
- [ ] Add analytics
- [ ] Custom domain configuration
- [ ] Email notifications for errors

---

## Rollback Plan

If something goes wrong:

1. **Vercel Rollback:**
   - Go to Vercel dashboard > Deployments
   - Click previous working deployment
   - Click "Promote to Production"

2. **Code Rollback:**
   ```bash
   git log --oneline
   git revert <commit-hash>
   git push origin main
   ```

3. **Environment Variable Rollback:**
   - Update variables in Vercel dashboard
   - Redeploy

4. **Support:**
   - Check Vercel logs for errors
   - Check LINE webhook test results
   - Review browser console errors

---

## Success Criteria

✅ Project is considered successfully deployed when:

1. ✓ Chat UI loads without errors
2. ✓ Can send messages to LINE from web UI
3. ✓ Messages appear in LINE app within 5 seconds
4. ✓ Can receive messages from LINE
5. ✓ Messages appear in web UI within 3 seconds
6. ✓ Webhook signature verification works
7. ✓ Error handling is graceful (no blank pages)
8. ✓ URLs documented in README
9. ✓ Code pushed to GitHub
10. ✓ Deployments automated on git push

---

## Post-Launch Maintenance

### Daily Checks (First Week)
- [ ] Check Vercel logs for errors
- [ ] Test sending/receiving messages
- [ ] Verify webhook deliveries

### Weekly Checks
- [ ] Review Vercel analytics
- [ ] Check deployment history
- [ ] No stranded processes or memory leaks

### Monthly Checks
- [ ] Update LINE channel settings if needed
- [ ] Review and optimize code if needed
- [ ] Plan for feature improvements
- [ ] Update dependencies (if applicable)

---

## Support & Troubleshooting

If deployment fails:

1. **Check build logs:**
   ```bash
   vercel logs <project-name> --follow
   ```

2. **Check environment variables:**
   - Verify all three are set in Vercel dashboard
   - Values are exact (no extra spaces)

3. **Check webhook configuration:**
   - Webhook URL is correct
   - Webhook verification passed
   - "Use webhook" is enabled

4. **Common Issues:**
   - Missing environment variables → Update in Vercel dashboard and redeploy
   - Webpack build error → Check TypeScript errors: `npm run build`
   - Webhook failing →Check signature verification, `LINE_CHANNEL_SECRET` value
   - Messages not sending → Check `LINE_CHANNEL_ACCESS_TOKEN` validity

---

## Completion

- [ ] All checklist items completed
- [ ] Project successfully deployed and tested
- [ ] Documentation updated
- [ ] Ready for production use

**Deployment Date:** _______________

**Deployed By:** _______________

**Notes/Issues:** _______________

---

Congratulations! Your LINE Webchat is now live! 🎉
