# Testing Parameter Replacement

## Quick Test for Company Parameter

1. **Open Parameter Manager**
   - Click "Parameters" button
   - Find "Company Name" in Common Parameters section
   - Set value: `company = "Acme Corp"`
   - Click "Save Parameters"

2. **Check Console (F12)**
   - Should see: `"Saving parameters: {company: 'Acme Corp'}"`
   - Should see: `"Parameters saved to API:"` or `"Parameters saved to localStorage"`

3. **Create/Edit Template**
   - Create a template with body: `Hello, I'm from {company}`
   - Save the template

4. **Copy Template**
   - Click "Copy" on the template
   - Check console for:
     - `"Copying template:"` - shows template body and parameters
     - `"Parameter replacement - Input:"` - shows what will be replaced
     - `"✓ Replaced {company} with 'Acme Corp'"` - confirms replacement
     - `"Parameter replacement - Output:"` - shows final result

5. **Verify Clipboard**
   - Paste somewhere (Ctrl+V)
   - Should see: `Hello, I'm from Acme Corp`

## Common Issues

### Issue: Parameter shows in console but not replaced
**Check:**
- Is the placeholder exactly `{company}` (not `{Company}` or `{ company }`)?
- Does the parameter value have content (not empty string)?
- Check console for warnings about unreplaced placeholders

### Issue: Parameter not in the parameters object
**Check:**
- Open Parameter Manager
- Is the value actually saved? (reopen to verify)
- Check console for `"Loaded parameters from API:"` or `"Loaded parameters from localStorage:"`
- Verify the key is exactly `"company"` (lowercase)

### Issue: Case sensitivity
**Solution:** I've added automatic lowercase normalization, so `Company`, `COMPANY`, and `company` all work the same.

## Manual Test in Console

```javascript
// Test replacement manually
const text = "Hello from {company}";
const params = { company: "Acme Corp" };
const result = text.replace(/\{company\}/gi, params.company);
console.log(result); // Should show: "Hello from Acme Corp"
```

