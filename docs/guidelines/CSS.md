# CSS Standards & Style Guide

This document defines the Golden Rules for style development in the project.  
It acts as the team's mental lint.

---

> **System Note**: This document defines the *technical* CSS rules. For visual and design system rules (Tokens, Moods, Glassmorphism), refer to **[Atmos UI System](../ATMOS_UI.md)**.

---

## 1. Base Rules

### Forbidden

- `!important`
- Deeply nested selectors such as `.card .body .title span`
- Uncontrolled global styles
- Generic classes without semantic meaning such as `.container`, `.box`, `.red`
- Styling by ID selectors
- Coupling styles to the internal DOM structure of external components

### Allowed

- Semantic, intention revealing class names
- Low and flat specificity
- Local styles per component using CSS Modules or utility first Tailwind
- Design Tokens and CSS Variables
- Composition instead of overwriting

---

## 2. Recommended Structure

```
src/
  components/
    Button/
      Button.tsx
      Button.module.css
    Modal/
      Modal.tsx
      Modal.module.css
  styles/
    tokens.css
    globals.css
```

---

## 3. Component Methodology

Component styles must be encapsulated.

Preferred approaches are:
1. CSS Modules for component scoped styles
2. Utility first classes for atomic composition

Global stylesheets are a last resort.

### Correct Example

**Button.module.css**
```css
.button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--radius-md);
  font-weight: 500;
  cursor: pointer;
  transition: background-color 150ms ease;
}

.primary {
  background-color: var(--color-primary);
  color: var(--color-on-primary);
}

.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

**Benefits:**
1. No global collisions
2. Flat specificity
3. Guaranteed local scope
4. Predictable overrides through composition

---

## 4. Design Tokens & Atmos UI

Magic values are forbidden. All visual attributes must use the **Atmos UI System**.

All colors, spacing, typography and radii must be expressed through tokens.

**styles/tokens.css (Atmos Impl)**
```css
:root {
  /* Atmos Semantic Tokens */
  --surface: 2 6 23;      /* Deep Midnight */
  --primary: 99 102 241;  /* Indigo-500 */
}
```

  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 12px;
  --space-lg: 16px;

  --radius-sm: 4px;
  --radius-md: 8px;
}
```

**Incorrect:**
```css
padding: 13px;
```

**Correct:**
```css
padding: var(--space-md);
```

---

## 5. Composition Over Overwriting

Styles must be extended through explicit variants, not forced overrides.

**Incorrect:**
```css
.modal .button {
  background: red !important;
}
```

**Correct:**
```css
.buttonDanger {
  background: var(--color-danger);
}
```

**Usage example:**
```jsx
<Button variant="danger" />
```

---

## 6. Low Specificity Rule

Specificity must remain flat and predictable.

**Incorrect:**
```css
.page .content .card .title span {
  color: red;
}
```

**Correct:**
```css
.cardTitle {
  color: red;
}
```

**Rule:** If you need more control, introduce a new semantic class. Never increase selector depth.

---

## 7. Global Styles Policy

Global styles are strictly limited to:
1. CSS resets and normalization
2. Base typography and font definitions
3. Theme tokens and CSS variables

Global files must never contain component specific rules.

---

## 8. Explicit State Styling

State must be modeled explicitly through classes rather than selector hacks.

**Incorrect:**
```css
.button:disabled {
  opacity: 0.4;
}
```

**Correct:**
```css
.disabled {
  opacity: 0.4;
}
```

State classes are applied by JavaScript or the framework.

---

## 9. Automation and Enforcement

Style rules are enforced automatically.

**stylelint.config.js**
```javascript
module.exports = {
  rules: {
    "declaration-no-important": true,
    "selector-max-specificity": "0,3,0",
    "selector-max-compound-selectors": 3
  }
};
```

Automated tests fail the build if forbidden patterns are detected.

---

## 10. The Golden Rule

If you feel tempted to use `!important`, the problem is not CSS, it is the component design.

---

## Metadata

- **Adopted:** v1.5.0
- **Status:** Normative
- **Alignment:** Component Driven and Token Based Styling
