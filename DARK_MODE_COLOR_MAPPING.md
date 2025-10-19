# Dark Mode Color Mapping Guide

## Problem
Many components use hard-coded Tailwind gray colors that don't adapt to dark mode, causing text to be invisible or hard to read.

## Solution: Use Semantic Color Tokens

Replace hard-coded colors with shadcn/ui's semantic tokens that automatically adapt to light/dark mode:

### Text Colors

| ❌ Don't Use | ✅ Use Instead | Purpose |
|-------------|---------------|---------|
| `text-gray-900` | `text-foreground` | Primary text (headings, body) |
| `text-gray-800` | `text-foreground` | Primary text |
| `text-gray-700` | `text-card-foreground` | Card text |
| `text-gray-600` | `text-muted-foreground` | Secondary text, descriptions |
| `text-gray-500` | `text-muted-foreground` | Subtle text, metadata |
| `text-gray-400` | `text-muted-foreground` | Very subtle text, icons |
| `text-black` | `text-foreground` | Primary text |
| `text-white` | `text-background` | Inverted text |

### Background Colors

| ❌ Don't Use | ✅ Use Instead | Purpose |
|-------------|---------------|---------|
| `bg-white` | `bg-card` or `bg-background` | Main backgrounds |
| `bg-gray-50` | `bg-accent` or `bg-muted` | Subtle backgrounds, hover states |
| `bg-gray-100` | `bg-accent` or `bg-muted` | Slightly emphasized backgrounds |
| `bg-gray-200` | `bg-accent` | More emphasized backgrounds |
| `bg-gray-800` | `bg-card` | Dark backgrounds (in light mode) |
| `bg-gray-900` | `bg-background` | Very dark backgrounds |

### Border Colors

| ❌ Don't Use | ✅ Use Instead |
|-------------|---------------|
| `border-gray-200` | `border-border` |
| `border-gray-300` | `border-border` |
| `border-gray-400` | `border-border` |

### Hover States

| ❌ Don't Use | ✅ Use Instead |
|-------------|---------------|
| `hover:bg-gray-50` | `hover:bg-accent` |
| `hover:bg-gray-100` | `hover:bg-accent` |
| `hover:text-gray-900` | `hover:text-foreground` |

## Complete Semantic Token Reference

### Available Tokens (from globals.css)

```css
/* Text Colors */
text-foreground          /* Primary text */
text-card-foreground     /* Text on cards */
text-popover-foreground  /* Text in popovers */
text-primary-foreground  /* Text on primary backgrounds */
text-muted-foreground    /* Subtle/secondary text */
text-accent-foreground   /* Text on accent backgrounds */
text-destructive         /* Error/danger text */

/* Background Colors */
bg-background           /* Main page background */
bg-card                 /* Card backgrounds */
bg-popover              /* Popover/dropdown backgrounds */
bg-primary              /* Primary button/accent backgrounds */
bg-secondary            /* Secondary backgrounds */
bg-muted                /* Muted backgrounds */
bg-accent               /* Hover/focus backgrounds */
bg-destructive          /* Error/danger backgrounds */

/* Border Colors */
border-border           /* All borders */
border-input            /* Input borders */
border-ring             /* Focus rings */
```

## Migration Priority

### 🔴 Critical (Invisible in Dark Mode)
1. **Main headings**: `text-gray-900` → `text-foreground`
2. **Body text**: `text-gray-600/700` → `text-muted-foreground`
3. **White backgrounds**: `bg-white` → `bg-card`

### 🟡 Important (Poor Contrast)
4. **Icons**: `text-gray-400` → `text-muted-foreground`
5. **Metadata**: `text-gray-500` → `text-muted-foreground`
6. **Hover states**: `hover:bg-gray-50` → `hover:bg-accent`

### 🟢 Nice to Have
7. **Borders**: `border-gray-*` → `border-border`
8. **Status badges**: Use variant system instead of hard-coded colors

## Pages Needing Updates

### Priority 1 (User-Facing)
- ✅ `/` (page.tsx) - Dashboard - FIXED
- ⚠️ `/trades` (trades/page.tsx)
- ⚠️ `/members` (members/page.tsx)
- ⚠️ `/alerts` (alerts/page.tsx)
- ⚠️ `/follows` (follows/page.tsx)

### Priority 2 (Detail Pages)
- ⚠️ `/politician/[id]` (politician/[id]/page.tsx)
- ⚠️ `/stock/[symbol]` (stock/[symbol]/page.tsx)

### Priority 3 (Less Common)
- ⚠️ `/demo` (demo/page.tsx)

## Example Fixes

### Before ❌
```tsx
<h1 className="text-3xl font-bold text-gray-900">
  Congressional Trading Dashboard
</h1>
<p className="text-gray-600">
  Track real-time stock trading activity
</p>
<div className="bg-white border-gray-200 hover:bg-gray-50">
  <span className="text-gray-500">Metadata</span>
</div>
```

### After ✅
```tsx
<h1 className="text-3xl font-bold text-foreground">
  Congressional Trading Dashboard
</h1>
<p className="text-muted-foreground">
  Track real-time stock trading activity
</p>
<div className="bg-card border-border hover:bg-accent">
  <span className="text-muted-foreground">Metadata</span>
</div>
```

## Testing Checklist

After updating each page:
- [ ] Check text is visible in both light and dark modes
- [ ] Verify hover states work correctly
- [ ] Ensure proper contrast ratios (WCAG AA minimum)
- [ ] Test all interactive elements
- [ ] Check loading/error states

## Automated Find & Replace Patterns

Use with caution (some contexts may need different tokens):

```bash
# Headings
text-gray-900 → text-foreground

# Body text
text-gray-600 → text-muted-foreground
text-gray-700 → text-muted-foreground

# Metadata/subtle text
text-gray-500 → text-muted-foreground
text-gray-400 → text-muted-foreground

# Backgrounds
bg-white → bg-card
bg-gray-50 → bg-accent
hover:bg-gray-50 → hover:bg-accent

# Borders
border-gray-200 → border-border
```

## Notes

- **Blue accents** (blue-600, etc.) can generally stay as-is since they're brand colors
- **Status colors** (green, red, yellow) should use semantic tokens when available
- **Always test** in both themes after making changes
- **Consider contrast** - some grays might need different semantic tokens based on context

---

**Next Steps**: Systematically update each page following this mapping guide.
