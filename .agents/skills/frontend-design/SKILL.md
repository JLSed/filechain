---
name: PRFS Frontend Design System
description: Design system and visual identity for the Pasig River Ferry Service web application. Defines color tokens, typography, layout patterns, component styles, and signature visual elements. Use this skill when building any UI component or page for the PRFS project.
---

# PRFS Frontend Design System

This skill defines the complete visual identity for the Pasig River Ferry Service (PRFS) web application. Every component, page, and layout must follow these specifications to maintain visual consistency.

## Design Philosophy

The PRFS design is **institutional and trustworthy** — it represents a government-operated public transit service. The aesthetic is clean, informational, and accessible. It avoids trendy startup aesthetics in favor of clear hierarchy, high readability, and a civic-infrastructure feel.

**Signature element**: The navy-to-blue-to-green gradient hero, representing the river flowing through the city. The gold accent (`#F5C518`) appears sparingly as a civic badge — like a government seal — and in the announcement ticker.

## Color Tokens

All colors are defined as CSS custom properties on `:root`.

### Primary Palette

| Token | Hex | Role |
|-------|-----|------|
| `--prfs-navy` | `#0D3B6E` | Navigation, primary buttons, headings, authority color |
| `--prfs-blue` | `#1565C0` | Links, active states, card icon backgrounds, interactive elements |
| `--prfs-green` | `#1B7A4A` | Success/operational states, secondary CTAs |
| `--prfs-gold` | `#F5C518` | Badges, ticker, accent highlights — used sparingly |

### Surface & Background

| Token | Hex | Role |
|-------|-----|------|
| `--prfs-lightblue` | `#E3F0FB` | Info card backgrounds, schedule notes |
| `--prfs-lightgreen` | `#E8F5EE` | Success/status backgrounds |
| `--prfs-white` | `#FFFFFF` | Card backgrounds |
| `--prfs-gray` | `#F4F6F9` | Page background |
| `--color-background-primary` | `#FFFFFF` | Primary content surface |
| `--color-background-secondary` | `#F8FAFC` | Secondary surfaces, alternating rows |
| `--color-background-tertiary` | `#F4F6F9` | Page body background |

### Text

| Token | Hex | Role |
|-------|-----|------|
| `--prfs-textdark` / `--color-text-primary` | `#0D1B2A` | Primary body text |
| `--prfs-textsub` / `--color-text-secondary` | `#4A5568` | Secondary/descriptive text |

### Borders

| Token | Hex | Role |
|-------|-----|------|
| `--color-border-secondary` | `#D8DEE9` | Input borders, tab borders |
| `--color-border-tertiary` | `#E5E7EB` | Card borders, dividers |

## Typography

- **Font stack**: `Arial, Helvetica, sans-serif` — chosen for universality and readability across all devices.
- **No custom web fonts** — this is a government service; loading speed and accessibility matter more than typographic personality.

### Type Scale

| Element | Size | Weight | Notes |
|---------|------|--------|-------|
| Hero heading (`h1`) | 26px | 500 | White on gradient |
| Section title | 20px | 500 | With icon, navy color |
| Card heading (`h2`) | 16px | 500 | Dark text |
| Body text | 13–14px | 400 | `--color-text-secondary` |
| Small labels | 11–12px | 400–500 | Badges, captions, table cells |
| Hero clock | 28px | 500 | Tabular numerals, letter-spacing: 2px |
| Nav title | 13px | 500 | White |
| Nav subtitle | 10px | 400 | Gold, letter-spacing: 0.5px |

## Layout Patterns

### Page Structure (top to bottom)

```
┌─────────────────────────────────────────────┐
│ NAVBAR (sticky, navy, z-index: 100)         │
├─────────────────────────────────────────────┤
│ TICKER (gold, scrolling announcements)      │
├─────────────────────────────────────────────┤
│ HERO (gradient, centered content)           │
├─────────────────────────────────────────────┤
│ CONTENT (max-width: 900px, centered)        │
│ ┌─────────────────────────────────────────┐ │
│ │ Status Banner                           │ │
│ ├─────────────────────────────────────────┤ │
│ │ Cards (stacked, 1rem gap)               │ │
│ ├─────────────────────────────────────────┤ │
│ │ Grid layouts for stats/steps            │ │
│ └─────────────────────────────────────────┘ │
├─────────────────────────────────────────────┤
│ FOOTER (navy, centered, 11px)               │
└─────────────────────────────────────────────┘
```

### Content Container
- `max-width: 900px`
- `margin: 0 auto`
- `padding: 1.5rem`

### Border Radius
- Cards: `12px` (`--border-radius-lg`)
- Inputs, badges, buttons: `8px` (`--border-radius-md`)
- Pills/tabs: `20px`

## Component Library

### Card
- White background, `12px` border-radius
- `0.5px` border in `--color-border-tertiary`
- `1.25rem` padding
- `1rem` bottom margin
- Header: 36px icon box (colored background) + h2

### Status Banner
- Light green background with green border
- Pulsing 8px dot + bold label + status text
- Changes color based on operational level (green/yellow/red)

### Ticker
- Gold background, scrolling text
- CSS animation: `translateX(0)` to `translateX(-50%)` over 25s
- Text duplicated for seamless loop

### Hero
- `background: linear-gradient(135deg, var(--prfs-navy) 0%, #1565C0 60%, var(--prfs-green) 100%)`
- White text, centered
- Badge (gold pill), heading, subtitle, clock, date, free-ride badge

### Info Stat Grid
- `grid-template-columns: repeat(auto-fit, minmax(200px, 1fr))`
- Each stat: label (12px secondary) + value (20px navy)

### Navigation
- Sticky, navy background, `min-height: 56px`
- Logo (38px circle with SVG) + brand text
- Links: `12px`, transparent, `rgba(255,255,255,0.8)`, hover lightens
- Admin button: green background

## Animations

| Name | Duration | Effect |
|------|----------|--------|
| `ticker` | 25s linear infinite | Horizontal scroll for announcements |
| `pulse` | 2s infinite | Opacity pulse on status dot |

## Icons

Use [Tabler Icons](https://tabler.io/icons) via the webfont CDN:
```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css">
```

Icon usage: `<i className="ti ti-{icon-name}" aria-hidden="true"></i>`

Common icons used:
- `ti-sailboat` — ferry/free ride badge
- `ti-speakerphone` — announcements
- `ti-map-pin` — routes
- `ti-clock` — schedule
- `ti-info-circle` — about/info
- `ti-lock` — admin
- `ti-phone` — contact
- `ti-book` — guide

## Accessibility

- All icons have `aria-hidden="true"`
- Screen-reader-only text uses `.sr-only` class
- Interactive elements have clear focus states
- Color contrast meets WCAG AA for text on backgrounds
