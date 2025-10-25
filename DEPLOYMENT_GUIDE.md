# Deployment Guide - TripPlanner AI

## 🚀 Quick Setup

### 1. Environment Variables

**Backend** (`backend/.env`):
```env
NODE_ENV=production
PORT=5000
BASE_URL=https://your-app.herokuapp.com
FRONTEND_URL=https://your-app.herokuapp.com
BACKEND_URL=https://your-app.herokuapp.com
DATABASE_URL=your_postgresql_url
JWT_SECRET=your-jwt-secret
SESSION_SECRET=your-session-secret
ENCRYPTION_KEY=your-encryption-key
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GEMINI_API_KEY=your-gemini-api-key
```

**Frontend** (`.env.local`):
```env
VITE_API_URL=https://your-app.herokuapp.com
VITE_BASE_URL=https://your-app.herokuapp.com
VITE_GOOGLE_CLIENT_ID=your-google-client-id
VITE_GEMINI_API_KEY=your-gemini-api-key
```

### 2. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create OAuth 2.0 credentials
3. Add authorized origins:
   - `https://your-app.herokuapp.com`
4. Add redirect URIs:
   - `https://your-app.herokuapp.com/auth/google/callback`
   - `https://your-app.herokuapp.com/auth/google/link/callback`

### 3. Deploy to Heroku

```bash
# Install Heroku CLI
heroku login
heroku create your-app-name

# Add PostgreSQL
heroku addons:create heroku-postgresql:mini

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET="your-jwt-secret"
heroku config:set SESSION_SECRET="your-session-secret"
heroku config:set ENCRYPTION_KEY="your-encryption-key"
heroku config:set GOOGLE_CLIENT_ID="your-google-client-id"
heroku config:set GOOGLE_CLIENT_SECRET="your-google-client-secret"
heroku config:set GEMINI_API_KEY="your-gemini-api-key"

# Deploy
git add .
git commit -m "Deploy to production"
git push heroku main
```

### 4. Update URLs After Deployment

After deployment, update your environment variables with the actual Heroku URL:

```bash
heroku config:set BASE_URL="https://your-actual-app-name.herokuapp.com"
heroku config:set FRONTEND_URL="https://your-actual-app-name.herokuapp.com"
heroku config:set BACKEND_URL="https://your-actual-app-name.herokuapp.com"
```

### 5. Test Your Deployment

1. Visit your Heroku app URL
2. Test Google OAuth login
3. Check that API endpoints work
4. Verify database connections

## ✅ No More localhost:5000!

Your app is now completely platform-independent and ready for deployment! 🎉
