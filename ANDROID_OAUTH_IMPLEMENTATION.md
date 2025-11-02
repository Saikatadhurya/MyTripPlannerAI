# Android OAuth Deep Link Implementation

## Overview

The Android app OAuth implementation has been configured to automatically detect Android requests and redirect to deep links instead of web URLs.

## What Was Implemented

### 1. Android Manifest Deep Links
- **File**: `android/app/src/main/AndroidManifest.xml`
- **Scheme**: `com.planmytrip.app://`
- Deep link intent filter configured to handle OAuth redirects

### 2. Backend Android Detection
- **File**: `backend/controllers/authController.js`
- **Function**: `isAndroidRequest(req)` - Detects Android requests via:
  - User-Agent containing "Android" or "CapacitorHttp"
  - Query parameter `platform=android`

### 3. Backend Deep Link Redirects
- **Function**: `getRedirectUrl(req, token, user, error, message)`
- Automatically uses deep links for Android:
  - Success: `com.planmytrip.app://auth?token=...&user=...`
  - Error: `com.planmytrip.app://auth?error=...`
  - Message: `com.planmytrip.app://auth?message=...`

### 4. Updated OAuth Callbacks
- `socialAuthCallback` - Handles Google OAuth login/signup
- `googleLinkingCallback` - Handles Google account linking
- Both now redirect to deep links when Android is detected

## How It Works

1. **User initiates OAuth** from Android app
2. **Backend detects Android** via User-Agent or query parameter
3. **OAuth completes** on Google's servers
4. **Backend redirects** to deep link: `com.planmytrip.app://auth?...`
5. **Android system** opens the app with the deep link
6. **Capacitor/WebView** converts deep link to URL parameters
7. **Frontend handles** via existing OAuth callback logic in `App.tsx`

## Testing

### Test Android Detection
Add `?platform=android` to OAuth URL:
```
/auth/google?platform=android
```

### Test Deep Link Manually
Use ADB to simulate deep link:
```bash
adb shell am start -a android.intent.action.VIEW -d "com.planmytrip.app://auth?token=test&user=test"
```

## Notes

- The frontend OAuth callback handler in `App.tsx` already handles URL parameters correctly
- No changes needed to frontend - Capacitor automatically handles deep links
- Google Cloud Console doesn't need deep link URLs - backend handles the redirect
- The app ID (`com.planmytrip.app`) must match in:
  - `capacitor.config.json`
  - `android/app/src/main/AndroidManifest.xml`
  - Android package name in `build.gradle`

## Future Enhancements

If needed, you can add Capacitor App plugin for more advanced deep link handling:

```bash
npm install @capacitor/app
```

Then listen for deep links:
```typescript
import { App } from '@capacitor/app';

App.addListener('appUrlOpen', (data) => {
  const url = new URL(data.url);
  // Handle deep link parameters
});
```

