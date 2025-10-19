# 🚀 Quick Start: Deploy in 2 Hours

**Deploy your Congressional Trading Tracker to production on 100% FREE tier services.**

---

## Prerequisites (5 minutes)

1. ✅ GitHub account
2. ✅ Code pushed to GitHub
3. ✅ FMP API key ([get free](https://financialmodelingprep.com))
4. ✅ Node.js 20+ installed locally

---

## 🔥 Fast Track (The TL;DR Version)

### 1. Generate Secrets (2 minutes)

```bash
node scripts/generate-secrets.js
```

Save the output somewhere safe!

### 2. Sign Up for Services (10 minutes)

| Service | Link | What For |
|---------|------|----------|
| Neon | [neon.tech](https://neon.tech) | PostgreSQL Database |
| Upstash | [upstash.com](https://upstash.com) | Redis Cache |
| Render | [render.com](https://render.com) | Backend API |
| Vercel | [vercel.com](https://vercel.com) | Frontend App |

Sign up for all 4 using your GitHub account (one-click).

### 3. Database Setup (15 minutes)

**Neon:**
1. Create project "congresstracker"
2. Copy connection string
3. Run migration:
   ```bash
   psql "postgresql://..." -f backend/migrations/001_initial_schema.sql
   ```

**Upstash:**
1. Create database "congresstracker-cache"
2. Copy Redis connection string

### 4. Deploy Backend (20 minutes)

**Render.com:**
1. New Web Service → Connect GitHub repo
2. Root directory: `backend`
3. Build: `npm install && npm run build`
4. Start: `npm start`
5. Plan: **Free**
6. Add environment variables (see checklist)
7. Deploy!
8. Go to Shell → Run: `npm run sync:now` (initial data)

### 5. Deploy Frontend (15 minutes)

**Vercel:**
1. Import GitHub project
2. Root directory: `frontend`
3. Add environment variables (use Render backend URL)
4. Deploy!
5. Update `CORS_ORIGIN` in Render with Vercel URL
6. Update Vercel env vars with actual Vercel URL
7. Redeploy

### 6. Setup Monitoring (10 minutes)

**UptimeRobot:**
- Monitor: `https://your-backend.onrender.com/health`
- Interval: 5 minutes

**GitHub Actions:**
- Add secrets: `DATABASE_URL`, `REDIS_URL`, `FMP_API_KEY`
- Test workflow manually

### 7. Done! 🎉

Open `https://your-app.vercel.app` and enjoy!

---

## 📚 Need More Details?

- **Full Guide**: [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) (step-by-step with screenshots)
- **Checklist**: [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md) (every single step)
- **Troubleshooting**: [docs/DEPLOYMENT.md#troubleshooting](docs/DEPLOYMENT.md#troubleshooting)

---

## 💰 Cost Breakdown

| Service | Free Tier | Your Usage | Status |
|---------|-----------|------------|--------|
| Vercel | 100 GB/month | ~5-10 GB | ✅ Safe |
| Render | 750 hours/month | 720 hours | ✅ Safe |
| Neon | 500 MB | ~10-20 MB | ✅ Safe |
| Upstash | 10K commands/day | ~2.4K/day | ✅ Safe |
| GitHub Actions | 2000 min/month | ~300 min | ✅ Safe |

**Total: $0/month** 🎊

---

## ⚡ Time Breakdown

| Step | Time |
|------|------|
| Generate secrets | 2 min |
| Sign up services | 10 min |
| Database setup | 15 min |
| Backend deploy | 20 min |
| Initial data sync | 10 min |
| Frontend deploy | 15 min |
| Connect services | 10 min |
| Monitoring setup | 10 min |
| Testing | 15 min |
| **TOTAL** | **~2 hours** |

---

## 🆘 Quick Help

**Backend won't start?**
→ Check `DATABASE_URL` and `REDIS_URL` in Render env vars

**Frontend shows "Failed to fetch"?**
→ Check `CORS_ORIGIN` in Render matches your Vercel URL exactly

**No trades showing?**
→ Did you run `npm run sync:now` in Render shell?

**Slow backend response?**
→ Normal for Render free tier (cold start). Set up UptimeRobot!

---

## 🎯 Your Deployment URLs

After deployment, save these:

```
Frontend:  https://congresstracker-<random>.vercel.app
Backend:   https://congresstracker-backend.onrender.com
API:       https://congresstracker-backend.onrender.com/api/v1
Health:    https://congresstracker-backend.onrender.com/health
```

---

## ✅ Verify It Works

```bash
# Quick test script
./scripts/verify-deployment.sh
```

Or manually:

```bash
# Test backend
curl https://your-backend.onrender.com/health

# Test frontend
open https://your-app.vercel.app
```

---

**Ready? Let's deploy!** 🚀

Follow the detailed guide: [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)
