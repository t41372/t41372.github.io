import { useEffect, useRef } from 'react'

/**
 * AsciiSmoke — an "ASCII shader" smoke plume.
 *
 * This does NOT draw one character per particle. It simulates a smoke
 * *density field* built from soft blobs ("puffs") that leave the chimney in
 * small clusters, then rasterizes that field every frame onto a fine grid of
 * tiny monospace characters — character and alpha are chosen from the local
 * density, like an ascii renderer sampling a texture. The result reads as
 * distinct little clouds that morph, drift upward and dissolve.
 *
 * Mouse: only the cursor's *motion* drags nearby puffs (a hand stirring
 * smoke). A cursor resting inside the plume does nothing.
 */

// density ramp, sparse -> dense
const RAMP = ['·', ':', '~', '≈', 'o', '*', '#', '@']

interface Puff {
  x: number
  y: number
  driftX: number // mouse-imparted velocity, px/s
  driftY: number
  riseSpeed: number // px/s
  wobblePhase: number
  wobbleFreq: number // Hz
  wobbleAmp: number // px/s
  baseRadius: number // px
  age: number // s
  life: number // s
  splits: number // how many more times a fast swipe can break this blob apart
}

export default function AsciiSmoke({
  className = '',
}: {
  className?: string
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const isMobile = window.matchMedia('(max-width: 768px)').matches

    const CELL = isMobile ? 8 : 7 // character cell size in px
    const FONT = `${CELL + 1}px 'Geist Mono Variable', monospace`

    let width = 0
    let height = 0
    let dpr = 1
    let cols = 0
    let rows = 0
    let density = new Float32Array(0)
    let cellJitter = new Float32Array(0) // static per-cell irregularity

    // quantized alpha -> fillStyle strings, so we don't build strings per cell
    const ALPHA_STEPS = 20
    const styles = Array.from(
      { length: ALPHA_STEPS + 1 },
      (_, i) => `oklch(0.85 0.03 264 / ${(i / ALPHA_STEPS).toFixed(3)})`,
    )

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      width = canvas.clientWidth
      height = canvas.clientHeight
      canvas.width = Math.floor(width * dpr)
      canvas.height = Math.floor(height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      cols = Math.max(1, Math.ceil(width / CELL))
      rows = Math.max(1, Math.ceil(height / CELL))
      density = new Float32Array(cols * rows)
      cellJitter = new Float32Array(cols * rows)
      for (let i = 0; i < cellJitter.length; i++) {
        cellJitter[i] = 0.75 + Math.random() * 0.5
      }
      if (reduced) drawStatic()
    }
    // the wrapper is positioned/sized by the valley scene script, so watch the
    // element itself rather than the window
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)

    // chimney mouth: horizontally centered, 12% above the canvas bottom so
    // blob bottoms aren't clipped flat by the canvas edge
    const emitterX = () => width * 0.5
    const emitterY = () => height * 0.88

    const puffs: Puff[] = []
    const maxPuffs = isMobile ? 36 : 64 // cap counts shards from split blobs

    // a chimney "exhale": 2-3 overlapping blobs forming one little cloud
    const spawnCluster = (preAge = 0) => {
      const n = 2 + Math.floor(Math.random() * 2)
      for (let i = 0; i < n; i++) {
        const age = preAge + Math.random() * 0.4
        const riseSpeed = 16 + Math.random() * 8
        puffs.push({
          x:
            emitterX() +
            (Math.random() - 0.5) * 8 +
            (i > 0 ? (Math.random() - 0.5) * 18 : 0),
          y: emitterY() - age * riseSpeed - (i > 0 ? Math.random() * 10 : 0),
          driftX: 0,
          driftY: 0,
          riseSpeed,
          wobblePhase: Math.random() * Math.PI * 2,
          wobbleFreq: 0.2 + Math.random() * 0.3,
          wobbleAmp: 3.5 + Math.random() * 5,
          baseRadius: 9 + Math.random() * 6,
          age,
          life: 8 + Math.random() * 4,
          splits: 2,
        })
      }
    }

    // hand-stirring interaction: track pointer position AND velocity
    const mouse = { x: -9999, y: -9999, vx: 0, vy: 0, lastT: 0 }
    const onPointerMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      const t = performance.now()
      if (mouse.lastT > 0) {
        const dt = Math.max((t - mouse.lastT) / 1000, 1 / 240)
        // smoothed, clamped hand velocity
        const nvx = Math.max(-500, Math.min(500, (x - mouse.x) / dt))
        const nvy = Math.max(-500, Math.min(500, (y - mouse.y) / dt))
        mouse.vx = mouse.vx * 0.5 + nvx * 0.5
        mouse.vy = mouse.vy * 0.5 + nvy * 0.5
      }
      mouse.x = x
      mouse.y = y
      mouse.lastT = t
    }
    const onPointerLeave = () => {
      mouse.x = -9999
      mouse.y = -9999
      mouse.vx = 0
      mouse.vy = 0
    }
    window.addEventListener('pointermove', onPointerMove, { passive: true })
    window.addEventListener('pointerout', onPointerLeave, { passive: true })

    // rasterize the current density field to the character grid
    const renderField = () => {
      density.fill(0)
      for (const p of puffs) {
        const t = p.age / p.life
        const R = p.baseRadius * (1 + t * 1.7)
        const fadeIn = Math.min(1, p.age / 0.45)
        const A = fadeIn * Math.pow(Math.max(0, 1 - t), 1.15)
        if (A <= 0.01) continue
        const cr = Math.ceil(R / CELL)
        const cx = Math.round(p.x / CELL - 0.5)
        const cy = Math.round(p.y / CELL - 0.5)
        const R2 = R * R
        for (let gy = Math.max(0, cy - cr); gy <= Math.min(rows - 1, cy + cr); gy++) {
          const dy = (gy + 0.5) * CELL - p.y
          for (let gx = Math.max(0, cx - cr); gx <= Math.min(cols - 1, cx + cr); gx++) {
            const dx = (gx + 0.5) * CELL - p.x
            const q = (dx * dx + dy * dy) / R2
            if (q < 1) {
              const f = 1 - q
              density[gy * cols + gx] += A * f * f
            }
          }
        }
      }

      ctx.clearRect(0, 0, width, height)
      ctx.font = FONT
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      const topFade = rows * 0.22
      const sideFade = cols * 0.08
      for (let gy = 0; gy < rows; gy++) {
        for (let gx = 0; gx < cols; gx++) {
          const i = gy * cols + gx
          const d = density[i]!
          if (d < 0.05) continue
          // saturating map to 0..1, roughened per cell
          let dn = (1 - Math.exp(-d * 1.3)) * cellJitter[i]!
          if (dn > 1) dn = 1
          const edge =
            Math.min(1, gy / topFade) *
            Math.min(1, gx / sideFade, (cols - 1 - gx) / sideFade)
          const alpha = (0.1 + dn * 0.48) * edge
          if (alpha < 0.02) continue
          const char = RAMP[Math.min(RAMP.length - 1, Math.floor(dn * RAMP.length))]!
          ctx.fillStyle = styles[Math.round(alpha * ALPHA_STEPS)]!
          ctx.fillText(char, (gx + 0.5) * CELL, (gy + 0.5) * CELL)
        }
      }
    }

    // static smoke for reduced motion: a few frozen puffs, rendered once
    function drawStatic() {
      puffs.length = 0
      spawnCluster(4.5)
      spawnCluster(2.5)
      spawnCluster(1)
      renderField()
      puffs.length = 0
    }

    if (reduced) {
      drawStatic()
      return () => {
        ro.disconnect()
        window.removeEventListener('pointermove', onPointerMove)
        window.removeEventListener('pointerout', onPointerLeave)
      }
    }

    // pre-warm so the plume already exists when it scrolls into view
    spawnCluster(5.2)
    spawnCluster(3.9)
    spawnCluster(2.6)
    spawnCluster(1.3)
    spawnCluster(0)

    let raf = 0
    let last = performance.now()
    let clusterAcc = 0
    let clusterNext = 1.2

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick)
      const dt = Math.min((now - last) / 1000, 0.05)
      last = now
      if (!width || !height) return

      clusterAcc += dt
      if (clusterAcc >= clusterNext) {
        clusterAcc = 0
        clusterNext = 1.6 + Math.random() * 0.9
        spawnCluster()
      }

      // idle cursor sheds its recorded velocity
      mouse.vx *= 1 - Math.min(1, 5 * dt)
      mouse.vy *= 1 - Math.min(1, 5 * dt)
      const mouseSpeed = Math.hypot(mouse.vx, mouse.vy)

      const wind = Math.sin(now * 0.00015) * 3

      for (let i = puffs.length - 1; i >= 0; i--) {
        const p = puffs[i]!
        p.age += dt
        if (p.age >= p.life) {
          puffs.splice(i, 1)
          continue
        }
        const t = p.age / p.life
        const R = p.baseRadius * (1 + t * 1.7)

        const dx = p.x - mouse.x
        const dy = p.y - mouse.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        const reach = R * 1.1 // only react when the cursor actually touches the blob

        // a fast swipe through a blob breaks it into shards that scatter
        // sideways and burn out early
        if (
          dist < reach &&
          mouseSpeed > 160 &&
          p.splits > 0 &&
          p.baseRadius > 5 &&
          puffs.length < maxPuffs
        ) {
          const dirX = mouse.vx / mouseSpeed
          const dirY = mouse.vy / mouseSpeed
          puffs.splice(i, 1)
          for (let k = -1; k <= 1; k++) {
            puffs.push({
              x: p.x - dirY * R * 0.4 * k,
              y: p.y + dirX * R * 0.4 * k,
              driftX: p.driftX + dirX * 55 - dirY * 75 * k,
              driftY: p.driftY + dirY * 55 + dirX * 75 * k,
              riseSpeed: p.riseSpeed * (0.9 + Math.random() * 0.2),
              wobblePhase: Math.random() * Math.PI * 2,
              wobbleFreq: 0.3 + Math.random() * 0.4,
              wobbleAmp: 5 + Math.random() * 5,
              baseRadius: p.baseRadius * 0.55,
              age: p.age,
              life: p.age + (p.life - p.age) * (0.5 + Math.random() * 0.2),
              splits: p.splits - 1,
            })
          }
          continue
        }

        // slow stroke inside a blob: local nudge along the hand's motion
        if (dist < reach) {
          const infl = 1 - dist / reach
          p.driftX += mouse.vx * infl * 1.2 * dt
          p.driftY += mouse.vy * infl * 1.2 * dt
        }
        p.driftX *= 1 - Math.min(1, 2.2 * dt)
        p.driftY *= 1 - Math.min(1, 2.2 * dt)

        const wobble =
          Math.sin(p.age * p.wobbleFreq * Math.PI * 2 + p.wobblePhase) *
          p.wobbleAmp
        // wind strengthens with altitude so the plume top trails away
        p.x += (wobble + wind * (0.4 + t * 1.6) + p.driftX) * dt
        p.y += (-p.riseSpeed * (1 - t * 0.3) + p.driftY) * dt
      }

      renderField()
    }
    raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerout', onPointerLeave)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-none ${className}`}
      aria-hidden="true"
    />
  )
}
