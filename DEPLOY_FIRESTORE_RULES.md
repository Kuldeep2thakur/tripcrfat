# Deploy Firestore Rules

You're getting a "Missing or insufficient permissions" error because the updated Firestore rules haven't been deployed to Firebase yet.

## Quick Fix - Deploy via Firebase Console (Easiest)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click on **Firestore Database** in the left sidebar
4. Click on the **Rules** tab
5. Copy the contents of `firestore.rules` file
6. Paste it into the rules editor
7. Click **Publish**

## Alternative - Deploy via Firebase CLI

### Step 1: Install Firebase CLI (if not already installed)
```bash
npm install -g firebase-tools
```

### Step 2: Login to Firebase
```bash
firebase login
```

### Step 3: Initialize Firebase (if not done)
```bash
firebase init
```
- Select **Firestore** when prompted
- Choose your existing project
- Accept default file names (firestore.rules)

### Step 4: Deploy Rules
```bash
firebase deploy --only firestore:rules
```

## What the New Rule Does

The updated rule allows you to query your own entries across all trips:

```javascript
// Collection group rule for 'entries'
match /{path=**}/entries/{entryId} {
  allow read: if isSignedIn() && resource.data.get("authorId", "") == request.auth.uid;
}
```

This enables:
- ✅ Counting total journal entries in the dashboard
- ✅ Querying entries across all trips
- ✅ Secure access (only your own entries)

## Verify Deployment

After deploying, refresh your dashboard page. The "Journal Entries" count should now display correctly without permission errors.

## Troubleshooting

If you still get permission errors:
1. Make sure you're logged in to the correct Firebase account
2. Verify the rules were published (check the Firebase Console)
3. Clear your browser cache and reload
4. Check the browser console for specific error messages
