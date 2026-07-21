# Animation Guidelines

This document provides guidelines and code examples for custom animation curves, including Framer Motion cubic-bezier and spring definitions, recommendations for transitions, and performance best practices.

## Custom Animation Curves (Framer Motion)

### Cubic-Bezier Easing Definitions

Use cubic-bezier curves for precise control over the acceleration and deceleration of your animations. This is especially useful for UI elements that require a specific "feel" not provided by standard easings.

```tsx
import { motion } from "framer-motion";

// Custom easing curves
const customEasings = {
  // Smooth, snappy entrance
  entrance: [0.175, 0.885, 0.32, 1.275],
  // Standard UI transition
  standard: [0.4, 0, 0.2, 1],
  // Decelerated exit
  exit: [0.4, 0, 1, 1],
};

export const CustomBezierComponent = () => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{
      duration: 0.4,
      ease: customEasings.entrance, // Using custom cubic-bezier
    }}
  >
    Content with Custom Easing
  </motion.div>
);
```

### Spring Animations

Spring animations feel more natural and responsive as they simulate real-world physics. They are ideal for interactive elements like drag, hover, or modal entrances.

```tsx
import { motion } from "framer-motion";

export const SpringComponent = () => (
  <motion.div
    initial={{ scale: 0.8, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    transition={{
      type: "spring",
      stiffness: 260,
      damping: 20,
    }}
  >
    Content with Spring Animation
  </motion.div>
);
```

## Modal Transitions vs Layout Shifts

When animating UI components, it's important to distinguish between animating an overlay (like a modal) and animating elements that affect the document flow (layout shifts).

### Modal Transitions

Modals float above the page content. Their transitions should be snappy but smooth. Avoid excessive scaling or bouncy spring animations that can feel distracting.

- **Recommendation:** Use a combination of `opacity` and a slight `scale` or `y` translation.
- **Easing:** `cubic-bezier(0.4, 0, 0.2, 1)` or a low-bounce spring.

```tsx
// Modal Variant Example
export const modalVariant = {
  hidden: { opacity: 0, scale: 0.95, y: -10 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 25 },
  },
  exit: { opacity: 0, scale: 0.95, y: 10, transition: { duration: 0.2 } },
};
```

### Layout Shifts

Layout shifts occur when elements enter, leave, or change size within the normal document flow (e.g., accordion menus, list items).

- **Recommendation:** Use Framer Motion's `layout` prop to smoothly transition surrounding elements rather than instantly snapping them to new positions.
- **Easing:** Use standard bezier curves to ensure the shift is predictable and linear enough not to cause motion sickness.

```tsx
// Layout Shift Example
export const LayoutShiftComponent = ({ items }) => (
  <motion.ul layout>
    {items.map((item) => (
      <motion.li
        key={item.id}
        layout
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        {item.text}
      </motion.li>
    ))}
  </motion.ul>
);
```

## Performance Guidelines for GPU-Accelerated CSS Properties

To ensure smooth 60fps animations, always animate properties that can be offloaded to the GPU.

### Recommended Properties to Animate

- `transform` (e.g., `translate`, `scale`, `rotate`)
- `opacity`

### Properties to Avoid Animating

Animating these properties triggers browser repaints or reflows, causing layout thrashing and jittery animations:

- `width` and `height`
- `top`, `bottom`, `left`, `right`
- `margin` and `padding`
- `box-shadow` (unless optimized)

### Using `will-change` (CSS)

If an element is going to animate soon, you can hint the browser to promote the element to a separate composite layer.

```css
.accelerated-element {
  will-change: transform, opacity;
}
```

**Caution:** Only apply `will-change` dynamically or to elements that frequently animate. Leaving `will-change` on many elements consumes excessive memory and can degrade performance.
