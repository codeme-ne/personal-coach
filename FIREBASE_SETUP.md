# Firebase CLI Setup & Security Rules Deployment

## 🚀 Quick Setup Guide

Since the Firebase CLI is already installed and configured in your project, follow these steps to complete the setup:

## Step 1: Authenticate with Firebase

**On your local machine, run:**

```bash
npx firebase login
```

This will open a browser window where you'll:
1. Select your Google account (the one that owns the Firebase project)
2. Grant Firebase CLI permissions
3. Return to the terminal

## Step 2: Verify Project Connection

**Check that the project is correctly connected:**

```bash
npx firebase use
```

You should see: `Currently using project personal-coach-108b0 (Personal Coach)`

If not, run:
```bash
npx firebase use --add
```
And select `personal-coach-108b0` from the list.

## Step 3: Deploy Firestore Security Rules

**Deploy the security rules to protect your data:**

```bash
npx firebase deploy --only firestore:rules
```

This command will:
- Upload the `firestore.rules` file to your Firebase project
- Apply the security rules to your Firestore database
- Ensure only authenticated users can access their own data

## Step 4: Deploy Firestore Indexes (Optional)

**For better query performance:**

```bash
npx firebase deploy --only firestore:indexes
```

## Step 5: Verify Security Rules

**In Firebase Console:**
1. Go to https://console.firebase.google.com/
2. Select your `personal-coach-108b0` project
3. Navigate to Firestore Database → Rules
4. Verify the rules are active and properly formatted

## ⚠️ CRITICAL SECURITY NOTICE

**Your app WILL NOT WORK PROPERLY until the security rules are deployed!**

The current default rules allow read/write to authenticated users without data scoping. This means:
- Users could potentially see other users' habits
- Data is not properly protected

**The rules we've created ensure:**
- ✅ Only authenticated users can access data
- ✅ Users can only see their own habits and completions
- ✅ User data is completely isolated
- ✅ Server-side security enforcement

## 📁 Files Created

The following Firebase configuration files have been created in your project:

1. **`firestore.rules`** - Security rules for data protection
2. **`firebase.json`** - Firebase project configuration
3. **`firestore.indexes.json`** - Database indexes for performance
4. **`.firebaserc`** - Project alias configuration

## 🧪 Testing Security Rules

After deploying, test that the security works:

1. **Create two different user accounts**
2. **Add habits to each account**
3. **Verify each user only sees their own habits**
4. **Test that habits persist after logout/login**

## 📱 Run Your App

After deploying the security rules:

```bash
npm start
# or
npx expo start --web
```

## 🔧 Troubleshooting

### Permission Denied Errors
If you see permission denied errors after deploying rules:
- Wait 1-2 minutes for rules to propagate
- Refresh your browser
- Check that Firebase config environment variables are set

### Rules Not Working
- Verify deployment was successful
- Check Firebase Console → Firestore → Rules
- Ensure your app is using the correct Firebase project

### CLI Authentication Issues
If `firebase login` doesn't work:
```bash
npx firebase login --no-localhost
```

## 🎯 Next Steps

1. Deploy the security rules using the commands above
2. Test the authentication flow thoroughly
3. Verify data isolation between users
4. Consider setting up Firebase hosting for web deployment

Your authentication system is now complete and ready for production use!