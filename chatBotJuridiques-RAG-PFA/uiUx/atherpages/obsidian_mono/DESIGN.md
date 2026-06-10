---
name: Obsidian Mono
colors:
  surface: '#f9f9f9'
  surface-dim: '#dadada'
  surface-bright: '#f9f9f9'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f3f3'
  surface-container: '#eeeeee'
  surface-container-high: '#e8e8e8'
  surface-container-highest: '#e2e2e2'
  on-surface: '#1a1c1c'
  on-surface-variant: '#4c4546'
  inverse-surface: '#2f3131'
  inverse-on-surface: '#f1f1f1'
  outline: '#7e7576'
  outline-variant: '#cfc4c5'
  surface-tint: '#5e5e5e'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#1b1b1b'
  on-primary-container: '#848484'
  inverse-primary: '#c6c6c6'
  secondary: '#5f5e5e'
  on-secondary: '#ffffff'
  secondary-container: '#e4e2e1'
  on-secondary-container: '#656464'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#1b1c1c'
  on-tertiary-container: '#848484'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e2e2e2'
  primary-fixed-dim: '#c6c6c6'
  on-primary-fixed: '#1b1b1b'
  on-primary-fixed-variant: '#474747'
  secondary-fixed: '#e4e2e1'
  secondary-fixed-dim: '#c8c6c5'
  on-secondary-fixed: '#1b1c1c'
  on-secondary-fixed-variant: '#474746'
  tertiary-fixed: '#e3e2e2'
  tertiary-fixed-dim: '#c7c6c6'
  on-tertiary-fixed: '#1b1c1c'
  on-tertiary-fixed-variant: '#464747'
  background: '#f9f9f9'
  on-background: '#1a1c1c'
  surface-variant: '#e2e2e2'
  obsidian: '#171717'
  border-subtle: '#E5E5E5'
  code-bg: '#F9F9F9'
typography:
  headline-xl:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
    letterSpacing: 0.02em
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  mono-ui:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
  label-caps:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1.0'
    letterSpacing: 0.1em
rounded:
  sm: 0.5rem
  DEFAULT: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  full: 9999px
spacing:
  base: 8px
  container-max: 1200px
  gutter: 24px
  margin-mobile: 16px
  section-gap: 80px
---

## Brand & Style

This design system is built for high-end developer tools and technical platforms that prioritize clarity over decoration. The brand personality is powerful, precise, and understated—evoking the feeling of a sophisticated terminal interface translated into a premium web experience.

The aesthetic follows a **Modern Minimalist** approach with a "Developer-Centric" edge. It utilizes a stark, high-contrast palette to establish a clear hierarchy, where whitespace is treated as a functional element rather than a void. The visual language balances the approachability of a consumer app with the utility of a command-line interface, utilizing monospaced accents to signal technical depth.

## Colors

The palette is strictly monochromatic, relying on value rather than hue to convey meaning. 

- **Primary & Obsidian**: Reserved for the most critical actions and primary headings. It represents the "source of truth."
- **Secondary & Tertiary**: Used for supporting text and UI chrome, ensuring the interface feels layered without being cluttered.
- **Neutral**: Applied to large surface areas and background regions to maintain a clean, breathable canvas.
- **Interactive States**: Use high-contrast inversions (Black to White) rather than color shifts to indicate hover and focus states.

## Typography

The typographic system leverages **Inter** for its systematic legibility and **Geist** for technical precision. 

- **Section Headers**: Use `headline-md` with expanded letter spacing to create clear visual anchors.
- **Technical Content**: All commands, file paths, and code snippets must use the `mono-ui` (Geist) style to distinguish data from prose.
- **Visual Rhythm**: Maintain generous line heights for body text to ensure readability in documentation-heavy layouts.

## Layout & Spacing

The design system employs a **Fixed Grid** philosophy for content consistency. All layouts are centered on a 12-column grid with a maximum width of 1200px.

- **Vertical Rhythm**: Utilize a strict 8px baseline. Component internal spacing should follow multiples of 8 (e.g., 16px, 24px, 32px).
- **Whitespace**: Use `section-gap` between major content blocks to emphasize the minimalist aesthetic.
- **Mobile Adaptation**: On mobile devices, margins shrink to 16px, and columns collapse to a single-stack layout. Grid gutters remain consistent at 24px to ensure touch targets are not cramped.

## Elevation & Depth

This design system avoids traditional drop shadows in favor of **Tonal Layering** and **Subtle Outlines**. 

- **Surface Tiers**: Depth is created by placing white cards on `#F5F5F5` backgrounds or `#171717` containers.
- **Borders**: Use 1px solid borders (`#E5E5E5`) to define boundaries. 
- **Focus States**: Rather than a shadow, interactive elements receive a sharp, 2px black border or a slight scale transformation to indicate elevation.
- **Overlays**: Modals and menus use a heavy backdrop blur (20px) with a semi-transparent white tint to maintain context without visual noise.

## Shapes

The shape language is defined by a high-contrast mix of **Full Pill** and **Soft Rectangles**.

- **Interactive Elements**: All buttons, tags, and chips use a `rounded-full` (Pill) style. This provides a soft, approachable counterpoint to the rigid typography.
- **Containers**: Large layout blocks, cards, and input fields use a more conservative `rounded-lg` (1rem) corner radius to maximize internal space efficiency.

## Components

### Buttons
Primary buttons are solid black with white text, utilizing the pill shape. Secondary buttons use a transparent background with a 1px `#E5E5E5` border. Hover states should strictly invert colors.

### Input Fields
Inputs are rectangular with a 1px border. The text within inputs defaults to the `mono-ui` font style to mimic a terminal entry, emphasizing the developer-tool vibe.

### Chips & Tags
Small, pill-shaped elements used for versioning (e.g., "v0.1.0") or categories. Use `#F5F5F5` backgrounds with `#737373` text to keep them secondary in hierarchy.

### Cards
Cards are flat white with no shadow, defined only by a 1px border. They should have generous internal padding (min 32px) to maintain the minimalist feel.

### Code Blocks
Wrapped in `#171717` (Obsidian) containers with syntax highlighting using muted grays. Copy-to-clipboard icons should be minimalist line-art (1.5px stroke).

### Checkboxes & Radios
High-contrast black-fill when active. Maintain the `rounded-full` language for radio buttons and a tight 4px radius for checkboxes.