import sharp from 'sharp'

/** Rendered pixels, snapshot geometry and scroll-before-capture regressions. */
export async function testGlass(browser, BASE, check) {
  const ctx = await browser.newContext({ viewport: { width: 1100, height: 800 } })
  const page = await ctx.newPage()
  const errors = []
  page.on('pageerror', e => errors.push(e.message))
  const sd = async png => (await sharp(png).stats()).channels[0].stdev
  for (const [path, selector] of [['/blog', '[data-blog-card]'], ['/projects', '[data-slot="card"]'], ['/blog/opus-gpt-gemini-field-notes', '[data-blog-article]']]) {
    await page.goto(BASE + path, { waitUntil: 'networkidle' })
    await page.addStyleTag({ content: 'body::before{content:"";position:fixed;inset:0;z-index:15;background:repeating-conic-gradient(#fff 0% 25%,#000 0% 50%) 0 0/8px 8px;pointer-events:none}' })
    for (const target of [selector, '[data-nav]']) {
      const r = await page.locator(target).first().boundingBox()
      const clip = target === '[data-nav]' ? { x: Math.round(r.x + 8), y: Math.round(r.y + 22), width: 12, height: 12 }
        : { x: Math.round(r.x + 8), y: Math.round(r.y + 65), width: 10, height: 24 }
      const blurred = await sd(await page.screenshot({ clip }))
      const control = await page.addStyleTag({ content: `${target}{-webkit-backdrop-filter:none!important;backdrop-filter:none!important}` })
      const raw = await sd(await page.screenshot({ clip }))
      await control.evaluate(el => el.remove())
      check(`glass pixels: ${path} ${target}`, raw > 15 && blurred < raw * 0.3, `blur σ=${blurred.toFixed(1)} control σ=${raw.toFixed(1)}`)
    }
  }
  await page.goto(BASE + '/blog', { waitUntil: 'networkidle' })
  await page.evaluate(() => {
    const start = document.startViewTransition.bind(document)
    document.startViewTransition = update => {
      const vt = start(update)
      window.__transition = vt
      vt.ready.then(() => {
        window.__parts = document.getAnimations().filter(a => a.effect?.pseudoElement)
        for (const a of window.__parts) { a.pause(); a.currentTime = 50 }
        window.__captured = true
      })
      return vt
    }
  })
  const source = await page.locator('[data-blog-card]').first().boundingBox()
  await page.locator('main a[data-bilingual]').first().click()
  await page.waitForFunction(() => window.__captured)
  const transition = await page.evaluate(() => {
    const group = getComputedStyle(document.documentElement, '::view-transition-group(blog-surface)')
    const target = document.querySelector('[data-blog-article]').getBoundingClientRect()
    return { h: parseFloat(group.height), y: new DOMMatrixReadOnly(group.transform).f, targetH: target.height, targetY: target.y,
      surfacePair: ['old', 'new'].every(state => window.__parts.some(a => a.effect.pseudoElement === `::view-transition-${state}(blog-surface)`)),
      rootOld: getComputedStyle(document.documentElement, '::view-transition-old(root)').display,
      rootBlend: getComputedStyle(document.documentElement, '::view-transition-old(root)').mixBlendMode }
  })
  check('blog: the selected card and article share an interpolated surface', transition.surfacePair && transition.h > source.height + 1 && transition.h < transition.targetH - 1 && transition.y < source.y && transition.y > transition.targetY, JSON.stringify(transition))
  check('scene: old background remains in additive transition', transition.rootOld !== 'none' && transition.rootBlend === 'plus-lighter', JSON.stringify(transition))
  await page.evaluate(() => window.__parts.forEach(a => a.finish()))
  await page.evaluate(() => window.__transition.finished)

  // From a scrolled reading position, the old scene remains captured while the
  // destination scroll/sky are settled before ready. No page-load scroll patch.
  await page.evaluate(() => { window.scrollTo({ top: 700, behavior: 'instant' }); window.__captured = false })
  await page.locator('[data-nav-key="projects"]').click()
  await page.waitForFunction(() => window.__captured)
  check('scrolled tab change: destination scroll is settled before reveal', await page.evaluate(() => scrollY === 0))
  check('scrolled tab change: both background snapshots participate', await page.evaluate(() => ['old', 'new'].every(state => window.__parts.some(a => a.effect.pseudoElement === `::view-transition-${state}(root)`))))
  await page.evaluate(() => window.__parts.forEach(a => a.finish()))
  await page.evaluate(() => window.__transition.finished)
  check('glass / shared transitions: no page errors', errors.length === 0, errors.join('; '))
  await ctx.close()
}
