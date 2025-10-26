# Render Deployment Guide

This guide will help you deploy MyTripPlannerAI to Render and fix the OAuth and database connectivity issues.

## Issues Fixed

✅ Backend URLs now properly fallback to Render URL in production  
✅ OAuth callback URLs now work correctly  
✅ CORS configuration handles production URLs  
✅ Cookie settings updated for cross-origin support  
✅ Frontend API calls now use relative URLs in production

## Step 1: Configure Environment Variables in Render

Go to your Render dashboard → Your Web Service → Environment tab and add the following variables:

### Required Environment Variables

```bash
# Database (REQUIRED)
DATABASE_URL=your_postgres_connection_string

# Base URL (REQUIRED for production)
BASE_URL=https://mytripplannerai.onrender.com

# Google OAuth (REQUIRED for Google login)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Session Secret (REQUIRED - generate a strong random string)
SESSION_SECRET=generate_a_strong_random_secret_here

# Optional: Override these if you have a separate frontend
FRONTEND_URL=https://mytripplannerai.onrender.com
BACKEND_URL=https://mytripplannerai.onrender.com

# Node Environment
NODE_ENV=production
```

### Generate a Session Secret

Run this command to generate a secure session secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Step 2: Configure Google OAuth

### Update Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Select your OAuth 2.0 Client ID
3. Add the following to **Authorized redirect URIs**:
   ```
   https://mytripplannerai.onrender.com/auth/google/callback
   https://mytripplannerai.onrender.com/auth/google/link/callback
   ```
4. Make sure your OAuth consent screen is configured

### Current Callback URLs
Your app will use these callback URLs (configured in the code):
- Login/Signup: `https://your-app.onrender.com/auth/google/callback`
- Account Linking: `https://your-app.onrender.com/auth/google/link/callback`

## Step 3: Set Up PostgreSQL Database

### Option A: Using Render's PostgreSQL

1. In Render dashboard, create a **PostgreSQL** instance
2. Copy the **Internal Database URL** or **External Database URL**
3. Set as `DATABASE_URL` in your web service environment

### Option B: Using External Database (e.g., Neon, Supabase)

1. Get your PostgreSQL connection string
2. Set as `DATABASE_URL` in environment variables
3. Example format: `postgresql://user:password@host:port/database?sslmode=require`

### Run Database Migrations

The app will automatically create tables on first start, or you can run migrations manually:

```bash
# SSH into your Render instance or use Render Shell
cd backend
psql $DATABASE_URL -f migrations/001_create_app_recommendations_history.sql
psql $DATABASE_URL -f migrations/002_create_unified_recommendations_history.sql
psql $DATABASE_URL -f migrations/003_drop_old_app_recommendations_history.sql
psql $DATABASE_URL -f migrations/004_add_gemini_api_key.sql
```

## Step 4: Update Build Settings

In your Render Web Service settings:

### Build Command
```bash
cd .. && npm install && npm run build
```

### Start Command
```bash
cd backend && npm start
```

### Root Directory
Leave empty (default)

## Step 5: Test the Deployment

After deploying:

1. **Test Regular Login/Register**
   - Go to your deployed site
   - Try creating an account with email/password
   - Verify database connection works

2. **Test Google OAuth**
   - Click "Login with Google"
   - Should redirect to your deployed site (not localhost:5000)
   - Verify authentication completes

3. **Check Logs**
   - Go to Render dashboard → Logs
   - Look for environment configuration output
   - Should see your BASE_URL and that DATABASE_URL is set

## Step 6: Troubleshooting

### Issue: Still redirecting to localhost:5000

**Solution**: 
- Verify `BASE_URL` environment variable is set correctly
- Check that `NODE_ENV=production` is set
- Look at server logs to see what URL it's using

### Issue: CORS errors

**Solution**:
- Verify `FRONTEND_URL` or `BASE_URL` is set
- The frontend should be served from the same domain as backend

### Issue: Database connection error

**Solution**:
- Verify `DATABASE_URL` is set
- Check database is accessible from Render (use external URL if needed)
- SSL connection may be required: add `?sslmode=require` to connection string

### Issue: Google OAuth callback fails

**Solution**:
- Verify callback URLs in Google Cloud Console match exactly
- Check that `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set
- Make sure your app is not in "Testing" mode in Google Cloud (or add test users)

### Issue: Session not persisting

**Solution**:
- Cookies now use `sameSite: 'none'` in production for cross-origin
- Verify `SESSION_SECRET` is set
- Check browser console for cookie issues

## Environment Variable Reference

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `DATABASE_URL` | Yes | PostgreSQL connection string | `postgresql://user:pass@host:5432/db?sslmode=require` |
| `BASE_URL` | Yes | Your app's public URL | `https://mytripplannerai.onrender.com` |
| `GOOGLE_CLIENT_ID` | Yes | Google OAuth client ID | `12345.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Yes | Google OAuth client secret | `GOCSPX-...` |
| `SESSION_SECRET` | Yes | Secret for session encryption | Random hex string |
| `NODE_ENV` | Yes | Set to `production` | `production` |
| `FRONTEND_URL` | No | Override frontend URL | Same as BASE_URL usually |
| `BACKEND_URL` | No | Override backend URL | Same as BASE_URL usually |

## Quick Start Commands

### Local Testing
```bash
# Backend
cd backend
npm install
npm run dev

# Frontend (in root)
npm install
npm run dev
```

### Production Deployment Checklist

- [ ] Environment variables set in Render
- [ ] Google OAuth callback URLs updated
- [ ] Database created and accessible
- [ ] BASE_URL points to your Render URL
- [ ] SESSION_SECRET is a strong random string
- [ ] Build and start commands configured
- [ ] Application deployed and accessible

## Additional Notes

- **SSL/TLS**: Render provides automatic SSL certificates
- **Static Files**: The backend serves the built React app from `/dist`
- **API Routes**: All API routes are prefixed with `/api/`
- **Health Check**: Render will automatically check your app at the root URL

## Support

If you encounter issues:
1. Check Render logs for error messages
2. Verify all environment variables are set
3. Check database connectivity
4. Verify Google OAuth credentials in Google Cloud Console

