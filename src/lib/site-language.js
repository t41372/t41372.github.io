// Inlined in the head: select the language before any body text is painted.
// Keep ordinary SSR content and URLs usable when scripts/storage are blocked.
;(() => {
  if (window.__siteLanguage) {
    window.__siteLanguage.apply(document)
    return
  }
  const KEY = 'site-language'
  const valid = value => value === 'en' || value === 'zh'
  const browserLanguage = () => {
    for (const value of navigator.languages || [navigator.language]) {
      const base = value.toLowerCase().split('-')[0]
      if (valid(base)) return base
    }
    return 'en'
  }
  let language = browserLanguage()
  let explicit = false
  try {
    const saved = localStorage.getItem(KEY)
    if (valid(saved)) { language = saved; explicit = true }
  } catch {}

  const apply = doc => {
    const root = doc.documentElement
    root.dataset.uiLang = language
    root.lang = root.dataset.contentLang || (language === 'zh' ? 'zh-Hans' : 'en')
    for (const link of doc.querySelectorAll('a[data-bilingual]')) {
      const href = link.getAttribute('data-href-' + language)
      if (href) link.setAttribute('href', href)
    }
    for (const button of doc.querySelectorAll('[data-blog-lang-toggle] button[data-lang]')) {
      const on = button.dataset.lang === language
      button.setAttribute('aria-pressed', String(on))
      button.classList.toggle('text-foreground', on)
      button.classList.toggle('text-muted', !on)
    }
  }
  const choose = value => {
    if (!valid(value)) return
    language = value
    explicit = true
    try { localStorage.setItem(KEY, value) } catch {}
    apply(document)
    document.dispatchEvent(new Event('site:language'))
  }
  // The primary EN URL follows a Chinese reader's preference. Explicit /zh
  // URLs keep their content language, including when shared with EN readers.
  const preferredArticle = (doc, url) => {
    if (language !== 'zh' || doc.documentElement.dataset.contentLang !== 'en') return
    const alternate = doc.querySelector('link[rel="alternate"][hreflang="zh"]')
    if (!alternate) return
    // hreflang uses the canonical domain; navigation must stay on the current
    // origin, including the independent github.io mirror and local previews.
    const target = new URL(url)
    target.pathname = new URL(alternate.href).pathname
    return target
  }
  window.__siteLanguage = { apply }
  apply(document)
  const initialTarget = preferredArticle(document, location.href)
  if (initialTarget) {
    document.documentElement.dataset.languageRedirect = ''
    location.replace(initialTarget)
  }

  // Capture precedes Astro's delegated navigation, so an explicit EN link is
  // never redirected back to Chinese and the selection survives reloads.
  document.addEventListener('click', event => {
    if (event.defaultPrevented || event.button !== 0) return
    const target = event.target.closest?.('[data-language-link], [data-ui-language-toggle], [data-blog-lang-toggle] button[data-lang]')
    if (!target) return
    if (!target.dataset.languageLink && (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)) return
    const next = target.dataset.languageLink || target.dataset.lang || (language === 'zh' ? 'en' : 'zh')
    choose(next)
    if (target.hasAttribute('data-ui-language-toggle')) {
      document.querySelector(`a[data-language-link="${next}"]`)?.click()
    }
  }, true)
  // Opening an explicit EN/中文 link in a new tab is still a language choice.
  document.addEventListener('auxclick', event => {
    if (event.defaultPrevented || event.button !== 1) return
    const link = event.target.closest?.('a[data-language-link]')
    if (link) choose(link.dataset.languageLink)
  }, true)
  document.addEventListener('astro:before-preparation', event => {
    const loader = event.loader
    event.loader = async () => {
      await loader()
      if (event.signal.aborted) return
      const target = preferredArticle(event.newDocument, event.to)
      if (target) {
        event.to = target
        await loader()
      }
      if (!event.signal.aborted) apply(event.newDocument)
    }
  })
  document.addEventListener('astro:before-swap', event => apply(event.newDocument))
  document.addEventListener('astro:after-swap', () => apply(document))
  document.addEventListener('astro:page-load', () => apply(document))
  addEventListener('languagechange', () => {
    if (explicit) return
    language = browserLanguage()
    apply(document)
    document.dispatchEvent(new Event('site:language'))
  })
  addEventListener('storage', event => {
    if (event.key !== KEY) return
    language = valid(event.newValue) ? event.newValue : browserLanguage()
    explicit = valid(event.newValue)
    apply(document)
    document.dispatchEvent(new Event('site:language'))
  })
})()
