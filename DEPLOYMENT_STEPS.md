# Smart Inventory System - Production Deployment Guide

## ✅ Completed Steps

### 1. Database Setup (Supabase) - DONE ✓
- [x] Created Supabase account and project
- [x] Updated Prisma schema to use `app_user` table (PostgreSQL reserved keyword fix)
- [x] Ran `supabase-schema.sql` to create all tables
- [x] Ready to run `supabase-seed.sql` to populate initial data

**Admin Login Credentials:**
- Email: `admin@inventory.com`
- Password: `admin123`

---

## 📋 Next Steps

### 2. Deploy Backend to Railway

1. **Create Railway Account**
   - Go to https://railway.app/
   - Sign up with GitHub (free, no credit card required)

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Connect your GitHub account if not already connected
   - Select: `BhagyaSRathore/smart-inventory-warehouse-management`

3. **Configure Backend Service**
   - Railway will detect the backend folder
   - Set **Root Directory**: `backend`
   - Set **Start Command**: `npm start`

4. **Add Environment Variables**
   
   Click on your backend service → Variables → Add the following:

   ```env
   NODE_ENV=production
   PORT=5000
   DATABASE_URL=<your-supabase-connection-string>
   JWT_SECRET=<generate-a-random-secret>
   GEMINI_API_KEY=<your-gemini-api-key-optional>
   ```

   **How to get values:**
   - `DATABASE_URL`: From Supabase → Project Settings → Database → Connection String (Direct connection)
     - Format: `postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres`
   - `JWT_SECRET`: Generate with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
   - `GEMINI_API_KEY`: Optional - get from https://makersuite.google.com/app/apikey

5. **Deploy Backend**
   - Railway will automatically deploy
   - Wait for deployment to complete (2-3 minutes)
   - Copy the backend URL: `https://your-backend.railway.app`

---

### 3. Deploy ML Service to Railway

1. **Add New Service to Same Project**
   - In Railway project, click "+ New"
   - Select "GitHub Repo"
   - Choose same repo: `BhagyaSRathore/smart-inventory-warehouse-management`

2. **Configure ML Service**
   - Set **Root Directory**: `ml-service`
   - Set **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`

3. **Add Environment Variables**
   
   ```env
   PORT=8000
   ```

4. **Deploy ML Service**
   - Railway will automatically deploy
   - Copy the ML service URL: `https://your-ml-service.railway.app`

---

### 4. Deploy Frontend to Vercel

1. **Create Vercel Account**
   - Go to https://vercel.com/
   - Sign up with GitHub (free, no credit card required)

2. **Import Project**
   - Click "Add New" → "Project"
   - Import: `BhagyaSRathore/smart-inventory-warehouse-management`

3. **Configure Frontend**
   - **Framework Preset**: Vite
   - **Root Directory**: `web`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

4. **Add Environment Variables**
   
   Click "Environment Variables" → Add:

   ```env
   VITE_API_BASE_URL=https://your-backend.railway.app
   ```

   Replace `https://your-backend.railway.app` with your actual Railway backend URL from step 2.5

5. **Deploy Frontend**
   - Click "Deploy"
   - Wait for deployment (2-3 minutes)
   - Copy your frontend URL: `https://your-app.vercel.app`

---

### 5. Update Backend CORS

1. **Go Back to Railway Backend**
   - Open backend service → Variables
   - Add new variable:

   ```env
   FRONTEND_URL=https://your-app.vercel.app
   ```

2. **Update server.js CORS Configuration**
   
   The backend should already have this code (verify if needed):
   ```javascript
   app.use(cors({
     origin: process.env.FRONTEND_URL || 'http://localhost:5173',
     credentials: true
   }));
   ```

3. **Redeploy Backend**
   - Railway will automatically redeploy with new environment variable

---

## 🧪 Testing Your Deployment

### Test Checklist:

1. **Backend Health Check**
   - Visit: `https://your-backend.railway.app/health`
   - Should return: `{"status":"ok"}`

2. **ML Service Health Check**
   - Visit: `https://your-ml-service.railway.app/health`
   - Should return: `{"status":"healthy"}`

3. **Frontend Access**
   - Visit: `https://your-app.vercel.app`
   - You should see the login page

4. **Login Test**
   - Email: `admin@inventory.com`
   - Password: `admin123`
   - Should successfully log in and see dashboard

5. **Full Feature Test**
   - ✅ Dashboard displays correctly
   - ✅ Inventory page loads products
   - ✅ Stock operations work (IN/OUT/TRANSFER/ADJUST)
   - ✅ Warehouse and Rack management works
   - ✅ Orders can be created
   - ✅ AI Assistant responds (if GEMINI_API_KEY configured)
   - ✅ ML Predictions work
   - ✅ Notifications display

---

## 🔧 Troubleshooting

### Issue: Backend deployment fails
- **Check Logs**: Railway → Backend Service → Deployments → View Logs
- **Common Issues**:
  - Missing environment variables
  - Database connection string incorrect
  - Node version mismatch (use Node 18+)

### Issue: Frontend can't connect to backend
- **Check CORS**: Ensure `FRONTEND_URL` is set in Railway
- **Check API URL**: Verify `VITE_API_BASE_URL` in Vercel matches Railway backend URL
- **Check Browser Console**: Look for CORS or network errors

### Issue: Database errors
- **Check Connection**: Verify Supabase connection string is correct
- **Check Tables**: Ensure both SQL files were run successfully in Supabase
- **Check Supabase Status**: Visit Supabase dashboard → Project Settings

### Issue: ML predictions not working
- **Check ML Service**: Verify ML service is running on Railway
- **Check Backend Environment**: Ensure backend can reach ML service
- **May need to update backend code** with ML service URL

---

## 📝 Post-Deployment Tasks

### 1. Change Admin Password
- Login with default credentials
- Go to Profile → Change Password
- Set a strong password

### 2. Create Additional Users
- Go to Users Management (Admin only)
- Add warehouse staff, managers as needed

### 3. Configure Warehouse Structure
- Add your warehouses
- Add racks to warehouses
- Add categories and suppliers

### 4. Import Products
- Add products with SKUs and barcodes
- Set reorder levels and safety stock
- Assign to categories and suppliers

### 5. Set Up Notifications (Optional)
- Configure Firebase Cloud Messaging if needed
- Add FCM service account JSON

---

## 🔒 Security Recommendations

1. **Change Default Credentials** immediately
2. **Use Strong JWT Secret** (32+ character random string)
3. **Enable HTTPS Only** (Railway and Vercel provide this by default)
4. **Rotate Secrets Regularly** (JWT_SECRET, database passwords)
5. **Review User Roles** and permissions
6. **Monitor Logs** for suspicious activity
7. **Keep Dependencies Updated** regularly

---

## 💰 Cost Estimate

**Total Monthly Cost: $0** 🎉

- **Supabase Free Tier**: Up to 500MB database, 2GB bandwidth
- **Railway Free Tier**: $5 credit/month (backend + ML service should fit)
- **Vercel Free Tier**: 100GB bandwidth, unlimited deployments

**Note**: Railway provides $5/month credit. If usage exceeds this:
- Backend: ~$0.000463/GB-hour RAM + $0.000002/vCPU-second
- ML Service: Similar pricing

---

## 📞 Support

If you encounter issues:

1. Check the logs in Railway/Vercel dashboards
2. Review the Troubleshooting section above
3. Verify all environment variables are set correctly
4. Ensure Supabase database is populated with seed data

---

## 🎉 Congratulations!

Once all steps are complete, you'll have a fully deployed Smart Inventory & Warehouse Management System running on production-grade infrastructure, completely free!

**Your URLs:**
- Frontend: `https://your-app.vercel.app`
- Backend API: `https://your-backend.railway.app`
- ML Service: `https://your-ml-service.railway.app`
- Database: Supabase (managed PostgreSQL)

