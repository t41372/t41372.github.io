// Shared motion tokens. Easing curves mirror the CSS custom properties in
// globals.css; springs are the canonical physics used across components.
// Tuned for an unhurried, rounded, high-craft deceleration profile.

export const EASE_OUT = [0.22, 1, 0.36, 1] as const;
export const EASE_IN_OUT = [0.76, 0, 0.24, 1] as const;
export const EASE_DRAWER = [0.22, 1, 0.36, 1] as const;
// Asymmetric cinematic S-curve: gentle departure, long weightless landing.
export const EASE_SCENE = [0.42, 0, 0.22, 1] as const;
export const SCENE_DURATION_MS = 640;
export const BLOG_SURFACE_DURATION_MS = 660;

/** CSS string form of EASE_OUT for inline style transitions. */
export const EASE_OUT_CSS = "cubic-bezier(0.22, 1, 0.36, 1)";

/** Press feedback on buttons and other tappable surfaces. */
export const SPRING_PRESS = {
  type: "spring",
  stiffness: 340,
  damping: 28,
  mass: 0.65,
} as const;

/** Content swaps — label/icon slots trading places inside a control. */
export const SPRING_SWAP = {
  type: "spring",
  stiffness: 310,
  damping: 28,
  mass: 0.6,
} as const;

/** Overlay panel entrances — modals and sheets summoned by pointer. */
export const SPRING_PANEL = {
  type: "spring",
  stiffness: 280,
  damping: 32,
  mass: 0.65,
} as const;

/** Shared-layout glides — pills, indicators and panels morphing between positions. */
export const SPRING_LAYOUT = {
  type: "spring",
  stiffness: 240,
  damping: 28,
  mass: 0.7,
} as const;

/** Cursor-follow physics for decorative mouse tracking (magnetic, tilt, dock). */
export const SPRING_MOUSE = {
  stiffness: 150,
  damping: 18,
  mass: 0.4,
} as const;

/** Dragged handles and fills (sliders) — critically damped `useSpring` config,
 * so the value follows the pointer butterily and never rebounds off an end. */
export const SPRING_GLIDE = {
  stiffness: 480,
  damping: 44,
  mass: 0.55,
} as const;
