# Peppyr Project Structure

## New Organized Structure

```
peppyr/
├── frontend/                    # React Frontend Application
│   ├── src/                    # Source code
│   │   ├── components/         # React components
│   │   ├── hooks/              # Custom React hooks
│   │   ├── services/           # API services
│   │   ├── types/              # TypeScript types
│   │   ├── utils/              # Utility functions
│   │   ├── App.tsx             # Main app component
│   │   └── main.tsx            # Entry point
│   ├── public/                 # Static assets
│   ├── index.html              # HTML template
│   ├── package.json            # Frontend dependencies
│   ├── vite.config.ts          # Vite configuration
│   ├── tsconfig.json           # TypeScript config
│   └── tailwind.config.js      # Tailwind CSS config
│
├── backend/                     # Express.js Backend API
│   ├── src/                    # Source code (or root if using index.js)
│   │   ├── index.js            # Main server file
│   │   └── routes/              # API routes (if organized)
│   ├── scripts/                 # Backend utility scripts
│   │   ├── clear-contacts.js
│   │   └── fix-contact-counts.js
│   ├── service-account.json     # Firebase service account
│   ├── package.json             # Backend dependencies
│   └── .env.example             # Environment variables template
│
├── extension/                    # Browser Extension
│   ├── manifest.json
│   ├── content-script.ts
│   └── service-worker.ts
│
├── docs/                        # Documentation
│   ├── README.md                # Documentation index
│   ├── setup/                   # Setup guides
│   │   ├── SETUP.md
│   │   └── FIREBASE_SETUP.md
│   ├── api/                     # API documentation
│   │   └── README_BACKEND.md
│   ├── database/                # Database docs
│   │   ├── FIRESTORE_RULES.md
│   │   ├── DATABASE_VERIFICATION.md
│   │   ├── COLLECTIONS_EXPLANATION.md
│   │   └── ...
│   └── guides/                  # User guides
│       ├── TEMPLATE_PARAMETERS.md
│       └── ...
│
├── scripts/                     # Root-level utility scripts
│   ├── clear-contacts.js
│   ├── prepare-extension.mjs
│   └── ...
│
├── config/                      # Shared configuration
│   └── (future config files)
│
├── .gitignore
├── README.md                     # Main project README
├── package.json                  # Root package.json (workspace)
└── RESTRUCTURE_PLAN.md          # This restructuring plan
```

## Benefits

1. **Clear Separation**: Frontend and backend are clearly separated
2. **Organized Docs**: All documentation in one place with logical subdirectories
3. **Easy Navigation**: Developers can quickly find what they need
4. **Scalability**: Easy to add new features or modules
5. **Maintainability**: Better organization makes code easier to maintain

## Migration Notes

- Configuration files (vite.config.ts, tsconfig.json) remain in their respective directories
- Import paths may need updating if files are moved
- Build scripts need to be updated to reflect new paths

