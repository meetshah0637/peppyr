# Data Isolation & Security

## Overview

Peppyr ensures that **each user can only see and manage their own templates/messages**. This is enforced at multiple levels for maximum security.

## How It Works

### 1. Backend API Filtering (Primary Security Layer)

All API endpoints automatically filter data by the authenticated user's ID:

#### **GET /api/templates** - List Templates
```javascript
// Only returns templates where userId matches the authenticated user
const snapshot = await db.collection('templates')
  .where('userId', '==', uid)  // ← Filters by user ID
  .orderBy('createdAt', 'desc')
  .get();
```

#### **POST /api/templates** - Create Template
```javascript
// Automatically adds userId to every template
const template = {
  ...data,
  userId: uid,  // ← Automatically set from authenticated user
  // ... other fields
};
```

#### **PUT /api/templates/:id** - Update Template
```javascript
// Verifies ownership before allowing update
if (templateData.userId !== uid) {
  return res.status(403).json({ error: 'Forbidden: Not your template' });
}
```

#### **DELETE /api/templates/:id** - Delete Template
```javascript
// Verifies ownership before allowing delete
if (templateData.userId !== uid) {
  return res.status(403).json({ error: 'Forbidden: Not your template' });
}
```

### 2. Firestore Security Rules (Database-Level Security)

Even if someone bypasses the API, Firestore rules prevent unauthorized access:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read and write their own templates
    match /templates/{templateId} {
      // Can only read if the template's userId matches their auth UID
      allow read: if request.auth != null && 
                     request.auth.uid == resource.data.userId;
      
      // Can only create if setting userId to their own UID
      allow create: if request.auth != null && 
                      request.auth.uid == request.resource.data.userId;
      
      // Can only update/delete their own templates
      allow write: if request.auth != null && 
                      request.auth.uid == resource.data.userId;
    }
  }
}
```

## Firestore Structure

We use a **single `templates` collection** with a `userId` field. This is the recommended approach:

```
templates/
  ├── template1_id
  │   ├── userId: "user_abc123"  ← Links to user
  │   ├── title: "My Template"
  │   └── body: "..."
  ├── template2_id
  │   ├── userId: "user_abc123"  ← Same user
  │   ├── title: "Another Template"
  │   └── body: "..."
  └── template3_id
      ├── userId: "user_xyz789"  ← Different user
      ├── title: "Their Template"
      └── body: "..."
```

**Why not separate collections per user?**
- Single collection is more efficient for queries
- Easier to manage and scale
- Security rules handle isolation
- Backend API filters ensure proper access

## Authentication Flow

1. User signs up/logs in → Gets Firebase ID token
2. Frontend sends token to backend → `Authorization: Bearer <token>`
3. Backend verifies token → Extracts `uid` from token
4. All operations use this `uid` to filter/verify ownership

## Testing Data Isolation

To verify it's working:

1. **Create two test accounts:**
   - User A: `userA@test.com`
   - User B: `userB@test.com`

2. **As User A:**
   - Create a template "Template A"
   - Should only see "Template A"

3. **As User B:**
   - Create a template "Template B"
   - Should only see "Template B" (NOT "Template A")

4. **Try to access User A's template as User B:**
   - Should get 403 Forbidden error
   - Template should not appear in User B's list

## Current Implementation Status

✅ **Backend API** - All endpoints filter by `userId`  
✅ **Firestore Rules** - Security rules enforce ownership  
✅ **Authentication** - Token-based auth with user ID extraction  
✅ **Frontend** - Uses backend API (not direct Firestore access)

## Important Notes

- **Never trust the frontend** - All security is enforced on the backend
- **Firestore rules are a backup** - Primary security is in the API
- **Each template has `userId`** - This field is set automatically and cannot be changed by users
- **Tokens are verified** - Backend verifies Firebase ID tokens on every request

## Troubleshooting

### "I can see another user's templates"
1. Check that Firestore rules are published (see `FIRESTORE_RULES.md`)
2. Verify backend is running and filtering correctly
3. Check browser console for API errors
4. Verify you're logged in as the correct user

### "403 Forbidden errors"
- This is expected! It means security is working
- You're trying to access a template that doesn't belong to you
- This is the correct behavior

### "Templates not showing up"
- Check that you're authenticated (check Network tab for 401 errors)
- Verify backend is filtering by your user ID
- Check Firestore console to see if templates have correct `userId` field

