import { useEffect, useRef } from 'react'
import { SKY_SCROLL_FACTOR } from '../lib/sky'

const VERT = /* glsl */ `
attribute vec2 aPos;
void main() {
  gl_Position = vec4(aPos, 0.0, 1.0);
}
`

const FRAG = /* glsl */ `
precision highp float;

uniform vec2 uRes;
uniform float uTime;
uniform float uVh;    // ONE viewport height in buffer px — the painting-space
                      // unit. Desktop: the canvas IS one viewport (uVh==uRes.y).
                      // Touch: the canvas is the WHOLE painting, much taller.
uniform float uWyTop; // painting-space wy of the canvas's TOP pixel row.
                      // Desktop rolls it per frame (1 - scroll offset); the tall
                      // touch canvas keeps it constant — it sits in the document
                      // flow and scrolls natively with the page.
uniform float uVigY;  // vertical vignette weight: 1 desktop (canvas==viewport);
                      // 0 tall mode (a whole-painting vignette would darken the
                      // page top/bottom instead of the screen edges)
uniform float uSkyH;  // painting's total height in viewport-heights: past its
                      // bottom edge (d > uSkyH — the tall canvas's bottom
                      // overdraw) the sky hands off to valley-ground black
uniform vec4 uAvoid[4]; // hero text LINE rects in screen uv (x0,y0,x1,y1), y up;
                        // unused slots are parked far off-screen
uniform float uAvoidK;  // how deeply the aurora thins behind them (0 = off)
uniform float uBoot;    // 0->1 ignition ramp after the first paint: stars fade
                        // up first, the aurora blooms in behind them — the
                        // page opens as a sky waking up, not a scene popping in

// ---------- noise ----------
float hash21(vec2 p) {
  p = fract(p * vec2(234.34, 435.345));
  p += dot(p, p + 34.23);
  return fract(p.x * p.y);
}

// white noise that stays healthy at gl_FragCoord scale: hash21 multiplies its
// input by ~435 BEFORE the first fract, so raw pixel coords (thousands) land
// where float32 only resolves steps of ~0.25 and the "noise" collapses into a
// coarse grid. This one scales DOWN first, so any on-screen coord is safe.
float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.zyx + 31.32);
  return fract((p3.x + p3.y) * p3.z);
}

float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = hash21(i);
  float b = hash21(i + vec2(1.0, 0.0));
  float c = hash21(i + vec2(0.0, 1.0));
  float d = hash21(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

// OCT is #define'd at compile time: 4 octaves on desktop, 3 on touch devices
// (the 4th octave is ~6% amplitude — invisible on a phone, 25% of fbm cost)
float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < OCT; i++) {
    v += a * vnoise(p);
    p = p * 2.03 + vec2(13.7, 7.1);
    a *= 0.5;
  }
  return v;
}

// ---------- stars ----------
// One layer of round, gaussian star points with jittered positions,
// per-star size / brightness / color temperature, compound twinkle.
vec3 starLayer(vec2 p, float t, float minBright) {
  vec2 cell = floor(p);
  vec2 f = fract(p);
  vec3 acc = vec3(0.0);

  // check 3x3 neighborhood so gaussians are not clipped at cell borders
  for (int oy = -1; oy <= 1; oy++) {
    for (int ox = -1; ox <= 1; ox++) {
      vec2 o = vec2(float(ox), float(oy));
      vec2 c = cell + o;
      float h = hash21(c);
      if (h < minBright) continue;

      // jittered position inside the cell
      vec2 pos = o + vec2(hash21(c + 17.3), hash21(c + 31.7));
      vec2 d = f - pos;
      float dist = length(d);

      // size & brightness: mostly tiny, rare big ones (cubic bias)
      float sel = (h - minBright) / (1.0 - minBright);
      float mag = pow(sel, 3.0);
      float size = mix(0.045, 0.14, mag);
      // crisp disc with a thin anti-aliased rim — no gaussian halo
      float core = smoothstep(size, size * 0.55, dist);

      // compound twinkle: two incommensurate frequencies -> organic flicker
      float ph = h * 43.7;
      float tw = 0.62 + 0.38 * sin(t * (0.4 + h * 1.6) + ph);
      tw *= 0.80 + 0.20 * sin(t * (2.1 + h * 2.7) + ph * 1.7);

      // slight color temperature variation: cool blue-white ... warm ivory
      float temp = hash21(c + 57.1);
      vec3 col = mix(vec3(0.72, 0.82, 1.0), vec3(1.0, 0.93, 0.80), temp * temp);

      float bright = (0.25 + 0.75 * mag) * tw;
      acc += col * core * bright;

      // 4-point diffraction glint only on the largest stars
      if (mag > 0.55) {
        float spike = exp(-abs(d.x) * 22.0) * exp(-d.y * d.y * 260.0)
                    + exp(-abs(d.y) * 22.0) * exp(-d.x * d.x * 260.0);
        acc += col * spike * 0.30 * tw * (mag - 0.55) / 0.45;
      }
    }
  }
  return acc;
}

void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  // aspect against ONE VIEWPORT height (not the canvas): keeps stars round and
  // all painting math identical whether the canvas is one viewport (desktop)
  // or the whole painting (touch)
  float aspect = uRes.x / uVh;

  // One long scroll painting: everything here lives in painting space and
  // moves together. wy = this pixel's height in the painting (up-positive,
  // painting top at wy=1); d = depth below the painting's top edge. wy is
  // derived from the canvas's top row (uWyTop) so the SAME math serves both
  // modes: desktop animates uWyTop with scroll; the tall touch canvas paints
  // the full painting once and the compositor slides it.
  float wy = uWyTop - (uRes.y - gl_FragCoord.y) / uVh;
  float d = 1.0 - wy;
  vec2 suv = vec2(gl_FragCoord.x / uVh, wy);

  // ---------- night sky ----------
  // the sky itself never darkens toward the page bottom — the "dusk near the
  // mountains" gradient lives in the valley layer, in front of this canvas
  vec3 nTop = vec3(0.045, 0.075, 0.225);
  vec3 nLow = vec3(0.10, 0.145, 0.33);
  // first viewport of the painting: the bright aurora horizon
  vec3 scene = mix(nLow, nTop, smoothstep(0.0, 1.0, 1.0 - min(d, 1.0)));

  // faint milky haze for depth
  float haze = fbm(suv * 2.2 + vec2(3.1, 8.7));
  scene += vec3(0.05, 0.07, 0.13) * haze * haze * 0.5;

  // ---------- stars: two depth layers (painted on the scroll) ----------
  // distant dense faint layer + near sparse bright layer (with glints)
  // starBoot: stars ignite during the first ~1s after the canvas appears
  float starBoot = smoothstep(0.0, 0.55, uBoot);
  scene += starLayer(suv * 55.0, uTime, 0.985) * 0.45 * starBoot;
  scene += starLayer(suv * 22.0 + 47.0, uTime, 0.978) * 0.95 * starBoot;

  // ---------- aurora curtains (painted at the top of the scroll) ----------
  // Viewpoint: an observer STANDING in the valley, looking out across the
  // mountains — not lying under the corona. Seen side-on, a curtain is a
  // ribbon sweeping across the sky: a crisp, undulating lower edge, thin
  // vertical rays hanging from it, and fold heights that vary wildly along
  // the ribbon so the tops dissolve raggedly at different altitudes instead
  // of at one uniform ceiling.
  // Aurora coordinate: on portrait screens the true aspect (< 1) makes the
  // noise domain so narrow that the ray fbm barely varies across the screen —
  // whole minutes can pass with no visible curtain. Clamping the horizontal
  // span to at least ~1.5 "landscape units" guarantees every viewport,
  // portrait or ultrawide, always spans enough noise features to show a
  // proper curtain. Stars keep the true aspect (they must stay round).
  float ax = uv.x * max(aspect, 1.5);

  // lower edge of the curtain: one long swooping arc plus per-fold dips —
  // without the second term the fringe straightens into a ruler line
  float baseY = 0.26
    + 0.26 * (fbm(vec2(ax * 0.7 + uTime * 0.022, uTime * 0.03)) - 0.5) * 2.0
    + 0.09 * (fbm(vec2(ax * 2.3 + 11.0, uTime * 0.045)) - 0.5) * 2.0;
  float hgt = wy - baseY; // height above the curtain's lower edge

  // domain warp -> drapery folds
  float warp = (fbm(vec2(ax * 1.6 - uTime * 0.035, wy * 1.1 + uTime * 0.012)) - 0.5) * 0.55;

  // folds lean sideways a little more with altitude — the gentle shear that
  // sells "drapery seen at an angle" rather than "patches straight overhead"
  float lean = (fbm(vec2(ax * 0.4 + 21.0, uTime * 0.015)) - 0.5) * 0.9;
  float rx = ax + warp + max(hgt, 0.0) * lean;

  // vertical rays: anisotropic noise (high freq in x, stretched in y)
  float rays = fbm(vec2(rx * 5.5, wy * 0.5 - uTime * 0.045));
  rays = smoothstep(0.30, 0.75, rays);
  // finer secondary ray detail
  float rays2 = vnoise(vec2(rx * 22.0, wy * 0.6 - uTime * 0.07));
  rays *= 0.72 + 0.28 * rays2;

  // per-fold ray height: some folds climb far past the screen top, others
  // stay short — heights come from their own noise, never from the viewport
  float tall = 0.30 + 1.30 * fbm(vec2(ax * 1.1 + 7.0, uTime * 0.018));
  float profile = smoothstep(-0.015, 0.045, hgt) * exp(-max(hgt, 0.0) * 2.2 / tall);

  // the side view's signature: a hot, crisp rim right at the lower edge
  float rim = smoothstep(-0.012, 0.02, hgt) * exp(-max(hgt, 0.0) * 10.0);

  // waves of brightness traveling along the curtain
  float shimmer = 0.78 + 0.22 * sin(ax * 9.0 - uTime * 0.55 + warp * 8.0);

  // gentle horizontal mask (fades only at the far edges)
  float edgeMask = smoothstep(0.0, 0.18, uv.x) * smoothstep(1.0, 0.80, uv.x);

  // hero-text exclusion: the curtain "happens" to run thin behind the intro
  // text. One rect PER TEXT LINE (distance to the nearest), so a short line
  // like "Hello!" doesn't drag a big empty quiet zone across the sky to the
  // right of it; a long, soft feather makes the falloff read as a gradient.
  // painting-space too (JS supplies the rect y's in wy units), so the quiet
  // zone stays glued to the sky whether the canvas rolls or the compositor
  // slides it
  vec2 ap = vec2(uv.x * aspect, wy);
  float ad = 1e3;
  for (int i = 0; i < 4; i++) {
    vec2 alo = vec2(uAvoid[i].x * aspect, uAvoid[i].y);
    vec2 ahi = vec2(uAvoid[i].z * aspect, uAvoid[i].w);
    ad = min(ad, distance(ap, clamp(ap, alo, ahi)));
  }
  float avoid = 1.0 - uAvoidK * (1.0 - smoothstep(0.0, 0.24, ad));

  // aurBoot: the curtain blooms in AFTER the stars (second act of the boot)
  float aurBoot = smoothstep(0.35, 1.0, uBoot);

  // rim weight follows ray density, so the hot fringe lights up only under
  // the strongest folds instead of underlining the whole curtain
  float aur = clamp((profile + rim * (0.2 + 0.8 * rays)) * rays * shimmer * edgeMask * 2.2, 0.0, 1.0) * avoid * aurBoot;

  // second, fainter and higher curtain for depth
  float baseY2 = baseY + 0.32 + 0.05 * sin(uTime * 0.05 + 2.0);
  float hgt2 = wy - baseY2;
  float rays2b = fbm(vec2((ax - warp * 0.8) * 5.0 + 31.0, wy * 0.4 + uTime * 0.03));
  rays2b = smoothstep(0.42, 0.85, rays2b);
  float tall2 = 0.25 + 0.85 * fbm(vec2(ax * 1.3 + 43.0, uTime * 0.02));
  float profile2 = smoothstep(-0.02, 0.06, hgt2) * exp(-max(hgt2, 0.0) * 2.6 / tall2);
  float aur2 = clamp(rays2b * profile2 * edgeMask * 1.3, 0.0, 1.0) * avoid * aurBoot;

  // ---------- aurora color ramp (by height above lower edge) ----------
  vec3 cFringe = vec3(0.92, 0.45, 0.62); // pink fringe at the very bottom
  vec3 cGreen  = vec3(0.32, 0.94, 0.55); // oxygen green
  vec3 cTeal   = vec3(0.30, 0.84, 0.86); // teal mid
  vec3 cPurple = vec3(0.52, 0.38, 0.88); // purple top
  float ch = clamp(hgt * 1.2, 0.0, 1.0);
  vec3 aurCol = mix(cGreen, cTeal, smoothstep(0.05, 0.45, ch));
  aurCol = mix(aurCol, cPurple, smoothstep(0.45, 1.0, ch));
  aurCol = mix(cFringe, aurCol, smoothstep(-0.005, 0.05, hgt));

  vec3 aurCol2 = mix(cTeal, cPurple, clamp(hgt2 * 2.5, 0.0, 1.0));

  // combine: primary curtain wins, secondary fills behind
  float dotB = max(aur, aur2 * 0.7);
  vec3 dotCol = aur >= aur2 * 0.7 ? aurCol : aurCol2;

  // soft atmospheric glow behind the halftone dots (ties dots to the sky)
  scene += aurCol * aur * 0.14 + aurCol2 * aur2 * 0.08;

  // ---------- halftone dots ----------
  // cell size follows the VIEWPORT height (uVh), not the canvas — on the tall
  // touch canvas uRes.y is several viewports and would blow the dots up
  float cellPx = max(4.0, uVh / 130.0);
  vec2 g = gl_FragCoord.xy / cellPx;
  vec2 cell = floor(g);
  vec2 gv = fract(g) - 0.5;

  float jitter = hash21(cell);
  float twinkle = 0.78 + 0.22 * sin(uTime * (1.2 + jitter * 2.4) + jitter * 6.283);
  float b = clamp(dotB, 0.0, 1.0) * twinkle;
  float radius = 0.42 * sqrt(b);
  float dotMask = smoothstep(radius, radius - 0.18, length(gv)) * step(0.02, b);

  vec3 color = scene + dotCol * dotMask * (0.35 + 0.65 * b);

  // ---------- vignette + grain ----------
  // vertical component gated by uVigY: on the tall canvas "canvas edges" are
  // the page's top/bottom, not the screen's — only the horizontal falloff stays
  vec2 vc = vec2(uv.x - 0.5, (uv.y - 0.5) * uVigY);
  color *= 1.0 - dot(vc, vc) * 0.5;
  // STATIC dither grain — its only job is breaking 8-bit banding in the dark
  // gradient; re-rolling it per frame read as a flickering mesh, not texture
  color += (hash12(gl_FragCoord.xy) - 0.5) * 0.015;

  // below the painting's bottom edge, fade to the valley-ground black
  // (#05070B): the tall canvas's bottom overdraw pokes out UNDER the black
  // footer during iOS toolbar transitions — sky-navy there reads as a glitch,
  // ground-black reads as more ground. No-op on desktop (d never exceeds uSkyH).
  // NOTE: this stays a NARROW fade at the very bottom only — a broad fade to
  // black up the painting was tried and rejected (read as "the whole starfield
  // went black"). The starfield stays navy the whole way down; the "blue under
  // the footer" leak is handled by body's ground-black background-color instead.
  color = mix(color, vec3(0.020, 0.027, 0.043), smoothstep(uSkyH, uSkyH + 0.06, d));

  gl_FragColor = vec4(color, 1.0);
}
`

/**
 * StarSky — the site's scroll-painting background (see lib/sky.ts). Stars,
 * aurora (painting top) and the bottom dark band all live in painting space
 * and scroll together at SKY_SCROLL_FACTOR; every mountain sits in front, in
 * the valley footer.
 *
 * Two scroll models, same shader (unified via uWyTop/uVh):
 * - Fine pointers (desktop): viewport-sized FIXED canvas, painting rolled per
 *   frame via uWyTop. 40fps idle cap, every-tick while scrolling, DPR ≤ 1.5.
 * - Coarse pointers (touch): the canvas IS the whole painting (plus
 *   overdraw above the document top), positioned IN-FLOW (absolute) and
 *   scrolled natively 1:1 by the compositor — zero JS on the scroll path,
 *   the only lag-free option mobile WebKit offers. The 0.4× parallax factor
 *   is desktop-only. Redraws only animate the twinkle: 20fps, scissored to
 *   the visible slice. DPR 1, 3 fbm octaves.
 * Boot: canvas fades in over the CSS .sky-fallback on its first frame, and
 * uBoot ignites stars then aurora (~1.8s). Reduced motion: frozen frame;
 * desktop re-renders on scroll, the touch painting needs nothing.
 */
export default function StarSky() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    // if WebGL is unavailable the canvas stays at opacity 0 and the CSS
    // .sky-fallback layer behind it remains the permanent sky
    const gl = canvas.getContext('webgl', {
      antialias: false,
      alpha: false,
      powerPreference: 'high-performance',
      // REQUIRED. (1) Under swup the canvas lives OUTSIDE the swapped <main>
      // and is never snapshotted, so client-side navigations no longer depend
      // on this flag — but it stays mandatory for reason (2). (Historically,
      // ClientRouter's view-transition root snapshot captured this canvas
      // out-of-band and the default post-composite buffer clear handed WebKit a
      // BLACK frame, so every navigation played out over a black sky — the
      // "whole page dims during transitions" bug on iOS.) (2) The tall-mode
      // twinkle redraws are scissored to the visible slice and rely on the rest
      // of the buffer keeping its last frame — that persistence is only
      // spec-defined with this flag. Cost: buffer copy instead of swap per
      // drawn frame (20-40fps full-screen quad) — negligible.
      // HISTORY: this flag was once blamed for "starfield composites black on
      // real Safari" and reverted — later DISPROVEN by readPixels: the actual
      // occluder was an opaque background-color on <body> (since removed, see
      // body's comment in global.css). If a black sky ever reappears on real
      // WebKit, hunt for an opaque layer over the -z canvas FIRST; only then
      // suspect this flag.
      preserveDrawingBuffer: true,
    })
    if (!gl) return

    // Older mobile GPUs silently clamp the drawing buffer BELOW the requested
    // height, and every painting-space mapping then shears. Read the real
    // limit so the tall-canvas paint height can be capped against it (PAINT_CAP
    // below, once OVER_T is known) instead of a blind 7000px.
    const maxBuf = Math.min(
      gl.getParameter(gl.MAX_TEXTURE_SIZE) || 4096,
      gl.getParameter(gl.MAX_RENDERBUFFER_SIZE) || 4096,
    )

    // Touch devices get a cheaper shader: DPR 1 (not 1.5) and 3 fbm octaves
    // (not 4) ≈ 3x less fragment work. iPhone GPUs under Safari's WebGL can't
    // hold the full-cost shader at scroll rate, and a slow sky next to
    // compositor-smooth foreground scrolling reads as extreme jank.
    const coarse = window.matchMedia('(pointer: coarse)').matches

    const compile = (type: number, src: string) => {
      const sh = gl.createShader(type)
      if (!sh) return null
      gl.shaderSource(sh, src)
      gl.compileShader(sh)
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
        return null
      }
      return sh
    }

    const vs = compile(gl.VERTEX_SHADER, VERT)
    const fs = compile(gl.FRAGMENT_SHADER, `#define OCT ${coarse ? 3 : 4}\n` + FRAG)
    if (!vs || !fs) return

    const prog = gl.createProgram()
    if (!prog) return
    gl.attachShader(prog, vs)
    gl.attachShader(prog, fs)
    gl.linkProgram(prog)
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return
    gl.useProgram(prog)

    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
    const aPos = gl.getAttribLocation(prog, 'aPos')
    gl.enableVertexAttribArray(aPos)
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0)

    const uRes = gl.getUniformLocation(prog, 'uRes')
    const uTime = gl.getUniformLocation(prog, 'uTime')
    const uVh = gl.getUniformLocation(prog, 'uVh')
    const uWyTop = gl.getUniformLocation(prog, 'uWyTop')
    const uVigY = gl.getUniformLocation(prog, 'uVigY')
    const uSkyH = gl.getUniformLocation(prog, 'uSkyH')
    const uAvoid = gl.getUniformLocation(prog, 'uAvoid')
    const uAvoidK = gl.getUniformLocation(prog, 'uAvoidK')
    const uBoot = gl.getUniformLocation(prog, 'uBoot')

    // ---- TALL PAINTING MODE (touch devices) ----
    // The canvas is the ENTIRE scroll painting, IN THE DOCUMENT FLOW
    // (position: absolute at the document top), scrolling 1:1 with the page —
    // the scroll path involves ZERO JavaScript, which is the only way mobile
    // WebKit scrolls a full-viewport layer without lag. The desktop 0.4×
    // parallax factor is deliberately given up on touch: no native primitive
    // moves a layer at a fractional scroll speed, and every scripted
    // stand-in was tried and janked (per-rAF transform: runs a beat behind
    // momentum scroll; ScrollTrigger scrub: drifts after the page stops;
    // normalizeScroll: broke touch scrolling entirely on real iPhones).
    // In-flow also kills the "blue starfield below the footer" class of bug
    // structurally: during iOS rubber-band overscroll the sky now lifts WITH
    // the content (a fixed canvas stayed put and showed raw sky under the
    // footer), and the gap beyond shows html's ground-black gradient.
    // CRITICAL: the canvas bottom must land AT or ABOVE the content bottom —
    // an absolutely-positioned element extends the root's scrollHeight, and
    // measuring content via scrollHeight then feeds back into the canvas
    // height forever (you could scroll past the footer into raw sky). So
    // content height is measured from body.offsetHeight, which by CSS
    // ignores absolutely-positioned children.
    // Redraws only animate the twinkle (low frequency, scissored to the
    // visible slice) — never scroll position.
    // OVER_T bleeds the canvas above the document top: it covers the iOS
    // status-bar region (viewport-fit=cover) and top overscroll.
    const tall = coarse
    const OVER_T = 144 // px above the document top (status bar + overscroll)
    // paint-height cap: never exceed the GPU's real buffer limit (minus the top
    // overdraw and a 64px safety margin), and never exceed 7000px anyway —
    // above the cap the shader fades the sky into ground-black and html's
    // gradient continues it, so long pages degrade gracefully
    const PAINT_CAP = Math.min(7000, maxBuf - OVER_T - 64)
    let paintPx = 0 // painting height in css px (tall mode)
    let bufDpr = 1

    // the elements the aurora keeps its distance from (the hero intro text);
    // re-queried after every client-side navigation — pages without any
    // simply run with the exclusion off. Their INLINE CONTENTS are measured
    // (Range API), not their boxes: h1/p are block elements spanning the full
    // container width, and a box-based rect read as an invisible billboard.
    let avoidEls: Element[] = []
    const findAvoid = () => {
      avoidEls = Array.from(document.querySelectorAll('[data-aurora-avoid]'))
    }
    findAvoid()
    const avoidRange = document.createRange()
    const avoidData = new Float32Array(16) // 4 line rects × (x0,y0,x1,y1)

    // Stable viewport reference = 100lvh (the LARGE viewport), which does NOT
    // change while the iOS address bar collapses/expands mid-scroll. Measured
    // via a probe (the tall canvas is no longer viewport-sized itself); using
    // it instead of live window.innerHeight kills the "sky slightly zooms /
    // jitters while scrolling on iPhone" feedback loop.
    let vhRef = 1
    let skyH = 1
    const probeLvh = () => {
      const d = document.createElement('div')
      d.style.cssText = 'position:fixed;top:0;left:0;width:0;height:100lvh;visibility:hidden;pointer-events:none'
      document.body.appendChild(d)
      const h = d.getBoundingClientRect().height || window.innerHeight
      d.remove()
      return Math.max(h, 1)
    }
    const measureDoc = () => {
      // body.offsetHeight, NOT documentElement.scrollHeight: the tall canvas
      // is an abspos child of body, so scrollHeight includes it — measuring
      // it would feed the canvas's own height back into itself (see above)
      const contentH = Math.max(document.body.offsetHeight, vhRef)
      const sMax = Math.max(contentH - vhRef, 0)
      // touch scrolls the painting 1:1 (in-flow); desktop rolls it at the
      // parallax factor
      skyH = 1 + ((tall ? 1 : SKY_SCROLL_FACTOR) * sMax) / vhRef
    }

    const resize = () => {
      vhRef = probeLvh()
      measureDoc()
      if (tall) {
        // whole painting; capped so the buffer stays well inside mobile
        // texture limits on very long pages (below the cap the shader fades
        // the sky into ground-black, and html's gradient continues it)
        paintPx = Math.min(skyH * vhRef, PAINT_CAP)
        // in the document flow; bottom lands exactly at min(contentH, cap),
        // never past the content bottom (see the scrollHeight note above)
        canvas.style.position = 'absolute'
        canvas.style.top = `${-OVER_T}px`
        canvas.style.height = `${Math.ceil(paintPx + OVER_T)}px`
      }
      bufDpr = Math.min(window.devicePixelRatio || 1, coarse ? 1 : 1.5)
      const w = Math.floor(canvas.clientWidth * bufDpr)
      const h = Math.floor(canvas.clientHeight * bufDpr)
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w
        canvas.height = h
        gl.viewport(0, 0, w, h)
      }
    }
    resize()

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let raf = 0
    let last = 0
    let settleTimer = 0
    let frame = 0
    let lastTimeSec = reduced ? 2.0 : 0
    const frameInterval = 1000 / 40 // 40 fps cap — while IDLE only (see render)
    const start = performance.now()
    // boot ignition: starts at the first real draw, runs ~1.8s in the shader
    let bootStart = -1
    // first-frame reveal: the canvas ships at opacity 0 over the CSS sky
    // fallback; once the first WebGL frame is actually drawn it fades in
    let revealed = false

    const draw = (timeSec: number, full = false) => {
      lastTimeSec = timeSec
      // clamp overscroll so the painting never rolls past its bottom edge
      const offset = Math.min(
        (SKY_SCROLL_FACTOR * Math.max(window.scrollY, 0)) / vhRef,
        skyH - 1,
      )
      // wy of the canvas's top row: desktop rolls the painting per frame; the
      // tall canvas is the whole painting (plus OVER_T of extra sky above)
      const wyTop = tall ? 1 + OVER_T / vhRef : 1 - offset
      // canvas top in window coords — known analytically (style top + current
      // transform), no getBoundingClientRect layout hit per frame
      const cTop = tall ? -OVER_T - window.scrollY : 0
      // measured per frame: the hero text rides a scroll-lag transform AND the
      // typewriter grows it character by character. getClientRects() gives
      // one rect per inline fragment; fragments sharing a line are merged, so
      // each TEXT LINE becomes its own snug exclusion rect — a short line
      // ("Hello!") never widens the quiet zone of the lines below it.
      avoidData.fill(-9) // park unused slots far off-screen
      let ak = 0
      if (avoidEls.length > 0) {
        const lines: { l: number; t: number; r: number; b: number }[] = []
        for (const el of avoidEls) {
          avoidRange.selectNodeContents(el)
          for (const r of avoidRange.getClientRects()) {
            if (r.width <= 0 || r.height <= 0) continue
            let merged = false
            for (const q of lines) {
              const overlap = Math.min(r.bottom, q.b) - Math.max(r.top, q.t)
              if (overlap > 0.5 * Math.min(r.height, q.b - q.t)) {
                q.l = Math.min(q.l, r.left)
                q.t = Math.min(q.t, r.top)
                q.r = Math.max(q.r, r.right)
                q.b = Math.max(q.b, r.bottom)
                merged = true
                break
              }
            }
            if (!merged) lines.push({ l: r.left, t: r.top, r: r.right, b: r.bottom })
          }
        }
        // more lines than slots (deep mobile wrapping): union the overflow
        // into the last slot rather than dropping it
        while (lines.length > 4) {
          const extra = lines.pop()!
          const last = lines[lines.length - 1]!
          last.l = Math.min(last.l, extra.l)
          last.t = Math.min(last.t, extra.t)
          last.r = Math.max(last.r, extra.r)
          last.b = Math.max(last.b, extra.b)
        }
        const w = Math.max(canvas.clientWidth, 1)
        for (let i = 0; i < lines.length; i++) {
          const q = lines[i]!
          // y goes to painting-space wy (window coords -> canvas -> painting),
          // matching the shader's `ap` — works under both scroll models
          avoidData[i * 4] = q.l / w
          avoidData[i * 4 + 1] = wyTop - (q.b - cTop) / vhRef
          avoidData[i * 4 + 2] = q.r / w
          avoidData[i * 4 + 3] = wyTop - (q.t - cTop) / vhRef
        }
        if (lines.length > 0) ak = 0.6
      }
      // tall mode: after the boot, redraws only service the twinkle — scissor
      // them to the visible slice (+margin). Off-slice rows keep their last
      // frame: fully lit, just twinkle-frozen, which is invisible since the
      // next slice redraw catches them within ~70ms of being scrolled in.
      // 360px margin: at momentum-scroll speeds the 20fps twinkle refresh
      // must cover rows about to scroll in, or their stars pop as they appear
      if (tall && !full) {
        gl.enable(gl.SCISSOR_TEST)
        const sliceTop = Math.max(0, (OVER_T + window.scrollY - 360) * bufDpr)
        const sliceH = (vhRef + 720) * bufDpr
        gl.scissor(0, Math.floor(canvas.height - sliceTop - sliceH), canvas.width, Math.ceil(sliceH))
      } else {
        gl.disable(gl.SCISSOR_TEST)
      }
      gl.uniform2f(uRes, canvas.width, canvas.height)
      gl.uniform1f(uTime, timeSec)
      gl.uniform1f(uVh, vhRef * bufDpr)
      gl.uniform1f(uWyTop, wyTop)
      gl.uniform1f(uVigY, tall ? 0 : 1)
      // tall mode: when the buffer cap truncates the painting, pull the
      // ground-black fade up so the canvas's last rows END in black — below
      // its bottom edge sits html's black gradient, so the handoff is seamless
      gl.uniform1f(uSkyH, tall ? Math.min(skyH, paintPx / vhRef) - 0.07 : skyH)
      gl.uniform4fv(uAvoid, avoidData)
      gl.uniform1f(uAvoidK, ak)
      // ignition ramp: stars first, aurora second (split inside the shader);
      // reduced motion skips the theatrics and lights everything at once
      if (bootStart < 0) bootStart = performance.now()
      gl.uniform1f(uBoot, reduced ? 1 : Math.min(1, (performance.now() - bootStart) / 1800))
      gl.drawArrays(gl.TRIANGLES, 0, 3)
      if (!revealed) {
        revealed = true
        if (reduced) canvas.style.transition = 'none'
        canvas.style.opacity = '1'
      }
    }

    // Resizing the drawing buffer clears the canvas to black; if the next
    // paint waited for the 40fps loop, every resize event would flash black
    // (the "high-frequency starfield/black flicker" during window resize).
    // Resize + redraw synchronously in the same handler instead.
    const onResize = () => {
      resize()
      draw(lastTimeSec, true)
    }
    window.addEventListener('resize', onResize)

    // A client-side navigation (swup, bridged as astro:page-load) swaps pages
    // without reloading: the persisted sky — it lives outside the swapped
    // <main> — just re-measures its painting length for the new page's scroll
    // height.
    const onPageLoad = () => {
      findAvoid()
      resize()
      draw(lastTimeSec, true)
      // reduced motion runs NO render loop, so this single immediate draw is
      // all the aurora would ever get — but the swapped-in HeroIntro island
      // hydrates AFTER page-load, so it captures empty avoid-rects and the
      // aurora never learns the text arrived. Re-assert on the next frame
      // (post-hydration paint) and once more after layout settles (fonts/images
      // can still grow the doc with no resize event).
      if (reduced) {
        cancelAnimationFrame(scrollRaf)
        scrollRaf = requestAnimationFrame(() => {
          scrollRaf = 0
          draw(2.0, true)
        })
        clearTimeout(settleTimer)
        settleTimer = window.setTimeout(() => {
          resize()
          draw(2.0, true)
        }, 900)
      }
    }
    document.addEventListener('astro:page-load', onPageLoad)

    // Pacing.
    // Desktop: while the page is scrolling the painting MUST re-render every
    // vsync tick — a 40fps cap against a 60/120Hz display lands frames at
    // uneven 16/33ms intervals, and for a scroll-locked layer that judder
    // reads as single-digit fps next to the smooth foreground. Idle (twinkle
    // only) keeps the 40fps cap; the boot ignition runs uncapped.
    // Tall/touch: scroll involves NO JS at all — the in-flow canvas is
    // scrolled natively by the compositor. Redraws only animate the twinkle:
    // 20fps, scissored to the visible slice (30fps full-canvas during boot).
    let lastSy = -1
    const render = (now: number) => {
      raf = requestAnimationFrame(render)
      const sy = window.scrollY
      const booting = bootStart >= 0 && now - bootStart < 1900
      if (tall) {
        if (bootStart >= 0 && now - last < (booting ? 33 : 50)) return
      } else {
        if (sy === lastSy && !booting && now - last < frameInterval) return
      }
      last = now
      lastSy = sy
      // layout below can change height (async content); re-measure cheaply.
      // NOTE: no per-frame resize() here — clientWidth/Height reads force
      // layout and the iOS URL-bar animation would thrash the buffer size.
      if (++frame % 40 === 0) {
        measureDoc()
        // tall canvas must physically grow/shrink with the painting
        if (tall && Math.abs(Math.min(skyH * vhRef, PAINT_CAP) - paintPx) > 2) {
          resize()
          draw((now - start) / 1000, true)
          return
        }
      }
      // first draw and boot-window draws paint the WHOLE canvas (so rows
      // outside the slice end up fully lit); steady state draws the slice
      draw((now - start) / 1000, booting || bootStart < 0)
    }

    // reduced motion: frozen time, but keep the sky world-anchored on scroll —
    // the tall in-flow canvas needs nothing (a complete static painting that
    // scrolls natively); desktop re-renders at the new offset
    let scrollRaf = 0
    const onScrollReduced = () => {
      if (scrollRaf) return
      scrollRaf = requestAnimationFrame(() => {
        scrollRaf = 0
        draw(2.0)
      })
    }

    // pause the WebGL loop while the tab is backgrounded (rAF already throttles
    // in hidden tabs, but this stops the draw calls entirely)
    let paused = false
    const onVisibility = () => {
      if (reduced) return
      if (document.hidden && !paused) {
        paused = true
        cancelAnimationFrame(raf)
      } else if (!document.hidden && paused) {
        paused = false
        last = performance.now() // don't force an immediate frame after resume
        raf = requestAnimationFrame(render)
      }
    }
    document.addEventListener('visibilitychange', onVisibility)

    if (reduced) {
      draw(2.0, true)
      // this first draw can run before HeroIntro's reduced-motion effect has
      // painted its (static) text, capturing empty avoid rects — redraw once
      // on the next frame so the aurora quiet zone sees the real glyphs
      scrollRaf = requestAnimationFrame(() => {
        scrollRaf = 0
        draw(2.0, true)
      })
      // fonts/images can grow the document after load with no resize event;
      // with no render loop AND (in tall mode) no scroll listener, the canvas
      // height and aurora avoid-rects would otherwise stay frozen — a seam at
      // the sky's bottom edge, or scrollHeight extending past the footer, the
      // class of bug tall mode must never reintroduce. One settled re-measure.
      settleTimer = window.setTimeout(() => {
        resize()
        draw(2.0, true)
      }, 900)
      if (!tall) window.addEventListener('scroll', onScrollReduced, { passive: true })
    } else {
      raf = requestAnimationFrame(render)
    }

    return () => {
      cancelAnimationFrame(raf)
      cancelAnimationFrame(scrollRaf)
      clearTimeout(settleTimer)
      window.removeEventListener('scroll', onScrollReduced)
      window.removeEventListener('resize', onResize)
      document.removeEventListener('astro:page-load', onPageLoad)
      document.removeEventListener('visibilitychange', onVisibility)
      gl.deleteProgram(prog)
      gl.deleteShader(vs)
      gl.deleteShader(fs)
      gl.deleteBuffer(buf)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      // desktop: fixed + 100lvh (large viewport) — constant size while the
      // address bar collapses, so scrolling never resizes the buffer. On touch
      // devices resize() overrides position/top/height inline: the canvas
      // becomes the whole painting, absolute in the document flow, scrolled
      // natively by the compositor (`tall`).
      // opacity-0: born invisible over the CSS .sky-fallback; the first drawn
      // WebGL frame fades it in (see `revealed` in draw)
      className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-lvh w-full opacity-0 transition-opacity duration-700 ease-out"
      aria-hidden="true"
    />
  )
}
