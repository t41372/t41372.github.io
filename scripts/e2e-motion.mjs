import { mkdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import sharp from 'sharp'

/** Long articles magnify a captured card border much more than the short
 * photo post. Inspect actual pixels in the first frames, where it is worst. */
export async function testSurfaceBorder(browser, BASE, check) {
  const output = process.env.E2E_ARTIFACT_DIR ?? join(tmpdir(), 'yi-ting-transition-qa')
  await mkdir(output, { recursive: true })
  for (const mobile of [false, true]) {
    const label = mobile ? 'mobile' : 'desktop'
    const ctx = await browser.newContext({ viewport: mobile ? { width: 393, height: 852 } : { width: 1473, height: 1000 }, isMobile: mobile, hasTouch: mobile })
    const page = await ctx.newPage()
    await page.goto(BASE + '/blog', { waitUntil: 'networkidle' })
    await page.locator('[data-blog-card="why-ai-might-destroy-the-world"]').scrollIntoViewIfNeeded()
    await page.evaluate(() => {
      // A flat control makes the border measurable independently of the moving
      // aurora. Keep real card geometry, native snapshots and CSS borders.
      const control = document.createElement('style')
      control.textContent = 'html,body{background:#000!important}canvas,.sky-fallback,[data-blog-copy]{visibility:hidden!important}[data-blog-card],[data-blog-article]{background:#000!important;border-color:#fff!important}::view-transition-group(blog-surface){border-color:#fff!important}'
      document.head.append(control)
      document.addEventListener('astro:before-swap', e => e.newDocument.head.append(control.cloneNode(true)), { once: true })
      const start = document.startViewTransition.bind(document)
      document.startViewTransition = update => {
        const vt = start(update)
        window.__borderTransition = vt
        vt.ready.then(() => queueMicrotask(() => {
          window.__borderParts = document.getAnimations().filter(a => a.effect?.pseudoElement?.startsWith('::view-transition-'))
          window.__borderParts.forEach(a => { a.pause(); a.currentTime = 0 })
          window.__borderReady = true
        }))
        return vt
      }
    })
    // The control hides copy, so activate its real anchor programmatically.
    // Input behavior is covered by testMotion; this is a calibrated paint test.
    await page.locator('[data-blog-card="why-ai-might-destroy-the-world"] a').evaluate(a => a.click())
    await page.waitForFunction(() => window.__borderReady)
    const bands = []
    for (const time of [8, 16, 32, 64, 120, 240]) {
      await page.evaluate(async time => {
        window.__borderParts.forEach(a => { a.currentTime = time })
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))
      }, time)
      const box = await page.evaluate(() => {
        const style = getComputedStyle(document.documentElement, '::view-transition-group(blog-surface)')
        const matrix = new DOMMatrixReadOnly(style.transform)
        return { x: matrix.e, y: matrix.f, width: parseFloat(style.width) }
      })
      const clip = { x: Math.round(box.x + box.width / 2 - 20), y: Math.max(0, Math.floor(box.y) - 2), width: 40, height: 50 }
      // Crop the saved viewport pixels, not a separately resampled browser
      // clip: subpixel edges can otherwise differ from the reviewed image.
      const png = await page.screenshot({ path: `${output}/${label}-long-article-border-${time}.png` })
      const { data, info } = await sharp(png).extract({ left: clip.x, top: clip.y, width: clip.width, height: clip.height }).removeAlpha().raw().toBuffer({ resolveWithObject: true })
      let brightRows = 0
      for (let y = 0; y < info.height; y++) {
        let bright = 0
        for (let x = 0; x < info.width; x++) if (data[(y * info.width + x) * info.channels] > 40) bright++
        if (bright > info.width / 2) brightRows++
      }
      bands.push(brightRows)
    }
    check(`${label}: long article border stays a thin line throughout expansion`, bands.every(rows => rows >= 1 && rows <= 3), `bright rows=${bands.join(',')}`)
    await page.evaluate(() => window.__borderParts.forEach(a => a.finish()))
    await page.evaluate(() => window.__borderTransition.finished)
    await ctx.close()
  }
}

// The previous checks proved that snapshots existed, but missed blurred copy,
// double-exposed tab labels and a sky which jumped before the first new frame.
export async function testMotion(browser, BASE, check) {
  const output = process.env.E2E_ARTIFACT_DIR ?? join(tmpdir(), 'yi-ting-transition-qa')
  await mkdir(output, { recursive: true })
  for (const mobile of [false, true]) {
    const label = mobile ? 'mobile' : 'desktop'
    const ctx = await browser.newContext({ viewport: mobile ? { width: 393, height: 852 } : { width: 1100, height: 800 }, isMobile: mobile, hasTouch: mobile })
    await ctx.addInitScript(() => {
      const readSky = () => {
        const canvas = document.querySelector('canvas')
        const gl = canvas?.getContext('webgl')
        const program = gl?.getParameter(gl.CURRENT_PROGRAM)
        if (!program) return null
        const uniform = name => gl.getUniform(program, gl.getUniformLocation(program, name))
        const rect = canvas.getBoundingClientRect()
        const vh = uniform('uVh') / (canvas.width / rect.width)
        return { top: uniform('uWyTop') + rect.y / vh, height: uniform('uSkyH') }
      }
      window.__readSky = readSky
      window.__pauseMotion = true
      const start = document.startViewTransition.bind(document)
      document.startViewTransition = update => {
        const oldSky = readSky()
        const transition = start(update)
        window.__motionTransition = transition
        window.__motionReady = false
        transition.ready.then(() => queueMicrotask(() => {
          window.__motionParts = document.getAnimations().filter(a => a.effect?.pseudoElement?.startsWith('::view-transition-') || a.id === 'reading-enter')
          if (window.__pauseMotion) {
            for (const animation of window.__motionParts) { animation.pause(); animation.currentTime = 0 }
          }
          window.__skySamples = [{ time: 0, ...oldSky }, { time: 0, ...readSky() }]
          const started = performance.now()
          const sample = () => {
            const elapsed = performance.now() - started
            window.__skySamples.push({ time: elapsed, ...readSky() })
            if (elapsed < 800) requestAnimationFrame(sample)
          }
          requestAnimationFrame(sample)
          window.__motionReady = true
        }))
        return transition
      }
    })
    const page = await ctx.newPage()
    const at = async time => page.evaluate(time => {
      for (const animation of window.__motionParts) animation.currentTime = time
    }, time)
    const finish = async () => {
      await page.evaluate(() => window.__motionParts.forEach(a => a.finish()))
      await page.evaluate(() => window.__motionTransition.finished)
    }
    const ready = () => page.waitForFunction(() => window.__motionReady)
    // Match the recording's returning-Home state; the first-ever authored
    // typewriter performance is covered by e2e-navigation separately.
    await page.goto(BASE + '/', { waitUntil: 'networkidle' })
    await page.keyboard.press('Escape')
    await page.waitForFunction(() => document.querySelector('main h1').textContent.includes('Yi-Ting Chiu'))
    await page.locator('[data-nav-key="blog"]').click()
    await ready()
    await finish()
    await page.evaluate(() => { window.__motionReady = false })
    await page.locator('[data-blog-card="sleep-is-an-extreme-sport"] a').click()
    await ready()
    await page.locator('.prose-night img').evaluate(img => img.decode())
    for (const time of [200, 400, 650, 1000]) {
      await at(time)
      await page.screenshot({ path: `${output}/${label}-article-${time}.png` })
    }
    await at(600)
    const reading = await page.evaluate(() => {
      const opacity = el => Number(getComputedStyle(el).opacity)
      const blocks = window.__motionParts.filter(a => a.id === 'reading-enter').map(a => a.effect.target)
      const style = name => getComputedStyle(document.documentElement, `::view-transition-group(${name})`)
      return { opacities: blocks.map(opacity), copyZ: Number(style('blog-article-copy').zIndex), surfaceZ: Number(style('blog-surface').zIndex), titleScale: document.querySelector('h1').style.viewTransitionName }
    })
    check(`${label}: article reveals from top to bottom above the glass`, reading.copyZ > reading.surfaceZ && reading.opacities.length >= 3 && reading.opacities[0] > reading.opacities.at(-1) + 0.1 && !reading.titleScale, JSON.stringify(reading))
    // Compare high-frequency detail in the photograph during an active native
    // snapshot with the settled photograph. The old glass-overlay defect loses
    // almost all detail here even though computed backdrop-filter is correct.
    await at(1600)
    const r = await page.locator('.prose-night img').boundingBox()
    const clip = { x: Math.round(r.x + r.width * 0.3), y: Math.round(r.y + 30), width: 100, height: 100 }
    const detail = async png => (await sharp(png).greyscale().convolve({ width: 3, height: 3, kernel: [0, -1, 0, -1, 4, -1, 0, -1, 0] }).stats()).channels[0].stdev
    const during = await detail(await page.screenshot({ clip }))
    await finish()
    const after = await detail(await page.screenshot({ clip }))
    check(`${label}: photograph stays sharp inside the transition`, during > after * 0.85, `detail=${during.toFixed(2)} settled=${after.toFixed(2)}`)
    await page.evaluate(() => { window.__pauseMotion = false })

    const skyChange = async (action, name) => {
      await page.evaluate(() => { window.__motionReady = false })
      await action()
      await ready()
      await page.waitForFunction(() => window.__skySamples.at(-1).time >= 800)
      const samples = await page.evaluate(() => window.__skySamples)
      const old = samples[0], first = samples[1], last = samples.at(-1)
      const delta = last.top - old.top
      // SwiftShader uniform reads can stall a frame. Assert an actual
      // intermediate camera, rather than assuming a sample lands at 160ms.
      const middle = samples.slice(2).find(s => {
        const progress = (s.top - old.top) / delta
        return progress > 0.03 && progress < 0.98
      })
      check(`${label}: ${name} sky moves continuously across scroll restoration`, Math.abs(first.top - old.top) < 0.025 && Math.abs(first.height - old.height) < 0.025 && Math.abs(delta) > 0.05 && !!middle, JSON.stringify({ old, first, middle, last }))
    }
    // Use actual navigation controls from a scrolled article, in both directions.
    await page.mouse.wheel(0, 650)
    await page.waitForTimeout(250)
    await skyChange(() => page.goBack(), 'article return')
    await skyChange(() => page.locator('[data-blog-card="sleep-is-an-extreme-sport"] a').click(), 'article entry')
    await page.mouse.wheel(0, 700)
    await page.waitForTimeout(250)
    await skyChange(() => page.locator('[data-nav-key="projects"]').click(), 'scrolled tab')

    await page.evaluate(() => { window.__pauseMotion = true; window.__motionReady = false })
    await page.locator('[data-nav-key="blog"]').click()
    await ready()
    await at(300)
    const tabState = await page.evaluate(() => {
      const opacity = name => Number(getComputedStyle(document.documentElement, `::view-transition-group(${name})`).opacity)
      return { active: document.querySelector('[data-nav] [aria-current="page"]')?.innerText, old: opacity('page-out-0'), next: opacity('page-in-0') }
    })
    check(`${label}: tab state commits before capture and titles do not double-expose`, tabState.active === 'Blog' && tabState.old < 0.01 && tabState.next > 0.2, JSON.stringify(tabState))
    await page.screenshot({ path: `${output}/${label}-tabs-300.png` })
    await finish()
    // Original-video failures also occur with text-only articles and direct
    // article exits. Keep these intermediate frames separate from Sleep QA.
    await page.evaluate(() => { window.__motionReady = false })
    await page.locator('[data-blog-card="ai-image-provenance"] a').click()
    await ready()
    await at(160)
    await page.screenshot({ path: `${output}/${label}-text-article-160.png` })
    await at(750)
    await page.screenshot({ path: `${output}/${label}-text-article-750.png` })
    await finish()
    await page.mouse.wheel(0, 900)
    await page.waitForTimeout(250)
    await page.evaluate(() => { window.__motionReady = false })
    await page.locator('[data-nav-key="home"]').click()
    await ready()
    await at(200)
    const outgoing = await page.evaluate(() => ({
      shared: window.__motionParts.some(a => a.effect?.pseudoElement?.includes('(blog-surface)')),
      opacity: getComputedStyle(document.documentElement, '::view-transition-group(page-out-0)').opacity,
    }))
    check(`${label}: direct article exit removes both slab and its backdrop filter`, !outgoing.shared && Number(outgoing.opacity) === 0, JSON.stringify(outgoing))
    await page.screenshot({ path: `${output}/${label}-article-to-home-200.png` })
    await finish()
    // A real click during each quarter of the material animation must reach
    // the persistent nav, cancel the old transition and leave no stale layer.
    for (const time of [0, 105, 210, 315]) {
      await page.goto(BASE + '/blog', { waitUntil: 'networkidle' })
      await page.locator('[data-blog-card="ai-image-provenance"] a').click()
      await ready()
      await at(time)
      await page.evaluate(() => { window.__pauseMotion = false; window.__motionReady = false })
      // Actual pointer input: native VT hit-testing reports the root for a
      // captured nav. Locator actionability would refuse to send the click.
      const nav = await page.locator('[data-nav-key="projects"]').boundingBox()
      if (mobile) await page.touchscreen.tap(nav.x + nav.width / 2, nav.y + nav.height / 2)
      else await page.mouse.click(nav.x + nav.width / 2, nav.y + nav.height / 2)
      await ready()
      await page.evaluate(() => window.__motionTransition.finished)
      const state = await page.evaluate(() => ({ path: location.pathname, active: document.querySelector('[data-nav] [aria-current="page"]')?.innerText, articles: document.querySelectorAll('[data-blog-article]').length, stale: document.querySelectorAll('[data-transition-part]').length }))
      check(`${label}: tab click interrupts article at ${time}ms`, state.path === '/projects' && state.active === 'Projects' && state.articles === 0 && state.stale === 0, JSON.stringify(state))
    }
    await ctx.close()
  }
}
