import { useEffect, useRef } from 'react'
import catalogUrl from '../data/bright-stars.bin?url'
import { createStarRenderer, STAR_OVERDRAW_PX } from '../lib/star-renderer'
import { STAR_RECORD_FLOATS } from '../lib/astronomy'

export default function CataloguedStars() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = canvasRef.current!
    const abort = new AbortController()
    const motion = matchMedia('(prefers-reduced-motion: reduce)')
    const interval = matchMedia('(pointer: coarse)').matches ? 50 : 33
    let catalog: Float32Array | undefined
    let renderer: ReturnType<typeof createStarRenderer>
    let frame = 0, timer = 0, last = -Infinity
    let lost = false
    const draw = () => renderer?.draw(new Date(), performance.now(), motion.matches)
    const stop = () => { cancelAnimationFrame(frame); clearInterval(timer) }
    const animate = (now: number) => {
      frame = requestAnimationFrame(animate)
      if (now - last < interval) return
      last = now
      renderer?.draw(new Date(), now, motion.matches)
    }
    const start = () => {
      stop()
      if (!renderer || document.hidden || lost) return
      draw()
      // Reduced motion keeps real time but has no twinkle or ignition.
      if (motion.matches) timer = window.setInterval(draw, 1000)
      else frame = requestAnimationFrame(animate)
    }
    const resize = () => { renderer?.resize(); draw() }
    const restore = () => {
      lost = false
      if (catalog) {
        renderer = createStarRenderer(canvas, catalog)
        start()
      }
    }
    const contextLost = (event: Event) => { event.preventDefault(); lost = true; stop(); renderer = undefined; delete canvas.dataset.starsReady }
    canvas.addEventListener('webglcontextlost', contextLost)
    canvas.addEventListener('webglcontextrestored', restore)
    window.addEventListener('resize', resize)
    document.addEventListener('visibilitychange', start)
    motion.addEventListener('change', start)
    // Bundled and content-hashed, served by this site. No external catalog API.
    void fetch(catalogUrl, { signal: abort.signal }).then(response => {
      if (!response.ok) throw new Error('Star catalog unavailable')
      return response.arrayBuffer()
    }).then(data => {
      if (abort.signal.aborted || !data.byteLength || data.byteLength % (STAR_RECORD_FLOATS * 4) !== 0) return
      catalog = new Float32Array(data)
      if (!lost) restore()
    }).catch(() => { /* The existing night-sky fallback remains readable. */ })
    return () => {
      abort.abort()
      stop()
      renderer?.dispose()
      canvas.removeEventListener('webglcontextlost', contextLost)
      canvas.removeEventListener('webglcontextrestored', restore)
      window.removeEventListener('resize', resize)
      document.removeEventListener('visibilitychange', start)
      motion.removeEventListener('change', start)
    }
  }, [])
  return <canvas ref={canvasRef} data-catalogued-stars aria-hidden="true"
    // A true distant sky has one camera and no depth parallax. Keeping its
    // transparent point layer fixed avoids stretching constellations across
    // arbitrarily long articles. The aurora's original in-flow iOS painting
    // and navigation camera continue separately. No JS scroll follower.
    className="pointer-events-none fixed inset-x-0 -z-9 w-full"
    style={{ top: -STAR_OVERDRAW_PX, height: `calc(100lvh + ${STAR_OVERDRAW_PX * 2}px)` }} />
}
