# Clearing Local Storage

## Why You're Still Seeing Templates

Even though you deleted all collections from Firestore, you're still seeing templates because:

1. **Browser localStorage** - The app stores templates in your browser's local storage as a fallback
2. **Auto-migration** - When Firestore is empty, the app was automatically loading from localStorage

## How to Clear Local Storage

### Option 1: Using Browser DevTools (Recommended)

1. **Open your browser's Developer Tools:**
   - Chrome/Edge: Press `F12` or `Ctrl+Shift+I` (Windows) / `Cmd+Option+I` (Mac)
   - Firefox: Press `F12` or `Ctrl+Shift+I` (Windows) / `Cmd+Option+I` (Mac)

2. **Go to Application/Storage tab:**
   - Chrome/Edge: Click "Application" tab → "Local Storage" → `http://localhost:5173`
   - Firefox: Click "Storage" tab → "Local Storage" → `http://localhost:5173`

3. **Delete the keys:**
   - Find `appointment-library-templates`
   - Right-click → Delete
   - Find `appointment-library-settings` (optional)
   - Right-click → Delete

4. **Refresh your app** - Templates should now be gone!

### Option 2: Using the Helper HTML File

1. Open `scripts/clear-local-storage.html` in your browser
2. Click "Clear Templates Only" or "Clear All Local Storage"
3. Refresh your Peppyr app

### Option 3: Using Browser Console

1. Open Developer Tools (`F12`)
2. Go to Console tab
3. Run these commands:

```javascript
// Clear templates only
localStorage.removeItem('appointment-library-templates');

// Or clear everything
localStorage.clear();

// Then refresh the page
location.reload();
```

## What Changed in the Code

I've updated the code to:
- **Stop auto-migrating** from localStorage when Firestore is empty
- **Not fallback to localStorage** for logged-in users (data should come from Firestore)
- **Show empty list** when Firestore is empty (instead of showing old localStorage data)

This ensures that when you clear Firestore, you get a truly empty list, not old cached data.

## Verify It's Working

After clearing localStorage:

1. **Refresh your app** (`Ctrl+R` or `Cmd+R`)
2. **Check the templates list** - Should be empty if Firestore is empty
3. **Create a new template** - Should save to Firestore (check Firebase Console to verify)
4. **Log out and log back in** - Should still see your new template (from Firestore)

## Testing Data Isolation

To properly test that users can't see each other's templates:

1. **Clear localStorage** (using methods above)
2. **Create User A account** - Create some templates
3. **Log out**
4. **Clear localStorage again** (important!)
5. **Create User B account** - Should see empty list
6. **Verify User B cannot see User A's templates**

## Notes

- **localStorage is per-browser** - Each browser/device has its own localStorage
- **localStorage persists** - It doesn't clear when you clear Firestore
- **For testing** - Always clear localStorage when switching between test accounts
- **Production** - Users will only see their Firestore data (localStorage is just a fallback for offline/anonymous mode)

