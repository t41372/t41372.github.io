# Navigation and component ownership

Astro ClientRouter owns fetching, history, cancellation and browser View
Transitions. StarSky, the header island and footer DOM are persistent. Static
builds still emit all article language variants and work without JavaScript.

## Protected design

The original HeroSection layout, long authored typewriter sequence, name glitch,
font cycle, draggable magnetic intro and pointer-responsive smoke are preserved.
Replacing an implementation does not authorize removing or redesigning these
features. HeroIntro keeps readable SSR and skips replay on return; Escape settles
its first sequence. Its drag layer stays separate from CSS scroll parallax.

## Glass and shared article transitions

`view-transition-name` creates a Backdrop Root even outside an animation. Never
name `main`, an Astro island wrapper, or another ancestor of a glass surface:
that prevents the child from sampling the sky even if computed blur is nonzero.
See [CSS View Transitions 1, rendering consolidation](https://www.w3.org/TR/css-view-transitions-1/#rendering-consolidation).

The reading-context adapter matches a selected list card to its article after
loading succeeds. Only that matched pair shares `blog-surface`. Direct article
navigation to Home/Projects uses an outgoing leaf fade, so an enormous article
snapshot cannot cover the new page. The browser interpolates the matched
material over 420ms with EASE_DRAWER, without overshoot. Both material snapshot images
fill the group's animated height; auto height leaves a short dark card floating
over a full-height article. There are no proxy divs.

The material is captured without raster borders/rounded corners and with its
hover color transition disabled. The native group draws a fixed 1px border and
clips the corners. Otherwise a long article magnifies the card's 1px top border
into a thick luminous band. e2e-motion checks calibrated border pixels in the
first 8–240ms of the longest article's expansion on desktop and mobile.

List and article copy have different names and sit **above** the surface in the
transition tree. Copy below the glass gets blurred until the transition ends.
The title stays inside its copy instead of scaling between different line wraps.
Visible article header/prose blocks fade in independently over 600ms with 60ms between blocks
and an 8px rise. A matched panel arrives before its content starts to appear, so
controls/title never float outside the moving material. WAAPI animations are
prepared before capture and start at ViewTransition.ready, inside the live
incoming copy. Offscreen blocks remain readable; scrolling does not trigger a
reveal. Language changes use distinct outgoing/incoming copy so differing text
lengths cannot stretch. Reduced motion uses a short opacity fade without movement
or stagger.

For route changes, page intros and actual card surfaces receive separate
outgoing/incoming names with the `page-content` transition class. Copy exits
before the new copy enters, avoiding overlapping Blog/Projects headlines and
card grids. Opacity belongs to the whole leaf group: backdrop filters live there,
so fading only an old/new image leaves a transparent blur rectangle behind.
Glass ancestors remain unnamed. Transient names are cleared after
the current transition finishes, including after interrupted navigation.

The root keeps the browser's additive scene crossfade. Reading position and the
index language are restored on `astro:after-swap`, before the new snapshot.
StarSky saves the visible camera before swap and redraws after scroll restoration
with that same camera. Starting at ready, it interpolates the sky offset and
painting length over 420ms with EASE_SCENE (easeInOutSine). This is a time-based navigation animation; normal
scrolling keeps the original native tall-canvas/CSS parallax path. A second
navigation starts from the currently displayed camera. Do not restore reading
scroll on page-load: that can visibly jump after capture.

## Other components

- Header: Motion Primitives Animated Background in a persistent React island;
  semantic anchors and committed route state, flushed on after-swap before
  capture. Its 280ms ease-out tween settles with the arriving heading, without
  spring overshoot. Clicks that the browser retargets from the captured nav to
  the transition root are forwarded to the same persistent semantic anchor.
- Cards: shadcn/ui Card with site tokens and actual `.glass-surface` blur.
- Project previews: beUI Center Morph Modal, retaining upstream presence/focus
  handling; site wrappers supply data, styling and close on route navigation.
- Background scroll effects: original CSS-driven parallax and iOS svh/lvh guards.

See THIRD_PARTY_NOTICES.md for vendor sources, MIT notices and local adaptations.

## Verification

Run `bunx astro check` and `bun run test:e2e`. e2e-glass samples rendered pixels
against an unblurred checkerboard control on blog, projects, article and nav;
computed `backdrop-filter` alone does not prove blur. It also pauses real native
transitions to check shared material geometry and old/new scene participation.
e2e-motion compares photograph detail during/after a transition, checks staggered
opacity and tab-heading separation, and samples actual shader camera uniforms
across entry, return and scrolled tab changes. It saves desktop/mobile transition
frames in the OS temp directory's `yi-ting-transition-qa` folder (override with
`E2E_ARTIFACT_DIR`). Navigation tests cover history/focus,
language routes, modal cleanup, restored Hero layout/drag, reduced motion and
superseded requests. They wait for the native transition's finished promise;
page-load can run before ready, when its animation list is still empty.
Mouse clicks and touch taps at each quarter of article entry verify cancellation
and cleanup, including the completed transition not erasing the next one's names.
Real Safari/Metal frame pacing still needs device review.
