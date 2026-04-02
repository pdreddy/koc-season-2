# KOC Season 2 (Expo)

This app is now configured for **EAS production builds** so you can deploy to the Apple App Store.

## What was fixed

- Added iOS/Android store version fields (`ios.buildNumber`, `android.versionCode`) in `app.json`.
- Added iOS export-compliance flag (`ITSAppUsesNonExemptEncryption: false`) to avoid App Store submission prompts when no non-exempt encryption is used.
- Added a production-ready `eas.json` with development/preview/production build profiles.
- Added a deployment checklist below.

## Local run

```bash
npm install
npm run start
```

## App Store deployment steps (Expo EAS)

1. Install and login to EAS CLI:
   ```bash
   npm install -g eas-cli
   eas login
   ```
2. Configure project credentials:
   ```bash
   eas build:configure
   ```
3. Create a production iOS build:
   ```bash
   eas build --platform ios --profile production
   ```
4. Submit to App Store Connect:
   ```bash
   eas submit --platform ios --profile production
   ```

## Before submitting to Apple

- Set your final app icon and splash image in `app.json`.
- Verify app metadata in App Store Connect (name, screenshots, privacy policy URL, category, age rating).
- Verify Apple Developer team access and certificates.
- Increment versions for each release:
  - `expo.version`
  - `expo.ios.buildNumber`

