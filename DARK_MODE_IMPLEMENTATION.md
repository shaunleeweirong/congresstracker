# Dark Mode Implementation ✨

## Overview
Dark mode has been successfully implemented using shadcn/ui components and Tailwind CSS v4 with a custom theme system.

## Features Implemented

### 1. Theme Provider Context
- **Location**: `frontend/src/contexts/ThemeContext.tsx`
- **Features**:
  - Support for 3 theme modes: `light`, `dark`, and `system`
  - Automatic system theme detection
  - LocalStorage persistence (key: `congresstracker-theme`)
  - Real-time system preference monitoring
  - No flash of unstyled content (FOUC)

### 2. Theme Toggle Component
- **Location**: `frontend/src/components/theme/ThemeToggle.tsx`
- **Features**:
  - Dropdown menu with theme options
  - Visual indicators for current theme
  - Animated icons (sun/moon)
  - Accessible with keyboard navigation

### 3. Theme Script (FOUC Prevention)
- **Location**: `frontend/src/components/theme/ThemeScript.tsx`
- **Purpose**: Prevents flash of incorrect theme on page load
- **Implementation**: Runs before React hydration to set theme immediately

### 4. Updated Components
- **Layout Component**: Updated with dark mode-friendly color classes
  - Header: `bg-card`, `border-border`, `text-foreground`
  - Navigation: `bg-accent`, `text-muted-foreground`
  - Footer: `bg-card`, `border-border`, `text-muted-foreground`
- **Root Layout**: Added ThemeProvider wrapper with `suppressHydrationWarning`

## How to Use

### For Developers

#### Accessing Theme State
```tsx
import { useTheme } from '@/contexts/ThemeContext';

function MyComponent() {
  const { theme, setTheme, resolvedTheme } = useTheme();

  // theme: 'light' | 'dark' | 'system'
  // resolvedTheme: 'light' | 'dark' (actual applied theme)
  // setTheme: (theme) => void
}
```

#### Using Theme-Aware Classes
Use Tailwind's semantic color tokens for automatic dark mode support:

```tsx
// ✅ Good - Uses semantic tokens
<div className="bg-background text-foreground">
  <h1 className="text-card-foreground">Title</h1>
  <p className="text-muted-foreground">Description</p>
</div>

// ❌ Avoid - Hard-coded colors don't adapt
<div className="bg-white text-gray-900">
  <h1 className="text-black">Title</h1>
</div>
```

#### Available Semantic Color Classes
- `bg-background` / `text-foreground` - Main background/text
- `bg-card` / `text-card-foreground` - Card backgrounds
- `bg-popover` / `text-popover-foreground` - Popover/dropdown backgrounds
- `bg-primary` / `text-primary-foreground` - Primary accent color
- `bg-secondary` / `text-secondary-foreground` - Secondary accent
- `bg-muted` / `text-muted-foreground` - Muted/subtle elements
- `bg-accent` / `text-accent-foreground` - Hover/focus states
- `border-border` - Border colors
- `text-destructive` - Error/destructive actions

### For Users

#### Accessing Theme Toggle
1. Look for the sun/moon icon button in the top-right header
2. Click to open theme selection dropdown
3. Choose from:
   - **Light** - Always use light theme
   - **Dark** - Always use dark theme
   - **System** - Follow system preferences (default)

#### Theme Persistence
Your theme preference is automatically saved and will persist across browser sessions.

## Testing Dark Mode

### Manual Testing Steps

1. **Start the development server**:
   ```bash
   cd frontend
   npm run dev
   ```

2. **Navigate to** http://localhost:3000

3. **Test Theme Toggle**:
   - Click the sun/moon button in the header
   - Select "Dark" - page should switch to dark theme
   - Select "Light" - page should switch to light theme
   - Select "System" - theme should match your OS preference

4. **Test Persistence**:
   - Change theme to "Dark"
   - Refresh the page
   - Verify dark theme is maintained

5. **Test System Preference**:
   - Set theme to "System"
   - Change your OS theme setting
   - Verify the app theme updates automatically

6. **Test Navigation**:
   - Toggle to dark mode
   - Navigate to different pages (Trades, Members, Alerts)
   - Verify all pages respect the theme setting

### Visual Checks
- ✅ Text is readable in both themes
- ✅ Borders are visible in both themes
- ✅ Cards have proper contrast
- ✅ Navigation hover states work
- ✅ Dropdown menus are readable
- ✅ Icons are visible

## Technical Details

### Theme Color Definitions
Defined in `frontend/src/app/globals.css`:

**Light Mode** (`:root`):
- Background: `oklch(1 0 0)` (white)
- Foreground: `oklch(0.145 0 0)` (near black)
- Card: `oklch(1 0 0)` (white)

**Dark Mode** (`.dark`):
- Background: `oklch(0.145 0 0)` (near black)
- Foreground: `oklch(0.985 0 0)` (near white)
- Card: `oklch(0.205 0 0)` (dark gray)

### Theme Application
The theme is applied by:
1. Adding/removing `.dark` class to `<html>` element
2. CSS variables cascade down to all components
3. Tailwind's `dark:` variant applies dark-specific styles

### Implementation Architecture
```
Root Layout (layout.tsx)
├── ThemeScript (prevents FOUC)
├── <html suppressHydrationWarning>
└── ThemeProvider
    └── AuthProvider
        └── Application Content
            └── Layout Component
                └── ThemeToggle
```

## Future Enhancements

Potential improvements for the future:
- [ ] Add transition animations between themes
- [ ] Per-component theme overrides
- [ ] Custom theme colors/presets
- [ ] Theme preview before applying
- [ ] Keyboard shortcut for quick toggle
- [ ] Remember last manual theme when switching from "System"

## Files Modified/Created

### Created
- ✅ `frontend/src/contexts/ThemeContext.tsx`
- ✅ `frontend/src/components/theme/ThemeToggle.tsx`
- ✅ `frontend/src/components/theme/ThemeScript.tsx`

### Modified
- ✅ `frontend/src/app/layout.tsx` - Added ThemeProvider wrapper
- ✅ `frontend/src/components/layout/Layout.tsx` - Updated color classes
- ✅ `frontend/src/app/globals.css` - Already had dark mode variables

## Troubleshooting

### Theme not persisting
- Check browser localStorage for `congresstracker-theme` key
- Try clearing localStorage and setting theme again

### Flash of incorrect theme on load
- Ensure `ThemeScript` is in the `<head>` of root layout
- Verify `suppressHydrationWarning` is on `<html>` tag

### Colors not changing
- Check if components are using semantic tokens (e.g., `bg-background` instead of `bg-white`)
- Verify `.dark` class is being applied to `<html>` element (inspect in DevTools)

### System theme not updating
- Check browser console for errors
- Verify MediaQuery listener is working (test by changing OS theme)

## Browser Support
- ✅ Chrome 93+
- ✅ Firefox 91+
- ✅ Safari 14.1+
- ✅ Edge 93+

All modern browsers with support for:
- CSS custom properties
- `prefers-color-scheme` media query
- localStorage API

---

**Implementation Date**: October 2, 2025
**Version**: 1.0.0
**Status**: ✅ Complete and Ready for Testing
