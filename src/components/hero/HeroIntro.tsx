import { useEffect, useRef } from 'react'

/**
 * HeroIntro — a 1:1 re-port of the old site's hero typing timeline
 * (reference/t41372.github.io-old-version/upper-level.js). Every hand-set
 * delay/speed AND TypeIt's own defaults are reproduced exactly: per-character
 * pace = speed/2 + rand()*speed (TypeIt's lifeLike), deleteSpeed = speed/3,
 * per-action `delay` = a pause AFTER the action, line-1 startDelay 800 /
 * line-2 250 / tech-cycle 800, no hidden nextStringDelay. Imperative DOM (no
 * TypeIt dep — it fights React's vdom and its .destroy() crashes on re-init).
 *
 * Line 1: "Hello!" -> types the literal "./wave.gif" (grey) -> swaps it for the
 *         wave gif -> "This is Yi-Ting Chiu." -> the name gets selected, then
 *         RGB-glitches forever.
 * Line 2: "A weird guy" -> deletes to "A nice guy" -> " (🥲)" ->
 *         " building [fun stuff] with " where "fun stuff" runs a font-iteration
 *         animation -> an endless cycle of tech words, re-flashing "fun stuff"'s
 *         font at set points.
 */

const NAME = 'Yi-Ting Chiu'

// the font-cycle order the old site stepped "fun stuff" through
const FONT_LIST = [
  'PlayfairDisplay-Italic',
  'CascadiaMonoPL-BoldItalic',
  'PlayfairDisplay-BlackItalic',
  'PlayfairDisplay-ExtraBold',
  'Cascadia-Code',
  'PlayfairDisplay-Italic',
  'PlayfairDisplay-Italic',
  'Roboto-ThinItalic',
  'Cascadia-Code',
  'Roboto-Bold',
]

// one full loop of the tech words, with the exact per-word speed/hold the old
// site used; `fun` marks where "fun stuff" re-flashes its font.
type TechStep = {
  word: string
  speed: number
  hold: number
  append?: string
  appendHold?: number
  fun?: 'step' | 'animate'
  gapAfter?: number
}
const TECH_CYCLE: TechStep[] = [
  { word: 'Java', speed: 120, hold: 1200 },
  { word: 'C++', speed: 120, hold: 1200 },
  { word: 'C#', speed: 120, hold: 800 },
  { word: 'Node.js', speed: 100, hold: 1200 },
  { word: 'Express.js', speed: 120, hold: 1200 },
  { word: 'SQLite', speed: 120, hold: 1200, fun: 'step', gapAfter: 2000 },
  { word: 'HTML', speed: 120, hold: 800 },
  { word: 'CSS', speed: 80, hold: 1200 },
  { word: 'JavaScript', speed: 120, hold: 800, fun: 'step' },
  { word: 'Unity', speed: 100, hold: 800 },
  { word: 'WinForm', speed: 80, hold: 500 },
  { word: 'JavaFX', speed: 80, hold: 800 },
  { word: 'AWS', speed: 80, hold: 500 },
  { word: 'Brain', speed: 80, hold: 500, append: '🧠', appendHold: 1200, fun: 'animate' },
]

export default function HeroIntro() {
  const helloRef = useRef<HTMLSpanElement>(null)
  const waveRef = useRef<HTMLSpanElement>(null)
  const thisRef = useRef<HTMLSpanElement>(null)
  const nameRef = useRef<HTMLSpanElement>(null)
  const dotRef = useRef<HTMLSpanElement>(null)
  const curRef = useRef<HTMLSpanElement>(null)
  const l2Ref = useRef<HTMLParagraphElement>(null)
  const l2aRef = useRef<HTMLSpanElement>(null)
  const sadRef = useRef<HTMLElement>(null)
  const l2bRef = useRef<HTMLSpanElement>(null)
  const funRef = useRef<HTMLSpanElement>(null)
  const l2cRef = useRef<HTMLSpanElement>(null)
  const techRef = useRef<HTMLSpanElement>(null)
  const dragRef = useRef<HTMLDivElement>(null)
  const ghostRef = useRef<HTMLDivElement>(null)
  const started = useRef(false)

  useEffect(() => {
    if (started.current) return
    started.current = true

    const el = {
      hello: helloRef.current!,
      wave: waveRef.current!,
      this: thisRef.current!,
      name: nameRef.current!,
      dot: dotRef.current!,
      cur: curRef.current!,
      l2: l2Ref.current!,
      l2a: l2aRef.current!,
      sad: sadRef.current!,
      l2b: l2bRef.current!,
      fun: funRef.current!,
      l2c: l2cRef.current!,
      tech: techRef.current!,
    }

    // reduced motion: paint a sensible final frame, no animation
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.hello.textContent = 'Hello!'
      el.wave.textContent = ' 👋'
      el.this.textContent = 'This is '
      el.name.textContent = NAME
      el.dot.textContent = '.'
      el.l2a.textContent = 'A nice guy'
      el.sad.textContent = ' (🥲)'
      el.l2b.textContent = ' building '
      el.fun.textContent = 'fun stuff'
      el.fun.classList.add('fun-settled')
      el.l2c.textContent = ' with '
      el.tech.textContent = 'LLMs'
      el.cur.remove()
      return
    }

    const ac = new AbortController()
    const { signal } = ac

    const sleep = (ms: number) =>
      new Promise<void>((resolve, reject) => {
        if (signal.aborted) return reject(new Error('aborted'))
        const t = setTimeout(resolve, ms)
        signal.addEventListener('abort', () => {
          clearTimeout(t)
          reject(new Error('aborted'))
        })
      })

    // keep the single cursor right after whatever is being typed
    const putCursor = (node: HTMLElement) => node.after(el.cur)

    // TypeIt's EXACT lifeLike pace: randomInRange(speed, speed/2) reduces to a
    // uniform draw over [0.5x, 1.5x] of the base speed. Deletes default to
    // speed/3. This is the humanization that makes the typing feel alive.
    const paceOnce = (speed: number) => speed / 2 + Math.random() * speed

    const type = async (node: HTMLElement, text: string, speed: number) => {
      putCursor(node)
      for (const ch of text) {
        await sleep(paceOnce(speed))
        node.textContent += ch
      }
    }
    // delete `count` code points (grapheme-safe, so the 🧠 surrogate pair isn't
    // split); TypeIt's deleteSpeed defaults to the instance speed / 3
    const del = async (node: HTMLElement, count: number, speed: number) => {
      putCursor(node)
      const dSpeed = speed / 3
      for (let i = 0; i < count; i++) {
        await sleep(paceOnce(dSpeed))
        const chars = Array.from(node.textContent ?? '')
        chars.pop()
        node.textContent = chars.join('')
      }
    }
    const delAll = (node: HTMLElement, speed: number) =>
      del(node, Array.from(node.textContent ?? '').length, speed)

    let fontIdx = 0
    const nextFont = () => FONT_LIST[fontIdx++ % FONT_LIST.length]!

    // "fun stuff" re-flash while its font steps forward (old funStep/funAnimate:
    // set bg + font, wait 500/2000; clear, wait 1000/1200)
    const funFlash = async (kind: 'step' | 'animate') => {
      el.fun.classList.add('fun-flash')
      if (kind === 'animate') el.fun.classList.add('fun-animate')
      el.fun.style.fontFamily = nextFont()
      await sleep(kind === 'animate' ? 2000 : 500)
      el.fun.classList.remove('fun-flash')
      if (kind === 'animate') el.fun.classList.remove('fun-animate')
      await sleep(kind === 'animate' ? 1200 : 1000)
    }

    const run = async () => {
      // ===== line 1 — TypeIt instance { speed: 120, startDelay: 800 } =====
      await sleep(800)
      await type(el.hello, 'Hello!', 120)
      await sleep(300)
      // "./wave.gif" joke: grey filename @ speed 20 -> 50ms -> swap -> 500ms
      el.wave.classList.add('text-muted-dark')
      await type(el.wave, './wave.gif', 20)
      await sleep(50)
      el.wave.classList.remove('text-muted-dark')
      el.wave.textContent = ''
      const img = document.createElement('img')
      img.src = '/assets/wave.gif'
      img.alt = 'waving hand'
      img.draggable = false // must not hijack the block's pointer-drag
      img.style.cssText =
        'display:inline-block;height:0.9em;width:auto;margin-left:0.18em;vertical-align:-0.08em'
      el.wave.appendChild(img)
      await sleep(500)
      // one .type @120: "This is " + name (continuous), then 1000
      await type(el.this, 'This is ', 120)
      await type(el.name, NAME, 120)
      await sleep(1000)
      await type(el.dot, '.', 120)
      await sleep(900)
      // select (800) -> glitch, kept forever (800) -> unselect (1000)
      el.name.classList.add('name-selected')
      await sleep(800)
      el.name.classList.remove('name-selected')
      el.name.classList.add('text-glitch', 'name-hl')
      await sleep(800)
      el.name.classList.remove('name-hl')
      await sleep(1000)

      // ===== line 2 — new TypeIt instance { speed: 80, startDelay: 250 } =====
      await sleep(250)
      await type(el.l2a, 'A weird guy', 80)
      await sleep(1000)
      await del(el.l2a, 9, 80) // "weird guy" -> "A "
      await sleep(500)
      await type(el.l2a, 'nice guy', 80)
      await sleep(300)
      await type(el.sad, ' (🥲)', 80)
      await sleep(500)
      await type(el.l2b, ' building ', 80)
      await type(el.fun, 'fun stuff', 80)
      await type(el.l2c, ' with ', 80)
      await sleep(500)
      // initial "fun stuff" font-iteration -> settles into icy bold-italic
      // (old: exec animate {500} -> exec settle {1000} -> exec unflash {0})
      el.fun.classList.add('fun-flash', 'fun-animate')
      await sleep(500)
      el.fun.classList.add('fun-settled')
      await sleep(1000)
      el.fun.classList.remove('fun-flash', 'fun-animate')

      // ===== tech cycle — each loop = new instance { speed: 80, startDelay: 800 } =====
      for (;;) {
        await sleep(800)
        for (const step of TECH_CYCLE) {
          await type(el.tech, step.word, step.speed)
          await sleep(step.hold)
          if (step.append) {
            await type(el.tech, step.append, step.speed)
            await sleep(step.appendHold ?? 0)
          }
          if (step.fun) await funFlash(step.fun)
          await delAll(el.tech, 80)
          if (step.gapAfter) await sleep(step.gapAfter)
        }
      }
    }

    run().catch(() => {
      /* aborted on unmount */
    })
    return () => ac.abort()
  }, [])

  // ---- draggable intro ----
  // The whole block can be picked up and dropped anywhere. The drag offset
  // lives on THIS inner layer, never on the `.hero-lag` ancestor — the
  // scroll-driven animation owns that element's transform, so a displaced
  // block still parallaxes (the two transforms compose). The aurora's
  // exclusion zone follows for free: StarSky re-measures the text's client
  // rects every frame, transforms included.
  //
  // "Home" is magnetic: inside SNAP_R the applied offset is the pointer
  // offset scaled by (d/SNAP_R)^2 — a dock-magnet suction, continuous at the
  // radius edge — and releasing inside the radius springs the block back to
  // exactly (0,0). Releasing farther out leaves it where it was dropped. A
  // dashed "home slot" fades in while dragging and brightens when a release
  // would snap. touch-action is pan-y, so phones still scroll normally over
  // the hero; a deliberate sideways drag grabs the block instead.
  useEffect(() => {
    const box = dragRef.current
    const ghost = ghostRef.current
    if (!box || !ghost) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const SNAP_R = 90

    const pos = { x: 0, y: 0 } // applied offset (suction included)
    const raw = { x: 0, y: 0 } // where the pointer alone would put it
    const vel = { x: 0, y: 0 }
    const grab = { x: 0, y: 0 }
    let pointerId: number | null = null
    let raf = 0
    let lastT = 0

    const apply = () => {
      box.style.transform =
        pos.x || pos.y ? `translate3d(${pos.x}px, ${pos.y}px, 0)` : ''
    }
    const ghostShow = (state: 'hidden' | 'marker' | 'armed') => {
      ghost.style.opacity = state === 'hidden' ? '0' : state === 'marker' ? '0.4' : '0.9'
    }

    const suction = () => {
      const d = Math.hypot(raw.x, raw.y)
      const f = d >= SNAP_R ? 1 : (d / SNAP_R) ** 2
      pos.x = raw.x * f
      pos.y = raw.y * f
      return d
    }

    const springHome = () => {
      vel.x = 0
      vel.y = 0
      lastT = performance.now()
      const step = (now: number) => {
        const dt = Math.min((now - lastT) / 1000, 0.032)
        lastT = now
        const K = 180 // stiffness; damping 24 ≈ 0.9 ratio — one soft bounce
        vel.x += (-K * pos.x - 24 * vel.x) * dt
        vel.y += (-K * pos.y - 24 * vel.y) * dt
        pos.x += vel.x * dt
        pos.y += vel.y * dt
        if (Math.hypot(pos.x, pos.y) < 0.5 && Math.hypot(vel.x, vel.y) < 8) {
          pos.x = 0
          pos.y = 0
          raf = 0
          apply()
          return
        }
        apply()
        raf = requestAnimationFrame(step)
      }
      raf = requestAnimationFrame(step)
    }

    // Touch must NEVER start a drag from a vertical gesture — vertical swipes
    // on the hero are page scrolling (touch-action: pan-y backs this up, but
    // we don't rely on browser behavior alone: gesture intent is checked
    // explicitly). A touch drag begins only after ~8px of PREDOMINANTLY
    // HORIZONTAL movement; a vertical start abandons the pointer to the
    // scroller. Mouse/pen drags begin immediately.
    let touchPending = false
    const down = { x: 0, y: 0 }

    // beginDrag is the ONLY place that stops an in-flight spring-home and
    // takes ownership of the position — a touch that turns out to be a
    // vertical scroll never reaches it, so it can't strand the block mid-way
    // home (grab uses the down coords, so the first 8px of intent-detection
    // movement is included and the block doesn't hop on drag start)
    const beginDrag = (e: PointerEvent) => {
      touchPending = false
      cancelAnimationFrame(raf)
      raf = 0
      raw.x = pos.x
      raw.y = pos.y
      grab.x = down.x - raw.x
      grab.y = down.y - raw.y
      box.setPointerCapture(e.pointerId)
      box.style.cursor = 'grabbing'
      document.documentElement.style.cursor = 'grabbing'
    }
    const onDown = (e: PointerEvent) => {
      if (e.button !== 0 || pointerId !== null) return
      pointerId = e.pointerId
      down.x = e.clientX
      down.y = e.clientY
      if (e.pointerType === 'touch') {
        touchPending = true // wait for horizontal intent
      } else {
        beginDrag(e)
        e.preventDefault() // no text selection under a mouse drag
      }
    }
    const onMove = (e: PointerEvent) => {
      if (e.pointerId !== pointerId) return
      if (touchPending) {
        const dx = e.clientX - down.x
        const dy = e.clientY - down.y
        if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return
        if (Math.abs(dx) <= Math.abs(dy)) {
          // vertical intent: this gesture belongs to the page scroll
          touchPending = false
          pointerId = null
          return
        }
        beginDrag(e)
      }
      raw.x = e.clientX - grab.x
      raw.y = e.clientY - grab.y
      const d = suction()
      apply()
      ghostShow(d < 6 ? 'hidden' : d < SNAP_R ? 'armed' : 'marker')
    }
    const onUp = (e: PointerEvent) => {
      if (e.pointerId !== pointerId) return
      pointerId = null
      if (touchPending) {
        // a tap that never became a drag: nothing was grabbed, nothing moves
        touchPending = false
        return
      }
      box.style.cursor = ''
      document.documentElement.style.cursor = ''
      ghostShow('hidden')
      if (Math.hypot(raw.x, raw.y) < SNAP_R) {
        if (reduced) {
          pos.x = 0
          pos.y = 0
          apply()
        } else {
          springHome()
        }
      }
    }
    const onNativeDrag = (e: Event) => e.preventDefault()

    box.addEventListener('pointerdown', onDown)
    box.addEventListener('pointermove', onMove)
    box.addEventListener('pointerup', onUp)
    box.addEventListener('pointercancel', onUp)
    box.addEventListener('dragstart', onNativeDrag)
    return () => {
      cancelAnimationFrame(raf)
      box.removeEventListener('pointerdown', onDown)
      box.removeEventListener('pointermove', onMove)
      box.removeEventListener('pointerup', onUp)
      box.removeEventListener('pointercancel', onUp)
      box.removeEventListener('dragstart', onNativeDrag)
      box.style.cursor = ''
      document.documentElement.style.cursor = ''
    }
  }, [])

  return (
    // outer div stays put (it marks "home"); the inner layer carries the drag
    // transform — see the draggable-intro effect above
    <div className="relative">
      <div
        ref={ghostRef}
        aria-hidden="true"
        className="pointer-events-none absolute -inset-x-5 -inset-y-4 rounded-2xl border border-dashed border-foreground/30 opacity-0 transition-opacity duration-300"
      />
      <div
        ref={dragRef}
        className="flex cursor-grab touch-pan-y flex-col gap-5 text-left select-none"
      >
        {/* data-aurora-avoid: StarSky measures the INLINE CONTENTS of these two
          blocks (Range API) and thins the aurora behind their union — the
          rect tracks the glyphs as the typewriter grows them */}
        <h1
          aria-label="Hello! This is Yi-Ting Chiu."
          className="font-mono text-3xl font-semibold leading-snug tracking-tight text-foreground sm:text-4xl md:text-5xl"
          data-aurora-avoid
        >
          <span ref={helloRef} />
          <span ref={waveRef} />
          <br />
          <span ref={thisRef} />
          {/* inline-block + nowrap: the name must never break mid-word. The
              glitch effect's ::before/::after copies are absolutely
              positioned; over a wrapped (multi-fragment) inline they anchor
              to the first fragment and re-wrap independently — misaligned
              ghost text. As an atomic box the name drops to its own line
              whole, and the copies overlay it exactly. */}
          <span ref={nameRef} data-text={NAME} className="inline-block whitespace-nowrap" />
          <span ref={dotRef} className="text-aurora" />
          <span ref={curRef} className="type-cursor" aria-hidden="true" />
        </h1>

        <p
          ref={l2Ref}
          aria-label="A nice guy building fun stuff."
          className="min-h-14 font-mono text-lg text-muted sm:text-xl md:text-2xl"
          data-aurora-avoid
        >
          <span ref={l2aRef} />
          <small ref={sadRef} className="text-muted-dark" />
          <span ref={l2bRef} />
          <span ref={funRef} className="fun-text" />
          <span ref={l2cRef} />
          <span ref={techRef} className="text-aurora" />
        </p>
      </div>
    </div>
  )
}
