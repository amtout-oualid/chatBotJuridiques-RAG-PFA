---
name: Lex Elite
colors:
  surface: '#fbf9f8'
  surface-dim: '#dbdad9'
  surface-bright: '#fbf9f8'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f5f3f3'
  surface-container: '#efeded'
  surface-container-high: '#e9e8e7'
  surface-container-highest: '#e4e2e2'
  on-surface: '#1b1c1c'
  on-surface-variant: '#4c4546'
  inverse-surface: '#303031'
  inverse-on-surface: '#f2f0f0'
  outline: '#7e7576'
  outline-variant: '#cfc4c5'
  surface-tint: '#5e5e5e'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#1b1b1b'
  on-primary-container: '#848484'
  inverse-primary: '#c6c6c6'
  secondary: '#5d5f5f'
  on-secondary: '#ffffff'
  secondary-container: '#dfe0e0'
  on-secondary-container: '#616363'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#191c1d'
  on-tertiary-container: '#828485'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e2e2e2'
  primary-fixed-dim: '#c6c6c6'
  on-primary-fixed: '#1b1b1b'
  on-primary-fixed-variant: '#474747'
  secondary-fixed: '#e2e2e2'
  secondary-fixed-dim: '#c6c6c7'
  on-secondary-fixed: '#1a1c1c'
  on-secondary-fixed-variant: '#454747'
  tertiary-fixed: '#e1e3e4'
  tertiary-fixed-dim: '#c5c7c8'
  on-tertiary-fixed: '#191c1d'
  on-tertiary-fixed-variant: '#454748'
  background: '#fbf9f8'
  on-background: '#1b1c1c'
  surface-variant: '#e4e2e2'
typography:
  display-hero:
    fontFamily: Inter
    fontSize: 72px
    fontWeight: '700'
    lineHeight: 80px
    letterSpacing: -0.04em
  headline-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.03em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 42px
    letterSpacing: -0.02em
  section-header:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '800'
    lineHeight: 16px
    letterSpacing: 0.15em
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-bold:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  section-py-lg: 8rem
  section-py-xl: 10rem
  gutter: 2rem
  container-max: 1280px
  bento-gap: 1.5rem
---

## Brand & Style

The design system embodies an elite, high-end corporate LegalTech aesthetic. It targets C-suite executives and top-tier legal firms who demand precision, authority, and modern efficiency. The emotional response is one of absolute trust, institutional power, and technological sophistication.

The visual style is a fusion of **High-End Minimalism** and **Bento-Box Modularism**. It utilizes massive whitespace to create a sense of "intellectual room," allowing complex legal concepts to breathe. The interface feels premium through its restraint, relying on perfect alignment, generous scale, and high-contrast interactions. The use of dark interactive cards against a pure white background provides a rhythmic depth that guides the user's attention through a structured hierarchy.

## Colors

The palette is strictly monochromatic and high-contrast, reflecting the binary nature of legal clarity.

- **Primary (#000000):** Used for typography, primary buttons, and deep-background interactive cards. It represents authority.
- **Secondary (#FFFFFF):** The canvas. Pure white is used to maximize the effect of shadows and provide a clean, medical-grade backdrop.
- **Tertiary (#F8F9FA):** Subtle surface differentiation. Used for bento-box backgrounds and inactive states to maintain a soft layered effect without introducing gray-scale fatigue.
- **Accent/Neutral (#666666):** Reserved for secondary body text and metadata, ensuring that the primary black text remains the dominant visual force.

## Typography

The typography is built on **Inter**, chosen for its tall x-height and technical precision. 

- **Headlines:** Set with tight tracking and massive scale. They should feel architectural and immovable.
- **Section Headers:** These are small but high-impact. Use `section-header` tokens with forced uppercase and generous letter spacing (tracking) to act as visual anchors for new content blocks.
- **Body Text:** Maintains a comfortable line height to ensure legibility in data-heavy legal contexts.
- **Hierarchy:** Contrast is achieved primarily through size and weight jumps rather than color changes.

## Layout & Spacing

The layout follows a **Fixed Grid** model (12 columns) for desktop, centered within a container. 

- **The Bento Grid:** For feature sections and cards, use a modular grid with a consistent gap (`bento-gap`). Elements should span 4, 6, or 8 columns to create asymmetrical but balanced visual interest.
- **Vertical Rhythm:** Sections are separated by massive vertical padding (`section-py-lg` for standard, `section-py-xl` for hero). This whitespace is a luxury signifier.
- **Reflow:** On mobile, the 12-column grid collapses to 1 or 2 columns, and padding is reduced to `4rem` to maintain momentum without losing the "breathable" feel.

## Elevation & Depth

Depth is achieved through a combination of **Tonal Layering** and **Soft Ambient Shadows**.

- **Surfaces:** The base is `#FFFFFF`. Secondary containers (Bento boxes) use `#F8F9FA`. Interactive cards use `#000000` to create a "void" effect that draws the eye.
- **Shadows:** Use extra-diffused shadows for primary cards. 
  - *Shadow Token:* `0 20px 40px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.02)`. 
- **Interactive Depth:** When hovering over dark cards, the elevation should increase subtly via a slight scale (1.02x) and a more pronounced shadow. No borders are needed when using these soft shadows; the shape definition comes from the shadow itself.

## Shapes

The shape language is sophisticated and approachable, avoiding the harshness often found in traditional legal software.

- **Containers:** Large cards and bento-box elements use `rounded-2xl` (1rem) to `rounded-[2rem]` (2rem). The larger the container, the more generous the radius.
- **Buttons:** Buttons are strictly **Pill-shaped**. This provides a soft contrast to the structured, rectangular bento-grid layout.
- **Media:** Images and video backgrounds must follow the container's roundedness to maintain a cohesive "contained" aesthetic.

## Components

- **Buttons:** 
  - *Primary:* Pill-shaped, Black background, White text, bold weight.
  - *Secondary:* Pill-shaped, Transparent background, Black border (1px), Black text.
- **Bento Cards:** Use `#F8F9FA` for informational cards. Use `#000000` with White text for "High-Focus" or "Call to Action" cards. Ensure internal padding is generous (at least `2.5rem`).
- **Section Labels:** Contained within a small pill-shaped badge with a black background and white `section-header` typography. Place these at the top left of sections.
- **Input Fields:** Minimalist. Bottom border only (2px Black) or a very subtle light gray fill with large rounded corners (1rem).
- **Lists:** Use custom checkmark icons (thin, minimalist) rather than standard bullets to maintain the high-end feel.
- **Interactive Grid:** Client logos and partner grids should be presented in a high-contrast monochromatic format, grayed out and turning pure black on hover.