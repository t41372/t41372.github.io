/** User-visible navigation contracts, independent of the animation implementation. */
export async function testNavigation(browser, BASE, check) {
  for (const mobile of [false, true]) {
    const ctx = await browser.newContext({ viewport: mobile ? { width: 393, height: 852 } : { width: 1280, height: 800 }, isMobile: mobile, hasTouch: mobile })
    await ctx.addInitScript(() => {
      window.__loaded = 0
      document.addEventListener('astro:page-load', () => window.__loaded++)
      document.addEventListener('astro:before-preparation', () => {
        window.__departingY = scrollY
      })
      const start = document.startViewTransition?.bind(document)
      if (start) document.startViewTransition = update => {
        const transition = start(update)
        window.__lastViewTransition = transition
        return transition
      }
    })
    const page = await ctx.newPage()
    const errors = []
    page.on('pageerror', e => errors.push(e.message))
    const go = async action => {
      const before = await page.evaluate(() => window.__loaded)
      await action()
      await page.waitForFunction(before => window.__loaded > before, before)
      // page-load can precede ready; an empty animation list at that point
      // does not mean that the transition overlay has finished intercepting input.
      await page.evaluate(() => window.__lastViewTransition?.finished)
    }
    const label = mobile ? 'mobile' : 'desktop'
    await page.goto(BASE + '/blog', { waitUntil: 'networkidle' })
    await page.keyboard.press('Tab')
    check(`${label}: initial Tab reaches the main navigation`, await page.evaluate(() => document.activeElement.getAttribute('data-nav-key') === 'home'))
    await page.evaluate(() => {
      window.__canvas = document.querySelector('canvas')
      window.__header = document.querySelector('header')
      window.__footer = document.querySelector('[aria-label="Footer"]')
    })
    const card = page.locator('main a[data-bilingual]').nth(1)
    await card.scrollIntoViewIfNeeded()
    const y = await page.evaluate(() => scrollY)
    const href = await card.getAttribute('href')
    await go(() => card.click())
    check(`${label}: article opens at top with readable text`, await page.evaluate(() => scrollY < 2 && document.querySelector('article h1').textContent.length > 10))
    await go(() => page.goBack())
    check(`${label}: Back restores list position and originating link`, await page.evaluate(({ y, href }) => Math.abs(scrollY - y) < 3 && document.activeElement.getAttribute('href') === href, { y, href }))
    await go(() => card.click())
    // The browser can align a partly-visible card before activating the link.
    // Restore that actual departure position, not an earlier visit's offset.
    const returnY = await page.evaluate(() => window.__departingY)
    // Already on screen. Direct input avoids the driver's scrollIntoView
    // retries while the article's independent content reveal is settling.
    const back = await page.locator('article a[href="/blog"]').boundingBox()
    await go(() => mobile
      ? page.touchscreen.tap(back.x + back.width / 2, back.y + back.height / 2)
      : page.mouse.click(back.x + back.width / 2, back.y + back.height / 2))
    const restoredY = await page.evaluate(() => scrollY)
    check(`${label}: explicit return restores list position`, Math.abs(restoredY - returnY) < 3, `restored=${restoredY} departure=${returnY}`)
    await go(() => card.click())
    await go(() => page.locator('article a').filter({ hasText: /^中文$/ }).click())
    check(`${label}: Chinese article uses correct document language`, await page.locator('html').getAttribute('lang') === 'zh')
    await go(() => page.locator('article a[href="/blog"]').press('Enter'))
    check(`${label}: language change preserves keyboard return to the originating card`, await page.evaluate(() => document.activeElement.closest('[data-blog-card]')?.getAttribute('data-blog-card') === 'ai-image-provenance' && document.activeElement.getAttribute('href')?.endsWith('/zh')))
    await page.locator('[data-blog-lang-toggle] button[data-lang="en"]').click()
    await go(() => page.locator('a[data-nav-key="projects"]').click())
    const preview = page.getByRole('button', { name: 'Preview Open-LLM-VTuber', exact: true })
    await preview.scrollIntoViewIfNeeded()
    await preview.click()
    const dialog = page.getByRole('dialog', { name: 'Open-LLM-VTuber', exact: true })
    await dialog.waitFor()
    await page.waitForTimeout(500)
    check(`${label}: prebuilt project dialog opens with repository link`, await dialog.locator('a[href="https://github.com/Open-LLM-VTuber/Open-LLM-VTuber"]').count() === 1)
    await page.keyboard.press('Escape')
    await dialog.waitFor({ state: 'detached' })
    check(`${label}: Escape returns focus and unlocks scrolling`, await preview.evaluate(el => document.activeElement === el && document.body.style.overflow !== 'hidden'))
    // The data model supports media, but current production cards have none.
    // Insert a video as the modal mounts so native control tab order is tested
    // without publishing a placeholder media item in the project list.
    await page.evaluate(() => {
      const observer = new MutationObserver(() => {
        const panel = document.querySelector('[role="dialog"]')
        if (!panel) return
        const video = document.createElement('video')
        video.controls = true
        video.width = 280
        video.height = 160
        video.dataset.testMedia = ''
        panel.prepend(video)
        observer.disconnect()
      })
      observer.observe(document.body, { childList: true, subtree: true })
    })
    await preview.click()
    await dialog.waitFor()
    await page.waitForTimeout(500)
    check(`${label}: video preview receives initial keyboard focus`, await page.evaluate(() => document.activeElement.matches('video[controls]')))
    await dialog.locator('a[href="https://github.com/Open-LLM-VTuber/Open-LLM-VTuber"]').press('Shift+Tab')
    check(`${label}: reverse Tab reaches video controls`, await page.evaluate(() => document.activeElement.matches('video[controls]')))
    await page.keyboard.press('Escape')
    await dialog.waitFor({ state: 'detached' })
    await go(() => page.locator('a[data-nav-key="home"]').click())
    await page.locator('.cursor-grab').waitFor()
    check(`${label}: original hero layout and typewriter are restored`, await page.locator('main h1').getAttribute('aria-label') === 'Hello! This is Yi-Ting Chiu.' && await page.locator('.type-cursor').count() === 1 && await page.locator('main a').count() === 0)
    await page.keyboard.press('Escape')
    check(`${label}: authored intro can still be skipped`, await page.locator('main h1').textContent().then(s => s.includes('Yi-Ting Chiu')))
    if (!mobile) {
      const drag = page.locator('.cursor-grab')
      const r = await drag.boundingBox()
      await page.mouse.move(r.x + 30, r.y + 20)
      await page.mouse.down()
      await page.mouse.move(r.x + 210, r.y + 40, { steps: 8 })
      await page.mouse.up()
      check('hero: original drag interaction moves the intro independently', await drag.evaluate(el => new DOMMatrixReadOnly(getComputedStyle(el).transform).e > 100), await drag.getAttribute('style') ?? '')
    }
    check(`${label}: persistent scene and navigation retain DOM identity`, await page.evaluate(() => window.__canvas === document.querySelector('canvas') && window.__header === document.querySelector('header') && window.__footer === document.querySelector('[aria-label="Footer"]')))
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await go(() => page.locator('a[data-nav-key="blog"]').click())
    check(`${label}: reduced motion leaves visible destination`, await page.locator('main h1').innerText() === 'Writings')
    await go(() => page.locator('a[data-nav-key="home"]').click())
    check(`${label}: returning hero is readable without replay`, await page.locator('main h1').textContent().then(s => s.includes('Yi-Ting Chiu')))
    await go(() => page.locator('a[data-nav-key="blog"]').click())
    await page.emulateMedia({ reducedMotion: 'no-preference' })
    // Slow actual network response: no fade-out before the page is available.
    await page.route('**/archive', async route => { await new Promise(r => setTimeout(r, 700)); await route.continue() })
    const before = await page.evaluate(() => window.__loaded)
    await page.locator('a[href="/archive"]').click()
    await page.waitForTimeout(150)
    check(`${label}: slow response retains readable source`, await page.locator('main h1').innerText() === 'Writings')
    await page.locator('a[data-nav-key="projects"]').click()
    await page.waitForFunction(before => window.__loaded > before && location.pathname === '/projects', before)
    await page.waitForTimeout(900)
    check(`${label}: latest navigation wins`, await page.locator('main h1').innerText() === 'Things I work on')
    check(`${label}: obsolete proxy material layers are gone`, await page.locator('.motion-material, [data-motion-proxy]').count() === 0)
    check(`${label}: no page errors`, errors.length === 0, errors.join('; '))
    await ctx.close()
  }
  const ctx = await browser.newContext({ javaScriptEnabled: false })
  const page = await ctx.newPage()
  await page.goto(BASE + '/')
  check('SSR: hero and navigation work without JS', await page.locator('main h1').textContent().then(s => s.includes('Yi-Ting Chiu')) && await page.locator('a[data-nav-key="blog"]').getAttribute('href') === '/blog')
  await page.goto(BASE + '/projects')
  check('SSR: every project repository remains a real link', await page.locator('main a[href^="https://github.com/"]').count() >= 3)
  await ctx.close()

  // The initial window load can complete while a client fetch is pending.
  // Its page-load event must not consume the new navigation's reading state.
  const raceContext = await browser.newContext()
  await raceContext.addInitScript(() => {
    if (window.top !== window.self) return
    window.__race = { preparation: 0, loaded: 0, swapped: 0, matched: false }
    document.addEventListener('DOMContentLoaded', () => {
      const frame = document.createElement('iframe')
      frame.hidden = true
      frame.src = '/__hold-load'
      document.body.append(frame)
    })
    document.addEventListener('astro:before-preparation', () => {
      window.__race.preparation++
      window.__race.clickY = scrollY
    })
    document.addEventListener('astro:page-load', () => window.__race.loaded++)
    document.addEventListener('astro:after-swap', () => window.__race.swapped++)
    document.addEventListener('astro:before-swap', e => {
      window.__raceTransition = e.viewTransition
      window.__race.matched = document.querySelector('[data-blog-card="sleep-is-an-extreme-sport"]')?.style.viewTransitionName === 'blog-surface'
      if (e.from.pathname.replace(/\/$/, '') === '/blog') window.__race.departureY = scrollY
    })
  })
  const racePage = await raceContext.newPage()
  let releaseLoad, releaseDestination
  const holdLoad = new Promise(resolve => { releaseLoad = resolve })
  const holdDestination = new Promise(resolve => { releaseDestination = resolve })
  await racePage.route('**/__hold-load', async route => { await holdLoad; await route.fulfill({ body: '<html></html>', contentType: 'text/html' }) })
  await racePage.route(url => url.pathname.replace(/\/$/, '') === '/blog/sleep-is-an-extreme-sport', async route => {
    if (route.request().resourceType() === 'fetch') await holdDestination
    await route.continue()
  })
  try {
    await racePage.goto(BASE + '/blog', { waitUntil: 'domcontentloaded' })
    await racePage.locator('[data-blog-card="sleep-is-an-extreme-sport"] a').press('Enter', { noWaitAfter: true })
    await racePage.waitForFunction(() => window.__race.preparation === 1)
    releaseLoad()
    await racePage.waitForFunction(() => window.__race.loaded === 1 && window.__race.swapped === 0)
    await racePage.mouse.wheel(0, 250)
    await racePage.waitForFunction(() => scrollY > window.__race.clickY + 100)
    await racePage.waitForTimeout(250)
    releaseDestination()
    await racePage.waitForURL('**/blog/sleep-is-an-extreme-sport')
    await racePage.waitForFunction(() => window.__race.swapped === 1)
    check('slow initial load does not erase an in-flight card transition', await racePage.evaluate(() => window.__race.matched))
    await racePage.evaluate(() => window.__raceTransition.finished)
    const departureY = await racePage.evaluate(() => window.__race.departureY)
    await racePage.goBack()
    await racePage.waitForURL('**/blog')
    // History updates the URL before Astro fetches and swaps the destination.
    await racePage.waitForFunction(() => window.__race.swapped === 2 && window.__race.loaded === 3)
    await racePage.evaluate(() => window.__raceTransition.finished)
    const returnedY = await racePage.evaluate(() => scrollY)
    check('return restores the position left after scrolling during a slow fetch', Math.abs(returnedY - departureY) < 3, `returned=${returnedY} departure=${departureY}`)
  } finally {
    releaseLoad()
    releaseDestination()
    await raceContext.close()
  }
}
