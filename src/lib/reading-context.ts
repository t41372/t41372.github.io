import type { TransitionBeforePreparationEvent, TransitionBeforeSwapEvent } from 'astro:transitions/client'
import { BLOG_SURFACE_DURATION_MS, EASE_OUT_CSS } from './ease'

type ReadingContext = { y: number; card?: string }

/** Astro owns routing and native transitions. This adapter restores reading
 * context, assigns actual surface/copy snapshots and stages article reveals. */
export function initReadingContext() {
  const contexts = new Map<string, ReadingContext>()
  const path = (url: URL) => url.pathname.replace(/\/$/, '') || '/'
  let pending: { signal: AbortSignal; restore?: ReadingContext; shared?: boolean; swapped?: boolean; returnReveal?: boolean } | undefined
  let swappingSignal: AbortSignal | undefined
  let transition: ViewTransition | undefined
  let generation = 0
  let reveals: Animation[] = []
  const clearNames = (doc: Document) => {
    for (const el of doc.querySelectorAll<HTMLElement>('[data-transition-part]')) {
      el.style.removeProperty('view-transition-name')
      el.style.removeProperty('view-transition-class')
      delete el.dataset.transitionPart
    }
  }
  const name = (el: HTMLElement | null, value: string) => {
    if (!el) return
    el.style.viewTransitionName = value
    el.dataset.transitionPart = value
  }
  const match = (doc: Document, key: string) => {
    const article = doc.querySelector<HTMLElement>('[data-blog-article]')
    const surface = article?.dataset.blogArticle === key ? article
      : doc.querySelector<HTMLElement>(`[data-blog-card="${CSS.escape(key)}"]`)
    if (!surface) return
    name(surface, 'blog-surface')
    name(surface.querySelector<HTMLElement>('[data-blog-copy]'), article ? 'blog-article-copy' : 'blog-list-copy')
  }
  const namePageContent = (phase: 'out' | 'in', returnReveal = false) => {
    // Name actual glass surfaces, never their ancestors. Each page has its
    // own copy/surface snapshots so tab labels cannot double-expose in root.
    // Only what is on screen gets a snapshot of its own: every named element
    // is captured at full size, and a long page of offscreen cards stalled
    // frames during capture. Offscreen content stays in the root snapshot,
    // where it is invisible anyway. Runs on the live, laid-out document.
    // Batch all rect reads before style/attribute writes to avoid O(N^2) reflows.
    const vh = innerHeight
    const candidates = [...document.querySelectorAll<HTMLElement>('main .glass-surface, [data-page-intro], [data-page-tail]')]
      .filter(el => !el.dataset.transitionPart)
    const visible = candidates.filter(el => {
      const rect = el.getBoundingClientRect()
      return rect.bottom > 0 && rect.top < vh
    })
    visible.forEach((el, index) => {
      name(el, `page-${phase}-${index}`)
      const glass = el.classList.contains('glass-surface')
        ? (el.hasAttribute('data-blog-article') ? ' page-glass-lg' : ' page-glass')
        : ''
      const step = phase === 'in' && !returnReveal && index > 0
        ? ` page-step-${Math.min(index, 3)}`
        : ''
      // A shrinking article passes over neighboring list rows. Reveal them
      // only near the end of the contraction, once that area is uncovered.
      el.style.viewTransitionClass = (returnReveal ? 'page-content page-in page-return' : `page-content page-${phase}${step}`) + glass
    })
  }
  // Browsers hit-test a captured nav as the transition root, even with
  // pointer-events:none on its snapshots. The persistent nav never changes
  // position, so forward that real click to its semantic link or language button. This keeps
  // Astro's normal navigation/cancellation and modifier-key behavior.
  document.addEventListener('click', event => {
    if (!transition || event.target !== document.documentElement || event.defaultPrevented || event.button !== 0) return
    for (const link of document.querySelectorAll<HTMLElement>('[data-nav] a, [data-nav] button')) {
      const r = link.getBoundingClientRect()
      if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) continue
      event.preventDefault()
      link.dispatchEvent(new MouseEvent('click', {
        bubbles: true, cancelable: true, view: window, button: event.button,
        clientX: event.clientX, clientY: event.clientY,
        ctrlKey: event.ctrlKey, metaKey: event.metaKey, shiftKey: event.shiftKey, altKey: event.altKey,
      }))
      break
    }
  })
  document.addEventListener('astro:before-preparation', event => {
    const e = event as TransitionBeforePreparationEvent
    generation++
    reveals.forEach(animation => animation.cancel())
    reveals = []
    const from = path(e.from), to = path(e.to)
    const link = e.sourceElement?.closest('a')
    const card = link?.closest<HTMLElement>('[data-blog-card]')?.dataset.blogCard
    contexts.set(from, { y: scrollY, card: card ?? contexts.get(from)?.card })
    const returning = from.startsWith('/blog/') && to === '/blog'
    const samePost = from.startsWith('/blog/') && from.replace(/\/(en|zh)$/, '') === to.replace(/\/(en|zh)$/, '')
    const current: NonNullable<typeof pending> = { signal: e.signal, restore: returning ? contexts.get('/blog') : samePost ? contexts.get(from) : undefined, shared: false }
    pending = current
    const loader = e.loader
    e.loader = async () => {
      await loader()
      if (e.signal.aborted || pending !== current) return
      clearNames(document)
      clearNames(e.newDocument)
      const outgoing = document.querySelector<HTMLElement>('[data-blog-article]')
      const incoming = e.newDocument.querySelector<HTMLElement>('[data-blog-article]')
      const key = incoming?.dataset.blogArticle ?? outgoing?.dataset.blogArticle
      if (outgoing && incoming) {
        // Language changes keep their own layout. Sharing the copy would
        // stretch one language's text to fit the other language's dimensions.
        name(outgoing.querySelector('[data-blog-copy]'), 'blog-outgoing-copy')
        name(incoming.querySelector('[data-blog-copy]'), 'blog-article-copy')
      } else if (key && document.querySelector(`[data-blog-card="${CSS.escape(key)}"], [data-blog-article="${CSS.escape(key)}"]`)
        && e.newDocument.querySelector(`[data-blog-card="${CSS.escape(key)}"], [data-blog-article="${CSS.escape(key)}"]`)) {
        current.shared = true
        match(document, key)
        match(e.newDocument, key)
      }
      namePageContent('out')
      // Incoming content is named after the swap, once it has layout.
      current.returnReveal = !!(current.shared && outgoing)
    }
  })
  document.addEventListener('astro:before-swap', event => {
    const e = event as TransitionBeforeSwapEvent
    transition = e.viewTransition
    swappingSignal = e.signal
    // The source stays scrollable during a slow fetch. Remember the position
    // actually being left, after the old snapshot and just before the swap.
    const outgoingContext = contexts.get(path(e.from))
    if (outgoingContext && !e.signal.aborted) outgoingContext.y = scrollY
    const current = transition
    const currentGeneration = generation
    void current.finished.then(() => {
      // A superseding loader can already have assigned the next names when
      // Astro skips this transition. Its completion must not erase those names.
      if (transition === current) {
        if (generation === currentGeneration) clearNames(document)
        transition = undefined
      }
    }, () => {})
  })
  // Astro has already performed its normal history/top scroll here. Apply
  // explicit return/language context before the new snapshot, never after it.
  document.addEventListener('astro:after-swap', () => {
    if (!pending || pending.signal.aborted || pending.signal !== swappingSignal) return
    pending.swapped = true
    if (pending?.restore && !pending.signal.aborted) {
      window.scrollTo({ top: pending.restore.y, behavior: 'instant' })
    }
    namePageContent('in', pending.returnReveal)
    // Animate only the visible reading blocks, in document order. Content
    // farther down is immediately readable when scrolled into view; no long
    // timer chain and no scroll listener. The new VT copy is live, so these
    // opacity/transform animations also run inside its snapshot.
    const copyRoot = document.querySelector<HTMLElement>('[data-blog-copy]')
    if (!copyRoot) return
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
    // Content has its own quiet reading cadence. Only the glass travels from
    // the selected card; copy appears at its final reading position.
    const lead = pending?.shared ? BLOG_SURFACE_DURATION_MS - 240 : 180
    const vh = innerHeight
    const blocks: HTMLElement[] = []
    for (const el of copyRoot.querySelectorAll<HTMLElement>(
      ':scope > header > *, :scope > .prose-night > *, :scope > footer',
    )) {
      const rect = el.getBoundingClientRect()
      if (rect.top >= vh) break
      if (rect.bottom > 0) blocks.push(el)
    }
    const entering = blocks.map((el, index) => {
      const animation = el.animate([
        { opacity: 0, transform: reduce ? 'none' : 'translateY(12px)' },
        { opacity: 1, transform: 'none' },
      ], { duration: reduce ? 160 : 780, delay: reduce ? 0 : lead + Math.min(index, 7) * 72, easing: EASE_OUT_CSS, fill: 'both' })
      animation.id = 'reading-enter'
      animation.pause()
      animation.currentTime = 0
      void animation.finished.then(() => animation.cancel(), () => {})
      return animation
    })
    reveals = entering
    const play = () => { if (reveals === entering) entering.forEach(animation => animation.play()) }
    if (transition) void transition.ready.then(play, play)
    else play()
  })
  document.addEventListener('astro:page-load', () => {
    // Preserve native hard-load/hash focus and the initial Tab order. Only
    // a client navigation needs an explicit destination focus handoff.
    if (!pending?.swapped || pending.signal.aborted) return
    const restore = pending?.signal.aborted ? undefined : pending?.restore
    // The list rewrites language-specific hrefs before capture. Its logical
    // card id stays stable when the reader changes language inside the article.
    const origin = restore?.card && location.pathname.replace(/\/$/, '') === '/blog'
      ? document.querySelector<HTMLElement>(`[data-blog-card="${CSS.escape(restore.card)}"] a[data-blog-copy]`) : null
    if (origin) origin.focus({ preventScroll: true })
    else {
      const heading = document.querySelector<HTMLElement>('main h1')
      if (heading) { heading.tabIndex = -1; heading.focus({ preventScroll: true }) }
    }
    pending = undefined
  })
}
