# Theme System

This directory contains the centralized theme configuration for the UniEventClient application.

## Overview

The theme system consolidates all color definitions and design tokens in one place, making it easy to:
- Understand the color palette
- Maintain visual consistency
- Update colors globally
- Onboard new team members

## Structure

### Files

- **`config.ts`** — The main theme configuration file containing all color definitions organized by category
- **`index.ts`** — Barrel export for clean imports
- **`README.md`** — This file (documentation for maintainers)

## Color Categories

Colors in `config.ts` are organized into logical groups:

### Primary Colors
- **Light Mode:** DTU Salmon/Orange (`#E85D3B` main)
- **Dark Mode:** DTU Blue (`#3C54F0` main)
- Each has `light` and `dark` variants for interactive states

### Background Colors
- Used for page backgrounds, cards, and panels
- Separate definitions for light and dark modes
- Cards have slight transparency in dark mode

### Text Colors
- **Primary:** Main body text
- **Body:** Secondary text (still prominent)
- **Subtle:** Muted text for labels, hints, timestamps

### UI Element Colors
- Borders, input fields, panels
- Button hover states
- Shadow colors

### Status Colors
- **Error:** Red tones (`#8b1a1a` light, `#ffb0b0` dark)
- **Success:** Green tones (`#1f6b3d` light, `#9cf0c2` dark)

### Header Colors
- Dedicated colors for the page header
- Includes gradient definitions for dark mode

### Link Colors
- Different for light and dark modes
- Includes hover state

### Toggle Colors
- Theme toggle switch colors
- Track, thumb, and icon colors

## CSS Variables

All theme colors are mapped to CSS variables in `web/src/styles/theme.css`. This allows colors to respond to light/dark mode automatically.

### Using CSS Variables in Stylesheets

```css
.my-component {
  color: var(--text-primary);
  background: var(--panel-bg);
  border: 1px solid var(--panel-border);
}
```

### Using CSS Variables in Tailwind Classes

```html
<div className="bg-[var(--panel-bg)] text-[var(--text-primary)]">
  Content
</div>
```

## CSS Variable Reference

### Light Mode (`:root`)
- `--dtu-primary-bg` — Primary background color
- `--dtu-secondary-bg` — Secondary background color
- `--dtu-card-bg` — Card background color
- `--dtu-accent` — Main accent color
- `--dtu-accent-light` — Light accent variant
- `--dtu-accent-hover` — Accent hover state
- `--text-primary` — Main text color
- `--text-body` — Body text color
- `--text-subtle` — Subtle/muted text color
- `--panel-bg` — Panel/modal background
- `--panel-border` — Panel/modal border color
- `--input-bg` — Input field background
- `--input-border` — Input field border
- `--input-focus-border` — Input focus border
- `--input-text` — Input text color
- `--button-hover` — Button hover background
- `--link-primary` — Link color
- `--link-primary-hover` — Link hover color
- `--status-error` — Error text color
- `--status-success` — Success text color
- `--toggle-track-light` — Toggle track background
- `--toggle-thumb-light` — Toggle thumb background
- `--toggle-icon-light` — Toggle icon color

### Dark Mode (`html.dark`)
All variables are redefined with dark-appropriate values. The system automatically switches when `dark` class is present on `<html>`.

## Adding New Colors

To add a new color to the theme:

1. **Define it in `config.ts`** under the appropriate category with light and dark variants
2. **Add CSS variables to `theme.css`** in both `:root` and `html.dark` sections
3. **Document the variable** in this README if it's a color that will be frequently used
4. **Use the variable** throughout the codebase via `var(--color-name)`

Example:

```typescript
// In config.ts
warning: {
  light: '#FFA500',
  dark: '#FFD700',
},

// In theme.css
:root {
  --status-warning: #FFA500;
}

html.dark {
  --status-warning: #FFD700;
}

// In components
<div className="text-[var(--status-warning)]">Warning</div>
```

## Transparency/Opacity Values

Some transparency values are used in Tailwind arbitrary values (e.g., `bg-[rgba(255,255,255,0.18)]`). These are documented in `config.ts` under `transparency` for reference and potential future refactoring.

## Light/Dark Mode

The app uses a class-based theme system:
- **Light Mode:** Default (no class)
- **Dark Mode:** `<html class="dark">`

All CSS variables automatically switch values based on this class. The theme toggle component manages this.

## Gradients

Page background gradients are defined in the `gradients` object:
- **Light:** Warm, subtle salmon gradient
- **Dark:** Cool, dark blue gradient

These are applied in `theme.css` to the page background.

## Extending the Theme

The theme system is designed to be easily extended:

1. **Add new color categories** in `config.ts` as needed
2. **Create new CSS variables** for consistency
3. **Reference them** in stylesheets and components

Keep colors semantic and organized by purpose, not by hex value. This makes maintenance easier.

## Migration Path

If the team decides to use a CSS-in-JS solution or design tokens system in the future, this config file serves as a blueprint for configuration.

---

## Quick Links

- [TypeScript Config](./config.ts)
- [CSS Theme Variables](../styles/theme.css)
- [Theme Usage Examples](#using-css-variables-in-stylesheets)
