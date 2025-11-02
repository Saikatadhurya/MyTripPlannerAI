# Android Quick Start Guide

## What Has Been Set Up

✅ **Capacitor dependencies** added to `package.json`
✅ **Build scripts** added for Android (`build:android`, `android:sync`, `android:dev`)
✅ **Capacitor configuration** file (`capacitor.config.ts`) created
✅ **Vite build config** updated for Android compatibility
✅ **API services** updated to detect mobile environment and use production backend
✅ **Environment variable utilities** created for backend URL detection
✅ **.gitignore** updated for Android build artifacts
✅ **Setup documentation** created (`ANDROID_SETUP.md`)

## Quick Start (3 Steps)

### 1. Set Environment Variables

Create `.env.production` file:
```env
VITE_BACKEND_URL=https://your-backend-url.onrender.com
```

### 2. Initialize and Add Android Platform

```bash
# Install dependencies (if not done)
npm install

# Build the React app
npm run build

# Initialize Capacitor (will use existing capacitor.config.ts)
npx cap init

# Add Android platform
npx cap add android
```

### 3. Build and Test

```bash
# Sync web app to Android
npm run android:sync

# Open in Android Studio
npm run android:dev
```

Then in Android Studio:
- Run on emulator or device
- Build → Generate Signed Bundle for Play Store

## Important Notes

### Backend Configuration

Your backend server needs to:
1. **Allow CORS** from Android app (the app will make requests from `file://` or custom scheme)
2. **Support OAuth deep links** like `com.planmytrip.app://auth/google/callback`

Update `backend/server.js` CORS to include your backend URL and the deep link scheme.

### Storage

The app currently uses `localStorage` and `sessionStorage`, which work fine in Capacitor WebView. For better security in the future, consider migrating to Capacitor Preferences API, but it's not required now.

### Environment Variables

- **Frontend**: Set in `.env.production` and baked into build by Vite
- **Backend**: Continue using `.env` file on your server (unchanged)

## Next Steps

1. Follow the detailed guide in `ANDROID_SETUP.md`
2. Test OAuth flows with deep links
3. Add app icons and splash screens
4. Configure Play Store listing
5. Submit to Google Play Store

