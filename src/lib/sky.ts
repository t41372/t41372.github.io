/**
 * The site background is ONE long scroll painting (卷軸): aurora at its top,
 * starfield through the middle, darkness at its bottom. Stars and aurora move
 * in strict sync at this fraction of the page scroll speed (all mountains,
 * including the farthest ridge, live in the valley footer in front of it).
 *
 * The painting's total height adapts to each page:
 *   skyHeight = viewport + SKY_SCROLL_FACTOR * (scrollHeight - viewport)
 * so its bottom edge meets the viewport bottom exactly when the page is
 * scrolled to its end. On short pages the painting is short — the aurora
 * still glowing above the valley there is accepted, by design.
 */
export const SKY_SCROLL_FACTOR = 0.4
