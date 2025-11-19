# Database Tables/Collections Verification

## Summary

This document verifies which Firestore collections (tables) are used for contacts and analytics in the Peppyr application.

## Contacts Collection

**Collection Name:** `contacts`

**Used For:**
- Storing individual contact/lead records
- Contact management (CRUD operations)
- CSV import data storage
- Contact status tracking

**Backend Endpoints:**
- `GET /api/contacts` - Fetch contacts (with optional filtering by `listId`, `status`, `search`)
- `POST /api/contacts` - Create new contact
- `PUT /api/contacts/:id` - Update contact
- `DELETE /api/contacts/:id` - Delete contact

**Location in Code:**
- `server/index.js` - Lines 680-810 (GET, POST, PUT, DELETE endpoints)
- All operations use: `db.collection('contacts')`

## Analytics Collections

### 1. Contacts Collection (Primary)
**Collection Name:** `contacts`

**Used For:**
- **Outreach Metrics** (`/api/analytics/metrics`):
  - Total contacts count
  - Contacted count (status: contacted, replied, meeting_scheduled, meeting_completed)
  - Replied count (status: replied, meeting_scheduled, meeting_completed)
  - Meetings scheduled count
  - Meetings completed count
  - Response rate calculation
  - Meeting conversion rate calculation

**Backend Endpoint:**
- `GET /api/analytics/metrics` - Lines 1094-1155 in `server/index.js`
- Queries: `db.collection('contacts').where('userId', '==', uid)`

### 2. Activities Collection (Secondary)
**Collection Name:** `activities`

**Used For:**
- **Template Performance** (`/api/analytics/template-performance`):
  - Template usage count (type: 'message_sent')
  - Response count per template (type: 'message_received')
  - Meeting scheduled count per template (type: 'meeting_scheduled')
  - Response rate per template
  - Meeting conversion rate per template

**Backend Endpoint:**
- `GET /api/analytics/template-performance` - Lines 1157-1239 in `server/index.js`
- Queries:
  - `db.collection('activities').where('userId', '==', uid).where('type', '==', 'message_sent')`
  - `db.collection('activities').where('userId', '==', uid).where('type', '==', 'message_received')`
  - `db.collection('activities').where('userId', '==', uid).where('type', '==', 'meeting_scheduled')`

## Verification Result

✅ **YES - The same `contacts` collection is used for both:**
1. **Contact Management** - All CRUD operations
2. **Analytics Metrics** - Outreach metrics calculation

✅ **Additional Collection Used:**
- `activities` collection is used for **Template Performance** analytics

## Data Flow

### Contacts Collection
```
User Action → Backend API → Firestore `contacts` collection
                              ↓
                    Used for both:
                    - Contact Management UI
                    - Analytics Dashboard
```

### Activities Collection
```
User Action → Backend API → Firestore `activities` collection
                              ↓
                    Used for:
                    - Template Performance Analytics
                    - Activity History Tracking
```

## Collections Summary

| Collection | Primary Use | Analytics Use |
|------------|-------------|---------------|
| `contacts` | ✅ Contact CRUD | ✅ Outreach Metrics |
| `activities` | ✅ Activity Tracking | ✅ Template Performance |
| `contactLists` | ✅ List Management | ❌ Not used |
| `templates` | ✅ Template Management | ❌ Not used (but referenced) |
| `userParameters` | ✅ Parameter Management | ❌ Not used |
| `users` | ✅ User Accounts | ❌ Not used |

## Conclusion

**The `contacts` collection is the primary table used for both contact management and analytics (outreach metrics).** The analytics tab calculates metrics directly from the `contacts` collection by filtering and aggregating contact statuses.

The `activities` collection is used separately for template performance analytics, which tracks message sending, responses, and meetings per template.

