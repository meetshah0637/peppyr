# How Contact Lists and Contacts Collections Work Together

## Two Separate Collections

### 1. `contactLists` Collection
**Purpose:** Stores **metadata** about lists (like folders/buckets)

**What it stores:**
- List name (e.g., "sample-contacts_17/11/2025")
- Description
- CSV filename (if imported)
- Contact count (how many contacts are in this list)
- Source (csv_import or manual)
- Created/updated dates

**Example document:**
```json
{
  "id": "qv1NgNf5UkZ6SnkIPCFU",
  "name": "sample-contacts_17/11/2025",
  "contactCount": 10,
  "csvFileName": "sample-contacts.csv",
  "source": "csv_import",
  "userId": "..."
}
```

### 2. `contacts` Collection
**Purpose:** Stores **actual contact data** (the individual people/leads)

**What it stores:**
- First name, last name
- Email, phone, company
- Status (pending, contacted, etc.)
- **listId** (links the contact to a list)
- Template used
- Notes, tags
- Created/updated dates

**Example document:**
```json
{
  "id": "contact_123",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@acmecorp.com",
  "company": "Acme Corp",
  "status": "pending",
  "listId": "qv1NgNf5UkZ6SnkIPCFU",  // ← Links to contactLists
  "userId": "..."
}
```

## How They Work Together

### When You Upload a CSV:

1. **Creates 1 document in `contactLists`:**
   - Name: "sample-contacts_17/11/2025"
   - contactCount: 10
   - Source: csv_import

2. **Creates 10 documents in `contacts`:**
   - Each row from CSV becomes a contact document
   - Each contact has `listId` pointing to the list document
   - Stores all contact details (name, email, company, status)

### When You View a List:

1. **Fetches the list document** from `contactLists`
2. **Fetches all contacts** from `contacts` where `listId` matches
3. **Displays them together** in the UI

### When You Delete a List:

1. **Deletes all contacts** from `contacts` collection (where `listId` matches)
2. **Deletes the list document** from `contactLists` collection

## Usage Summary

| Collection | What It Stores | When It's Used |
|------------|----------------|----------------|
| `contactLists` | List metadata (name, count, source) | Creating lists, viewing list cards |
| `contacts` | Individual contact records | **Everything else** - viewing contacts, editing, analytics, status updates |

## Important: Contacts Collection IS Used Extensively

✅ **Contact Management:**
- Creating contacts (CSV import or manual)
- Viewing contacts in table
- Editing contact details
- Updating contact status
- Deleting contacts

✅ **Analytics:**
- Calculating total contacts
- Response rates
- Meeting conversion rates
- Status distribution

✅ **Filtering & Search:**
- Filtering by listId
- Filtering by status
- Searching by name/email/company

## Why Two Collections?

**Separation of Concerns:**
- `contactLists` = Organization (like folders)
- `contacts` = Data (the actual records)

**Benefits:**
- Can have multiple lists
- Can move contacts between lists
- Can query contacts by list
- Can delete entire lists efficiently
- Can track list-level metadata (like CSV filename)

## Conclusion

**YES, we ARE using the `contacts` collection!** It's the primary collection that stores all your contact data. The `contactLists` collection is just for organizing contacts into groups/lists.

