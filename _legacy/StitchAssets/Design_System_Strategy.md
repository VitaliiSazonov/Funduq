# Design System Strategy: The Digital Concierge

## 1. Overview & Creative North Star
The Creative North Star for this design system is **"The Curated Horizon."** 

In the world of high-end UAE real estate and luxury services, the experience should never feel like a crowded marketplace. Instead, it must feel like a private gallery or a personal concierge. We break the "standard template" look by utilizing **intentional asymmetry** and **tonal depth**. Rather than rigid grids, we use expansive white space and overlapping elements—where a high-resolution villa image might slightly bleed over a background container—to create a sense of movement and architectural grace. This system is designed to breathe, prioritizing the "feeling" of luxury over the density of information.

---

## 2. Colors & Surface Architecture
Our palette is a dialogue between the warmth of the desert sands and the precision of modern architecture.

### Color Tokens
*   **Surface:** `background` (#fafaf5) – Our canvas. A warm, breathable beige.
*   **Primary:** `primary` (#5f5e5e) – A sophisticated charcoal for structural confidence.
*   **Accent/Tertiary:** `tertiary_container` (#d4af37) – Our "Warm Gold." Use sparingly for high-value calls to action or "Exclusive" badges.
*   **Neutral Shifts:** `surface_container_low` (#f4f4ef) to `surface_container_highest` (#e3e3de).

### The "No-Line" Rule
**Explicit Instruction:** Traditional 1px solid borders are strictly prohibited for sectioning. We define boundaries through background shifts. To separate a featured villa list from the hero section, transition from `surface` to `surface_container_low`. This creates a sophisticated, "borderless" interface that feels high-end and custom-built.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers. A card should not just sit "on top" of a background; it should feel like a fine sheet of paper laid upon a stone surface.
*   **Level 0:** `surface` (The base floor).
*   **Level 1:** `surface_container_low` (In-set content areas).
*   **Level 2:** `surface_container_lowest` (#ffffff) (Elevated cards or floating menus).

### The "Glass & Gold" Rule
For floating navigation or mobile headers, use **Glassmorphism**. Apply `surface` at 80% opacity with a `backdrop-blur` of 20px. This allows the Warm Gold accents and high-end imagery to bleed through subtly, maintaining a sense of depth and luxury.

---

## 3. Typography: The Editorial Voice
We use a high-contrast scale to mimic the feel of a luxury lifestyle magazine.

*   **Display & Headlines:** **Plus Jakarta Sans** (serving as our 'Outfit' equivalent). 
    *   *Role:* Used for villa titles and emotional hooks. Use `display-lg` (3.5rem) for hero sections with tight letter-spacing (-0.02em) to command authority.
*   **UI & Body:** **Inter**.
    *   *Role:* Reliability and precision. Use `body-md` (0.875rem) for descriptions. Inter’s neutral tone allows the editorial headlines to remain the star of the show.
*   **The Tonal Shift:** Use `label-sm` in all-caps with 0.1em letter-spacing for category tags (e.g., "PRIVATE POOL"). This conveys a "concierge" precision.

---

## 4. Elevation & Depth: Tonal Layering
We move away from the "Material 2" shadow-heavy look toward **Tonal Layering**.

### The Layering Principle
Depth is achieved by "stacking" surface tiers. To make a property card pop, place a `surface_container_lowest` (#ffffff) card on a `surface_container_low` (#f4f4ef) background. This provides a soft, natural lift that mimics architectural lighting.

### Ambient Shadows
Shadows are used only for "floating" elements like Modals or Primary CTAs. 
*   **Specs:** `blur: 40px`, `y: 12px`, `color: rgba(26, 28, 25, 0.06)`. 
*   Never use pure black shadows; always tint the shadow with the `on-surface` (#1a1c19) color to ensure it feels like a natural shadow cast by ambient light.

### The "Ghost Border" Fallback
If a boundary is required for accessibility in input fields, use a **Ghost Border**: `outline_variant` (#d0c5af) at 30% opacity. 

---

## 5. Signature Components

### Primary Buttons
*   **Style:** `primary` (#5f5e5e) background with `on_primary` (#ffffff) text.
*   **Shape:** `md` (0.75rem / 12px) rounded corners.
*   **Luxury Polish:** Apply a very subtle linear gradient from `primary` to `primary_fixed_variant` to give the button a "brushed metal" depth.

### Property Cards
*   **Forbid dividers.** Use `spacing-6` (2rem) of vertical white space to separate the image from the title and price.
*   **The "Concierge Badge":** Use a `tertiary_fixed` (#ffe088) chip with `label-sm` text for status indicators like "Verified Villa."

### Input Fields
*   **Background:** `surface_container_low`.
*   **Border:** None (use Ghost Border on focus only).
*   **Interaction:** On focus, the background shifts to `surface_container_lowest` (#ffffff) with a subtle `tertiary` (Gold) bottom-border (2px).

### The "Curated" Carousel
Instead of standard dots, use a slim horizontal progress bar using the `outline_variant` as the track and `tertiary` (Gold) as the indicator. This feels more like a high-end gallery interaction.

---

## 6. Do’s and Don’ts

### Do:
*   **Embrace Asymmetry:** Offset images and text blocks slightly to create a bespoke, editorial feel.
*   **Use Generous Padding:** When in doubt, increase spacing. Luxury is the luxury of space. Use `spacing-10` (3.5rem) for section margins.
*   **Micro-interactions:** Use slow, elegant fades (300ms ease-out) rather than "snappy" animations.

### Don’t:
*   **No "Boxy" Layouts:** Avoid wrapping everything in containers with borders. Let the content define the edge.
*   **No High-Contrast Shadows:** Never use `opacity > 10%` for shadows. It breaks the "Premium Casual" softness.
*   **No Pure Grays:** Our grays are always warm. Ensure `primary` and `outline` tokens maintain their slight brownish/gold undertone to stay "inviting."

### Accessibility Note:
While we use soft tones, ensure all `body-md` and `body-sm` text sits on a background that maintains at least a 4.5:1 contrast ratio. Use `on_surface_variant` (#4d4635) for secondary text to ensure legibility without losing the warm brand tone.
