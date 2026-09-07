/** Browser preference, explicit reading choices and static fallback contracts. */
export async function testLanguage(browser, BASE, check) {
  const ctx = await browser.newContext({ locale: 'zh-TW', viewport: { width: 393, height: 852 }, isMobile: true, hasTouch: true })
  await ctx.addInitScript(() => {
    // The old implementation auto-saved EN; it must not mask browser Chinese.
    localStorage.setItem('blog-lang', 'en')
    window.__languageSwaps = []
    document.addEventListener('DOMContentLoaded', () => {
      window.__firstLanguage = document.documentElement.dataset.uiLang
      window.__firstDocumentLanguage = document.documentElement.lang
      window.__firstHeading = document.querySelector('main h1')?.innerText
    })
    document.addEventListener('astro:after-swap', () => {
      window.__languageSwaps.push(document.documentElement.dataset.contentLang)
    })
  })
  const page = await ctx.newPage()
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  const settle = async () => {
    await page.waitForTimeout(1100)
  }
  try {
    await page.goto(BASE + '/blog', { waitUntil: 'networkidle' })
    check('language: Chinese is selected before the first body paint', await page.evaluate(() => window.__firstLanguage === 'zh' && window.__firstDocumentLanguage === 'zh-Hans' && window.__firstHeading === '文章'))
    check('language: automatic preference does not become a saved override', await page.evaluate(() => localStorage.getItem('site-language') === null))
    check('language: Chinese index links directly to Chinese articles', await page.locator('a[data-bilingual]').evaluateAll(links => links.every(link => link.getAttribute('href').endsWith('/zh'))))
    check('language: narrow Chinese navigation fits the viewport', await page.locator('[data-nav]').evaluate(nav => nav.getBoundingClientRect().left >= 0 && nav.getBoundingClientRect().right <= innerWidth))
    await page.locator('[data-blog-card="ai-image-provenance"] a').click()
    await page.waitForURL('**/ai-image-provenance/zh')
    await settle()
    check('language: article and document retain the content language', await page.locator('html').getAttribute('lang') === 'zh' && await page.locator('article').getAttribute('lang') === 'zh')
    await page.locator('article a[href="/blog"]').press('Enter')
    await page.waitForURL('**/blog')
    await settle()
    check('language: Chinese return retains the originating card', await page.evaluate(() => document.activeElement.closest('[data-blog-card]')?.dataset.blogCard === 'ai-image-provenance'))

    // An ordinary internal primary link also follows the preference before
    // capture; no intermediate English article is ever swapped into view.
    await page.evaluate(() => {
      const link = document.createElement('a')
      link.href = '/blog/ai-image-provenance?via=related#language-test'
      link.textContent = 'Related article'
      link.id = 'language-related'
      document.querySelector('main').prepend(link)
      window.__languageSwaps = []
    })
    await page.locator('#language-related').click()
    await page.waitForURL('**/ai-image-provenance/zh/?via=related#language-test')
    await settle()
    check('language: client navigation selects the translation before swap', await page.evaluate(() => window.__languageSwaps.length === 1 && window.__languageSwaps[0] === 'zh'))
    await page.locator('article a[data-language-link="en"]').first().click()
    await page.waitForURL('**/ai-image-provenance')
    await settle()
    check('language: explicit English stays English without a redirect loop', await page.locator('html').getAttribute('lang') === 'en' && await page.evaluate(() => localStorage.getItem('site-language') === 'en'))
    await page.locator('[data-nav-key="projects"]').click()
    await page.waitForURL('**/projects')
    await settle()
    await page.reload({ waitUntil: 'networkidle' })
    check('language: manual choice survives route changes and reload', await page.locator('main h1').innerText() === 'Things I work on')
    await page.locator('[data-ui-language-toggle]').click()
    check('language: global choice updates hydrated project descriptions', (await page.locator('main').innerText()).includes('通过语音与 LLM 自然对话'))
    await page.locator('[data-nav-key="home"]').click()
    await page.waitForURL(BASE + '/')
    await settle()
    await page.keyboard.press('Escape')
    check('language: authored hero remains English under Chinese UI', await page.locator('main h1').innerText().then(text => text.includes('Yi-Ting Chiu')) && await page.locator('main section').getAttribute('lang') === 'en')
    check('language: no runtime errors or hydration failures', errors.length === 0, errors.join('; '))
  } finally {
    await ctx.close()
  }

  const direct = await browser.newContext({ locale: 'zh-CN' })
  const directPage = await direct.newPage()
  try {
    await directPage.goto(BASE + '/blog/ai-image-provenance?via=shared#source', { waitUntil: 'domcontentloaded' })
    await directPage.waitForURL('**/ai-image-provenance/zh/?via=shared#source')
    check('language: direct primary URL selects Chinese on the current origin', new URL(directPage.url()).origin === new URL(BASE).origin && await directPage.locator('article').getAttribute('lang') === 'zh')
  } finally { await direct.close() }

  const blocked = await browser.newContext({ locale: 'zh-CN' })
  await blocked.addInitScript(() => {
    Object.defineProperty(navigator, 'languages', { value: ['ja-JP', 'zh-CN', 'en-US'] })
    Storage.prototype.getItem = Storage.prototype.setItem = () => { throw new DOMException('Storage blocked', 'SecurityError') }
  })
  const blockedPage = await blocked.newPage()
  try {
    await blockedPage.goto(BASE + '/projects', { waitUntil: 'networkidle' })
    check('language: first supported browser language works with storage blocked', await blockedPage.locator('main h1').innerText() === '我在做的项目')
    await blockedPage.locator('[data-ui-language-toggle]').click()
    await blockedPage.locator('[data-nav-key="blog"]').click()
    await blockedPage.waitForURL('**/blog')
    await blockedPage.waitForTimeout(700)
    check('language: manual choice works in memory when storage is blocked', await blockedPage.locator('main h1').innerText() === 'Writings')
  } finally { await blocked.close() }

  const english = await browser.newContext({ locale: 'en-US' })
  const englishPage = await english.newPage()
  try {
    await englishPage.goto(BASE + '/blog/ai-image-provenance/zh', { waitUntil: 'networkidle' })
    check('language: an explicit shared Chinese URL remains Chinese', await englishPage.locator('article').getAttribute('lang') === 'zh' && await englishPage.locator('[data-nav-key="projects"]').innerText() === 'Projects')
  } finally { await english.close() }
}
