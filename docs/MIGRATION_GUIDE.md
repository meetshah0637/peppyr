# Codebase Migration Guide

## Overview
This guide helps you migrate from the current structure to the new organized structure.

## Step-by-Step Migration

### Option 1: Manual Migration (Recommended for Active Development)

1. **Create new directories:**
   ```bash
   mkdir -p frontend/src backend/scripts docs/setup docs/api docs/database docs/guides
   ```

2. **Move frontend files:**
   - Move `src/` → `frontend/src/`
   - Move `public/` → `frontend/public/`
   - Move `index.html` → `frontend/index.html`
   - Move `vite.config.ts` → `frontend/vite.config.ts`
   - Move `tsconfig.json` → `frontend/tsconfig.json`
   - Move `tailwind.config.js` → `frontend/tailwind.config.js`
   - Copy `package.json` → `frontend/package.json` (update paths)

3. **Move backend files:**
   - Move `server/index.js` → `backend/index.js`
   - Move `server/package.json` → `backend/package.json`
   - Move `server/service-account.json` → `backend/service-account.json`
   - Move `server/clear-contacts.js` → `backend/scripts/`
   - Move `server/fix-contact-counts.js` → `backend/scripts/`

4. **Organize documentation:**
   - Move all `.md` files to appropriate `docs/` subdirectories

5. **Update configurations:**
   - Update `vite.config.ts` paths
   - Update import paths in code
   - Update package.json scripts

### Option 2: Keep Current Structure (Simpler)

If you prefer to keep the current structure but organize it better:

1. **Create docs structure:**
   ```bash
   mkdir -p docs/setup docs/api docs/database docs/guides
   ```

2. **Move documentation files only:**
   - Move all `.md` files to `docs/` subdirectories
   - Keep `src/`, `server/`, etc. in root

3. **Update README.md** to reflect current structure

## Recommended: Hybrid Approach

Keep the current structure but organize documentation:

```
peppyr/
├── src/              # Frontend (keep as is)
├── server/           # Backend (keep as is)
├── extension/        # Extension (keep as is)
├── docs/             # NEW: All documentation
│   ├── setup/
│   ├── api/
│   ├── database/
│   └── guides/
├── scripts/          # Utility scripts
└── README.md         # Updated main README
```

This approach:
- ✅ Minimal disruption
- ✅ Better documentation organization
- ✅ No need to update import paths
- ✅ Easy to implement

## Next Steps

1. Choose your preferred approach
2. Execute the migration
3. Update all documentation references
4. Test that everything still works
5. Update CI/CD if applicable

