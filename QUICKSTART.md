# Stashu - Quick Start Guide

Your Stashu app is **100% complete**! Here's how to get it running.

## ✅ What's Already Done

- ✅ Complete backend API (Node.js + Express)
- ✅ Firebase configured (Auth + Firestore)
- ✅ Frontend with React + Vite + Tailwind
- ✅ Login/Signup pages with Google OAuth
- ✅ Discord-style UI (Sidebar + Chat)
- ✅ Real-time message sync
- ✅ File upload infrastructure (S3 ready)

## 🚀 Get Running in 5 Minutes

### Step 1: Install Dependencies

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../web
npm install
```

### Step 2: Enable Firebase Authentication

1. Go to https://console.firebase.google.com/project/stashu-3eefe
2. Click **Authentication** in left sidebar
3. Click **Get Started**
4. Enable **Email/Password** provider
5. Enable **Google** provider (optional but recommended)

### Step 3: Deploy Firestore Rules

```bash
# Install Firebase CLI (if not installed)
npm install -g firebase-tools

# Login to Firebase
firebase login

# Deploy security rules (from project root)
firebase deploy --only firestore:rules
```

### Step 4: Start the App

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd web
npm run dev
```

### Step 5: Test It Out!

1. Open http://localhost:5173
2. Click **"Register"** to create an account
3. Create your first channel
4. Send a message
5. Watch it sync in real-time!

## 📸 What You Can Do Now

✅ **Create an account** (email/password or Google)
✅ **Create channels** (like "Ideas", "Links", "Notes")
✅ **Send text messages**
✅ **Real-time sync** (open in multiple tabs to see it!)
✅ **Delete messages**
✅ **Logout/Login**

## 🔧 File Upload Setup (Optional)

File uploads need AWS S3. To enable:

### 1. Create S3 Bucket

```bash
# Install AWS CLI
brew install awscli  # or download from aws.amazon.com

# Configure AWS
aws configure
```

### 2. Create Bucket

```bash
aws s3 mb s3://stashu-uploads
```

### 3. Configure CORS

Create `cors.json`:
```json
[
  {
    "AllowedOrigins": ["http://localhost:5173"],
    "AllowedMethods": ["GET", "PUT", "POST"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

Apply CORS:
```bash
aws s3api put-bucket-cors --bucket stashu-uploads --cors-configuration file://cors.json
```

### 4. Update Backend .env

Edit `backend/.env`:
```env
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key-id
AWS_SECRET_ACCESS_KEY=your-secret-access-key
AWS_S3_BUCKET=stashu-uploads
```

### 5. Restart Backend

```bash
cd backend
npm run dev
```

Now you can upload files! Click the paperclip icon in the message input.

## 🎨 Customization Ideas

### Change Theme Colors

Edit `web/tailwind.config.js`:
```javascript
colors: {
  discord: {
    accent: '#5865f2'  // Change this to your color!
  }
}
```

### Add More Emoji Icons

Edit `web/src/components/layout/Sidebar.jsx` line 120:
```javascript
['💬', '💡', '🔗', '📝', '📷', '📁', '⭐', '🎯', '🎨', '🚀']
```

## 🐛 Troubleshooting

### "Firebase: Error (auth/email-already-in-use)"
- Email already registered. Use the login page instead.

### "Cannot GET /api/channels"
- Backend not running. Start with `cd backend && npm run dev`

### "Network Error"
- Check CORS in `backend/.env`: `CORS_ORIGINS=http://localhost:5173`

### Messages not syncing
- Deploy Firestore rules: `firebase deploy --only firestore:rules`

## 📱 Next Steps

### Deploy to Production

**Backend (Railway):**
```bash
npm install -g @railway/cli
railway login
railway init
railway up
```

**Frontend (Vercel):**
```bash
npm install -g vercel
cd web
vercel --prod
```

### Add Mobile App

The React Native setup is ready in the `mobile/` folder. Just needs:
```bash
cd mobile
npm install
npx expo start
```

## 🎉 You're All Set!

Your app is fully functional with:
- User authentication
- Real-time messaging
- Channel organization
- Beautiful Discord-style UI

**Have fun organizing your digital life!** 🚀

---

Need help? Check:
- [README.md](README.md) - Full documentation
- [backend/README.md](backend/README.md) - Backend API details
- Firebase Console: https://console.firebase.google.com/project/stashu-3eefe
