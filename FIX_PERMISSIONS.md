# Fix Firestore Permissions

You're getting "Missing or insufficient permissions" because Firestore security rules need to be deployed.

## Quick Fix (2 steps)

### Step 1: Deploy Firestore Rules

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Deploy rules (run from project root)
firebase deploy --only firestore:rules
```

### Step 2: Restart Backend

After updating CORS, restart the backend:

```bash
# Stop backend (Ctrl+C)
# Then restart:
cd backend
npm run dev
```

## Alternative: Manual Rule Deployment

If you prefer to use the Firebase Console:

1. Go to https://console.firebase.google.com/project/stashu-3eefe/firestore/rules
2. Replace the rules with this:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function isAuthenticated() {
      return request.auth != null;
    }

    function isOwner(uid) {
      return request.auth.uid == uid;
    }

    match /users/{uid} {
      allow read, write: if isAuthenticated() && isOwner(uid);

      match /channels/{channelId} {
        allow read, write: if isAuthenticated() && isOwner(uid);

        match /messages/{messageId} {
          allow read, write: if isAuthenticated() && isOwner(uid);
        }
      }
    }

    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

3. Click **Publish**

## Then Try Again

After deploying rules and restarting backend:
1. Refresh your browser
2. Try creating a channel
3. It should work now!
