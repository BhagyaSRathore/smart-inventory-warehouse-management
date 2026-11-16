# 🔧 FIX LOGIN ISSUE - PERMANENT SOLUTION

## ❌ Current Problem

**Error:** "Login failed" 

**Root Cause:** Backend cannot connect to Supabase database

**Error in logs:** `getaddrinfo ENOTFOUND db.qjabjuiahlsoxfbbnsbo.supabase.co`

---

## ✅ PERMANENT FIX - Follow These Steps

### **Step 1: Get Correct Supabase Connection String**

1. **Go to Supabase Dashboard:** https://supabase.com/dashboard
2. **Click on your project** (the one you created)
3. **Go to Settings** (gear icon) → **Database**
4. **Scroll down to "Connection String" section**
5. **Select "Direct connection"** (NOT Session or Transaction pooler)
6. **Copy the full connection string**

**IMPORTANT:** The correct format should be:
```
postgresql://postgres.[project-ref]:[YOUR-PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres
```

**Key differences from what you have:**
- Port should be **6543** (NOT 5432)
- Hostname should end with `.pooler.supabase.com` (NOT just `.supabase.co`)
- Should have `[project-ref]` in the postgres username

---

### **Step 2: Update Backend .env File**

1. **Open:** `backend/.env`
2. **Replace the DATABASE_URL with the correct one from Supabase**
3. **Save the file**

Example `.env` file:
```env
DATABASE_URL=postgresql://postgres.[YOUR-PROJECT-REF]:[PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres
JWT_SECRET=085514f0c5376a710a3aaa0f21d51b862e3377583273b1054e80b95ba57b3805
NODE_ENV=development
PORT=5000
```

---

### **Step 3: Ensure Database Schema is Correct**

**You MUST run these SQL files in Supabase SQL Editor (in order):**

#### A. Drop Old Table (if it exists)
```sql
DROP TABLE IF EXISTS "app_user" CASCADE;
```

#### B. Run supabase-schema.sql
1. Open `supabase-schema.sql` from your project
2. Copy the ENTIRE file
3. Paste into Supabase SQL Editor
4. Click "Run"
5. Should see: "Database schema created successfully!"

#### C. Run supabase-seed.sql
1. Open `supabase-seed.sql` from your project
2. Copy the ENTIRE file  
3. Paste into Supabase SQL Editor
4. Click "Run"
5. Should see: "Seed data inserted successfully!"

---

### **Step 4: Verify Database is Ready**

Run this test script:

```bash
cd backend
node test-db.js
```

**Expected output:**
```
✅ Connected to database
✅ app_user table exists
Columns in app_user table:
   - id (integer)
   - email (text)
   - username (text)
   - passwordHash (text)    ← MUST be "passwordHash" not "password"!
   - name (text)
   - role (text)
   - phone (text)
   - fcmToken (text)
   - createdAt (timestamp with time zone)
   - updatedAt (timestamp with time zone)
✅ Admin user exists:
   ID: 1
   Email: admin@inventory.com
   Username: admin
   Role: ADMIN
   Password Hash: EXISTS (length: 60)
✅ Database is ready! Login should work.
```

**If you see "Password Hash: MISSING!"**, you need to re-run `supabase-seed.sql`!

**If column is named "password" instead of "passwordHash"**, you need to drop the table and re-run the schema!

---

### **Step 5: Restart Backend**

```bash
cd backend
npm run dev
```

Should see:
```
Server running on http://localhost:5000
```

No database errors!

---

### **Step 6: Test Login**

1. Open: http://localhost:5173
2. Login with:
   - Email: `admin@inventory.com`
   - Password: `admin123`
3. **Should work!** ✅

---

## 🔍 Troubleshooting

### Issue: "getaddrinfo ENOTFOUND" error

**Solution:** Your DATABASE_URL is incorrect. Get the correct connection string from Supabase Dashboard → Settings → Database → Connection String (Direct connection).

### Issue: "column passwordHash does not exist"

**Solution:** 
1. Drop the table: `DROP TABLE IF EXISTS "app_user" CASCADE;`
2. Re-run `supabase-schema.sql` 
3. Re-run `supabase-seed.sql`

### Issue: "Invalid email/username or password"

**Solution:** 
1. Run `node test-db.js` to check if admin user exists
2. If password hash is MISSING, re-run `supabase-seed.sql`
3. Make sure column is named `passwordHash` (not `password`)

### Issue: Still can't connect after correct DATABASE_URL

**Possible causes:**
1. **Firewall blocking connection** - Check your firewall/antivirus
2. **Supabase project paused** - Check Supabase dashboard
3. **Wrong password in connection string** - Verify password is correct
4. **Network/DNS issue** - Try from a different network

---

## 📋 Checklist for Permanent Fix

- [ ] Get correct Supabase connection string (port 6543, .pooler.supabase.com)
- [ ] Update `backend/.env` with correct DATABASE_URL
- [ ] Drop old app_user table in Supabase
- [ ] Run `supabase-schema.sql` in Supabase SQL Editor
- [ ] Run `supabase-seed.sql` in Supabase SQL Editor
- [ ] Verify with `node test-db.js` (should show passwordHash EXISTS)
- [ ] Restart backend (`npm run dev`)
- [ ] Test login at http://localhost:5173
- [ ] Update Render environment variable with correct DATABASE_URL
- [ ] Redeploy Render backend
- [ ] Test production login at Vercel URL

---

## 🎯 Summary

The issue is caused by:
1. ❌ **Wrong DATABASE_URL** - Cannot connect to Supabase
2. ❌ **Wrong column name** - Database has `password` but Prisma expects `passwordHash`

**Fix both issues and login will work permanently!**

---

## 💡 For Production (Render)

Once local login works, update Render:

1. Go to Render Dashboard
2. Click on your backend service
3. Go to "Environment" tab
4. Update `DATABASE_URL` with the CORRECT Supabase connection string
5. Save and wait for auto-redeploy
6. Test production login at your Vercel URL

---

**After following these steps, login will work both locally and in production!** 🎉
