import { readFileSync } from 'node:fs'
import { J2000_MS, JULIAN_YEAR_MS, projectStar } from '../src/lib/astronomy.ts'

const bytes = readFileSync(new URL('../src/data/bright-stars.bin', import.meta.url))
const catalog = new Float32Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 4)
const instant = new Date('2026-09-07T08:00:00Z')
const project = (offset, date, aspect) => {
  const years = (date.getTime() - J2000_MS) / JULIAN_YEAR_MS
  const xyz = [1, 2, 3].map(index => catalog[offset + index] + years * catalog[offset + index + 3])
  const norm = Math.hypot(...xyz)
  return projectStar(xyz.map(value => value / norm), date, aspect)
}
const offsetFor = id => {
  for (let i = 0; i < catalog.length; i += 9) if (catalog[i] === id) return i
  throw new Error(`Missing star ${id}`)
}

export async function testStars(browser, BASE, check) {
  for (const mobile of [false, true]) {
    const width = mobile ? 393 : 1280, height = mobile ? 852 : 800
    const aspect = width / height
    const polaris = project(offsetFor(11734), instant, aspect)
    let faint
    for (let i = 0; i < catalog.length; i += 9) {
      if (catalog[i + 7] < 5.5 || catalog[i + 7] > 5.8) continue
      const p = project(i, instant, aspect)
      if (p.visible && Math.abs(p.x) < 0.8 && Math.abs(p.y) < 0.8) { faint = p; break }
    }
    const ctx = await browser.newContext({ viewport: { width, height }, isMobile: mobile, hasTouch: mobile })
    await ctx.addInitScript(probes => {
      window.__starProbes = probes
      window.__starSamples = []
      const getContext = HTMLCanvasElement.prototype.getContext
      HTMLCanvasElement.prototype.getContext = function (type, ...options) {
        const gl = getContext.call(this, type, ...options)
        if (type === 'webgl' && this.hasAttribute('data-catalogued-stars') && gl && !gl.__sampleStars) {
          gl.__sampleStars = true
          const canvas = this
          const draw = gl.drawArrays.bind(gl)
          gl.drawArrays = (...args) => {
            draw(...args)
            if (args[0] !== gl.POINTS) return
            const dpr = canvas.width / canvas.clientWidth
            const viewportHeight = canvas.clientHeight - 288
            const samples = window.__starProbes.map(probe => {
              const x = Math.round((probe.x + 1) * canvas.width / 2)
              const y = Math.round((144 + (probe.y + 1) * viewportHeight / 2) * dpr)
              const pixels = new Uint8Array(9 * 9 * 4)
              gl.readPixels(x - 4, y - 4, 9, 9, gl.RGBA, gl.UNSIGNED_BYTE, pixels)
              const alpha = [...pixels].filter((_, i) => i % 4 === 3)
              return { peak: Math.max(...alpha), area: alpha.filter(value => value > 50).length, energy: alpha.reduce((a, b) => a + b, 0) }
            })
            window.__starSamples.push(samples)
            if (window.__starSamples.length > 100) window.__starSamples.shift()
          }
        }
        return gl
      }
    }, [polaris, faint])
    const page = await ctx.newPage()
    const label = mobile ? 'mobile' : 'desktop'
    const errors = []
    page.on('pageerror', error => errors.push(error.message))
    try {
      await page.clock.setFixedTime(instant)
      await page.goto(BASE + '/', { waitUntil: 'networkidle' })
      await page.waitForSelector('[data-stars-ready="6054"]')
      await page.waitForTimeout(1600)
      const stars = await page.evaluate(() => window.__starSamples.at(-1))
      check(`${label}: catalog projects Polaris into the rendered northern sky`, stars[0].peak > 120, JSON.stringify(stars))
      check(`${label}: bright stars occupy a visible multi-pixel core`, stars[0].area >= 6, `core area=${stars[0].area}px`)
      check(`${label}: catalog magnitude retains strong bright/faint contrast`, stars[0].energy > stars[1].energy * 3, `bright=${stars[0].energy}, faint=${stars[1].energy}`)
      await page.evaluate(() => { window.__starSamples = [] })
      await page.waitForTimeout(2600)
      const energy = await page.evaluate(() => window.__starSamples.map(sample => sample[0].energy))
      check(`${label}: stars scintillate without moving their catalog positions`, Math.max(...energy) - Math.min(...energy) > 40)
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await page.waitForTimeout(100)
      await page.evaluate(() => { window.__starSamples = [] })
      await page.waitForTimeout(2100)
      const still = await page.evaluate(() => window.__starSamples.map(sample => sample[0].energy))
      check(`${label}: reduced motion removes star scintillation`, still.length >= 2 && Math.max(...still) === Math.min(...still))

      const later = new Date(instant.getTime() + 6 * 3600000)
      const dubheLater = project(offsetFor(53905), later, aspect)
      // Polaris stays close to north; Dubhe is a more revealing time probe.
      // A narrow phone camera may not contain Dubhe six hours later.
      if (Math.abs(dubheLater.x) < 0.85 && Math.abs(dubheLater.y) < 0.85) {
        await page.evaluate(probe => { window.__starProbes = [probe]; window.__starSamples = [] }, dubheLater)
        await page.clock.setFixedTime(later)
        await page.waitForTimeout(1200)
        check(`${label}: clock changes move a real star to its new sky position`, await page.evaluate(() => window.__starSamples.at(-1)[0].peak > 100))
      }
      await page.evaluate(() => { window.__catalogCanvas = document.querySelector('[data-catalogued-stars]') })
      await page.locator('[data-nav-key="blog"]').click()
      await page.waitForURL('**/blog')
      await page.waitForTimeout(600)
      check(`${label}: real-star canvas persists through client navigation`, await page.evaluate(() => window.__catalogCanvas === document.querySelector('[data-catalogued-stars]')))
      const extension = await page.evaluate(() => {
        const gl = document.querySelector('[data-catalogued-stars]').getContext('webgl')
        window.__starContext = gl.getExtension('WEBGL_lose_context')
        window.__starContext?.loseContext()
        return !!window.__starContext
      })
      if (extension) {
        await page.waitForSelector('[data-catalogued-stars]:not([data-stars-ready])')
        await page.evaluate(() => window.__starContext.restoreContext())
        await page.waitForSelector('[data-stars-ready="6054"]')
        check(`${label}: catalog renderer recovers after context loss`, true)
      }
      check(`${label}: real sky has no runtime errors`, errors.length === 0, errors.join('; '))
    } finally { await ctx.close() }
  }
  const ctx = await browser.newContext()
  const page = await ctx.newPage()
  try {
    await page.route('**/bright-stars*.bin', route => route.abort())
    await page.goto(BASE + '/blog', { waitUntil: 'networkidle' })
    await page.waitForFunction(() => getComputedStyle(document.querySelector('canvas')).opacity === '1')
    check('stars: unavailable catalog keeps readable content and the existing night sky', await page.locator('main h1').innerText() === 'Writings' && await page.locator('canvas').first().evaluate(canvas => getComputedStyle(canvas).opacity === '1'))
  } finally { await ctx.close() }
}
