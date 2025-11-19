# Firestore Security Rules Setup

## Overview
To use Firebase Firestore with this application, you need to configure security rules that allow authenticated users to read and write their own data.

## Security Rules

Copy and paste these rules into your Firebase Console:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read and write their own user document
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Users can only read and write their own templates
    match /templates/{templateId} {
      // Can read only if the template's userId matches authenticated user's UID
      allow read: if request.auth != null && 
                     request.auth.uid == resource.data.userId;
      
      // Can create only if setting userId to their own UID
      allow create: if request.auth != null && 
                      request.auth.uid == request.resource.data.userId;
      
      // Can update/delete only their own templates
      allow update, delete: if request.auth != null && 
                               request.auth.uid == resource.data.userId;
    }
    
    // Users can only read and write their own parameters
    match /userParameters/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Users can only read and write their own contact lists
    match /contactLists/{listId} {
      allow read: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
      allow update, delete: if request.auth != null && request.auth.uid == resource.data.userId;
    }

    // Users can only read and write their own contacts
    match /contacts/{contactId} {
      allow read: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
      allow update, delete: if request.auth != null && request.auth.uid == resource.data.userId;
    }

    // Users can only read and write their own activities
    match /activities/{activityId} {
      allow read: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
      allow update, delete: if request.auth != null && request.auth.uid == resource.data.userId;
    }
  }
}
```

## Collections Used in This Application

All collections listed below are **actively used** and should **NOT be deleted**:

1. **`users`** - User account information and metadata
2. **`templates`** - Message templates created by users
3. **`userParameters`** - Global template parameters (like {name}, {company})
4. **`contactLists`** - CSV import batches/lists
5. **`contacts`** - Individual contact/lead records
6. **`activities`** - Activity tracking (message sent, replied, etc.)

## How to Apply These Rules

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Firestore Database** → **Rules**
4. Replace the default rules with the rules above
5. Click **Publish**

## Rule Explanation

- **User Documents**: Users can only access their own user document (`/users/{userId}`)
- **Template Documents**: Users can only access templates where the `userId` field matches their authenticated UID
- **Contact Lists**: Users can only access contact lists they created
- **Contacts**: Users can only access contacts they created
- **Activities**: Users can only access activities for their own contacts
- **Authentication Required**: All operations require the user to be authenticated (`request.auth != null`)

## Testing the Rules

You can test these rules in the Firebase Console:

1. Go to **Firestore Database** → **Rules** → **Rules Playground**
2. Test read/write operations with authenticated and unauthenticated users
3. Verify that users can only access their own data

## Troubleshooting

If you see "Missing or insufficient permissions" errors:

1. **Check Authentication**: Ensure the user is properly authenticated
2. **Verify User ID**: Make sure the `userId` field in documents matches the authenticated user's UID
3. **Check Rules**: Verify the security rules are published and correct
4. **Console Logs**: Check browser console for detailed error messages

## Local Development

For local development without Firebase:
- The app will automatically fall back to local storage
- No authentication is required
- All data is stored locally in the browser

## Production Deployment

Before deploying to production:
1. Set up proper Firebase configuration in your `.env` file
2. Configure Firestore security rules
3. Test authentication flow
4. Verify data synchronization works correctly
