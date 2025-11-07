# PWA (Progressive Web App) Configuration

## Overview

This application is configured as a Progressive Web App (PWA) using `@ducanh2912/next-pwa` v10.2.9, which provides offline support, caching, and installability features.

## Configuration Files

### 1. **next.config.ts**
The PWA configuration is set up in the Next.js config file:

```typescript
const withPWA = withPWAInit({
  dest: "public",
  register: true,  // Auto-register service worker
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === "development",
  workboxOptions: {
    disableDevLogs: true,
  },
});
```

**Key Features:**
- **Auto-registration**: Service worker automatically registers on page load
- **Offline Support**: Caches pages and assets for offline access
- **Aggressive Caching**: Pre-caches pages during navigation for faster loads
- **Development Mode**: PWA is disabled in development for easier debugging

### 2. **tsconfig.json**
TypeScript types for the PWA workbox are configured:

```json
{
  "compilerOptions": {
    "types": ["@ducanh2912/next-pwa/workbox"]
  }
}
```

This provides TypeScript support for the Workbox API (window.workbox).

### 3. **public/manifest.json**
The app manifest defines PWA metadata:

```json
{
  "name": "Flow - Upturn",
  "short_name": "Flow",
  "description": "Your all in one business solution",
  "theme_color": "#1e3a8a",
  "background_color": "#ffffff",
  "display": "standalone",
  "orientation": "portrait",
  "scope": "/",
  "start_url": "/",
  "icons": [...]
}
```

### 4. **src/app/layout.tsx**
The root layout includes PWA meta tags:

```tsx
<head>
  <link rel="manifest" href="/manifest.json" />
  <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="default" />
  <meta name="apple-mobile-web-app-title" content="Upturn" />
  <meta name="theme-color" content="#1e3a8a" />
</head>
```

## Generated Files

When you build the application, the following PWA files are automatically generated in the `public/` directory:

1. **sw.js** - Main service worker file
2. **workbox-*.js** - Workbox runtime library
3. **swe-worker-*.js** - Service worker entry point

## Testing the PWA

### Important Note
⚠️ **PWA functionality is DISABLED in development mode** (`npm run dev`). To test PWA features, you must create a production build.

### Steps to Test

1. **Build for production:**
   ```bash
   npm run build
   ```

2. **Start production server:**
   ```bash
   npm start
   ```

3. **Open the app in your browser:**
   - Navigate to `http://localhost:3000` (or your deployed URL)
   - Open Chrome DevTools (F12)

4. **Verify Service Worker Registration:**
   - Go to **Application** tab → **Service Workers**
   - You should see a service worker running for your app
   - Status should show "activated and running"

5. **Check Manifest:**
   - Go to **Application** tab → **Manifest**
   - Verify all fields are correctly populated
   - Check that icons are loading properly

6. **Test Offline Mode:**
   - In DevTools, go to **Network** tab
   - Check "Offline" checkbox to simulate offline mode
   - Navigate through the app - cached pages should still load
   - You can also use **Application** tab → **Service Workers** → Check "Offline"

7. **Test Install Prompt:**
   - On supported browsers (Chrome, Edge), you should see an install prompt
   - Or find "Install App" in the browser menu (⋮)
   - Install the app and verify it works as a standalone application

8. **Test Caching:**
   - Go to **Application** tab → **Cache Storage**
   - You should see multiple caches:
     - `start-url` - Homepage cache
     - `pages` - Page caches
     - `static-style-assets` - CSS files
     - `next-static-js-assets` - JavaScript bundles
     - `static-image-assets` - Images
     - And more...

## Testing on Mobile Devices

### iOS (Safari)
1. Build and deploy to a server with HTTPS
2. Open Safari on iOS
3. Tap the Share button
4. Select "Add to Home Screen"
5. The app will be installed on the home screen

### Android (Chrome)
1. Build and deploy to a server with HTTPS
2. Open Chrome on Android
3. You should see a banner to "Install app" or find it in the menu
4. Install and test the standalone app

## Troubleshooting

### Service Worker Not Registering

**Problem**: Service worker doesn't appear in DevTools

**Solutions**:
1. Make sure you're testing a **production build** (not `npm run dev`)
2. Check browser console for errors
3. Verify `register: true` is set in `next.config.ts`
4. Ensure you're accessing the app via `http://` or `https://` (not `file://`)

### Install Prompt Not Showing

**Problem**: No install prompt appears

**Requirements for install prompt**:
1. Must be served over HTTPS (or localhost for testing)
2. Must have a valid manifest.json
3. Must have a registered service worker
4. Must have valid icons (at least 192x192 and 512x512)
5. User must have visited the site at least once (Chrome requirement)

### Cache Not Working

**Problem**: Pages don't load offline

**Solutions**:
1. Check **Application** → **Cache Storage** to verify caches exist
2. Visit pages while online first to cache them
3. Check service worker status is "activated and running"
4. Clear caches and try again

### TypeScript Errors

**Problem**: `window.workbox` shows TypeScript errors

**Solution**: Ensure `"@ducanh2912/next-pwa/workbox"` is in tsconfig.json types array

## Advanced Configuration

### Custom Caching Strategies

You can modify the workbox options in `next.config.ts`:

```typescript
workboxOptions: {
  disableDevLogs: true,
  runtimeCaching: [
    // Add custom runtime caching rules
  ],
  skipWaiting: true,
  clientsClaim: true,
}
```

### Force Update Service Worker

To manually update the service worker when the app is running:

```typescript
if (typeof window !== 'undefined' && 'workbox' in window) {
  const wb = (window as any).workbox;
  wb.addEventListener('waiting', () => {
    wb.messageSkipWaiting();
  });
}
```

## Performance Monitoring

Monitor PWA performance using:
1. **Lighthouse** (Chrome DevTools → Lighthouse tab)
   - Run PWA audit
   - Check for installability
   - Review performance metrics

2. **Web Vitals**
   - Monitor CLS, FID, LCP in production
   - Track offline usage

## Documentation References

- [@ducanh2912/next-pwa Documentation](https://ducanh-next-pwa.vercel.app/docs/next-pwa)
- [Web.dev PWA Guide](https://web.dev/learn/pwa/)
- [Workbox Documentation](https://developer.chrome.com/docs/workbox/)
- [Next.js PWA Examples](https://github.com/vercel/next.js/tree/canary/examples)

## Migration Notes

If migrating from an older PWA solution:
1. Clear old service workers from all browsers
2. Update cache names to avoid conflicts
3. Test thoroughly in production environment
4. Consider migrating to [@serwist/next](https://serwist.pages.dev/docs/next) for long-term support
