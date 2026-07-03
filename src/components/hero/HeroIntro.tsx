import { useEffect, useRef, useState } from 'react'

/**
 * HeroIntro — replays the classic two-line intro from the old site
 * with a lightweight hand-rolled typewriter timeline (no TypeIt).
 *
 * Line 1: Hello! [wave] / This is Yi-Ting Chiu.  (name gets selected -> RGB glitch)
 * Line 2: A weird guy -> nice guy (sad) who build fun stuff with [cycling tech words]
 */

const TECH_WORDS = [
  'Python',
  'TypeScript',
  'LLMs',
  'ASR',
  'Rust',
  'Docker',
  'PyTorch',
  'Whisper',
  'Astro',
  'Brain 🧠',
]

const NAME = 'Yi-Ting Chiu'

type NameStage = 'hidden' | 'typing' | 'selected' | 'glitch'

const sleep = (ms: number, signal: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    if (signal.aborted) return reject(new Error('aborted'))
    const t = setTimeout(resolve, ms)
    signal.addEventListener('abort', () => {
      clearTimeout(t)
      reject(new Error('aborted'))
    })
  })

export default function HeroIntro() {
  const [hello, setHello] = useState('')
  const [showWave, setShowWave] = useState(false)
  const [thisIs, setThisIs] = useState('')
  const [nameTyped, setNameTyped] = useState('')
  const [nameStage, setNameStage] = useState<NameStage>('hidden')
  const [showDot, setShowDot] = useState(false)
  const [line2, setLine2] = useState('')
  const [showSad, setShowSad] = useState(false)
  const [line2b, setLine2b] = useState('')
  const [tech, setTech] = useState('')
  const [cursorAt, setCursorAt] = useState<'l1' | 'l2' | 'tech'>('l1')
  const [reduced, setReduced] = useState(false)
  const startedRef = useRef(false)

  useEffect(() => {
    if (startedRef.current) return
    startedRef.current = true

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      // show the final state immediately
      setReduced(true)
      setHello('Hello!')
      setShowWave(true)
      setThisIs('This is ')
      setNameTyped(NAME)
      setNameStage('glitch')
      setShowDot(true)
      setLine2('A nice guy')
      setShowSad(true)
      setLine2b(' who build fun stuff with ')
      setTech('LLMs')
      return
    }

    const ac = new AbortController()
    const signal = ac.signal

    const typeInto = async (
      text: string,
      set: (updater: (prev: string) => string) => void,
      speed = 85,
    ) => {
      for (const ch of text) {
        await sleep(speed + Math.random() * 40, signal)
        set((prev) => prev + ch)
      }
    }

    const deleteFrom = async (
      count: number,
      set: (updater: (prev: string) => string) => void,
      speed = 45,
    ) => {
      for (let i = 0; i < count; i++) {
        await sleep(speed, signal)
        set((prev) => prev.slice(0, -1))
      }
    }

    const run = async () => {
      // ---- line 1 ----
      await sleep(700, signal)
      await typeInto('Hello!', (u) => setHello(u), 110)
      await sleep(400, signal)
      setShowWave(true)
      await sleep(900, signal)
      await typeInto('This is ', (u) => setThisIs(u), 90)
      setNameStage('typing')
      await typeInto(NAME, (u) => setNameTyped(u), 95)
      await sleep(700, signal)
      setShowDot(true)
      // selection flash -> glitch
      await sleep(800, signal)
      setNameStage('selected')
      await sleep(850, signal)
      setNameStage('glitch')

      // ---- line 2 ----
      setCursorAt('l2')
      await sleep(600, signal)
      await typeInto('A weird guy', (u) => setLine2(u), 80)
      await sleep(900, signal)
      await deleteFrom(9, (u) => setLine2(u))
      await sleep(350, signal)
      await typeInto('nice guy', (u) => setLine2(u), 80)
      await sleep(500, signal)
      setShowSad(true)
      await sleep(600, signal)
      await typeInto(' who build fun stuff with ', (u) => setLine2b(u), 55)

      // ---- cycling tech words, forever ----
      setCursorAt('tech')
      let i = 0
      for (;;) {
        const word = TECH_WORDS[i % TECH_WORDS.length]!
        await typeInto(word, (u) => setTech(u), 100)
        await sleep(1400, signal)
        await deleteFrom(word.length, (u) => setTech(u), 50)
        await sleep(500, signal)
        i++
      }
    }

    run().catch(() => {
      /* aborted on unmount */
    })

    return () => ac.abort()
  }, [])

  return (
    <div className="flex flex-col gap-5">
      <h1 className="font-mono text-3xl font-semibold leading-snug tracking-tight text-foreground sm:text-4xl md:text-5xl">
        <span>{hello}</span>
        {showWave && (
          <span className="ml-2 inline-block origin-[70%_70%] animate-[wave_1.8s_ease-in-out_2]" role="img" aria-label="waving hand">
            👋
          </span>
        )}
        <br />
        <span>{thisIs}</span>
        {nameStage !== 'hidden' && (
          <span
            data-text={NAME}
            className={
              nameStage === 'glitch'
                ? 'text-glitch'
                : nameStage === 'selected'
                  ? 'name-selected'
                  : undefined
            }
          >
            {nameTyped}
          </span>
        )}
        {showDot && <span className="text-aurora">.</span>}
        {cursorAt === 'l1' && !reduced && <span className="type-cursor" aria-hidden="true" />}
      </h1>

      <p className="min-h-14 font-mono text-lg text-muted sm:text-xl md:text-2xl">
        <span>{line2}</span>
        {showSad && (
          <small className="text-muted-dark" role="img" aria-label="slightly crying face">
            {' (🥲)'}
          </small>
        )}
        <span>{line2b}</span>
        <span className="text-aurora">{tech}</span>
        {cursorAt !== 'l1' && !reduced && <span className="type-cursor" aria-hidden="true" />}
      </p>

      <style>{`
        @keyframes wave {
          0%, 100% { transform: rotate(0deg); }
          20% { transform: rotate(18deg); }
          40% { transform: rotate(-8deg); }
          60% { transform: rotate(14deg); }
          80% { transform: rotate(-4deg); }
        }
      `}</style>
    </div>
  )
}
