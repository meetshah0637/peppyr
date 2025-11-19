# Peppyr Logo Design

## Overview

The Peppyr logo features a modern speech bubble design that represents messaging and outreach, perfect for a LinkedIn outreach message manager.

## Design Elements

### Main Icon
- **Speech Bubble**: Modern, rounded speech bubble with gradient (indigo to purple)
- **Accent Dots**: Three colorful dots representing message templates/variations
- **Text Lines**: Subtle lines representing message content

### Color Scheme
- **Primary Gradient**: Indigo (#6366f1) to Purple (#8b5cf6)
- **Accent Gradient**: Amber (#f59e0b) to Red (#ef4444)
- **Text**: Gradient text matching the primary colors

### Symbolism
- **Speech Bubble**: Communication, messaging, outreach
- **Multiple Dots**: Template variety, message options
- **Text Lines**: Content, messages, templates

## Files

- `public/logo-peppyr.svg` - Full logo (120x120px)
- `public/favicon.svg` - Simplified favicon (32x32px)
- `src/components/Logo.tsx` - React component with variants

## Usage

### In Components

```tsx
import { Logo } from './components/Logo';

// Full logo with text
<Logo width={48} height={48} showText={true} />

// Icon only
<Logo width={32} height={32} showText={false} />

// Compact variant
<Logo width={32} height={32} showText={true} variant="compact" />
```

### Variants

- **full** (default): Full-size logo with gradient text
- **icon**: Icon only, no text
- **compact**: Smaller, optimized for headers

## Where It's Used

1. **Landing Page** (`src/components/Landing.tsx`)
   - Large logo (48x48px) with text
   - Centered at top of auth form

2. **Header** (`src/components/HeaderAuth.tsx`)
   - Compact logo (32x32px) with text
   - Left side of header bar

3. **Favicon** (`public/favicon.svg`)
   - Simplified version for browser tabs
   - Used in `index.html`

## Customization

To customize colors, edit the gradients in:
- `public/logo-peppyr.svg` - For the SVG file
- `src/components/Logo.tsx` - For the React component

The component uses Tailwind's gradient utilities for the text, which can be customized via the `bg-gradient-to-r` classes.

