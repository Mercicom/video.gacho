# Netlify Deployment Guide

This guide will walk you through deploying the Video Analyzer application to Netlify.

## Prerequisites

✅ Code pushed to GitHub: https://github.com/Mercicom/video.gacho.git  
✅ Netlify account (free): https://app.netlify.com/signup  
✅ Custom domain (optional, can be added later)

---

## Step 1: Import GitHub Repository to Netlify

1. **Go to Netlify Dashboard**
   - Visit: https://app.netlify.com
   - Sign in to your account

2. **Create New Site**
   - Click the "Add new site" button (or "Import an existing project")
   - Select "Deploy with GitHub"

3. **Authorize GitHub Access**
   - If prompted, click "Authorize Netlify"
   - Grant access to your GitHub account
   - You may need to configure which repositories Netlify can access

4. **Select Repository**
   - Find and select: `Mercicom/video.gacho`
   - Click to select it

---

## Step 2: Configure Build Settings

You should see a configuration screen with these settings:

### Basic Build Settings

Fill in these fields:

| Setting | Value |
|---------|-------|
| **Branch to deploy** | `main` |
| **Build command** | `npm run build` |
| **Publish directory** | `.next` |
| **Functions directory** | *(leave empty - auto-detected)* |

### Advanced Build Settings (Click "Show advanced")

Add these environment variables by clicking "New variable":

| Variable Name | Value |
|---------------|-------|
| `NODE_VERSION` | `18` |
| `RATE_LIMIT_PER_MINUTE` | `10` |
| `MAX_VIDEO_SIZE_MB` | `100` |
| `MAX_VIDEOS_PER_BATCH` | `500` |

**Important Notes:**
- ✅ No `GOOGLE_API_KEY` needed - users provide their own
- ✅ No Firebase, OpenAI, or other API keys needed for core functionality
- These are just configuration limits for the application

---

## Step 3: Deploy

1. **Click "Deploy site"**
   - Netlify will start building your site
   - This takes 2-4 minutes for the first deployment

2. **Monitor Build Progress**
   - You'll see a build log in real-time
   - Look for "Site is live" message
   - If build fails, check the logs for errors

3. **Get Your Site URL**
   - Netlify assigns a random URL like: `random-name-12345.netlify.app`
   - Note this URL - you'll use it for custom domain setup

---

## Step 4: Change Site Name (Optional but Recommended)

1. **Go to Site Settings**
   - From your site dashboard, click "Site settings"
   - Navigate to "General" → "Site details"

2. **Change Site Name**
   - Click "Change site name"
   - Enter: `video-gacho` (or your preferred name)
   - Click "Save"

3. **New URL**
   - Your site is now at: `https://video-gacho.netlify.app`
   - This is easier to remember than the random name

---

## Step 5: Configure Custom Subdomain

### Option A: Add Subdomain to Existing Domain

1. **Go to Domain Settings**
   - In Netlify dashboard: Site settings → Domain management
   - Click "Add custom domain"

2. **Enter Your Subdomain**
   - Enter: `video.yourdomain.com` (replace with your actual domain)
   - Click "Verify"
   - Netlify will check if you own the domain

3. **Configure DNS**
   - Netlify will provide DNS configuration instructions
   - Add a CNAME record in your domain's DNS settings:

   ```
   Type:  CNAME
   Name:  video
   Value: video-gacho.netlify.app
   TTL:   Auto (or 3600)
   ```

4. **Wait for DNS Propagation**
   - DNS changes can take 1-60 minutes to propagate
   - Netlify will automatically provision SSL certificate (Let's Encrypt)
   - Your site will be available at: `https://video.yourdomain.com`

### Option B: Use Netlify Subdomain Only

If you don't have a custom domain or want to set it up later:
- Your site is already live at: `https://video-gacho.netlify.app`
- SSL is automatically enabled
- You can add a custom domain anytime from Site settings → Domain management

---

## Step 6: Verify Deployment

### Test Core Functionality

1. **Visit Your Site**
   - Go to: `https://video-gacho.netlify.app` (or your custom domain)
   
2. **Configure API Key**
   - You should see an "API Key Required" warning
   - Click "API Settings" button
   - Get a free API key: https://aistudio.google.com/app/apikey
   - Enter your API key and click "Save API Key"

3. **Test Video Analysis**
   - Upload a test video (MP4, MOV, etc.)
   - Click "Analyze"
   - Wait for analysis to complete (6 seconds per video)
   - Verify all fields are populated:
     - Visual Hook
     - Text Hook
     - Voice Hook
     - Video Script
     - Pain Point

4. **Test Export**
   - Click "Export CSV" or "Export JSON"
   - Verify file downloads correctly
   - Open the file and check data is present

### Verify Security

- ✅ `/api/deepgram` should return 404 (endpoint removed)
- ✅ Open DevTools → Network → Check no API keys in requests
- ✅ Open DevTools → Application → Local Storage → Verify API key is stored locally
- ✅ Test in incognito/private window (should ask for API key again)

### Check Build Status

- ✅ Go to: Deploys tab in Netlify dashboard
- ✅ Verify "Published" status with green checkmark
- ✅ Check deploy logs for any warnings

---

## Step 7: Enable Continuous Deployment (Automatic)

Good news! Netlify automatically sets up continuous deployment:

- ✅ Every push to `main` branch triggers automatic deployment
- ✅ Pull requests create preview deployments
- ✅ Build status shown in GitHub commits

**Test it:**
1. Make a small change to your code locally
2. Commit and push to GitHub
3. Netlify automatically detects the change and rebuilds
4. Check Deploys tab to see the new deployment

---

## Troubleshooting

### Build Fails

**Error: "Command 'npm run build' failed"**

Check these:
1. Verify `NODE_VERSION=18` is set in environment variables
2. Check build logs for specific errors
3. Test build locally: `npm run build`
4. Ensure all dependencies are in `package.json`

**Error: "Module not found"**

1. Delete `node_modules` and reinstall:
   ```bash
   rm -rf node_modules
   npm install
   npm run build
   ```
2. Commit and push the updated `package-lock.json`

**Error: "Build exceeded memory limit"**

1. Upgrade to Netlify Pro (if needed)
2. Or optimize build:
   - Remove unused dependencies
   - Use dynamic imports for large components

### Deployment Succeeds but Site Shows 404

**Check:**
1. Publish directory is set to `.next`
2. Build command is `npm run build`
3. `@netlify/plugin-nextjs` plugin is configured in `netlify.toml`
4. Redirects are properly configured in `netlify.toml`

### API Routes Don't Work

**Check:**
1. `netlify.toml` redirects are configured
2. `@netlify/plugin-nextjs` is installed
3. API routes are in `src/app/api/` directory
4. Routes export functions named `POST`, `GET`, etc.

**Test API directly:**
```bash
curl https://your-site.netlify.app/api/gemini/analyze-video
# Should return: {"success":false,"error":{"message":"Method not allowed..."}}
```

### Custom Domain Not Working

**DNS Issues:**
1. Verify CNAME record is correct:
   ```
   dig video.yourdomain.com
   # Should point to video-gacho.netlify.app
   ```
2. Wait for DNS propagation (up to 48 hours, usually < 1 hour)
3. Clear your browser cache and DNS cache:
   ```bash
   # macOS
   sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder
   ```

**SSL Certificate Issues:**
1. Netlify auto-provisions SSL (Let's Encrypt)
2. Wait 1-2 minutes after DNS propagates
3. If fails, go to Domain settings → HTTPS → "Verify DNS configuration"

---

## Monitoring & Maintenance

### View Deploy Logs
- Netlify Dashboard → Deploys → Click on any deploy
- See full build logs, function logs, and errors

### Check Site Analytics
- Netlify Dashboard → Analytics (requires upgrade to Pro)
- Or add Google Analytics/Plausible

### Monitor Function Usage
- Netlify Dashboard → Functions
- See invocations, duration, and errors
- Free tier: 125,000 function requests/month

### Rollback Deployment
If something goes wrong:
1. Go to Deploys tab
2. Find the last working deployment
3. Click "..." menu → "Publish deploy"
4. Site immediately reverts to that version

---

## Performance Optimization

### Enable Caching

Add to `netlify.toml`:

```toml
[[headers]]
  for = "/static/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "/*.js"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "/*.css"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
```

### Enable Build Plugins

```toml
[[plugins]]
  package = "netlify-plugin-cache-nextjs"
```

### Pre-render Static Pages

Most pages are already server-side rendered, but you can pre-render the homepage:

```typescript
// src/app/page.tsx
export const dynamic = 'force-static';
```

---

## Security Headers (Recommended)

Add to `netlify.toml`:

```toml
[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    X-XSS-Protection = "1; mode=block"
    Referrer-Policy = "strict-origin-when-cross-origin"
    Permissions-Policy = "camera=(), microphone=(), geolocation=()"
```

---

## Cost Estimates

### Netlify Free Tier (Current Plan)
- ✅ 100 GB bandwidth/month
- ✅ 300 build minutes/month
- ✅ Unlimited sites
- ✅ Automatic HTTPS
- ✅ Deploy previews

**Sufficient for:**
- Up to 1,000 daily active users
- ~10,000 video analyses per month
- Hobby projects and MVPs

### When to Upgrade to Pro ($19/month)

Upgrade when you exceed:
- 100 GB bandwidth
- 300 build minutes
- Need build plugins
- Need analytics
- Need team collaboration

---

## Next Steps After Deployment

1. ✅ Test the live site thoroughly
2. ✅ Share the URL with beta testers
3. ⚠️ Monitor Netlify function usage
4. ⚠️ Set up error tracking (Sentry recommended)
5. ⚠️ Add analytics (Google Analytics, Plausible, or Vercel Analytics)
6. 🔮 Consider adding authentication (NextAuth.js) if you want user accounts
7. 🔮 Add database (Supabase) for persistent storage
8. 🔮 Implement caching for duplicate video analyses

---

## Support

**Netlify Documentation:**
- Next.js on Netlify: https://docs.netlify.com/frameworks/next-js/overview/
- Deploy settings: https://docs.netlify.com/configure-builds/overview/
- Custom domains: https://docs.netlify.com/domains-https/custom-domains/

**Project Documentation:**
- See `overview.md` for complete project documentation
- See `README.md` for user-facing instructions
- See `feature_request.md` for original requirements

**Getting Help:**
- Netlify Support: https://answers.netlify.com
- GitHub Issues: https://github.com/Mercicom/video.gacho/issues

---

## Deployment Checklist

Before going live:

- [ ] Code pushed to GitHub repository
- [ ] Netlify site created and deployed successfully
- [ ] Site accessible at Netlify URL
- [ ] API key settings modal works
- [ ] Video upload functionality works
- [ ] Video analysis returns results
- [ ] Export (CSV/JSON) downloads correctly
- [ ] Custom domain configured (if applicable)
- [ ] SSL certificate active (HTTPS working)
- [ ] Tested in multiple browsers
- [ ] Tested on mobile devices
- [ ] No console errors in browser DevTools
- [ ] API routes responding correctly
- [ ] Rate limiting working as expected

**Your site is ready for users! 🚀**

---

## Quick Reference

### Netlify URLs
- **Dashboard:** https://app.netlify.com
- **Your Site:** https://video-gacho.netlify.app
- **Deploy Status Badge:** `[![Netlify Status](https://api.netlify.com/api/v1/badges/YOUR-SITE-ID/deploy-status)](https://app.netlify.com/sites/video-gacho/deploys)`

### Important Files
- `netlify.toml` - Netlify configuration
- `.nvmrc` - Node.js version (18)
- `package.json` - Dependencies and scripts
- `next.config.mjs` - Next.js configuration

### Environment Variables in Netlify
- Set at: Site settings → Environment variables
- Separate for: Production, Deploy previews, Branch deploys
- Can be updated anytime (triggers rebuild)

### Git Workflow
```bash
# Make changes locally
git add .
git commit -m "Description of changes"
git push origin main

# Netlify automatically deploys
# Check: Deploys tab in Netlify dashboard
```

---

**Last Updated:** November 6, 2025  
**Next Review:** After first deployment

