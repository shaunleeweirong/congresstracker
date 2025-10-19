# 🚀 Production Deployment Guide

Complete step-by-step guide for deploying the Congressional Trading Transparency Platform to production using **100% free tier services**.

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Architecture](#architecture)
4. [Step 1: Generate Secrets](#step-1-generate-secrets)
5. [Step 2: Set Up Database (Neon)](#step-2-set-up-database-neon)
6. [Step 3: Set Up Redis (Upstash)](#step-3-set-up-redis-upstash)
7. [Step 4: Deploy Backend (Render)](#step-4-deploy-backend-render)
8. [Step 5: Initial Data Sync](#step-5-initial-data-sync)
9. [Step 6: Deploy Frontend (Vercel)](#step-6-deploy-frontend-vercel)
10. [Step 7: Connect Services](#step-7-connect-services)
11. [Step 8: Set Up Monitoring](#step-8-set-up-monitoring)
12. [Step 9: Configure Daily Sync](#step-9-configure-daily-sync)
13. [Troubleshooting](#troubleshooting)
14. [Free Tier Limits](#free-tier-limits)

---

## Overview

This deployment uses completely free services:

| Service | Purpose | Free Tier |
|---------|---------|-----------|
| **Vercel** | Frontend hosting | 100 GB bandwidth/month |
| **Render** | Backend API | 750 hours/month (24/7) |
| **Neon** | PostgreSQL Database | 500 MB storage |
| **Upstash** | Redis Cache | 10,000 commands/day |
| **GitHub Actions** | Daily data sync | 2,000 minutes/month |

**Total Cost: $0/month** 🎉

---

## Prerequisites

Before starting, ensure you have:

- ✅ GitHub account (for repository access)
- ✅ Git installed locally
- ✅ Node.js 20+ installed
- ✅ Financial Modeling Prep API key ([get free key](https://financialmodelingprep.com))
- ✅ Code pushed to GitHub repository

---

## Architecture

```
┌─────────────────┐
│  User Browser   │
└────────┬────────┘
         │
         ↓
┌─────────────────┐       ┌──────────────────┐
│  Vercel         │◄──────┤  GitHub          │
│  (Frontend)     │       │  (Source Code)   │
└────────┬────────┘       └──────────────────┘
         │
         │ API Calls
         ↓
┌─────────────────┐       ┌──────────────────┐
│  Render.com     │◄──────┤  GitHub Actions  │
│  (Backend API)  │       │  (Daily Sync)    │
└────────┬────────┘       └──────────────────┘
         │
         ├──────────────┐
         │              │
         ↓              ↓
┌─────────────────┐  ┌──────────────────┐
│  Neon           │  │  Upstash         │
│  (PostgreSQL)   │  │  (Redis)         │
└─────────────────┘  └──────────────────┘
```

---

## Step 1: Generate Secrets

Generate secure cryptographic secrets for production.

```bash
# Navigate to project root
cd /path/to/congresstracker

# Run secret generator
node scripts/generate-secrets.js
```

**Output:**
```
🔐 Generating Production Secrets...

═══════════════════════════════════════════════════════════════

📝 JWT_SECRET (for backend):
a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2

📝 NEXTAUTH_SECRET (for frontend):
b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2g3

📝 ADMIN_API_KEY (optional, for GitHub Actions):
c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2g3h4
```

**📝 Save these secrets!** You'll need them for configuration.

---

## Step 2: Set Up Database (Neon)

### 2.1 Sign Up

1. Go to [neon.tech](https://neon.tech)
2. Click "Sign up" → Continue with GitHub
3. Authorize Neon to access your GitHub account

### 2.2 Create Project

1. Click "Create a project"
2. **Project name**: `congresstracker`
3. **Region**: Choose closest to you (e.g., US East, Europe, Asia)
4. **PostgreSQL version**: 15 (default)
5. Click "Create project"

### 2.3 Get Connection String

1. After creation, you'll see the connection details
2. Click "Copy" next to "Connection string"
3. It will look like:
   ```
   postgresql://user:password@ep-random-name-123456.us-east-2.aws.neon.tech/congresstracker?sslmode=require
   ```
4. **Save this connection string!**

### 2.4 Run Database Migration

```bash
# Copy the connection string from Neon
export DATABASE_URL="postgresql://user:password@ep-xxx.neon.tech/congresstracker"

# Connect to database
psql "$DATABASE_URL"
```

In the PostgreSQL prompt:

```sql
-- Run migration script
\i backend/migrations/001_initial_schema.sql

-- Verify tables created
\dt

-- Expected output: 9 tables
-- - users
-- - congressional_members
-- - corporate_insiders
-- - stock_tickers
-- - stock_trades
-- - user_alerts
-- - user_follows
-- - alert_notifications
-- - notification_queue

-- Exit
\q
```

### 2.5 Verify Setup

```bash
# Quick verification
psql "$DATABASE_URL" -c "SELECT count(*) FROM pg_tables WHERE schemaname = 'public';"

# Should show: count = 9
```

✅ **Database setup complete!**

---

## Step 3: Set Up Redis (Upstash)

### 3.1 Sign Up

1. Go to [upstash.com](https://upstash.com)
2. Click "Get Started" → Continue with GitHub
3. Authorize Upstash

### 3.2 Create Redis Database

1. Click "Create database"
2. **Name**: `congresstracker-cache`
3. **Type**: Regional (lower latency)
4. **Region**: Choose same as your Neon database
5. **Eviction**: No eviction (default)
6. Click "Create"

### 3.3 Get Connection String

1. After creation, go to "Details" tab
2. Scroll to "REST API" section
3. Copy the **Redis Connection String** (not REST URL)
4. It will look like:
   ```
   redis://default:AbCdEfGhIjKlMnOpQrStUvWxYz123456@global-wealthy-1234.upstash.io:6379
   ```
5. **Save this connection string!**

### 3.4 Test Connection (Optional)

```bash
# Install redis-cli if you don't have it
# macOS: brew install redis
# Ubuntu: sudo apt install redis-tools

# Test connection
redis-cli -u "redis://default:password@host.upstash.io:6379" PING

# Expected output: PONG
```

✅ **Redis setup complete!**

---

## Step 4: Deploy Backend (Render)

### 4.1 Sign Up

1. Go to [render.com](https://render.com)
2. Click "Get Started" → Continue with GitHub
3. Authorize Render to access your repositories

### 4.2 Create Web Service

1. Click "New +" → "Web Service"
2. Find and select your repository: `shaunleeweirong/congresstracker`
3. Click "Connect"

### 4.3 Configure Service

**Basic Settings:**
- **Name**: `congresstracker-backend`
- **Region**: Same as your Neon/Upstash region
- **Branch**: `master` (or `main`)
- **Root Directory**: `backend`
- **Runtime**: Node
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`

**Advanced Settings:**
- **Plan**: Free
- **Health Check Path**: `/health`
- **Auto-Deploy**: Yes (recommended)

### 4.4 Add Environment Variables

Click "Advanced" → "Add Environment Variable" and add each:

| Key | Value | Source |
|-----|-------|--------|
| `NODE_ENV` | `production` | Manual |
| `PORT` | `3001` | Manual |
| `DATABASE_URL` | `postgresql://...` | From Neon (Step 2.3) |
| `REDIS_URL` | `redis://...` | From Upstash (Step 3.3) |
| `JWT_SECRET` | `a1b2c3d4...` | From Step 1 |
| `FMP_API_KEY` | `eZgVpY93...` | Your FMP key |
| `CORS_ORIGIN` | `https://localhost:3000` | Update after Vercel deploy |
| `JWT_EXPIRES_IN` | `7d` | Manual |
| `BCRYPT_ROUNDS` | `12` | Manual |
| `API_VERSION` | `v1` | Manual |
| `LOG_LEVEL` | `info` | Manual |

**Important:** Don't have your Vercel URL yet, so use a placeholder for `CORS_ORIGIN`. We'll update this later.

### 4.5 Deploy

1. Click "Create Web Service"
2. Wait for deployment (~5-10 minutes first time)
3. Watch the logs for any errors

### 4.6 Get Backend URL

Once deployed, you'll see:
```
Your service is live at https://congresstracker-backend.onrender.com
```

**📝 Save this URL!** You'll need it for Vercel configuration.

### 4.7 Test Backend

```bash
# Test health endpoint
curl https://congresstracker-backend.onrender.com/health

# Expected output:
# {"status":"ok","timestamp":"2025-01-20T..."}

# Test API info
curl https://congresstracker-backend.onrender.com/api/v1

# Should return API version and endpoints
```

✅ **Backend deployment complete!**

---

## Step 5: Initial Data Sync

Populate the database with congressional trading data.

### 5.1 Connect to Render Shell

1. Go to Render dashboard
2. Click on "congresstracker-backend" service
3. Click "Shell" tab (top right)
4. Wait for shell to connect

### 5.2 Run Sync Command

In the Render shell:

```bash
# Run initial data sync
npm run sync:now

# This will:
# - Fetch 10 pages of Senate trades (~1,250 trades)
# - Fetch 10 pages of House trades (~1,250 trades)
# - Create congressional members
# - Create stock tickers
# - Takes ~2-3 minutes
```

**Expected output:**
```
🚀 Starting congressional data sync...
📅 Start time: 2025-01-20T02:00:00.000Z

📊 Syncing congressional trading data from FMP API...
  Fetched page 1: 250 Senate trades (total: 250)
  Fetched page 2: 250 Senate trades (total: 500)
  ...
  Fetched page 10: 250 House trades (total: 2500)

✅ Sync completed successfully!
📈 Results:
   - Processed: 2500 trades
   - Created: 2500 new trades
   - Updated: 0 existing trades
   - Skipped: 0 duplicates
   - Errors: 0
   - Duration: 142.56s
```

### 5.3 Verify Data

```bash
# Check trade count
psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM stock_trades;"

# Expected: 2000-3000+ trades

# Check members
psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM congressional_members;"

# Expected: 100-300 members

# Check top traded stocks
psql "$DATABASE_URL" -c "SELECT ticker_symbol, COUNT(*) as count FROM stock_trades GROUP BY ticker_symbol ORDER BY count DESC LIMIT 10;"
```

✅ **Initial data sync complete!**

---

## Step 6: Deploy Frontend (Vercel)

### 6.1 Sign Up

1. Go to [vercel.com](https://vercel.com)
2. Click "Sign Up" → Continue with GitHub
3. Authorize Vercel

### 6.2 Import Project

1. Click "Add New..." → "Project"
2. Import your repository: `shaunleeweirong/congresstracker`
3. Click "Import"

### 6.3 Configure Project

**Framework Preset:** Next.js (auto-detected)

**Root Directory:**
- Click "Edit" next to Root Directory
- Enter: `frontend`
- Click "Continue"

**Build Settings (auto-detected):**
- Build Command: `npm run build`
- Output Directory: `.next`
- Install Command: `npm install`

### 6.4 Add Environment Variables

Click "Environment Variables" and add:

| Key | Value | Source |
|-----|-------|--------|
| `NEXT_PUBLIC_API_URL` | `https://congresstracker-backend.onrender.com/api/v1` | From Step 4.6 |
| `NEXT_PUBLIC_APP_URL` | `https://your-app.vercel.app` | Will update after deploy |
| `NEXTAUTH_SECRET` | `b2c3d4e5...` | From Step 1 |
| `NEXTAUTH_URL` | `https://your-app.vercel.app` | Will update after deploy |
| `NODE_ENV` | `production` | Manual |

**Note:** For `NEXT_PUBLIC_APP_URL` and `NEXTAUTH_URL`, use a placeholder first. We'll update after seeing the actual Vercel URL.

### 6.5 Deploy

1. Click "Deploy"
2. Wait for build (~2-3 minutes)
3. Watch build logs

### 6.6 Get Frontend URL

Once deployed, you'll see:
```
🎉 Congratulations! Your site is live at:
https://congresstracker-abc123.vercel.app
```

### 6.7 Update Environment Variables

1. Copy your actual Vercel URL
2. Go to Project Settings → Environment Variables
3. Update:
   - `NEXT_PUBLIC_APP_URL` → `https://congresstracker-abc123.vercel.app`
   - `NEXTAUTH_URL` → `https://congresstracker-abc123.vercel.app`
4. Redeploy (Vercel will auto-redeploy on env var change)

✅ **Frontend deployment complete!**

---

## Step 7: Connect Services

Now connect frontend and backend.

### 7.1 Update Backend CORS

1. Go to Render dashboard → congresstracker-backend
2. Environment → Edit
3. Find `CORS_ORIGIN`
4. Update value to: `https://congresstracker-abc123.vercel.app`
5. Click "Save Changes"
6. Wait for automatic redeployment (~2 minutes)

### 7.2 Test Connection

1. Open your Vercel app: `https://congresstracker-abc123.vercel.app`
2. You should see the dashboard
3. Open browser DevTools (F12) → Network tab
4. Refresh the page
5. Check for API calls to your Render backend
6. Verify trades are loading

**If you see trades and stock data, it's working!** 🎉

### 7.3 Test Key Features

- ✅ Dashboard displays trades
- ✅ Search functionality works
- ✅ Stock detail pages load
- ✅ Politician detail pages load
- ✅ Dark mode toggle works
- ✅ Mobile responsive

---

## Step 8: Set Up Monitoring

Prevent Render free tier from spinning down.

### 8.1 UptimeRobot (Keep Backend Awake)

1. Go to [uptimerobot.com](https://uptimerobot.com)
2. Sign up (free, no credit card)
3. Click "Add New Monitor"
4. **Monitor Type**: HTTP(s)
5. **Friendly Name**: Congressional Tracker Backend
6. **URL**: `https://congresstracker-backend.onrender.com/health`
7. **Monitoring Interval**: 5 minutes (free tier)
8. Click "Create Monitor"

This pings your backend every 5 minutes, preventing it from spinning down.

### 8.2 Vercel Analytics (Optional)

Already included in Vercel free tier! View at:
- Vercel Dashboard → Your Project → Analytics

---

## Step 9: Configure Daily Sync

Set up automated daily data synchronization.

### 9.1 Add GitHub Secrets

1. Go to your GitHub repository
2. Settings → Secrets and variables → Actions
3. Click "New repository secret"

Add these secrets:

| Name | Value | Source |
|------|-------|--------|
| `DATABASE_URL` | `postgresql://...` | From Neon (Step 2.3) |
| `REDIS_URL` | `redis://...` | From Upstash (Step 3.3) |
| `FMP_API_KEY` | `eZgVpY93...` | Your FMP API key |

### 9.2 Verify GitHub Action

The GitHub Action was created in `.github/workflows/daily-sync.yml`.

It will run:
- **Automatically**: Every day at 2:00 AM UTC
- **Manually**: GitHub → Actions → "Daily Congressional Trades Sync" → "Run workflow"

### 9.3 Test Manual Run

1. Go to GitHub → Actions tab
2. Click "Daily Congressional Trades Sync"
3. Click "Run workflow" → "Run workflow"
4. Wait ~5 minutes
5. Check logs to verify success

✅ **Automated sync configured!**

---

## Troubleshooting

### Frontend shows "Failed to fetch"

**Cause:** CORS not configured correctly

**Fix:**
1. Check Render environment variable `CORS_ORIGIN`
2. Should match your Vercel URL exactly
3. Redeploy backend after changing

### Backend returning 500 errors

**Cause:** Database connection issue

**Fix:**
1. Check Render logs for error details
2. Verify `DATABASE_URL` is correct
3. Test database connection:
   ```bash
   psql "$DATABASE_URL" -c "SELECT 1;"
   ```

### Slow first request (30-60 seconds)

**Cause:** Render free tier cold start

**Expected behavior:** This is normal for free tier
**Fix:** Set up UptimeRobot (Step 8.1)

### GitHub Action sync failing

**Cause:** Missing or incorrect secrets

**Fix:**
1. Verify all three secrets are set in GitHub
2. Check secret values match production
3. Review Action logs for specific error

### No trades showing on dashboard

**Cause:** Data sync hasn't run

**Fix:**
1. Run manual sync: Step 5.2
2. Or trigger GitHub Action: Step 9.3
3. Verify data in database:
   ```bash
   psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM stock_trades;"
   ```

---

## Free Tier Limits

### Vercel (Frontend)
- ✅ 100 GB bandwidth/month
- ✅ Unlimited deployments
- ✅ Automatic HTTPS
- ✅ Custom domain (1 free)

**Estimated usage:** ~5-10 GB/month (well within limits)

### Render (Backend)
- ✅ 750 hours/month (enough for 24/7)
- ✅ 512 MB RAM
- ⚠️  Spins down after 15 min inactivity
- ⚠️  Cold start: ~30-60 seconds

**Mitigation:** UptimeRobot keeps it awake

### Neon (PostgreSQL)
- ✅ 500 MB storage
- ✅ 3 projects
- ✅ 10 branches

**Current usage:** ~10-20 MB for 3,000 trades
**Capacity:** Can hold ~50,000-100,000 trades

### Upstash (Redis)
- ✅ 10,000 commands/day
- ✅ 256 MB storage

**Current usage:** ~2,400 commands/day (24% of limit)
**Safe margin:** 4x under limit

### GitHub Actions
- ✅ 2,000 minutes/month
- ✅ Unlimited public repos

**Daily sync:** ~10 minutes/day = ~300 minutes/month (15% of limit)

---

## Next Steps

Your app is now live! 🚀

**Recommended:**
1. Set up custom domain (optional, $10-15/year)
2. Enable Vercel Analytics
3. Monitor logs for errors
4. Test all features end-to-end
5. Share with friends!

**Monitoring:**
- Vercel Dashboard: Frontend analytics
- Render Dashboard: Backend logs
- GitHub Actions: Sync job history
- UptimeRobot: Uptime monitoring

---

## Support

If you encounter issues:

1. **Check logs:**
   - Render: Dashboard → Logs tab
   - Vercel: Dashboard → Deployments → View build logs
   - GitHub: Actions tab

2. **Review this guide:**
   - Double-check each step
   - Verify all environment variables

3. **Common issues:**
   - See [Troubleshooting](#troubleshooting) section above

---

**Deployment complete!** Your Congressional Trading Transparency Platform is now live and running on 100% free tier infrastructure. 🎉
