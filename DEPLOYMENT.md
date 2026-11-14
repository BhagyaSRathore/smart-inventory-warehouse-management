# Quick Deployment Guide

## 🚀 Fastest Way to Deploy (5 minutes)

### Option A: Deploy to Render (Recommended - FREE)

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Ready for deployment"
   git remote add origin https://github.com/YOUR_USERNAME/inventory-system.git
   git push -u origin main
   ```

2. **Deploy on Render**
   - Go to https://render.com
   - Sign up with GitHub
   - Click "New +" → "Blueprint"
   - Select your repository
   - Wait 5-10 minutes for deployment

3. **Done!** Your app is live at:
   - Frontend: `https://inventory-frontend.onrender.com`
   - Backend: `https://inventory-backend.onrender.com`
   - ML Service: `https://inventory-ml-service.onrender.com`

### Option B: Deploy to Vercel + Railway (FREE)

1. **Deploy Database (Railway)**
   - Go to https://railway.app
   - Create new project → PostgreSQL
   - Copy connection URL

2. **Deploy Backend (Railway)**
   - New service → Your GitHub repo → `backend` folder
   - Add environment variables:
     ```
     DATABASE_URL=postgresql://...
     JWT_SECRET=your_secret_key
     NODE_ENV=production
     ```

3. **Deploy Frontend (Vercel)**
   - Go to https://vercel.com
   - Import repository → Select `web` folder
   - Add environment variable:
     ```
     VITE_API_BASE_URL=https://your-backend.railway.app/api
     ```

4. **Done!** Your app is live at:
   - Frontend: `https://your-app.vercel.app`

---

## 📋 Pre-Deployment Checklist

- [ ] All environment variables configured
- [ ] Database seeded with initial data
- [ ] CORS configured for production URLs
- [ ] SSL/HTTPS enabled
- [ ] Test all features locally

---

## 🔑 Important Environment Variables

### Backend
```env
DATABASE_URL=postgresql://user:pass@host:5432/dbname
JWT_SECRET=minimum_32_characters_long_secret_key
NODE_ENV=production
ML_API_URL=https://your-ml-service-url
PORT=5000
GEMINI_API_KEY=your_key_optional
```

### Frontend
```env
VITE_API_BASE_URL=https://your-backend-url/api
```

### ML Service
No environment variables needed!

---

## 🧪 Test Your Deployment

### Test Backend
```bash
curl https://your-backend-url/api/auth/login \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@inventory.com","password":"admin123"}'
```

### Test ML Service
```bash
curl https://your-ml-service-url/health
```

### Test Frontend
Open in browser: `https://your-frontend-url`

---

## 🆘 Common Issues

**"Cannot connect to database"**
- Verify DATABASE_URL is correct
- Check database is running
- Ensure firewall allows connections

**"CORS error"**
- Update `backend/server.js` CORS config
- Add your frontend URL to allowed origins

**"502 Bad Gateway"**
- Backend not running
- Check logs in platform dashboard

---

## 📱 Default Login

```
Email: admin@inventory.com
Password: admin123
```

**⚠️ Change this immediately after first login!**

---

## 📊 Free Tier Limits

### Render
- 750 hours/month per service
- 1GB database storage
- Services sleep after 15 min inactivity

### Vercel
- Unlimited bandwidth
- 100GB hours/month

### Railway
- $5 free credit/month
- Automatic sleep after inactivity

---

## 🔒 Security Checklist

- [ ] Change default admin password
- [ ] Set strong JWT_SECRET
- [ ] Enable HTTPS
- [ ] Configure CORS properly
- [ ] Set up database backups
- [ ] Enable rate limiting
- [ ] Review logs regularly

---

## 📈 Monitoring

Set up free monitoring:
- **Uptime:** UptimeRobot.com
- **Errors:** Sentry.io
- **Analytics:** Google Analytics

---

## 🔄 Update Deployment

### Render (Auto-deploys on git push)
```bash
git add .
git commit -m "Update feature"
git push
```

### Manual Update
```bash
# SSH into server
cd /var/www/inventory-system
git pull
pm2 restart all
```

---

For detailed deployment instructions, see the full deployment guide in the artifacts.
