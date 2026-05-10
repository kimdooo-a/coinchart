---
name: Data-Dense Utility
colors:
  surface: '#faf8ff'
  surface-dim: '#d8d9e6'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f3ff'
  surface-container: '#ecedfa'
  surface-container-high: '#e6e7f4'
  surface-container-highest: '#e1e2ee'
  on-surface: '#191b24'
  on-surface-variant: '#424656'
  inverse-surface: '#2e303a'
  inverse-on-surface: '#eff0fd'
  outline: '#727687'
  outline-variant: '#c2c6d8'
  surface-tint: '#0054d6'
  primary: '#0050cb'
  on-primary: '#ffffff'
  primary-container: '#0066ff'
  on-primary-container: '#f8f7ff'
  inverse-primary: '#b3c5ff'
  secondary: '#006e2e'
  on-secondary: '#ffffff'
  secondary-container: '#5efd88'
  on-secondary-container: '#007230'
  tertiary: '#a33200'
  on-tertiary: '#ffffff'
  tertiary-container: '#cc4204'
  on-tertiary-container: '#fff6f4'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dae1ff'
  primary-fixed-dim: '#b3c5ff'
  on-primary-fixed: '#001849'
  on-primary-fixed-variant: '#003fa4'
  secondary-fixed: '#67ff8d'
  secondary-fixed-dim: '#3ee271'
  on-secondary-fixed: '#002109'
  on-secondary-fixed-variant: '#005321'
  tertiary-fixed: '#ffdbd0'
  tertiary-fixed-dim: '#ffb59d'
  on-tertiary-fixed: '#390c00'
  on-tertiary-fixed-variant: '#832600'
  background: '#faf8ff'
  on-background: '#191b24'
  surface-variant: '#e1e2ee'
typography:
  h1:
    fontFamily: notoSans
    fontSize: 28px
    fontWeight: '700'
    lineHeight: '1.2'
  h2:
    fontFamily: notoSans
    fontSize: 22px
    fontWeight: '700'
    lineHeight: '1.3'
  body-base:
    fontFamily: notoSans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
  body-sm:
    fontFamily: notoSans
    fontSize: 13px
    fontWeight: '400'
    lineHeight: '1.4'
  meta:
    fontFamily: notoSans
    fontSize: 12px
    fontWeight: '400'
    lineHeight: '1.2'
  label-bold:
    fontFamily: notoSans
    fontSize: 12px
    fontWeight: '700'
    lineHeight: '1.2'
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  container-max: 1200px
  main-width: 760px
  sidebar-width: 300px
  column-gap: 24px
  row-padding-v: 8px
  row-padding-h: 12px
  widget-padding: 16px
---

## Brand & Style
The design system is engineered for high-velocity information consumption, catering to the specific needs of the Korean financial and cryptocurrency investment community. The aesthetic is rooted in **Corporate / Modern** efficiency with a focus on maximum data density, inspired by established Korean portals. 

The UI prioritizes utility over decoration. It evokes a sense of professional reliability and urgency, ensuring that users can scan hundreds of headlines and price points with minimal eye fatigue. By avoiding decorative elements like hero images or gradients, the system maintains a "tools-first" philosophy where the content is the interface.

## Colors
This design system adheres strictly to Korean market expectations for financial visualization. The primary brand color is a sharp **Fintech Blue**, used for actions and navigation, while **Naver Green** serves as a secondary accent for community-related highlights.

Critical semantic colors follow the local standard: **Red** denotes growth, bullish trends, and buy signals; **Blue** denotes decline, bearish trends, and sell signals. The background strategy uses pure white for the primary reading experience to maintain high contrast, with light gray used exclusively for structural separation and sidebar depth.

## Typography
The typography is centered on **Noto Sans KR** to ensure perfect legibility for Hangul characters. The scale is intentionally tight to allow for high-density information layouts. 

- **Headlines:** Reserved for page titles and major section headers, using a bold weight for immediate hierarchy.
- **Body Text:** The 14px base is the standard for post content and primary list items.
- **Small Text:** 13px is used for secondary board lists and descriptions to increase the content-to-screen ratio.
- **Meta Information:** 12px is utilized for timestamps, view counts, and author names, often paired with a neutral gray color to recede behind primary headlines.

## Layout & Spacing
The layout follows a **Fixed Grid** model centered on a 1200px container. This ensures a consistent scanning experience for power users who rely on muscle memory. 

The structure is split into a 760px main content area and a 300px right-hand sidebar, separated by a 24px gutter. Padding within list items is kept minimal (8px-10px vertically) to maximize the number of visible threads. On mobile devices, the sidebar drops below the main content, and horizontal margins shrink to 12px to preserve text space.

## Elevation & Depth
In line with the high-density requirement, this design system rejects heavy shadows and layered depth. Instead, it utilizes **Low-contrast outlines** and **Tonal layering**.

- **Level 0:** Main background (#FFFFFF).
- **Level 1:** Sidebar and decorative backgrounds (#F5F6F8).
- **Separation:** Achieved through 1px solid borders (#E5E7EB).
- **Active States:** Subtle 1px borders in the primary blue or a very light gray fill are used to indicate hover states on list rows. No blur effects or shadows are permitted, ensuring the UI remains crisp and performance-oriented.

## Shapes
The shape language is conservative and geometric. A "Soft" roundedness profile is applied to maintain a modern feel without sacrificing the professional, "industrial" look of a financial tool.

- **Sidebar Widgets:** 4px (rounded-sm/md) corner radius.
- **Badges & Labels:** 2px corner radius for a nearly square, "sticker" like appearance for indicators like HOT, NEW, or NOTICE.
- **Form Inputs & Buttons:** 4px corner radius to match the widgets.
- **Container Dividers:** 0px radius, spanning the full width of their parent containers.

## Components
- **BoardRow:** Single-line list items. Use 14px text for titles. Right-aligned meta-data (comments, views, date) should be 12px. Vertical padding is locked to 8px.
- **Sidebar Widgets:** Fixed 300px width. Header of the widget uses a 1px bottom border and bold 13px text.
- **Badges:** Square-ish (2px radius). 
    - *NOTICE:* Blue background with white text.
    - *HOT/NEW:* Red or Green outline with corresponding text color.
- **Buttons:** Primarily flat. Primary buttons use #0066FF with white text. Secondary buttons use a white background with #D1D5DB borders and #374151 text.
- **Input Fields:** 1px solid #D1D5DB border, 4px radius. Focus state uses a 1px #0066FF border with no outer glow.
- **Pagination:** Classic numbered style. The active page is highlighted with a bold Fintech Blue text and a simple underline or a light gray square background.