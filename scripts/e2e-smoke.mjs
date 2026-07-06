/**
 * e2e smoke test — `bun run test:e2e`
 *
 * Drives the real site in headless Chrome (desktop + mobile-emulated) and
 * asserts the invariants that have actually broken before:
 *   1. no uncaught page errors on load or navigation
 *   2. the sky canvas renders (WebGL compiled — a bad shader fails silently)
 *   3. mobile: canvas is IN-FLOW and scrolls natively 1:1 with the page
 *      (scripted scroll-followers of a full-screen layer lag mobile WebKit)
 *   4. mobile: canvas bottom never extends past the content bottom, and max
 *      scroll == content height (the "scroll past the footer into raw sky"
 *      feedback-loop regression)
 *   5. nav pill slides ONCE, monotonically (it used to double-slide on iOS)
 *   6. hero text lag + valley layers respond to scroll (parallax active) with
 *      NO after-stop drift (scrub smoothing made the mountains keep floating
 *      after a fling); layers are compositor-promoted to blunt the iOS SVG
 *      re-raster without dropping the effect.
 *   7. desktop: the sky is still LIT (night-sky navy, not cleared black) after
 *      a client-side navigation.
 *
 * PRODUCTION PIPELINE BY DEFAULT. Some regressions exist ONLY in the built
 * output and never against `astro dev` — e.g. Lightning CSS merges an
 * `animation-timeline` longhand into the `animation` shorthand and silently
 * drops the whole scroll-driven-animation declaration (killed the valley
 * parallax in prod only). So this script BUILDS the site (`bun run build`) and
 * serves the real `dist/` via `astro preview` on a free port, then tears the
 * server down on exit.
 *
 * Fast-iteration override — point at an already-running server and skip the
 * build+serve entirely:
 *   E2E_BASE=http://localhost:4321 bun run test:e2e
 * (4321 is astro dev/preview's own default and is already taken by an unrelated
 * server in this environment, which is why the managed preview probes 4322+.)
 * A bare positional URL arg is still honoured too: `bun run test:e2e <url>`.
 *
 * Requires Google Chrome (channel: 'chrome').
 */
import { chromium } from 'playwright-core'
import { spawn } from 'node:child_process'
import net from 'node:net'

const OVER_T = 144 // keep in sync with StarSky.tsx
let failures = 0

// --- server lifecycle -------------------------------------------------------
// probe for a free port at/above `from` (4321 is taken by an unrelated server)
const freePort = (from) =>
  new Promise((resolve) => {
    const srv = net.createServer()
    srv.once('error', () => resolve(freePort(from + 1)))
    srv.listen(from, '127.0.0.1', () => {
      const { port } = srv.address()
      srv.close(() => resolve(port))
    })
  })

const run = (cmd, args) =>
  new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { stdio: 'inherit' })
    p.once('error', reject)
    p.once('exit', (code) =>
      code === 0 ? resolve() : reject(new Error(`${cmd} ${args.join(' ')} exited ${code}`)),
    )
  })

const waitForServer = async (url, tries = 100) => {
  for (let i = 0; i < tries; i++) {
    try {
      if ((await fetch(url)).ok) return
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 200))
  }
  throw new Error(`server at ${url} never became ready`)
}

let preview = null
let BASE = process.env.E2E_BASE ?? process.argv[2]
if (!BASE) {
  await run('bun', ['run', 'build'])
  const port = await freePort(4322)
  BASE = `http://localhost:${port}`
  // stderr inherited so a startup failure is visible; stdout muted to keep the
  // check log clean. Killed on ANY exit path (see the handlers below).
  preview = spawn('bunx', ['astro', 'preview', '--port', String(port)], {
    stdio: ['ignore', 'ignore', 'inherit'],
  })
  const killPreview = () => {
    if (preview && !preview.killed) preview.kill('SIGTERM')
  }
  process.on('exit', killPreview)
  process.on('SIGINT', () => {
    killPreview()
    process.exit(130)
  })
  process.on('SIGTERM', () => {
    killPreview()
    process.exit(143)
  })
  await waitForServer(BASE + '/')
}

const check = (name, ok, detail = '') => {
  console.log(`${ok ? '  ok ' : 'FAIL '} ${name}${detail ? ` — ${detail}` : ''}`)
  if (!ok) failures++
}

const browser = await chromium.launch({
  channel: 'chrome',
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
})

// ---------- mobile (coarse pointer) ----------
{
  const ctx = await browser.newContext({
    viewport: { width: 393, height: 852 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  })
  const page = await ctx.newPage()
  const errs = []
  page.on('pageerror', (e) => errs.push(e.message))
  await page.goto(BASE + '/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(2500)
  // the site sets `html { scroll-behavior: smooth }`, which makes the test's
  // programmatic scrollTo() land non-deterministically (a mid-flight smooth
  // animation gets cancelled by the next call, so samples read stale offsets).
  // Force instant jumps for the test — real users are unaffected. (documentEl
  // is never swapped by swup — only <main> is — so this survives the nav test too.)
  await page.evaluate(() => {
    document.documentElement.style.scrollBehavior = 'auto'
  })

  const info = await page.evaluate(() => {
    const c = document.querySelector('canvas')
    const gl = c?.getContext('webgl')
    return {
      hasCanvas: !!c,
      rendered: c && Number(getComputedStyle(c).opacity) > 0.5, // reveals only after 1st WebGL frame
      position: c && getComputedStyle(c).position,
      canvasH: c ? parseFloat(getComputedStyle(c).height) : 0,
      transform: c?.style.transform || '',
      bodyH: document.body.offsetHeight,
      docH: document.documentElement.scrollHeight,
      vh: innerHeight,
      maxTexture: gl ? gl.getParameter(gl.MAX_TEXTURE_SIZE) : 0,
    }
  })
  check('mobile: WebGL sky rendered', info.hasCanvas && info.rendered)
  check(
    'mobile: canvas is in-flow with no scripted transform',
    info.position === 'absolute' && info.transform === '',
    `pos=${info.position} transform=${info.transform || '(none)'}`,
  )
  check(
    'mobile: canvas bottom never passes the content bottom',
    info.canvasH - OVER_T <= info.bodyH + 1,
    `canvas bottom=${info.canvasH - OVER_T} content=${info.bodyH}`,
  )
  // tall/coarse mode clamps the buffer DPR to 1, so buffer px == css px here;
  // no escape hatch — if a future change lifts the paintPx cap past what the
  // GPU can allocate, this must fail
  check(
    'mobile: canvas buffer under GPU texture limit',
    info.canvasH <= info.maxTexture,
    `canvasH=${info.canvasH} maxTexture=${info.maxTexture}`,
  )

  const rect0 = await page.evaluate(
    () => document.querySelector('canvas').getBoundingClientRect().top,
  )
  await page.evaluate(() => window.scrollTo(0, 999999))
  await page.waitForTimeout(1000)
  const bottom = await page.evaluate(() => ({
    scrollY: Math.round(window.scrollY),
    max: document.documentElement.scrollHeight - innerHeight,
    rectTop: document.querySelector('canvas').getBoundingClientRect().top,
    edgeBg: getComputedStyle(document.documentElement).backgroundColor,
  }))
  check(
    'mobile: cannot scroll past the footer',
    Math.abs(bottom.scrollY - bottom.max) <= 1,
    `scrollY=${bottom.scrollY} max=${bottom.max}`,
  )
  check(
    'mobile: sky scrolls natively 1:1 with the page',
    Math.abs(bottom.rectTop - (rect0 - bottom.scrollY)) <= 1,
    `rectTop=${bottom.rectTop} expect=${rect0 - bottom.scrollY}`,
  )
  // iOS 26+ Liquid Glass derives its toolbar tint from html's background-color
  // (BaseLayout swaps it near the page ends): ground-black at the bottom edge…
  check(
    'mobile: html edge color is ground-black at the page bottom',
    bottom.edgeBg === 'rgb(5, 7, 11)',
    `got ${bottom.edgeBg}`,
  )

  // touch KEEPS the parallax — now a scroll-driven CSS animation (compositor
  // -threaded on Safari 26.4+/Chrome; the transforms live in COMPUTED style,
  // not inline style): valley layers + hero text MUST move with scroll, then
  // settle with NO after-stop drift.
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.waitForTimeout(300)
  const at0 = await page.evaluate(() => ({
    layer: getComputedStyle(document.querySelector('g[data-depth]')).transform,
    hero: getComputedStyle(document.querySelector('.hero-lag')).transform,
    edgeBg: getComputedStyle(document.documentElement).backgroundColor,
  }))
  // …and back to sky-navy everywhere else (top overscroll / status bar)
  check(
    'mobile: html edge color returns to sky-navy at the top',
    at0.edgeBg === 'rgb(11, 19, 57)',
    `got ${at0.edgeBg}`,
  )
  await page.evaluate(() => window.scrollTo(0, 400))
  await page.waitForTimeout(700)
  const at400 = await page.evaluate(() => ({
    layer: getComputedStyle(document.querySelector('g[data-depth]')).transform,
    hero: getComputedStyle(document.querySelector('.hero-lag')).transform,
  }))
  check('mobile: valley parallax active on scroll', at0.layer !== at400.layer, `${at0.layer} -> ${at400.layer}`)
  check('mobile: hero text lag active on scroll', at0.hero !== at400.hero, `${at0.hero} -> ${at400.hero}`)
  // no after-stop drift: a scroll-driven animation is a pure function of the
  // scroll offset — once scrolling stops the transform must be frozen (the
  // old numeric GSAP scrub kept the layers floating after a fling)
  const settled1 = await page.evaluate(() => getComputedStyle(document.querySelector('g[data-depth]')).transform)
  await page.waitForTimeout(500)
  const settled2 = await page.evaluate(() => getComputedStyle(document.querySelector('g[data-depth]')).transform)
  check('mobile: no post-scroll parallax drift', settled1 === settled2, `${settled1} -> ${settled2}`)
  check('mobile: no page errors', errs.length === 0, errs.join('; '))
  await ctx.close()
}

// ---------- desktop ----------
{
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } })
  const page = await ctx.newPage()
  const errs = []
  page.on('pageerror', (e) => errs.push(e.message))
  await page.goto(BASE + '/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(2500)
  await page.evaluate(() => {
    document.documentElement.style.scrollBehavior = 'auto'
  })

  const d = await page.evaluate(() => {
    const c = document.querySelector('canvas')
    return {
      rendered: c && Number(getComputedStyle(c).opacity) > 0.5,
      position: c && getComputedStyle(c).position,
      viewportSized: c && Math.abs(parseFloat(getComputedStyle(c).height) - innerHeight) < 2,
    }
  })
  check('desktop: WebGL sky rendered', d.rendered)
  check('desktop: viewport-sized fixed canvas', d.position === 'fixed' && d.viewportSized)

  // desktop runs the same scroll-driven CSS parallax: the valley layers must
  // still move as you scroll (computed transform — no inline styles anymore)
  const vly0 = await page.evaluate(
    () => getComputedStyle(document.querySelector('g[data-depth]')).transform,
  )
  await page.evaluate(() => window.scrollTo(0, 800))
  await page.waitForTimeout(400)
  const vly1 = await page.evaluate(
    () => getComputedStyle(document.querySelector('g[data-depth]')).transform,
  )
  check('desktop: valley parallax active on scroll', vly0 !== vly1, `${vly0} -> ${vly1}`)
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.waitForTimeout(200)

  // nav pill: must slide once, monotonically, starting promptly after click
  const pillX = () =>
    page.evaluate(() =>
      Math.round(
        new DOMMatrixReadOnly(
          getComputedStyle(document.querySelector('[data-nav-pill]')).transform,
        ).e,
      ),
    )
  const x0 = await pillX()
  // stash the live sky canvas so we can prove swup did NOT re-create it across
  // the navigation (it lives outside the swapped <main> container)
  await page.evaluate(() => {
    window.__skyCanvas = document.querySelector('canvas')
  })
  await page.click('a[data-nav-key="projects"]')
  const samples = []
  for (let i = 0; i < 14; i++) {
    await page.waitForTimeout(90)
    samples.push(await pillX())
  }
  let reversals = 0
  for (let i = 1; i < samples.length - 1; i++) {
    if ((samples[i] - samples[i - 1]) * (samples[i + 1] - samples[i]) < 0) reversals++
  }
  // "prompt response" guards the old bug where the pill didn't move until
  // astro:page-load (~500ms dead button); now it fires on before-preparation.
  // 120ms is the real-hardware target, but headless software-GL starves GSAP's
  // rAF, so we assert it has begun moving within ~540ms (sample 6) — still well
  // inside the old regression, generous enough not to flake on CPU jitter.
  const movedBy = samples.findIndex((x) => x > x0)
  check(
    'nav pill: starts moving promptly (< ~540ms)',
    movedBy >= 0 && movedBy <= 5,
    `movedAtSample=${movedBy} seq=${samples.join(',')}`,
  )
  check('nav pill: single monotonic slide', reversals === 0, samples.join(','))

  // the nav click above navigated / -> /projects via swup. The sky canvas
  // (StarSky island, rendered OUTSIDE <main>) must be the SAME DOM node — swup
  // only swaps <main>, so the WebGL context is never destroyed/re-created.
  const canvasSurvived = await page.evaluate(
    () => !!window.__skyCanvas && document.querySelector('canvas') === window.__skyCanvas,
  )
  check('desktop: sky canvas survives navigation (lives outside the swup container)', canvasSurvived)

  // the sky must still be LIT after the client-side navigation, not cleared to
  // black. Sample the WebGL canvas: drawImage a 64x64 patch from the upper-
  // middle into a 2D canvas and average its pixels. drawImage of a WebGL canvas
  // reads the CLEARED (black) buffer UNLESS preserveDrawingBuffer:true — which
  // StarSky sets — so this doubly confirms the buffer persisted. Headless
  // swiftshader renders the night sky navy (~rgb(24,37,84)): blue dominates red
  // and sits well off black.
  const sky = await page.evaluate(() => {
    const src = document.querySelector('canvas')
    const s = 64
    const off = document.createElement('canvas')
    off.width = s
    off.height = s
    const ctx = off.getContext('2d')
    const sx = Math.floor(src.width / 2 - s / 2)
    const sy = Math.floor(src.height * 0.2) // upper-middle: sky/aurora band
    ctx.drawImage(src, sx, sy, s, s, 0, 0, s, s)
    const { data } = ctx.getImageData(0, 0, s, s)
    let r = 0
    let g = 0
    let b = 0
    const n = data.length / 4
    for (let i = 0; i < data.length; i += 4) {
      r += data[i]
      g += data[i + 1]
      b += data[i + 2]
    }
    return { r: r / n, g: g / n, b: b / n }
  })
  check(
    'desktop: sky still lit after navigation (not black)',
    sky.b > sky.r && sky.b > 15,
    `avg rgb=(${sky.r.toFixed(1)}, ${sky.g.toFixed(1)}, ${sky.b.toFixed(1)})`,
  )

  // island rehydration after a swup swap: the swapped-in /projects <main>
  // contains a GithubStars island (client:visible). Scroll it into view to trip
  // its IntersectionObserver, then confirm it hydrated — Astro strips the `ssr`
  // attribute from an <astro-island> once its client directive fires and React
  // mounts. astro-island present INSIDE <main> AND no `ssr` == the swapped DOM
  // re-ran island hydration (custom-element upgrade), the crux of swup + Astro.
  await page.evaluate(() => {
    document.querySelector('main astro-island')?.scrollIntoView({ block: 'center' })
  })
  await page.waitForTimeout(1500)
  const hydrated = await page.evaluate(() => {
    const island = document.querySelector('main astro-island')
    return { exists: !!island, ssr: island?.hasAttribute('ssr') ?? true }
  })
  check(
    'desktop: swapped-in island rehydrates after navigation',
    hydrated.exists && !hydrated.ssr,
    `exists=${hydrated.exists} ssr=${hydrated.ssr}`,
  )

  // glass cards must not FLASH OUT after fading in on a nav into /blog. The bug:
  // the in-animation drifted <main> (a common ANCESTOR of the frosted post cards)
  // with translateY; a transform on a backdrop-filter element's ancestor makes
  // that ancestor the card's backdrop root, so when the drift was torn down the
  // cards' backdrop-filter re-rasterized and the whole glass subtree blanked for
  // one frame — after it was already visible, cross-browser (a spec-level
  // backdrop-root change, not a GPU quirk, so computed opacity alone never dips).
  // Install a per-frame sampler BEFORE navigating, then assert on the recording:
  //   (a) no ANCESTOR of a glass card (up to <main>) is EVER transformed during
  //       the transition — the direct signature of the bug (fails pre-fix,
  //       where <main> carried translateY for the whole in-animation);
  //   (b) the card's computed opacity does reach ≥0.95 within ~1s and, once it
  //       has, never drops back below 0.8 — guards the sibling failure modes
  //       (a target stranded at 0, or re-pinned after the fade).
  await page.evaluate(() => {
    window.__flash = []
    window.__flashStop = false
    // the OUTGOING page's card matches this selector too (and its OUT animation
    // fades it toward 0). Latch the pre-nav card node and only record once swup
    // has swapped in a DIFFERENT node — so we measure the INCOMING /blog card,
    // not the /projects card leaving.
    const outgoing = document.querySelector('main [class*="backdrop-blur"]')
    const loop = () => {
      if (window.__flashStop) return
      const card = document.querySelector('main [class*="backdrop-blur"]')
      if (card && card !== outgoing) {
        let ancestorTransformed = false
        for (let el = card.parentElement; el; el = el.parentElement) {
          const t = getComputedStyle(el).transform
          if (t && t !== 'none') ancestorTransformed = true
          if (el.tagName === 'MAIN') break
        }
        window.__flash.push({ opacity: +getComputedStyle(card).opacity, ancestorTransformed })
      }
      requestAnimationFrame(loop)
    }
    requestAnimationFrame(loop)
  })
  await page.click('a[data-nav-key="blog"]')
  await page.waitForTimeout(1000)
  const flash = await page.evaluate(() => {
    window.__flashStop = true
    return window.__flash
  })
  const anyAncestorTransform = flash.some((f) => f.ancestorTransformed)
  const reachedAt = flash.findIndex((f) => f.opacity >= 0.95)
  const droppedAfter = reachedAt >= 0 && flash.slice(reachedAt).some((f) => f.opacity < 0.8)
  check(
    'desktop: glass cards never flash out after fade-in',
    !anyAncestorTransform && reachedAt >= 0 && !droppedAfter,
    `ancestorTransformFrames=${flash.filter((f) => f.ancestorTransformed).length} reachedFullAt=${reachedAt} droppedBelow0.8After=${droppedAfter} frames=${flash.length}`,
  )

  check('desktop: no page errors (incl. navigation)', errs.length === 0, errs.join('; '))
  await ctx.close()
}

await browser.close()
console.log(failures === 0 ? '\nall checks passed' : `\n${failures} check(s) FAILED`)
process.exit(failures === 0 ? 0 : 1)
