# Debugging Parameter Replacement

## Issue
Parameters are not being replaced when copying templates.

## Debugging Steps

1. **Open Browser Console** (F12 → Console tab)

2. **Check if parameters are loaded:**
   - Open Parameter Manager
   - Set some parameters (e.g., name = "John", company = "Acme")
   - Click "Save Parameters"
   - Check console for: "Saving parameters: {name: 'John', company: 'Acme'}"

3. **Check if parameters are available when copying:**
   - Copy a template with `{name}` or `{company}` placeholders
   - Check console for:
     - "Copying template:" - shows template body and current parameters
     - "Parameter replacement:" - shows what was replaced
     - "Processed body:" - shows final result

4. **Common Issues:**

   **Issue 1: Parameters are empty object `{}`**
   - Solution: Parameters might not be saved correctly
   - Check: Open Parameter Manager again - are your values still there?
   - Check: Network tab → Look for PUT /api/parameters request

   **Issue 2: Parameters not loaded from backend**
   - Solution: Check if you're logged in
   - Check: Network tab → Look for GET /api/parameters request
   - Check: Backend console for errors

   **Issue 3: Placeholder format incorrect**
   - Must be: `{name}` (with curly braces, no spaces)
   - Not: `{ name }` or `[name]` or `{{name}}`

   **Issue 4: Parameter key mismatch**
   - If template has `{name}` but parameter is saved as `Name` (capitalized)
   - Parameter keys are case-sensitive
   - Use lowercase: `name`, `company`, etc.

## Quick Test

1. Create a template with body: `Hello {name}, welcome to {company}!`
2. Set parameters: `name = "John"`, `company = "Acme"`
3. Copy the template
4. Expected clipboard: `Hello John, welcome to Acme!`

## Manual Check

Run in browser console:
```javascript
// Check current parameters
localStorage.getItem('appointment-library-settings')
// Should show your parameters in the JSON

// Test replacement manually
const text = "Hello {name}, welcome to {company}!";
const params = { name: "John", company: "Acme" };
const result = text.replace(/\{name\}/g, params.name).replace(/\{company\}/g, params.company);
console.log(result); // Should show: "Hello John, welcome to Acme!"
```

