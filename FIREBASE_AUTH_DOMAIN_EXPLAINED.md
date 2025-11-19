# Firebase Auth Domain - Simple Explanation

## The Confusion

There are TWO different things with similar names:

1. **`VITE_FIREBASE_AUTH_DOMAIN`** (Environment Variable)
   - This is Firebase's domain
   - Example: `peppyr.firebaseapp.com`
   - This tells your app WHERE Firebase Authentication is hosted

2. **Authorized Domains** (Firebase Console Setting)
   - This is YOUR custom domain
   - Example: `peppyr.online`
   - This tells Firebase WHICH domains are allowed to use authentication

## Think of it Like This:

- **Auth Domain** = The address of Firebase's authentication server
- **Authorized Domain** = The list of websites that are allowed to use it

## What to Set Where

### In Vercel Environment Variables:
```
VITE_FIREBASE_AUTH_DOMAIN=peppyr.firebaseapp.com
```
↑ This is Firebase's domain, NOT your custom domain

### In Firebase Console:
- Go to Authentication → Settings → Authorized domains
- Add: `peppyr.online`
- Add: `www.peppyr.online`
↑ These are YOUR domains that are allowed to use Firebase

## Why Both Are Needed

1. **Auth Domain** tells your frontend code: "Hey, when someone tries to sign in, send the request to `peppyr.firebaseapp.com`"

2. **Authorized Domains** tells Firebase: "Hey, if a request comes from `peppyr.online`, that's okay - allow it"

Without both, authentication won't work!

## Quick Check

**Wrong:**
```
VITE_FIREBASE_AUTH_DOMAIN=peppyr.online  ❌
```

**Right:**
```
VITE_FIREBASE_AUTH_DOMAIN=peppyr.firebaseapp.com  ✅
```

And separately, in Firebase Console, add `peppyr.online` to authorized domains.

