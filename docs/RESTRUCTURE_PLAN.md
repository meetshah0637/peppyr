# Codebase Restructure Plan

## Current Issues
- Documentation files scattered in root directory
- Scripts in multiple locations (root/scripts and server/)
- Unclear separation between frontend, backend, and utilities

## Proposed Structure

```
peppyr/
├── frontend/              # All frontend React code
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── ...
├── backend/               # All backend API code
│   ├── src/
│   ├── scripts/          # Backend utility scripts
│   ├── package.json
│   └── ...
├── extension/            # Browser extension code
├── docs/                 # All documentation
│   ├── setup/
│   ├── api/
│   ├── database/
│   └── guides/
├── scripts/              # Root-level utility scripts
├── config/               # Shared configuration files
└── README.md            # Main project README
```

## Migration Steps
1. Create new directory structure
2. Move frontend code to frontend/
3. Move backend code to backend/
4. Organize documentation into docs/
5. Update all import paths and references
6. Update package.json scripts
7. Update build configurations

