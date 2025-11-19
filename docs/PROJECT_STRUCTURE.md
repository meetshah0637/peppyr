# Peppyr Project Structure

## Current Structure (Organized)

```
peppyr/
├── frontend/                    # React Frontend (if migrated)
│   └── src/                    # Or keep src/ in root
│
├── backend/                     # Express Backend (if migrated)  
│   └── scripts/                # Or keep server/ in root
│
├── extension/                   # Browser Extension
│   ├── manifest.json
│   ├── content-script.ts
│   └── service-worker.ts
│
├── docs/                        # 📚 All Documentation (NEW)
│   ├── README.md                # Documentation index
│   ├── setup/                   # Setup & Installation
│   │   ├── SETUP.md
│   │   └── FIREBASE_SETUP.md
│   ├── api/                     # API Documentation
│   │   └── README_BACKEND.md
│   ├── database/                # Database & Firestore
│   │   ├── FIRESTORE_RULES.md
│   │   ├── DATABASE_VERIFICATION.md
│   │   ├── COLLECTIONS_EXPLANATION.md
│   │   ├── COLLECTIONS_ANALYSIS.md
│   │   ├── COLLECTIONS_VERIFICATION.md
│   │   ├── FIRESTORE_COLLECTION_BEHAVIOR.md
│   │   └── DATA_ISOLATION.md
│   └── guides/                  # User Guides & Features
│       ├── TEMPLATE_PARAMETERS.md
│       ├── LOGO_DESIGN.md
│       ├── TEST_PARAMETERS.md
│       ├── DEBUG_PARAMETERS.md
│       ├── CLEAR_LOCAL_STORAGE.md
│       └── CHANGES.md
│
├── scripts/                     # Utility Scripts
│   ├── clear-contacts.js
│   ├── clear-local-storage.html
│   ├── prepare-extension.mjs
│   └── ...
│
├── src/                         # Frontend Source (current location)
│   ├── components/
│   ├── hooks/
│   ├── services/
│   ├── types/
│   └── utils/
│
├── server/                      # Backend Source (current location)
│   ├── index.js
│   ├── package.json
│   └── service-account.json
│
├── public/                      # Static Assets
├── sample-contacts.csv          # Sample data
│
├── package.json                 # Root package.json
├── vite.config.ts              # Vite config
├── tsconfig.json               # TypeScript config
├── tailwind.config.js          # Tailwind config
└── README.md                   # Main README
```

## Documentation Organization

All documentation is now organized in the `docs/` directory:

- **Setup Guides** (`docs/setup/`) - Installation and configuration
- **API Docs** (`docs/api/`) - Backend API documentation  
- **Database** (`docs/database/`) - Firestore schema and rules
- **Guides** (`docs/guides/`) - Feature guides and troubleshooting

## Code Organization

- **Frontend**: `src/` - React components, hooks, services
- **Backend**: `server/` - Express API, routes, middleware
- **Extension**: `extension/` - Browser extension code
- **Scripts**: `scripts/` - Utility and helper scripts

## Benefits

✅ **Clear Documentation Structure** - Easy to find relevant docs
✅ **Logical Grouping** - Related files are together
✅ **Scalable** - Easy to add new documentation
✅ **Professional** - Industry-standard organization

