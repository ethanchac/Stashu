# Stashu Mobile

React Native mobile app for Stashu - a Discord-like messaging application.

## Features

- Firebase Authentication (Email/Password)
- Real-time messaging with Firestore
- Channel-based organization
- File upload support
- Cross-platform (iOS & Android)

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Expo CLI
- iOS Simulator (for Mac) or Android Studio (for Android development)

## Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env` file in the mobile directory:
   ```bash
   cp .env.example .env
   ```

3. Update the `.env` file with your Firebase credentials and backend API URL:
   - Get Firebase config from your Firebase Console
   - Set `EXPO_PUBLIC_API_URL` to your backend URL (default: http://localhost:3000)

## Running the App

### Development Mode

Start the Expo development server:
```bash
npm start
```

This will open Expo DevTools in your browser. From there you can:
- Press `i` to open iOS Simulator
- Press `a` to open Android Emulator
- Scan the QR code with Expo Go app on your physical device

### iOS Simulator (Mac only)
```bash
npm run ios
```

### Android Emulator
```bash
npm run android
```

## Project Structure

```
mobile/
├── src/
│   ├── contexts/        # React contexts (Auth, etc.)
│   ├── hooks/           # Custom React hooks
│   ├── navigation/      # Navigation setup
│   ├── screens/         # App screens
│   ├── services/        # API services (Firebase, axios)
│   └── utils/           # Utility functions
├── App.js              # Root component
├── package.json        # Dependencies
└── .env.example        # Environment variables template
```

## Environment Variables

The app uses Expo's environment variable system. All public variables should be prefixed with `EXPO_PUBLIC_`.

Required variables:
- `EXPO_PUBLIC_FIREBASE_API_KEY` - Firebase API key
- `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN` - Firebase auth domain
- `EXPO_PUBLIC_FIREBASE_PROJECT_ID` - Firebase project ID
- `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET` - Firebase storage bucket
- `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` - Firebase messaging sender ID
- `EXPO_PUBLIC_FIREBASE_APP_ID` - Firebase app ID
- `EXPO_PUBLIC_API_URL` - Backend API URL

## Backend Connection

Make sure your backend is running before using the mobile app:

```bash
cd ../backend
npm run dev
```

For testing on a physical device, you'll need to:
1. Update `EXPO_PUBLIC_API_URL` to your computer's local IP address (e.g., `http://192.168.1.100:3000`)
2. Ensure your device is on the same network as your development machine

## Building for Production

### iOS
```bash
expo build:ios
```

### Android
```bash
expo build:android
```

## Troubleshooting

### Dependencies installation fails
If you encounter npm permission issues, try:
```bash
sudo chown -R $(whoami) ~/.npm
npm cache clean --force
npm install
```

### Firebase connection issues
- Verify your Firebase credentials in `.env`
- Check that Firebase Authentication is enabled in Firebase Console
- Ensure Firestore is set up with proper security rules

### Backend connection issues
- Verify backend is running on the correct port
- For physical devices, use your computer's IP address instead of localhost
- Check that CORS is properly configured in the backend

## Tech Stack

- React Native (via Expo)
- Firebase (Authentication & Firestore)
- React Navigation
- Axios for API calls
- AsyncStorage for local persistence

## License

MIT
