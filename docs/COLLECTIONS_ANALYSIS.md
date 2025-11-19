# Firestore Collections Analysis

## Current Collections in Use

Based on code analysis, the application uses **exactly 6 collections**:

1. ✅ **`users`** - User accounts
2. ✅ **`templates`** - Message templates
3. ✅ **`userParameters`** - Template parameters
4. ✅ **`contactLists`** - CSV import batches/lists
5. ✅ **`contacts`** - Individual contacts/leads
6. ✅ **`activities`** - Activity tracking

## Important: Only ONE `contacts` Collection

The code uses **only one `contacts` collection** (lowercase). There is no duplicate or multiple contacts tables.

**Backend Code Reference:**
- All contact operations use: `db.collection('contacts')`
- No other contact collection names are used

## Potential Issues

If you're seeing listing issues, it's **NOT** because of multiple contacts tables. Possible causes:

1. **Missing Firestore Index**: When filtering by `userId` + `listId` + `orderBy('updatedAt')`, Firestore requires a composite index. The code handles this with a fallback, but you should create the index.

2. **Case Sensitivity**: Firestore collection names are case-sensitive. Make sure you only have:
   - `contacts` (lowercase) ✅
   - NOT `Contacts` (uppercase) ❌
   - NOT `contact` (singular) ❌

3. **Query Filtering**: The query filters by:
   - `userId` (required)
   - `listId` (optional, when viewing a specific list)
   - `status` (optional)

## How to Check for Duplicate Collections

1. Go to Firebase Console → Firestore Database
2. Check the left sidebar for collections
3. Look for any variations:
   - `contacts` ✅ (keep this one)
   - `Contacts` ❌ (delete if exists)
   - `contact` ❌ (delete if exists)
   - Any other contact-related collections ❌ (delete if not needed)

## Firestore Indexes Needed

If you're filtering by `listId` and ordering by `updatedAt`, you may need to create a composite index:

1. Go to Firebase Console → Firestore Database → Indexes
2. Click "Create Index"
3. Collection ID: `contacts`
4. Fields to index:
   - `userId` (Ascending)
   - `listId` (Ascending)
   - `updatedAt` (Descending)
5. Query scope: Collection

The code will work without this index (it falls back to no orderBy), but having the index improves performance.

## Verification

To verify which collections are actually being used:

1. Check `server/index.js` - All collection references are there
2. Search for `collection('` in the codebase
3. Only these 6 collections should appear

## Summary

- **There is only ONE `contacts` collection** - the listing issue is NOT due to multiple tables
- All 6 collections are required and actively used
- If you see other collections in Firebase, they may be test data or old collections that can be safely deleted
- The listing issue is likely due to:
  - Missing Firestore index
  - Query filtering not working as expected
  - Data not being saved with correct `listId` field

