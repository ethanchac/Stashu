# Stashu Mobile App Setup Guide

This guide will help you set up and run the Stashu mobile app on your device.

## What's Included

The mobile app has been created with the following features:
- ✅ Firebase Authentication (Email/Password)
- ✅ Real-time messaging with Firestore
- ✅ Channel creation and management
- ✅ Message sending and receiving
- ✅ File upload support (images and documents)
- ✅ Cross-platform support (iOS & Android)
- ✅ Responsive design with Discord-like UI

## Project Structure

```
mobile/
├── src/
│   ├── contexts/
│   │   └── AuthContext.js          # Authentication context
│   ├── hooks/
│   │   ├── useChannels.js          # Hook for channel management
│   │   ├── useMessages.js          # Hook for message management
│   │   └── useFileUpload.js        # Hook for file uploads
│   ├── navigation/
│   │   └── AppNavigator.js         # Navigation configuration
│   ├── screens/
│   │   ├── LoginScreen.js          # Login screen
│   │   ├── SignupScreen.js         # Signup screen
│   │   └── DashboardScreen.js      # Main app screen
│   └── services/
│       ├── api.js                  # API service (axios)
│       └── firebase.js             # Firebase configuration
├── App.js                          # Root component
├── package.json                    # Dependencies
├── .env.example                    # Environment variables template
└── README.md                       # Mobile app documentation
```

## Prerequisites

Before you start, ensure you have:
1. Node.js (v16 or higher) installed
2. npm or yarn installed
3. Expo CLI installed globally: `npm install -g expo-cli`
4. For iOS: Xcode and iOS Simulator (Mac only)
5. For Android: Android Studio and Android Emulator

## Step-by-Step Setup

### 1. Fix NPM Permissions (If Needed)

If you encountered npm permission errors earlier, fix them:

```bash
sudo chown -R $(whoami) ~/.npm
npm cache clean --force
```

### 2. Install Dependencies

Navigate to the mobile directory and install dependencies:

```bash
cd mobile
npm install
```

If installation fails, try:
```bash
npm install --legacy-peer-deps
```

### 3. Configure Environment Variables

Copy the example environment file:
```bash
cp .env.example .env
```

Edit the `.env` file and add your Firebase credentials:

```env
# Get these from Firebase Console > Project Settings
EXPO_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id

# Backend API URL
EXPO_PUBLIC_API_URL=http://localhost:3000
```

You can find your web app's Firebase config at:
`web/src/services/firebase.js`

### 4. Start the Backend Server

The mobile app needs the backend API running. In a separate terminal:

```bash
cd ../backend
npm run dev
```

The backend should start on http://localhost:3000

### 5. Run the Mobile App

Start the Expo development server:

```bash
npm start
```

This will open the Expo DevTools in your browser.

#### Option A: Run on iOS Simulator (Mac only)
```bash
npm run ios
```
Or press `i` in the Expo DevTools terminal.

#### Option B: Run on Android Emulator
```bash
npm run android
```
Or press `a` in the Expo DevTools terminal.

#### Option C: Run on Physical Device

1. Install the **Expo Go** app on your phone:
   - iOS: [App Store](https://apps.apple.com/app/expo-go/id982107779)
   - Android: [Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)

2. Scan the QR code from the Expo DevTools with:
   - iOS: Camera app
   - Android: Expo Go app

3. **Important for Physical Devices**: Update the API URL in `.env`:
   ```env
   # Replace with your computer's local IP address
   EXPO_PUBLIC_API_URL=http://192.168.1.XXX:3000
   ```

   To find your IP:
   - Mac: `ifconfig | grep "inet " | grep -v 127.0.0.1`
   - Windows: `ipconfig` (look for IPv4 Address)
   - Linux: `ip addr show`

## Testing the App

1. **Sign Up**: Create a new account with email and password
2. **Create Channel**: Tap the "+" button or "New Channel" to create your first channel
3. **Send Messages**: Select a channel and type a message
4. **Real-time Updates**: Open the web app in parallel to see real-time synchronization

## Troubleshooting

### Issue: "Cannot connect to backend"
**Solution**:
- Verify the backend is running on port 3000
- Check `EXPO_PUBLIC_API_URL` in `.env`
- For physical devices, use your computer's IP instead of localhost

### Issue: Firebase authentication errors
**Solution**:
- Verify Firebase credentials in `.env`
- Ensure Firebase Authentication is enabled in Firebase Console
- Check that Email/Password authentication is enabled

### Issue: "Module not found" errors
**Solution**:
```bash
rm -rf node_modules
npm cache clean --force
npm install
```

### Issue: Expo Go app not connecting
**Solution**:
- Ensure phone and computer are on the same WiFi network
- Disable any VPN or proxy
- Try restarting the Expo dev server with `npm start -- --clear`

### Issue: Build fails on iOS/Android
**Solution**:
```bash
# Clear cache and rebuild
expo start -c
```

## App Features

### Authentication
- Email/password signup and login
- Persistent authentication with AsyncStorage
- Automatic token refresh

### Channels
- Create channels with custom names and emojis
- View channel list with message counts
- Real-time channel updates

### Messaging
- Send and receive messages in real-time
- Message pagination (load more)
- Auto-scroll to latest messages
- Message timestamps

### File Upload (Implemented but not integrated in UI)
- Image picker for photos
- Document picker for files
- Upload progress tracking
- S3 integration via backend

## Next Steps

To integrate file uploads into the UI:
1. Add attachment button to message input in `DashboardScreen.js`
2. Use `useFileUpload` hook
3. Call `pickImage()` or `pickDocument()`
4. Upload file and include s3Key in message

Example:
```javascript
const { pickImage, uploadFile } = useFileUpload();

const handleAttachment = async () => {
  const image = await pickImage();
  if (image) {
    const { s3Key, fileMetadata } = await uploadFile(
      image.uri,
      image.fileName,
      image.mimeType
    );
    // Include s3Key in message
  }
};
```

## Production Build

When ready to build for production:

### iOS
```bash
expo build:ios
```

### Android
```bash
expo build:android
```

## Additional Resources

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/)
- [Firebase Documentation](https://firebase.google.com/docs)

## Support

If you encounter any issues:
1. Check the [Expo Forums](https://forums.expo.dev/)
2. Review the [React Native GitHub Issues](https://github.com/facebook/react-native/issues)
3. Check Firebase Console for authentication/Firestore issues

---

**Congratulations!** Your Stashu mobile app is now ready to use! 🎉
