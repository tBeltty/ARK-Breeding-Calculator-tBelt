# Atmos UI: The System

> **Atmos UI** is an opinionated design language based on layers, atmosphere, and semantic color.

---

## 1. The Core (Manifesto)

Before writing code, we must agree on what Atmos UI **IS** and **IS NOT**.

### ❌ What Atmos UI is NOT:
*   **It is NOT a closed component library.** We do not ship npm packages of "black box" components.
*   **It is NOT about pixel perfection.** It uses relative spacing and fluid layout.
*   **It is NOT generic.** It refuses to use standard `Slate-900` or `Gray-100`.

### ✅ What Atmos UI IS:
**"Atmosphere over Interface."**

We do not build "screens" or "pages". We build **environments**.
When a user opens the app, they are not looking at a UI; they are stepping into a mood.

> *Atmos UI makes it easy to do the right thing and intentionally hard to do the wrong one.*

### Core Principles
1.  **Depth over Flatness**: Elements must feel like they occupy space. Light and shadow are functional, not decorative.
2.  **Color with Intent**: Colors are not just hex codes; they are emotions.
3.  **Motion as Feedback**: Nothing teleports. Everything flows.
4.  **Glass as Context**: We use glassmorphism to show *where* you are (context), not just to look pretty.
5.  **Atmosphere before Decoration**: Every visual choice must serve the mood, not just fill space.

### Non-Goals
*   **We are not a Component Library**: We are a decision framework. We do not provide a generic "Button"; we provide the *rules* for a Button.
*   **We are not Agnostic**: We have opinions. We prefer depth over flatness and motion over static.
*   **We do not support "Theming"**: We support *Moods*. You cannot simply "change the primary color"; you must shift the entire atmosphere.

---

## 2. The Token Contract

Our tokens are not just variables; they are a contract. You must respect the role of each token.

| Token | Semantic Role | Rule of Use | Forbidden Use |
| :--- | :--- | :--- | :--- |
| **`surface`** | The absolute base of the world. | Main backgrounds, body. | Interactive Elements (buttons). |
| **`surface-container`** | The "Card" layer floating 1 unit above base. | Cards, Sidebars, Modals. | High emphasis actions. |
| **`surface-container-high`** | The "highlight" within a container. | Hover states of list items, active tabs. | Main Backgrounds. |
| **`primary`** | The Brand Soul / Action. | Primary Buttons, Active Toggles, Key Icons. | Large background areas (except gradients). |
| **`on-[color]`** | Legibility layer on top of a color. | Text/Icons depending on generic background. | Backgrounds. |
| **`outline`** | Structural definition. | Borders, Dividers. | Filling shapes. |

---

## 3. The Mood System

In Atmos UI, we don't just have "colors"; we have **Moods**. A Mood must define four properties:

1.  **Base Surface**: The atmospheric tint (e.g., Deep Navy, not Black).
2.  **Accent (Primary)**: The source of light/energy.
3.  **Emotional Intent**: How it should make the user feel.
4.  **Dark Behavior**: How it deepens (Does it desaturate or hyper-saturate?).

### Current Mood Registry:

#### **Cosmic Night**
*   **Intent**: Professional, Focused, Infinite.
*   **Surface**: Tinted Slate (`slate-950`).
A "Mood" is a holistic state, not just a color palette.
> *A Mood must be applicable to the entire system without redefining components.*

### Defined Moods
*   **Cosmic Night** (Default): Deep indigo/violet. Focus, calm, professional.
*   **Sunset Vibes**: Warm orange/purple. Energetic, creative.
*   **Forest Rain**: Deep greens. Natural, steady, financial growth.
*   **Glacial Blue**: Cyan/slate. Crisp, analytical, cold.

### Implementation Rule
Moods are applied via a root class (e.g., `.theme-cosmic`). All semantic tokens (`--primary`, `--surface`) automatically re-map based on this class.

---

## 4. Semantic States (Interaction)

We describe states by their *behavior*, not their appearance.
> *Exact values may vary, semantic intent must not.*

| State | Semantic Name | Visual Effect |
| :--- | :--- | :--- |
| **Hover** | "Lift" | Elements rise closer to the user. (Use `surface-container-high` or slight scale). |
| **Focus** | "Glow" | Element connects to the primary energy. (Ring with `primary/20`, not generic blue). |
| **Active** | "Press" | Physical feedback. Scale down (`0.98`) to denote mass. |
| **Disabled** | "Drained" | Element loses vitality (saturation), but maintains visibility. Reduce opacity only slightly, desaturate heavily. |
| **Loading** | "Breathing" | Pulse animations that imply life (`animate-pulse`), never static spinners if possible. |

---

## 5. The Laws of Glass

Glassmorphism is our context layer. To prevent "cheap" effects, we follow these strict laws:

1.  **Context, Not Decoration**: Glass is ONLY used for elements that float *above* content (Sticky Headers, Dropdowns, Toasts). Never use glass for a static card on a static background.
2.  **The "No-Stacking" Rule**: Never place a glass element on top of another glass element. It causes visual artifacting.
3.  **The Outline Rule**: Glass must always be anchored by a subtle `outline/30` border. Glass without edges looks like a rendering error.

---

## 7. Technical Engineering Standards

Atmos UI is designed to be strictly compliant with modern **Software Engineering Standards**, prioritizing maintainability, performance, and zero side-effects.

### The "Magic Value" Constraint
**Principle**: "Magic values are forbidden in application code."
**Atmos Implementation**: All visual attributes (colors, blur pixels, gradients) are encapsulated in Semantic Tokens.
- ❌ **Forbidden**: Hardcoding values like `style={{ backdropFilter: 'blur(16px)' }}`.
- ✅ **Required**: Using tokens like `className="backdrop-blur-glass"`.

### The "Flat Specificity" Constraint
**Principle**: "CSS Specificity must remain flat to ensure predictability."
**Atmos Implementation**: All Atmos utilities are single-class selectors (e.g., `.bg-atmos-cosmic`). The system avoids nesting or ID selectors to prevent style wars.

### The "Zero Override" Constraint
**Principle**: `!important` and forced overrides are architectural failures.
**Atmos Implementation**: The system relies on standard CSS cascade layers. If a component requires an override, it indicates a gap in the system, not a need for force.

> **System Note**: This specification is designed to be framework-agnostic, though the reference implementation provided uses Tailwind CSS.

---

## 6. Implementation Guide

### A. Tailwind Config (The Contract Enforcement)
```javascript
theme: {
    extend: {
      colors: {
        surface: 'rgb(var(--surface) / <alpha-value>)',
        'surface-container': 'rgb(var(--surface-container) / <alpha-value>)',
        primary: 'rgb(var(--primary) / <alpha-value>)',
        outline: 'rgb(var(--outline) / <alpha-value>)',
      }
    }
}
```

### B. Example Component: The "Vital" Button
Implements the **State** and **Token** rules:
```jsx
<button className="
    bg-primary text-on-primary           // Token Contract
    hover:scale-105 active:scale-95      // Semantic State (Lift/Press)
    shadow-lg shadow-primary/20          // Vitality (Glow)
    disabled:opacity-70 disabled:grayscale // Semantic State (Drained)
">
    Action
</button>
```

---

<div align="center">
  <p><strong>Atmos UI</strong> — The Atmospheric Design System</p>
  <p>Crafted with 💙 by <strong>tBelt</strong></p>
  <p>© 2026 tBelt Finanzas. All rights reserved.</p>
</div>
