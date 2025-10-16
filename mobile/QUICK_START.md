# Quick Start - Stashu Mobile

## The Problem

The mobile app is having issues because of the workspace configuration in the root `package.json`. Metro bundler dependencies are conflicting.

## Simple Solution

Run the app using this command which bypasses workspace issues:

```bash
cd /Users/ethan/Desktop/Computer\ Science/Personal/Projects/Stashu/mobile
npx expo start --ios --no-dev
```

Or try with expo doctor to auto-fix dependencies:

```bash
cd mobile
npx expo install --fix
npx expo start --ios
```

## Alternative: Use Expo Go App

Instead of the simulator, use your iPhone:

1. Install **Expo Go** from the App Store
2. Run:
   ```bash
   cd mobile
   npx expo start
   ```
3. Scan the QR code with your iPhone camera
4. Update `.env` file with your computer's IP:
   ```
   EXPO_PUBLIC_API_URL=http://YOUR_IP:3000/api
   ```

## Recommended: Fresh Expo Init

If problems persist, I can help you:
1. Create a fresh Expo app outside the workspace
2. Copy all the source files over
3. This will avoid all the dependency conflicts

Let me know which approach you'd like to try!
