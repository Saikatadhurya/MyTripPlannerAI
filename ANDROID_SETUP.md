# Android App Setup Guide

This guide will help you set up your React app as an Android application using Capacitor.

## Prerequisites

1. **Node.js** (v18 or higher recommended)
2. **Android Studio** (latest version)
3. **JDK 11+** installed and configured
4. **Android SDK** configured via Android Studio
5. **Play Store Developer Account** (for publishing)

## Environment Variables Setup

### How Environment Variables Work in Android Builds

When building for Android, environment variables are **baked into the app bundle** at build time. This means:

1. Variables are read from `.env` files during `npm run build`
2. They are embedded in the JavaScript bundle inside the APK/AAB
3. They cannot be changed after the app is built without rebuilding

### Step 1: Create Environment File

Create a `.env.production` file in the **root directory** of your project (same level as `package.json`):

```env
# Production Backend URL (REQUIRED for Android app)
VITE_BACKEND_URL=https://your-backend-url.onrender.com

# Optional: Development API URL (used in web development)
VITE_API_URL=http://localhost:5000

# Optional: Gemini API Key (if you want to bundle it in the app)
# WARNING: This will be exposed in the app bundle. Consider moving API calls to backend instead.
GEMINI_API_KEY=your-gemini-api-key-here
```

### Step 2: Understanding Vite Environment Variables

**Vite automatically exposes environment variables that:**
- Are prefixed with `VITE_` (e.g., `VITE_BACKEND_URL`)
- Are accessed via `import.meta.env.VITE_BACKEND_URL` in your code

**Important Rules:**
- Variables **must** start with `VITE_` to be accessible in the client
- Variables are replaced at build time (not runtime)
- Values are injected as strings

### Step 3: Environment File Priority

Vite loads environment files in this order (higher priority overrides lower):
1. `.env.production.local` (highest priority, not committed to git)
2. `.env.production` (used for production builds)
3. `.env.local` (local overrides, not committed)
4. `.env` (default for all environments)

**For Android builds, use `.env.production`** as it's automatically used when running `npm run build`.

### Step 4: Building with Environment Variables

```bash
# 1. Create .env.production with your values
# 2. Build the app (uses .env.production automatically)
npm run build

# 3. Sync to Android
npm run android:sync

# 4. Build in Android Studio
npm run android:dev
```

### Step 5: Verify Environment Variables

To verify your environment variables are being loaded correctly:

1. **Check during build**: Add a temporary console.log in your code:
   ```typescript
   console.log('Backend URL:', import.meta.env.VITE_BACKEND_URL);
   ```

2. **Check in browser dev tools**: Open Chrome DevTools in the Android WebView and check the console

3. **Check the built files**: Search for your values in `dist/assets/*.js` files (be careful - they're minified)

### Environment Variables Reference

| Variable | Required | Description | Example | Where Used |
|----------|----------|-------------|---------|------------|
| `VITE_BACKEND_URL` | **Yes** | Production backend URL for Android app | `https://planmytrip.onrender.com` | `utils/capacitorUtils.ts` |
| `VITE_API_URL` | No | Development API URL | `http://localhost:5000` | Development fallback |
| `GEMINI_API_KEY` | Optional | Gemini API key | `AIza...` | If bundled in client |

### Important Security Notes

⚠️ **Security Warning:**
- Environment variables in `.env.production` are **bundled into the Android APK/AAB**
- They can be **extracted from the app** by reverse engineering
- **Never put sensitive secrets** (like private API keys) in client-side environment variables
- **Best Practice**: Move sensitive API calls to your backend server instead

✅ **Safe to include:**
- Public backend URLs
- Public API endpoints
- Non-sensitive configuration

❌ **Never include:**
- Private API keys
- Database credentials
- Authentication secrets
- JWT secrets

### Troubleshooting Environment Variables

**Issue: Environment variables are undefined**
- ✅ Verify variable starts with `VITE_` prefix
- ✅ Check that `.env.production` is in the root directory
- ✅ Rebuild the app: `npm run build`
- ✅ Re-sync to Android: `npm run android:sync`
- ✅ Use `import.meta.env.VITE_*` (not `process.env.VITE_*`)

**Issue: Variables not updating after changes**
- ✅ Delete `dist/` folder and rebuild
- ✅ Run `npm run android:sync` again
- ✅ Clear Android Studio build cache: Build → Clean Project

**Issue: Different values in development vs production**
- ✅ Use `.env` for development
- ✅ Use `.env.production` for Android builds
- ✅ Variables in `.env.production` override `.env` during production builds

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Initialize Capacitor

```bash
npx cap init
```

The `capacitor.config.json` file has already been created with:
- **App name**: PlanMyTrip AI
- **App ID**: com.planmytrip.app
- **Web dir**: dist

You can customize these values if needed.

## Step 3: Build Your React App

```bash
npm run build
```

This creates the `dist/` folder that Capacitor will use.

## Step 4: Add Android Platform

```bash
npx cap add android
```

This will create the `android/` directory with a native Android project.

## Step 5: Sync Your Web App to Android

```bash
npm run android:sync
```

This copies your built web app to the Android project.

## Step 6: Configure Android App

### Update Package Name (Optional)

If you want to change the package name, edit:
- `android/app/build.gradle` → `applicationId`
- `android/app/src/main/AndroidManifest.xml` → package attribute

### Configure App Metadata

Edit `android/app/src/main/res/values/strings.xml`:
```xml
<resources>
    <string name="app_name">PlanMyTrip AI</string>
</resources>
```

### Configure Deep Links for OAuth

Edit `android/app/src/main/AndroidManifest.xml` and add deep link intent filters:

```xml
<activity ...>
    <!-- Existing activity config -->
    
    <!-- Deep links for OAuth redirects -->
    <intent-filter>
        <action android:name="android.intent.action.VIEW" />
        <category android:name="android.intent.category.DEFAULT" />
        <category android:name="android.intent.category.BROWSABLE" />
        <data android:scheme="com.planmytrip.app" />
    </intent-filter>
</activity>
```

The backend will automatically detect Android requests and redirect to deep links:
- `com.planmytrip.app://auth?token=...&user=...` (for OAuth login/signup)
- `com.planmytrip.app://auth?message=...` (for OAuth linking)

**Note**: The backend detects Android requests via User-Agent or `platform=android` query parameter. No additional configuration needed in Google Cloud Console for deep links - the backend handles the redirect automatically.

## Step 7: Add App Icons and Splash Screen

### App Icons

Place your app icons in:
- `android/app/src/main/res/mipmap-mdpi/ic_launcher.png` (48x48)
- `android/app/src/main/res/mipmap-hdpi/ic_launcher.png` (72x72)
- `android/app/src/main/res/mipmap-xhdpi/ic_launcher.png` (96x96)
- `android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png` (144x144)
- `android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png` (192x192)
- `android/app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml` (adaptive icon)

### Splash Screen

The splash screen is the first screen users see when launching your app. Here's how to design and configure it:

#### 1. Configure Splash Screen in Capacitor

Edit `capacitor.config.json` to customize the splash screen behavior:

```json
{
  "plugins": {
    "SplashScreen": {
      "launchShowDuration": 2000,
      "launchAutoHide": true,
      "backgroundColor": "#ffffff",
      "androidSplashResourceName": "splash",
      "androidScaleType": "CENTER_CROP",
      "showSpinner": false,
      "spinnerColor": "#6D28D9",
      "splashFullScreen": true,
      "splashImmersive": false
    }
  }
}
```

**Configuration Options:**
- `launchShowDuration`: How long to show splash screen in milliseconds (default: 2000)
- `launchAutoHide`: Automatically hide splash when app is ready (default: true)
- `backgroundColor`: Background color while loading (hex color, e.g., "#ffffff" for white)
- `androidSplashResourceName`: Name of the splash drawable resource (default: "splash")
- `androidScaleType`: How to scale the image - `CENTER`, `CENTER_CROP`, `CENTER_INSIDE`, `FIT_CENTER`, or `FIT_XY`
- `showSpinner`: Show loading spinner (default: false)
- `spinnerColor`: Color of the loading spinner if enabled
- `splashFullScreen`: Display in full screen mode
- `splashImmersive`: Hide system UI (status bar, navigation)

#### 2. Create Splash Screen Images

You need to create splash screen images for different screen densities. The images should be **portrait and landscape** orientations.

**Recommended Sizes:**
- **Portrait** (vertical): 320x470px to 1080x1920px (9:16 aspect ratio)
- **Landscape** (horizontal): 470x320px to 1920x1080px (16:9 aspect ratio)

**Screen Density Folders:**
Place splash images in these directories:

**Portrait (Port):**
- `android/app/src/main/res/drawable-port-mdpi/splash.png` (320x470px)
- `android/app/src/main/res/drawable-port-hdpi/splash.png` (480x800px)
- `android/app/src/main/res/drawable-port-xhdpi/splash.png` (720x1280px)
- `android/app/src/main/res/drawable-port-xxhdpi/splash.png` (1080x1920px)
- `android/app/src/main/res/drawable-port-xxxhdpi/splash.png` (1440x2560px)

**Landscape (Land):**
- `android/app/src/main/res/drawable-land-mdpi/splash.png` (470x320px)
- `android/app/src/main/res/drawable-land-hdpi/splash.png` (800x480px)
- `android/app/src/main/res/drawable-land-xhdpi/splash.png` (1280x720px)
- `android/app/src/main/res/drawable-land-xxhdpi/splash.png` (1920x1080px)
- `android/app/src/main/res/drawable-land-xxxhdpi/splash.png` (2560x1440px)

**Default (used if orientation-specific not found):**
- `android/app/src/main/res/drawable/splash.png` (1080x1920px recommended)

#### 3. Splash Screen Design Guidelines

**Best Practices:**
1. **Brand Consistency**: Use your app logo (`PlanMyTrip.png`) prominently
2. **Simple Design**: Keep it minimal - logo + app name or tagline
3. **Background Color**: Match your app's theme color (`#6D28D9` purple) or use white/light gradient
4. **Safe Zone**: Keep important elements (logo) in center 80% to avoid cutoffs on various screens
5. **No Text Overload**: Avoid long text - users may see this screen for only 1-2 seconds

**Design Elements:**
- App logo centered (use `/PlanMyTrip.png`)
- App name: "PlanMyTrip AI" (optional, centered below logo)
- Tagline: "Plan Your Dream Trip" (optional)
- Background: Solid color or subtle gradient matching theme (`#6D28D9`)

**Example Design Layout:**
```
┌─────────────────────┐
│                     │
│                     │ (Top spacing)
│     [Logo Image]    │ (Centered)
│   PlanMyTrip AI     │ (App name)
│  Plan Your Dream    │ (Tagline)
│       Trip          │
│                     │ (Bottom spacing)
└─────────────────────┘
```

#### 4. Create Splash Screen Assets

**Option A: Use Design Tools**
- **Figma**: Create splash screens, export for each density
- **Canva**: Use preset Android splash screen templates
- **Photoshop/GIMP**: Create and resize for each density

**Option B: Online Generators**
- Use tools like "Android Asset Studio" or "Splash Screen Generator"
- Upload your logo and generate all sizes automatically

**Option C: Programmatic Generation**
Create a base design and use image tools to resize:
```bash
# Example using ImageMagick (if installed)
convert base_splash.png -resize 1080x1920 drawable-port-xxhdpi/splash.png
```

#### 5. Update Android Styles (If Needed)

The splash screen is already configured in `android/app/src/main/res/values/styles.xml`:

```xml
<style name="AppTheme.NoActionBarLaunch" parent="Theme.SplashScreen">
    <item name="android:background">@drawable/splash</item>
</style>
```

This references the `splash.png` files you place in the drawable folders.

#### 6. Test Your Splash Screen

1. **Build and run the app:**
   ```bash
   npm run build
   npm run android:sync
   npm run android:dev
   ```

2. **Test on different devices:**
   - Test on emulator with different screen sizes
   - Test on physical devices (portrait and landscape)
   - Verify logo isn't cut off on smaller screens

3. **Adjust if needed:**
   - If logo is too large/small, resize and regenerate
   - If colors don't match, update background color in `capacitor.config.json`
   - If duration is too short/long, adjust `launchShowDuration`

#### 7. Advanced Customization

**Dynamic Splash Screen:**
For a more dynamic experience, you can programmatically control the splash screen from your React app:

```typescript
import { SplashScreen } from '@capacitor/splash-screen';

// Hide splash when app is ready
await SplashScreen.hide({
  fadeOutDuration: 300
});

// Show splash again if needed
await SplashScreen.show({
  showDuration: 2000,
  autoHide: true
});
```

**Gradient Background:**
Instead of solid color, use a gradient drawable (`android/app/src/main/res/drawable/splash_gradient.xml`):

```xml
<?xml version="1.0" encoding="utf-8"?>
<shape xmlns:android="http://schemas.android.com/apk/res/android">
    <gradient
        android:angle="135"
        android:startColor="#6D28D9"
        android:centerColor="#8B5CF6"
        android:endColor="#A78BFA"
        android:type="linear" />
</shape>
```

Then update `styles.xml` to use `@drawable/splash_gradient` instead of `@drawable/splash`.

#### Quick Checklist

- [ ] Design splash screen with logo and app name
- [ ] Create images for all required densities (portrait and landscape)
- [ ] Place images in correct `drawable-*` folders
- [ ] Configure `capacitor.config.json` with desired settings
- [ ] Test on emulator and physical devices
- [ ] Verify appearance in both portrait and landscape modes
- [ ] Adjust timing and colors as needed

## Step 8: Test in Android Studio

```bash
npm run android:dev
```

This opens the Android project in Android Studio. You can then:
1. Run the app on an emulator
2. Run the app on a connected device
3. Build debug APK for testing

## Step 9: Build for Production

### Generate Signed Release Build

1. Open Android Studio
2. Build → Generate Signed Bundle / APK
3. Select **Android App Bundle (AAB)** for Play Store or **APK** for direct distribution
4. Create a new keystore or use existing one
5. Configure signing and build

### Alternative: Build via Command Line

Create a `keystore.properties` file in `android/` directory:
```properties
storePassword=your-store-password
keyPassword=your-key-password
keyAlias=your-key-alias
storeFile=path/to/your/keystore.jks
```

Then run:
```bash
cd android
./gradlew bundleRelease  # For AAB
# or
./gradlew assembleRelease  # For APK
```

## Step 10: Update Backend CORS

Make sure your backend server allows requests from your Android app. The backend CORS configuration in `backend/server.js` should include your production backend URL. The deep link scheme (`com.planmytrip.app://`) is handled automatically by the Android redirect logic - no CORS changes needed.

## Troubleshooting

### Issue: Build fails with "Cannot find module '@capacitor/core'"
**Solution**: Run `npm install` again.

### Issue: App shows blank screen
**Solution**: 
- Verify the build completed successfully: `npm run build`
- Check that `dist/` folder contains `index.html`
- Run `npm run android:sync` again

### Issue: API calls fail in Android app
**Solution**:
- Verify `VITE_BACKEND_URL` is set in `.env.production`
- Check backend CORS configuration
- Verify network permissions in `AndroidManifest.xml`

### Issue: OAuth redirects don't work
**Solution**:
- Verify deep link configuration in `AndroidManifest.xml`
- Update OAuth provider (Google Console) with deep link URLs
- Check backend callback URL handling

## Environment Variables Reference

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `VITE_BACKEND_URL` | Yes | Production backend URL for Android app | `https://planmytrip.onrender.com` |
| `GEMINI_API_KEY` | Optional | Gemini API key (will be exposed in app) | `AIza...` |

## Next Steps

1. Test the app thoroughly on Android devices
2. Set up Google Play Console
3. Prepare app store listing (screenshots, description, etc.)
4. Submit for review

