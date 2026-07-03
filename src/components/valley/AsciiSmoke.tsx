import { useEffect, useRef } from 'react'

/**
 * AsciiSmoke — canvas particle system rendering ASCII characters as smoke.
 * Particles rise from the chimney (bottom-center of the canvas), drift with
 * a sine sway, morph through a character lifecycle, fade out, and can be
 * scattered by the mouse (radial repulsion).
 */

// character lifecycle: dense -> loose -> wisps
const CHAR_STAGES = ['@', '#', 'O', 'o', '*', '°', '≈', '~', '·']

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  age: number
  life: number // total lifespan in seconds
  swayPhase: number
  swayFreq: number
  swayAmp: number
  size: number
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

    let width = 0
    let height = 0
    let dpr = 1

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      width = canvas.clientWidth
      height = canvas.clientHeight
      canvas.width = Math.floor(width * dpr)
      canvas.height = Math.floor(height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    window.addEventListener('resize', resize)

    // chimney mouth position, relative to canvas (matches the ASCII art below)
    const emitterX = () => width * 0.5
    const emitterY = () => height - 4

    const particles: Particle[] = []
    const maxParticles = isMobile ? 40 : 90
    const spawnInterval = isMobile ? 0.22 : 0.11 // seconds between spawns

    const mouse = { x: -9999, y: -9999, active: false }

    // listen on window so the interaction works even though the canvas
    // sits inside a pointer-events-none layer stack
    const onPointerMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect()
      mouse.x = e.clientX - rect.left
      mouse.y = e.clientY - rect.top
      mouse.active = true
    }
    const onPointerLeave = () => {
      mouse.active = false
      mouse.x = -9999
      mouse.y = -9999
    }
    window.addEventListener('pointermove', onPointerMove, { passive: true })
    window.addEventListener('pointerout', onPointerLeave, { passive: true })

    const spawn = () => {
      if (particles.length >= maxParticles) return
      particles.push({
        x: emitterX() + (Math.random() - 0.5) * 6,
        y: emitterY(),
        vx: (Math.random() - 0.5) * 4,
        vy: -(14 + Math.random() * 10),
        age: 0,
        life: 4.5 + Math.random() * 3,
        swayPhase: Math.random() * Math.PI * 2,
        swayFreq: 0.7 + Math.random() * 0.8,
        swayAmp: 6 + Math.random() * 10,
        size: 11 + Math.random() * 5,
      })
    }

    // static smoke for reduced motion: a few faint fixed characters
    if (reduced) {
      ctx.clearRect(0, 0, width, height)
      ctx.font = '13px monospace'
      ctx.textAlign = 'center'
      const staticChars = ['~', '≈', '°', '·', '~']
      staticChars.forEach((ch, i) => {
        const t = i / (staticChars.length - 1)
        ctx.fillStyle = `oklch(0.8 0.06 195 / ${0.45 * (1 - t)})`
        ctx.fillText(
          ch,
          emitterX() + Math.sin(i * 1.7) * 14,
          emitterY() - 12 - t * (height * 0.7),
        )
      })
      return () => {
        window.removeEventListener('resize', resize)
        window.removeEventListener('pointermove', onPointerMove)
        window.removeEventListener('pointerout', onPointerLeave)
      }
    }

    let raf = 0
    let last = performance.now()
    let spawnAcc = 0

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick)
      const dt = Math.min((now - last) / 1000, 0.05)
      last = now

      spawnAcc += dt
      while (spawnAcc >= spawnInterval) {
        spawnAcc -= spawnInterval
        spawn()
      }

      ctx.clearRect(0, 0, width, height)
      ctx.textAlign = 'center'

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i]!
        p.age += dt
        if (p.age >= p.life) {
          particles.splice(i, 1)
          continue
        }

        const t = p.age / p.life // 0..1

        // natural drift: rise + sine sway, slowing down as it disperses
        const sway = Math.sin(p.age * p.swayFreq * Math.PI * 2 + p.swayPhase)
        const rise = p.vy * (1 - t * 0.55)

        // mouse repulsion: radial force that scatters the smoke
        if (mouse.active) {
          const dx = p.x - mouse.x
          const dy = p.y - mouse.y
          const distSq = dx * dx + dy * dy
          const radius = 90
          if (distSq < radius * radius && distSq > 0.01) {
            const dist = Math.sqrt(distSq)
            const force = (1 - dist / radius) * 260
            p.vx += (dx / dist) * force * dt
            p.vy += (dy / dist) * force * dt
          }
        }

        // damp scattered velocity back toward natural drift
        p.vx *= 1 - 1.6 * dt

        p.x += (p.vx + sway * p.swayAmp * 0.35) * dt * 3
        p.y += rise * dt * 3

        // char morph + fade
        const stage = Math.min(
          CHAR_STAGES.length - 1,
          Math.floor(t * CHAR_STAGES.length),
        )
        const alpha = t < 0.12 ? t / 0.12 : 1 - (t - 0.12) / 0.88
        const grow = 1 + t * 0.9

        ctx.font = `${p.size * grow}px monospace`
        ctx.fillStyle = `oklch(0.82 0.07 190 / ${Math.max(alpha, 0) * 0.55})`
        ctx.fillText(CHAR_STAGES[stage]!, p.x, p.y)
      }
    }
    raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
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
