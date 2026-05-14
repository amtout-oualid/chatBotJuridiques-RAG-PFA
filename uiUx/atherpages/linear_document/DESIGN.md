---
name: Linear Document
colors:
  surface: '#f9f9f9'
  surface-dim: '#dadada'
  surface-bright: '#f9f9f9'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f3f4'
  surface-container: '#eeeeee'
  surface-container-high: '#e8e8e8'
  surface-container-highest: '#e2e2e2'
  on-surface: '#1a1c1c'
  on-surface-variant: '#4c4546'
  inverse-surface: '#2f3131'
  inverse-on-surface: '#f0f1f1'
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
  secondary-container: '#e2dfde'
  on-secondary-container: '#636262'
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
  secondary-fixed: '#e5e2e1'
  secondary-fixed-dim: '#c8c6c5'
  on-secondary-fixed: '#1c1b1b'
  on-secondary-fixed-variant: '#474746'
  tertiary-fixed: '#e3e2e2'
  tertiary-fixed-dim: '#c7c6c6'
  on-tertiary-fixed: '#1b1c1c'
  on-tertiary-fixed-variant: '#464747'
  background: '#f9f9f9'
  on-background: '#1a1c1c'
  surface-variant: '#e2e2e2'
  border-subtle: '#E5E5E5'
  surface-muted: '#F5F5F5'
  text-charcoal: '#171717'
typography:
  headline-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '600'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '500'
    lineHeight: '1.3'
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: '400'
    lineHeight: '1.5'
  label-caps:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1.0'
    letterSpacing: 0.05em
  code-md:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.6'
  code-sm:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '400'
    lineHeight: '1.5'
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  container-max: 1024px
  section-gap: 80px
  stack-gap: 24px
  gutter: 16px
  margin-mobile: 20px
  margin-desktop: 40px
---

## Brand & Style

The design system is defined by a "document-first" philosophy, prioritizing legibility and intellectual clarity over decorative elements. It targets a sophisticated audience that values precision and speed, particularly in technical and AI-driven contexts. 

The aesthetic is rooted in **Minimalism** with a focus on functional purity. By utilizing high-contrast typography against a stark white canvas, the UI recedes to allow content to lead. It avoids visual noise like shadows or gradients, relying instead on structural alignment and thin, deliberate borders to define space. The result is an interface that feels like a premium digital editorial or a high-end technical specification—calm, authoritative, and undistracted.

## Colors

The palette is strictly monochromatic to emphasize hierarchy through value and weight rather than hue.

- **Primary & Secondary:** Pure Black (#000000) and Deep Charcoal (#171717) are reserved for primary text, iconography, and high-action components.
- **Backgrounds:** The primary surface is always Pure White (#FFFFFF). Use Surface Muted (#F5F5F5) sparingly for code blocks or to differentiate secondary content sections.
- **Borders:** A consistent, subtle gray (#E5E5E5) is used for all structural divisions, ensuring a light footprint.
- **Accents:** No chromatic accents are used. Interactivity is signaled through inversions (white text on black backgrounds) or subtle shifts in text weight.

## Typography

Typography is the primary vehicle for visual expression in this design system. It utilizes **Inter** for all UI and prose elements, chosen for its neutral, highly legible character. **JetBrains Mono** is employed for technical outputs, code snippets, and metadata to reinforce the system's "developer-focused" utility.

- **Scale:** High contrast between headlines and body text is essential. Headlines should use tight tracking and significant line heights.
- **Technical Elements:** Use the monospace font for any data-heavy strings, model names, or terminal-style interactions.
- **Hierarchy:** Rely on weight shifts (e.g., Medium for labels vs. Regular for body) rather than color changes to guide the eye.

## Layout & Spacing

The layout model mimics a printed document: centered, spacious, and vertically driven.

- **Grid Model:** Use a fixed-width central column (1024px) for desktop to prevent line lengths from becoming unreadable. For marketing surfaces, a 12-column grid is used with generous 80px gaps between major sections.
- **Rhythm:** Adhere to an 8px spacing system. Use "generous whitespace" as a functional tool—increase padding around core actions to signal their importance without adding visual weight.
- **Responsiveness:** On mobile, margins should be tight (20px) to maximize the reading area, while vertical stack gaps remain large to ensure the interface feels airy and un-cramped.

## Elevation & Depth

This design system is strictly **flat**. Depth is achieved through layering and borders rather than shadows or blurs.

- **Low-Contrast Outlines:** Use 1px borders (#E5E5E5) to define containers and interactive regions.
- **Tonal Layers:** For secondary surfaces—such as sidebars or code blocks—use a subtle fill of #F5F5F5. 
- **Z-Index Strategy:** Only use literal overlays for critical global elements (like command palettes or navigation menus). These should be rendered with a sharp 1px border and a white background to distinguish them from the page content. Shadows are strictly prohibited.

## Shapes

The shape language is disciplined and professional. 

- **Corner Radius:** A "Soft" rounding (4px / 0.25rem) is applied to all UI elements like buttons, inputs, and cards. This provides just enough approachable softness to prevent the UI from feeling aggressive or "brutalist," while maintaining a sharp, clean silhouette.
- **Special Cases:** Search bars and tags should never be pill-shaped; they must maintain the consistent 4px radius to align with the geometric rigor of the system.

## Components

- **Buttons:** Primary buttons are solid #000000 with white text. Secondary buttons use a 1px border (#E5E5E5) with #171717 text. Avoid "Ghost" buttons unless they are within a navigation bar.
- **Input Fields:** Use a 1px border (#E5E5E5) on all four sides. On focus, the border color shifts to #000000. Labels should be placed above the field in `label-caps` typography.
- **Cards:** Cards are simple white containers with a 1px border. Do not use background fills for cards on the primary white background; use the border to define the boundary.
- **Chips/Tags:** Small, rectangular containers with a #F5F5F5 fill and no border. Use `code-sm` font for a technical feel.
- **Lists:** Use simple horizontal dividers (#E5E5E5) with no bullets. Ensure vertical padding between list items is at least 16px to maintain the spacious aesthetic.
- **Code Blocks:** Always rendered in JetBrains Mono on a #F5F5F5 background with a 1px border. No syntax highlighting should use vibrant colors; stick to varying shades of gray and bold weights.