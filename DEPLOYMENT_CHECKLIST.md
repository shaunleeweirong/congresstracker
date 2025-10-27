# 🚀 Production Deployment Checklist

Use this checklist to ensure all steps are completed for production deployment.

---

## Pre-Deployment

- [ ] Read [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) completely
- [ ] Ensure code is pushed to GitHub repository
- [ ] Verify `.env` files are in `.gitignore` (not committed)
- [ ] Have FMP API key ready

---

## Step 1: Generate Secrets (5 minutes)

- [ ] Run: `node scripts/generate-secrets.js`
- [ ] Save JWT_SECRET (64 chars)
- [ ] Save NEXTAUTH_SECRET (64 chars)
- [ ] Save ADMIN_API_KEY (optional, 64 chars)

---

## Step 2: Database Setup - Neon (15 minutes)

- [ ] Sign up at [neon.tech](https://neon.tech) with GitHub
- [ ] Create project: "congresstracker"
- [ ] Choose region closest to you
- [ ] Copy PostgreSQL connection string
- [ ] Save connection string securely
- [ ] **Note:** Migrations run automatically on backend startup (no manual psql needed)
- [ ] ⚠️ **Important:** Neon free tier databases sleep after inactivity and can take 5-15 seconds to wake up

---

## Step 3: Redis Setup - Upstash (10 minutes)

- [ ] Sign up at [upstash.com](https://upstash.com) with GitHub
- [ ] Create Redis database: "congresstracker-cache"
- [ ] Type: Regional
- [ ] Choose same region as Neon
- [ ] Copy Redis connection string
- [ ] Save connection string securely
- [ ] (Optional) Test: `redis-cli -u "<connection-string>" PING`

---

## Step 4: Backend Deployment - Render (20 minutes)

- [ ] Sign up at [render.com](https://render.com) with GitHub
- [ ] Click "New +" → "Web Service"
- [ ] Connect repository: `shaunleeweirong/congresstracker`
- [ ] Name: `congresstracker-backend`
- [ ] Region: Same as Neon/Upstash
- [ ] Branch: `master`
- [ ] Root Directory: `backend`
- [ ] Build: `npm install && npm run build`
- [ ] Start: `npm start`
- [ ] Plan: **Free**
- [ ] Health Check Path: `/health`

### Environment Variables:
- [ ] `NODE_ENV` = `production`
- [ ] `PORT` = `3001`
- [ ] `DATABASE_URL` = (from Neon)
- [ ] `REDIS_URL` = (from Upstash)
- [ ] `JWT_SECRET` = (from Step 1)
- [ ] `FMP_API_KEY` = (your FMP key)
- [ ] `CORS_ORIGIN` = `https://localhost:3000` (placeholder, will update)
- [ ] `JWT_EXPIRES_IN` = `7d`
- [ ] `BCRYPT_ROUNDS` = `12`
- [ ] `API_VERSION` = `v1`
- [ ] `LOG_LEVEL` = `info`

### After Deployment:
- [ ] Wait for build to complete (~5-10 min)
- [ ] **Watch deployment logs for these success indicators:**
  - [ ] ✅ `Creating migrations table succeeded (took ~1800ms)`
  - [ ] ✅ `Fetching executed migrations succeeded (took ~200ms)`
  - [ ] ✅ `No pending migrations`
  - [ ] ✅ `🚀 Server running on port 3001`
  - [ ] ✅ `Your service is live 🎉`
- [ ] Copy backend URL (e.g., `https://congresstracker-backend.onrender.com`)
- [ ] Test health: `curl https://your-backend.onrender.com/health`
- [ ] Should return: `{"status":"healthy","timestamp":"...","uptime":...,"version":"1.0.0"}`
- [ ] ⚠️ **If deployment fails with "Connection terminated due to connection timeout":**
  - This means Neon took too long to wake up (rare but possible)
  - Simply trigger "Manual Deploy" → "Deploy latest commit" to retry
  - The retry logic will handle it (up to 5 attempts with exponential backoff)

---

## Step 5: Initial Data Sync (15 minutes)

- [ ] Go to Render dashboard → congresstracker-backend
- [ ] Click "Shell" tab
- [ ] Wait for shell to connect
- [ ] Run: `npm run sync:now`
- [ ] Wait ~2-3 minutes for completion
- [ ] Verify: `psql "<neon-url>" -c "SELECT COUNT(*) FROM stock_trades;"`
- [ ] Should show 2000-3000+ trades

---

## Step 6: Frontend Deployment - Vercel (15 minutes)

- [ ] Sign up at [vercel.com](https://vercel.com) with GitHub
- [ ] Click "Add New..." → "Project"
- [ ] Import: `shaunleeweirong/congresstracker`
- [ ] Framework: Next.js (auto-detected)
- [ ] Root Directory: `frontend`
- [ ] Build: `npm run build` (auto-detected)

### Environment Variables:
- [ ] `NEXT_PUBLIC_API_URL` = `https://your-backend.onrender.com/api/v1`
- [ ] `NEXT_PUBLIC_APP_URL` = `https://your-app.vercel.app` (placeholder)
- [ ] `NEXTAUTH_SECRET` = (from Step 1)
- [ ] `NEXTAUTH_URL` = `https://your-app.vercel.app` (placeholder)
- [ ] `NODE_ENV` = `production`

### After Deployment:
- [ ] Click "Deploy"
- [ ] Wait for build (~2-3 min)
- [ ] Copy Vercel URL (e.g., `https://congresstracker-abc123.vercel.app`)
- [ ] Update env vars:
  - [ ] `NEXT_PUBLIC_APP_URL` = actual Vercel URL
  - [ ] `NEXTAUTH_URL` = actual Vercel URL
- [ ] Redeploy (automatic after env change)

---

## Step 7: Connect Services (10 minutes)

- [ ] Go to Render → congresstracker-backend → Environment
- [ ] Update `CORS_ORIGIN` = your actual Vercel URL
- [ ] Save changes (triggers redeploy, ~2 min)
- [ ] Open Vercel app in browser
- [ ] Open DevTools (F12) → Network tab
- [ ] Refresh page
- [ ] Verify API calls to Render backend succeed
- [ ] Check trades are loading on dashboard

---

## Step 8: Testing (15 minutes)

### Critical Features:
- [ ] Dashboard loads without errors
- [ ] Trades display correctly
- [ ] Date range picker works
- [ ] Search functionality works (politicians & stocks)
- [ ] Stock detail page loads
- [ ] Politician detail page loads
- [ ] Dark mode toggle works
- [ ] Mobile responsive (test on phone or resize browser)

### Performance:
- [ ] Dashboard loads in < 5 seconds (after cold start)
- [ ] API calls respond in < 2 seconds
- [ ] No console errors in DevTools

---

## Step 9: Monitoring Setup (10 minutes)

### UptimeRobot (Keep Backend Awake):
- [ ] Sign up at [uptimerobot.com](https://uptimerobot.com) (free)
- [ ] Click "Add New Monitor"
- [ ] Type: HTTP(s)
- [ ] Name: Congressional Tracker Backend
- [ ] URL: `https://your-backend.onrender.com/health`
- [ ] Interval: 5 minutes
- [ ] Create monitor

### Vercel Analytics:
- [ ] Already enabled automatically!
- [ ] View: Vercel Dashboard → Your Project → Analytics

---

## Step 10: Automated Daily Sync (10 minutes)

### Add GitHub Secrets:
- [ ] Go to GitHub repo → Settings → Secrets and variables → Actions
- [ ] Click "New repository secret"
- [ ] Add `DATABASE_URL` = (from Neon)
- [ ] Add `REDIS_URL` = (from Upstash)
- [ ] Add `FMP_API_KEY` = (your FMP key)

### Test GitHub Action:
- [ ] Go to GitHub → Actions tab
- [ ] Click "Daily Congressional Trades Sync"
- [ ] Click "Run workflow" → "Run workflow"
- [ ] Wait ~5 minutes
- [ ] Verify success (green checkmark)
- [ ] Check logs for any errors

---

## Post-Deployment

### Verify Everything Works:
- [ ] Frontend accessible at Vercel URL
- [ ] Backend accessible at Render URL
- [ ] Database has trades data
- [ ] Redis cache working
- [ ] GitHub Action runs successfully
- [ ] UptimeRobot pinging backend

### Optional Enhancements:
- [ ] Set up custom domain (Vercel + Cloudflare)
- [ ] Configure Sentry error tracking
- [ ] Add Google Analytics
- [ ] Share with friends!

---

## Troubleshooting

If something doesn't work, check:

1. **Render logs** (Dashboard → Logs tab)
2. **Vercel deployment logs** (Deployments → View build logs)
3. **Browser console** (F12 → Console tab)
4. **GitHub Actions logs** (Actions tab → Click workflow run)
5. [docs/DEPLOYMENT.md#troubleshooting](docs/DEPLOYMENT.md#troubleshooting)

### Common Issues & Solutions:

#### ❌ "Connection terminated due to connection timeout" during deployment
**Cause:** Neon database took longer than 15 seconds to wake from sleep (rare on free tier)

**Solution:**
1. Go to Render dashboard → Your service
2. Click "Manual Deploy" → "Deploy latest commit"
3. Watch logs - the retry logic (5 attempts) should handle it
4. If still failing after 3 manual deploys, check your `DATABASE_URL` is correct

#### ❌ "Migration failed" or "server cannot start safely"
**Cause:** Database connection issues or invalid migration SQL

**Solution:**
1. Verify `DATABASE_URL` environment variable is correct in Render
2. Test connection: `psql "<your-database-url>" -c "SELECT 1"`
3. Check Neon dashboard - database should be active (green)
4. Trigger manual deploy after confirming DATABASE_URL

#### ❌ Deployment shows "Live" but health endpoint returns 502
**Cause:** Server crashed after startup or build output is incorrect

**Solution:**
1. Check Render logs for error messages after "Server running on port 3001"
2. Verify build command is: `npm install && npm run build`
3. Verify start command is: `npm start`
4. Check that `dist/server.js` exists in build output

#### ⚠️ "ChangeWarning: The onLimitReached configuration option is deprecated"
**Cause:** Old express-rate-limit configuration (already fixed in latest code)

**Solution:** This is just a warning and won't break anything. Update to latest code:
```bash
git pull origin master
```

#### 🐌 Slow first request (15-30 seconds)
**Cause:** Render free tier spins down after 15 minutes of inactivity

**Solution:**
1. This is expected behavior on free tier
2. Set up UptimeRobot (Step 9) to ping every 5 minutes
3. Or upgrade to Render paid plan ($7/month for always-on)

---

## 🎉 Deployment Complete!

Your Congressional Trading Transparency Platform is now live!

**URLs:**
- Frontend: `https://your-app.vercel.app`
- Backend: `https://your-backend.onrender.com`
- API Docs: `https://your-backend.onrender.com/api/v1`

**Free Services Used:**
- ✅ Vercel (Frontend)
- ✅ Render (Backend)
- ✅ Neon (PostgreSQL)
- ✅ Upstash (Redis)
- ✅ GitHub Actions (Daily Sync)
- ✅ UptimeRobot (Monitoring)

**Total Monthly Cost: $0** 💰

---

## 📝 Recent Deployment History

### 2025-10-27: Successful Production Deployment ✅

**Deployment:** https://congresstracker-backend.onrender.com

**Status:** 🟢 Live and Healthy

**Key Metrics:**
- Database connection: 1.8s (first attempt)
- Migrations: 215ms
- Historical data: 39,587 trades (14,587 Senate + 25,000 House)
- Zero deprecation warnings
- Build time: ~5 minutes
- Health endpoint response time: <200ms

**Fixes Applied:**
- Increased database connection timeout from 2s → 15s for Neon cold starts
- Increased idle timeout from 30s → 60s for serverless compatibility
- Added exponential backoff retry logic to migration runner (5 attempts)
- Fixed express-rate-limit deprecation warning (v7 compatible)

**Commit:** `7162e78` - "fix: Resolve Neon database connection timeouts and rate limiter deprecation"

---

**Next:** Monitor your deployment and enjoy your live app!
