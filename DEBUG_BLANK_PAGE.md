# Debug Blank Page Issue

## Quick Checks

1. **Open Browser Console (F12)**
   - Look for red error messages
   - Check if React is loading
   - Look for `[App]` and `[Home]` debug logs

2. **Check Network Tab**
   - Make sure `main.tsx` is loading (status 200)
   - Make sure CSS files are loading
   - Check for 404 errors

3. **Verify React is Mounting**
   - In console, type: `document.getElementById('root')`
   - Should return the root div element
   - Check if it has any children

## Common Issues

### Issue: JavaScript Errors
**Symptom:** Blank page, errors in console

**Fix:**
- Check console for specific error
- Common: Missing environment variables
- Common: Import errors
- Common: Firebase initialization errors

### Issue: CSS Not Loading
**Symptom:** Page loads but looks broken/blank

**Fix:**
- Check Network tab for CSS files
- Verify Tailwind is configured
- Check `index.css` is imported

### Issue: React Not Rendering
**Symptom:** Root div exists but empty

**Fix:**
- Check React DevTools
- Verify `main.tsx` is executing
- Check for uncaught errors

## Test Commands

Run these in browser console:

```javascript
// Check if root exists
document.getElementById('root')

// Check if React is loaded
window.React

// Check if app is mounted
document.querySelector('#root').innerHTML

// Force re-render (if React is loaded)
window.location.reload()
```

