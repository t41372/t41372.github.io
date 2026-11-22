import { useEffect, useRef } from 'react'
import { scatterPuff, type Puff } from '../../lib/smoke'

/**
 * AsciiSmoke — an "ASCII shader" smoke plume.
 *
 * This does NOT draw one character per particle. It simulates a smoke
 * *density field* built from soft blobs ("puffs") that leave the chimney in
 * small clusters, then rasterizes that field onto a fine grid of tiny
 * monospace characters — character and alpha are chosen from the local
 * density, like an ascii renderer sampling a texture. The result reads as
 * distinct little clouds that morph, drift upward and dissolve.
 *
 * Glyphs (8 characters × 20 quantized alpha steps) are pre-rendered once into
 * a tiny offscreen sprite atlas so per-frame rasterization uses batched
 * drawImage blits + dirty-rect clears instead of thousands of per-frame
 * CoreText/Skia fillText() calls.
 *
 * Mouse: only the cursor's *motion* drags nearby puffs (a hand stirring
 * smoke). A cursor resting inside the plume does nothing.
 * Fast strokes can scatter the same smoke repeatedly; each hit has a short
 * cooldown, and tiny wisps keep accepting impulses without spawning more blobs.
 */

// density ramp, sparse -> dense
const RAMP = ['·', ':', '~', '≈', 'o', '*', '#', '@']

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
    const isCoarse = window.matchMedia('(pointer: coarse)').matches

    const CELL = isMobile ? 8 : 7 // character cell size in px
    const PAD = 2 // extra CSS px margin per atlas tile so glyphs never clip
    const TILE_CSS = CELL + PAD * 2
    const FONT = `${CELL + 1}px 'Geist Mono Variable', monospace`

    let width = 0
    let height = 0
    let dpr = 1
    let cols = 0
    let rows = 0
    let density = new Float32Array(0)
    let cellJitter = new Float32Array(0) // static per-cell irregularity
    let prevClear: { x: number; y: number; w: number; h: number } | null = null

    // quantized alpha -> fillStyle strings, baked once into the glyph atlas
    const ALPHA_STEPS = 20
    const styles = Array.from(
      { length: ALPHA_STEPS + 1 },
      (_, i) => `oklch(0.85 0.03 264 / ${(i / ALPHA_STEPS).toFixed(3)})`,
    )

    const atlas = document.createElement('canvas')
    const actx = atlas.getContext('2d')
    let tilePx = TILE_CSS

    const buildAtlas = () => {
      if (!actx) return
      tilePx = Math.max(1, Math.ceil(TILE_CSS * dpr))
      atlas.width = RAMP.length * tilePx
      atlas.height = (ALPHA_STEPS + 1) * tilePx
      const scale = tilePx / TILE_CSS
      actx.setTransform(scale, 0, 0, scale, 0, 0)
      actx.clearRect(0, 0, RAMP.length * TILE_CSS, (ALPHA_STEPS + 1) * TILE_CSS)
      actx.font = FONT
      actx.textAlign = 'center'
      actx.textBaseline = 'middle'
      for (let a = 1; a <= ALPHA_STEPS; a++) {
        actx.fillStyle = styles[a]!
        const cy = (a + 0.5) * TILE_CSS
        for (let c = 0; c < RAMP.length; c++) {
          actx.fillText(RAMP[c]!, (c + 0.5) * TILE_CSS, cy)
        }
      }
    }

    let rectDirty = true
    let cachedLeft = 0
    let cachedTop = 0
    let revealed = false
    const reveal = () => {
      if (revealed) return
      revealed = true
      if (reduced) canvas.style.transition = 'none'
      canvas.style.opacity = '1'
    }
    const markRectDirty = () => {
      rectDirty = true
    }

    const resize = () => {
      const nextDpr = Math.min(window.devicePixelRatio || 1, 1.5)
      const nextW = canvas.clientWidth
      const nextH = canvas.clientHeight
      const bufW = Math.floor(nextW * nextDpr)
      const bufH = Math.floor(nextH * nextDpr)
      rectDirty = true
      const anchored =
        !canvas.parentElement ||
        canvas.parentElement.id !== 'smoke-wrap' ||
        canvas.parentElement.hasAttribute('data-anchored')
      if (bufW === canvas.width && bufH === canvas.height && nextDpr === dpr && width === nextW && height === nextH) {
        if (!warmed && !reduced && anchored && width > 0 && height > 0) {
          warmUp()
          warmed = true
          renderField()
          reveal()
        }
        return
      }
      const dprChanged = nextDpr !== dpr || atlas.width === 0
      dpr = nextDpr
      width = nextW
      height = nextH
      canvas.width = bufW
      canvas.height = bufH
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      if (dprChanged) buildAtlas()
      prevClear = { x: 0, y: 0, w: width, h: height }
      cols = Math.max(1, Math.ceil(width / CELL))
      rows = Math.max(1, Math.ceil(height / CELL))
      density = new Float32Array(cols * rows)
      cellJitter = new Float32Array(cols * rows)
      for (let i = 0; i < cellJitter.length; i++) {
        cellJitter[i] = 0.75 + Math.random() * 0.5
      }
      if (reduced) {
        if (anchored && width > 0 && height > 0) {
          drawStatic()
          reveal()
        }
      } else {
        // Seed a full standing plume the first time the chimney has real
        // anchored dimensions, so smoke never pre-warms inside a 300x150
        // default canvas box and softly fades in alongside the sky.
        if (!warmed && anchored && width > 0 && height > 0) {
          warmUp()
          warmed = true
        }
        // Reassigning canvas.width above CLEARS the canvas. Repaint the current
        // plume on every resize so it survives the valley script re-sizing the
        // wrapper even while the loop is paused off-screen.
        if (warmed) {
          renderField()
          reveal()
        }
      }
    }
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)

    let disposed = false
    void document.fonts?.ready?.then(() => {
      if (disposed || !width || !height) return
      buildAtlas()
      prevClear = { x: 0, y: 0, w: width, h: height }
      if (reduced) drawStatic()
      else if (warmed) renderField()
    })

    // chimney mouth: horizontally centered, 7% above the canvas bottom so
    // blob bottoms aren't clipped flat by the canvas edge
    const emitterX = () => width * 0.5
    const emitterY = () => height * 0.93

    const puffs: Puff[] = []
    const maxPuffs = isMobile ? 44 : 80 // cap counts shards from split blobs

    const riseFactor = (t: number) => 0.55 + 2.6 * t
    const climbAt = (riseSpeed: number, age: number, life: number) =>
      riseSpeed * (0.55 * age + (1.3 * age * age) / life)

    const spawnCluster = (preAge = 0) => {
      const n = 3 + Math.floor(Math.random() * 3)
      const rise = 17 + Math.random() * 6 // px/s, shared by the whole cloud
      const cx = (Math.random() - 0.5) * 10
      for (let i = 0; i < n && puffs.length < maxPuffs; i++) {
        const age = preAge + Math.random() * 0.6
        const riseSpeed = rise * (0.92 + Math.random() * 0.16)
        const life = 31 + Math.random() * 6
        puffs.push({
          x:
            emitterX() +
            cx +
            (i > 0 ? (Math.random() - 0.5) * 20 : (Math.random() - 0.5) * 6),
          y:
            emitterY() -
            climbAt(riseSpeed, Math.min(age, life), life) -
            (i > 0 ? Math.random() * 12 : 0),
          driftX: 0,
          driftY: 0,
          riseSpeed,
          wobblePhase: Math.random() * Math.PI * 2,
          wobbleFreq: 0.14 + Math.random() * 0.2,
          wobbleAmp: 3.5 + Math.random() * 5,
          baseRadius: 10 + Math.random() * 7,
          age,
          life,
          scatterCooldown: 0,
        })
      }
    }

    // hand-stirring interaction: track pointer position AND velocity only while
    // the smoke canvas is near the viewport, using a cached bounding rect so
    // mouse moves never force synchronous layout.
    const mouse = { x: -9999, y: -9999, vx: 0, vy: 0, lastT: 0 }
    const onPointerMove = (e: PointerEvent) => {
      if (rectDirty) {
        const rect = canvas.getBoundingClientRect()
        cachedLeft = rect.left
        cachedTop = rect.top
        rectDirty = false
      }
      const x = e.clientX - cachedLeft
      const y = e.clientY - cachedTop
      const t = performance.now()
      if (mouse.lastT > 0) {
        const dt = Math.max((t - mouse.lastT) / 1000, 1 / 240)
        const nvx = Math.max(-500, Math.min(500, (x - mouse.x) / dt))
        const nvy = Math.max(-500, Math.min(500, (y - mouse.y) / dt))
        mouse.vx = mouse.vx * 0.5 + nvx * 0.5
        mouse.vy = mouse.vy * 0.5 + nvy * 0.5
      }
      mouse.x = x
      mouse.y = y
      mouse.lastT = t
    }
    const onPointerLeave = (event: PointerEvent) => {
      if (event.relatedTarget !== null) return
      mouse.x = -9999
      mouse.y = -9999
      mouse.vx = 0
      mouse.vy = 0
      mouse.lastT = 0
    }

    // rasterize the current density field to the character grid
    const renderField = () => {
      density.fill(0)
      let minGx = cols
      let maxGx = -1
      let minGy = rows
      let maxGy = -1

      for (const p of puffs) {
        const t = p.age / p.life
        const R = p.baseRadius * (1 + t * 2.6)
        const fadeIn = Math.min(1, p.age / 0.45)
        const A = fadeIn * Math.max(0, 1 - t * t) * (1 - 0.5 * t)
        if (A <= 0.01) continue
        const cr = Math.ceil(R / CELL)
        const cx = Math.round(p.x / CELL - 0.5)
        const cy = Math.round(p.y / CELL - 0.5)
        const x0 = Math.max(0, cx - cr)
        const x1 = Math.min(cols - 1, cx + cr)
        const y0 = Math.max(0, cy - cr)
        const y1 = Math.min(rows - 1, cy + cr)
        if (x0 > x1 || y0 > y1) continue
        if (x0 < minGx) minGx = x0
        if (x1 > maxGx) maxGx = x1
        if (y0 < minGy) minGy = y0
        if (y1 > maxGy) maxGy = y1
        const R2 = R * R
        for (let gy = y0; gy <= y1; gy++) {
          const dy = (gy + 0.5) * CELL - p.y
          const dy2 = dy * dy
          const rowOff = gy * cols
          for (let gx = x0; gx <= x1; gx++) {
            const dx = (gx + 0.5) * CELL - p.x
            const q = (dx * dx + dy2) / R2
            if (q < 1) {
              const f = 1 - q
              density[rowOff + gx] += A * f * f
            }
          }
        }
      }

      if (prevClear) {
        ctx.clearRect(prevClear.x, prevClear.y, prevClear.w, prevClear.h)
        prevClear = null
      }
      if (maxGx < minGx || maxGy < minGy) return

      const topFade = rows * 0.14
      const sideFade = cols * 0.08
      const useAtlas = actx !== null && atlas.width > 0
      if (!useAtlas) {
        ctx.font = FONT
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
      }

      let drawnMinX = cols
      let drawnMaxX = -1
      let drawnMinY = rows
      let drawnMaxY = -1

      for (let gy = minGy; gy <= maxGy; gy++) {
        const edgeY = Math.min(1, gy / topFade)
        const rowOff = gy * cols
        for (let gx = minGx; gx <= maxGx; gx++) {
          const i = rowOff + gx
          const d = density[i]!
          if (d < 0.05) continue
          let dn = (1 - Math.exp(-d * 1.3)) * cellJitter[i]!
          if (dn > 1) dn = 1
          const edge = edgeY * Math.min(1, gx / sideFade, (cols - 1 - gx) / sideFade)
          const alpha = (0.1 + dn * 0.48) * edge
          if (alpha < 0.02) continue
          const aIdx = Math.round(alpha * ALPHA_STEPS)
          if (aIdx <= 0) continue
          const cIdx = Math.min(RAMP.length - 1, Math.floor(dn * RAMP.length))
          if (useAtlas) {
            ctx.drawImage(
              atlas,
              cIdx * tilePx,
              aIdx * tilePx,
              tilePx,
              tilePx,
              gx * CELL - PAD,
              gy * CELL - PAD,
              TILE_CSS,
              TILE_CSS,
            )
          } else {
            ctx.fillStyle = styles[aIdx]!
            ctx.fillText(RAMP[cIdx]!, (gx + 0.5) * CELL, (gy + 0.5) * CELL)
          }
          if (gx < drawnMinX) drawnMinX = gx
          if (gx > drawnMaxX) drawnMaxX = gx
          if (gy < drawnMinY) drawnMinY = gy
          if (gy > drawnMaxY) drawnMaxY = gy
        }
      }

      if (drawnMaxX >= drawnMinX) {
        const x = Math.max(0, drawnMinX * CELL - PAD - 1)
        const y = Math.max(0, drawnMinY * CELL - PAD - 1)
        const right = Math.min(width, (drawnMaxX + 1) * CELL + PAD + 1)
        const bottom = Math.min(height, (drawnMaxY + 1) * CELL + PAD + 1)
        prevClear = { x, y, w: right - x, h: bottom - y }
      }
    }

    function drawStatic() {
      puffs.length = 0
      spawnCluster(21)
      spawnCluster(13)
      spawnCluster(6.5)
      spawnCluster(2)
      prevClear = { x: 0, y: 0, w: width, h: height }
      renderField()
      puffs.length = 0
    }

    if (reduced) {
      drawStatic()
      return () => {
        disposed = true
        ro.disconnect()
      }
    }

    let warmed = false
    const warmUp = () => {
      for (const a of [30.5, 26, 21.5, 17, 13, 9, 5.8, 2.8, 0]) spawnCluster(a)
    }

    let raf = 0
    let last = performance.now()
    let clusterAcc = 0
    let clusterNext = 3.4
    let running = false
    let onScreen = false

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick)
      // Yield GPU upload bandwidth while a route View Transition is actively compositing.
      if (document.documentElement.hasAttribute('data-astro-transition')) {
        last = now
        return
      }
      // Run at 60fps only while a fine pointer is actively stirring the plume;
      // ambient 22px/s drift on a 7px character grid locks cleanly to 30fps (29ms).
      const activeHand =
        !isCoarse &&
        (Math.abs(mouse.vx) > 25 || Math.abs(mouse.vy) > 25) &&
        mouse.x >= -40 &&
        mouse.x <= width + 40 &&
        mouse.y >= -40 &&
        mouse.y <= height + 40
      const minFrame = isCoarse ? 29 : activeHand ? 14 : 29
      if (now - last < minFrame) return
      const dt = Math.min((now - last) / 1000, 0.05)
      last = now
      if (!width || !height) return

      if (!warmed) {
        warmUp()
        warmed = true
      }

      clusterAcc += dt
      if (clusterAcc >= clusterNext) {
        clusterAcc = 0
        clusterNext = 3.4 + Math.random() * 2.2
        spawnCluster()
      }

      mouse.vx *= 1 - Math.min(1, 5 * dt)
      mouse.vy *= 1 - Math.min(1, 5 * dt)
      const mouseSpeed = Math.hypot(mouse.vx, mouse.vy)

      const wind = Math.sin(now * 0.00015) * 5

      for (let i = puffs.length - 1; i >= 0; i--) {
        const p = puffs[i]!
        p.age += dt
        p.scatterCooldown = Math.max(0, p.scatterCooldown - dt)
        if (p.age >= p.life) {
          puffs.splice(i, 1)
          continue
        }
        const t = p.age / p.life
        const R = p.baseRadius * (1 + t * 2.6)

        const dx = p.x - mouse.x
        const dy = p.y - mouse.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        const reach = R * 1.1

        if (dist < reach && mouseSpeed > 160) {
          const shards = scatterPuff(p, mouse, maxPuffs - puffs.length)
          if (shards) {
            puffs.splice(i, 1, ...shards)
            continue
          }
        }

        if (dist < reach) {
          const infl = 1 - dist / reach
          p.driftX += mouse.vx * infl * 1.2 * dt
          p.driftY += mouse.vy * infl * 1.2 * dt
        }
        p.driftX *= 1 - Math.min(1, 2.2 * dt)
        p.driftY *= 1 - Math.min(1, 2.2 * dt)

        const wobble =
          Math.sin(p.age * p.wobbleFreq * Math.PI * 2 + p.wobblePhase) *
          p.wobbleAmp *
          (1 + t * 1.8)
        p.x += (wobble + wind * (0.4 + t * 2.2) + p.driftX) * dt
        p.y += (-p.riseSpeed * riseFactor(t) + p.driftY) * dt
      }

      renderField()
    }

    const start = () => {
      if (running) return
      running = true
      rectDirty = true
      last = performance.now()
      window.addEventListener('pointermove', onPointerMove, { passive: true })
      window.addEventListener('pointerout', onPointerLeave, { passive: true })
      window.addEventListener('scroll', markRectDirty, { passive: true })
      raf = requestAnimationFrame(tick)
    }
    const stop = () => {
      if (!running) return
      running = false
      cancelAnimationFrame(raf)
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerout', onPointerLeave)
      window.removeEventListener('scroll', markRectDirty)
      mouse.vx = 0
      mouse.vy = 0
      mouse.lastT = 0
    }

    const io = new IntersectionObserver(
      (entries) => {
        onScreen = entries[entries.length - 1]!.isIntersecting
        if (onScreen && !document.hidden) start()
        else stop()
      },
      { rootMargin: '0px' },
    )
    io.observe(canvas)

    const onVisibility = () => {
      if (document.hidden) stop()
      else if (onScreen) start()
    }
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      disposed = true
      stop()
      io.disconnect()
      ro.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-none opacity-0 transition-opacity duration-[1400ms] ease-[var(--ease-out)] ${className}`}
      aria-hidden="true"
    />
  )
}
