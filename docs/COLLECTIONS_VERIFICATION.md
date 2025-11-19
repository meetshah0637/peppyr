# Firestore Collections Verification

## Collections Currently in Use

All collections listed below are **actively used** in the application and should **NOT be deleted**:

### 1. `users` ✅
- **Purpose**: User account information and metadata
- **Used in**: User authentication, signup, profile management
- **Endpoints**: `/api/auth/signup`, `/api/auth/verify`
- **Status**: **REQUIRED - DO NOT DELETE**

### 2. `templates` ✅
- **Purpose**: Message templates created by users for outreach
- **Used in**: Template library, template CRUD operations
- **Endpoints**: `/api/templates` (GET, POST, PUT, DELETE)
- **Status**: **REQUIRED - DO NOT DELETE**

### 3. `userParameters` ✅
- **Purpose**: Global template parameters (like {name}, {company}) that users can set
- **Used in**: Parameter management, template parameter replacement
- **Endpoints**: `/api/parameters` (GET, PUT)
- **Status**: **REQUIRED - DO NOT DELETE**

### 4. `contactLists` ✅
- **Purpose**: CSV import batches/lists - each uploaded CSV becomes a list
- **Used in**: CSV import, list management, contact organization
- **Endpoints**: `/api/contact-lists` (GET, POST, PUT, DELETE)
- **Status**: **REQUIRED - DO NOT DELETE**

### 5. `contacts` ✅
- **Purpose**: Individual contact/lead records
- **Used in**: Contact management, CSV import, contact CRUD
- **Endpoints**: `/api/contacts` (GET, POST, PUT, DELETE)
- **Status**: **REQUIRED - DO NOT DELETE**

### 6. `activities` ✅
- **Purpose**: Activity tracking (message sent, replied, meeting scheduled, etc.)
- **Used in**: Activity history, analytics, response tracking
- **Endpoints**: `/api/contacts/:contactId/activities` (GET), `/api/activities` (POST), `/api/analytics/*`
- **Status**: **REQUIRED - DO NOT DELETE**

## Summary

**All 6 collections are actively used and required for the application to function properly.**

### Collections to Keep:
- ✅ `users`
- ✅ `templates`
- ✅ `userParameters`
- ✅ `contactLists`
- ✅ `contacts`
- ✅ `activities`

### Collections to Delete:
- ❌ None - All collections are in use

## Verification

To verify which collections are used, check:
- `server/index.js` - All 6 collections are referenced
- `FIRESTORE_RULES.md` - Security rules for all 6 collections
- Frontend hooks: `useAuth`, `useTemplates`, `useParameters`, `useContacts`, `useContactLists`, `useActivities`

## If You See Other Collections

If you see any other collections in Firebase that are not listed above, they may be:
1. Test data from development
2. Old/unused collections from previous versions
3. Collections created by Firebase extensions

You can safely delete any collections that are not in the list above, but **DO NOT DELETE** any of the 6 listed collections.

