# Environment Variables Setup Guide

This guide explains how to set up environment variables for MyTripPlannerAI, which uses a **unified `.env` file** at the root directory for both frontend and backend.

## Quick Start

1. **Copy the example file:**
   ```bash
   cp .env.example .env
   ```

2. **Fill in your actual values** in the `.env` file

3. **Done!** Both frontend and backend will automatically read from this file.

## File Structure

```
MyTripPlannerAI/
├── .env                    # ← Unified environment file (create this)
├── .env.example            # ← Template (already provided)
├── .env.production         # ← For production builds (optional)
├── backend/                # ← Backend reads from ../.env
└── [frontend files]        # ← Frontend reads from ./.env
```

## How It Works

### Frontend (Vite)
- **Reads from:** `.env` in root directory
- **Build time:** Variables prefixed with `VITE_` are baked into the bundle
- **Access:** Use `import.meta.env.VITE_BACKEND_URL` in your code

### Backend (Node.js)
- **Reads from:** `.env` in root directory (parent of `backend/` folder)
- **Runtime:** Variables are loaded when the server starts
- **Access:** Use `process.env.DATABASE_URL` in your code

## Environment File Priority

### Frontend (Vite)
1. `.env.production.local` (highest priority)
2. `.env.production` (for production builds)
3. `.env.local` (local overrides)
4. `.env` (default)

### Backend (dotenv)
- Always uses `.env` in root directory (configured in code)
- You can override by setting environment variables directly

## Required Variables

### Frontend (Required for Android)
- ✅ `VITE_BACKEND_URL` - Your production backend URL

### Backend (Required)
- ✅ `DATABASE_URL` - PostgreSQL connection string
- ✅ `SESSION_SECRET` - Strong random string for sessions
- ✅ `GOOGLE_CLIENT_ID` - Google OAuth client ID
- ✅ `GOOGLE_CLIENT_SECRET` - Google OAuth client secret
- ✅ `ENCRYPTION_SECRET` or `ENCRYPTION_KEY_BASE64` - For data encryption

### Backend (Recommended)
- ✅ `BASE_URL` - Your app's public URL (required in production)
- ✅ `JWT_SECRET` - For JWT token generation
- ✅ `NODE_ENV` - Set to `production` when deployed

## Variable Categories

### 🔵 Frontend Variables (VITE_ prefix)
```env
VITE_BACKEND_URL=https://your-backend.onrender.com
VITE_API_URL=http://localhost:5000
GEMINI_API_KEY=optional-key
```

### 🟢 Backend Variables (No prefix)
```env
DATABASE_URL=postgresql://...
SESSION_SECRET=your-secret
GOOGLE_CLIENT_ID=your-id
GOOGLE_CLIENT_SECRET=your-secret
```

### 🔴 Shared/Common Variables
```env
NODE_ENV=development
BASE_URL=http://localhost:5000
```

## Creating Your .env File

### Option 1: Use the Template

1. Copy `.env.example`:
   ```bash
   cp .env.example .env
   ```

2. Open `.env` in your editor

3. Fill in all required variables (marked with ✅ above)

4. Save the file

### Option 2: Manual Creation

1. Create a new `.env` file in the root directory

2. Add all required variables from the categories above

3. Reference `.env.example` for the full list

## Generating Secrets

### Session Secret
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### JWT Secret
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Encryption Secret
Use any strong random string, or generate:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Development vs Production

### Development (`.env`)
```env
NODE_ENV=development
BASE_URL=http://localhost:5000
VITE_BACKEND_URL=http://localhost:5000
VITE_API_URL=http://localhost:5000
```

### Production (`.env.production`)
```env
NODE_ENV=production
BASE_URL=https://mytripplannerai.onrender.com
VITE_BACKEND_URL=https://mytripplannerai.onrender.com
```

**Note:** For Android builds, create `.env.production` with your production values.

## Security Best Practices

### ✅ Safe to Include in .env
- Database URLs (already in .gitignore)
- Backend API URLs
- Public OAuth client IDs (public info)

### ⚠️ Handle with Care
- `GEMINI_API_KEY` in frontend - Will be exposed in client bundle
- Consider moving sensitive API calls to backend

### ❌ Never Commit
- `.env` files (already in .gitignore)
- `.env.local` files
- `.env.production.local` files
- Any file containing real secrets

## Troubleshooting

### Issue: Backend can't find environment variables

**Solution:**
- ✅ Verify `.env` file is in the root directory (same level as `package.json`)
- ✅ Check file name is exactly `.env` (not `.env.txt` or `env`)
- ✅ Restart your backend server after creating/modifying `.env`

### Issue: Frontend variables are undefined

**Solution:**
- ✅ Verify variables start with `VITE_` prefix
- ✅ Use `import.meta.env.VITE_*` (not `process.env.VITE_*`)
- ✅ Rebuild the app: `npm run build`
- ✅ Check `.env` file is in root directory

### Issue: Variables not updating

**Solution:**
- ✅ Restart backend server
- ✅ Rebuild frontend: `npm run build`
- ✅ Clear build cache: Delete `dist/` folder

### Issue: Different values needed for development vs production

**Solution:**
- ✅ Use `.env` for development
- ✅ Use `.env.production` for production builds
- ✅ Backend always reads from root `.env` (you can override with system env vars)

## Migration from Separate Files

If you previously had separate `.env` files:

1. **Backup your existing files:**
   ```bash
   cp backend/.env backend/.env.backup
   cp .env .env.frontend.backup
   ```

2. **Merge the contents:**
   - Copy all variables from `backend/.env` into root `.env`
   - Copy all variables from frontend `.env` into root `.env`
   - Remove duplicates (keep one of each)

3. **Test:**
   ```bash
   # Test backend
   cd backend
   npm start
   
   # Test frontend
   npm run dev
   ```

4. **Remove old files:**
   ```bash
   rm backend/.env
   # Keep .env.backup files as backup for now
   ```

## Environment Variables Reference

| Variable | Type | Required | Description |
|----------|------|----------|-------------|
| `VITE_BACKEND_URL` | Frontend | ✅ Android | Production backend URL |
| `VITE_API_URL` | Frontend | No | Dev API URL |
| `GEMINI_API_KEY` | Frontend | No | Gemini API key (exposed in bundle) |
| `DATABASE_URL` | Backend | ✅ | PostgreSQL connection string |
| `BASE_URL` | Backend | ✅ Prod | App's public URL |
| `SESSION_SECRET` | Backend | ✅ | Session encryption secret |
| `GOOGLE_CLIENT_ID` | Backend | ✅ | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Backend | ✅ | Google OAuth secret |
| `JWT_SECRET` | Backend | No | JWT token secret |
| `ENCRYPTION_SECRET` | Backend | ✅ | Data encryption secret |
| `SMTP_HOST` | Backend | No | Email server host |
| `SMTP_USER` | Backend | No | Email username |
| `SMTP_PASS` | Backend | No | Email password |

## Additional Resources

- See `ANDROID_SETUP.md` for Android-specific environment variable setup
- See `RENDER_DEPLOYMENT_GUIDE.md` for production deployment configuration








