/**
 * OG social image generator — `bun scripts/generate-og.mjs`
 *
 * Screenshots the REAL hero (WebGL aurora, glitch name, finished typewriter)
 * in headless Chrome and writes public/og.png (1200×630). Rendered at 2x and
 * downsampled with sharp so the text stays crisp.
 *
 * The result is committed — re-run this only when the hero visibly changes.
 * Same serve strategy as e2e-smoke.mjs: build + `astro preview` on a free
 * port, or point OG_BASE at an already-running server to skip both.
 */
import { chromium } from 'playwright-core'
import { spawn } from 'node:child_process'
import { stat } from 'node:fs/promises'
import net from 'node:net'
import sharp from 'sharp'

const OUT = new URL('../public/og.png', import.meta.url).pathname

const freePort = (from) =>
  new Promise((resolve) => {
    const srv = net.createServer()
    srv.once('error', () => resolve(freePort(from + 1)))
    srv.listen(from, '127.0.0.1', () => {
      const { port } = srv.address()
      srv.close(() => resolve(port))
    })
  })

const run = (cmd, args) =>
  new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { stdio: 'inherit' })
    p.once('error', reject)
    p.once('exit', (code) =>
      code === 0 ? resolve() : reject(new Error(`${cmd} ${args.join(' ')} exited ${code}`)),
    )
  })

const waitForServer = async (url, tries = 100) => {
  for (let i = 0; i < tries; i++) {
    try {
      if ((await fetch(url)).ok) return
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 200))
  }
  throw new Error(`server at ${url} never became ready`)
}

let preview = null
let BASE = process.env.OG_BASE
if (!BASE) {
  await run('bun', ['run', 'build'])
  const port = await freePort(4322)
  BASE = `http://localhost:${port}`
  preview = spawn('bunx', ['astro', 'preview', '--port', String(port)], {
    stdio: ['ignore', 'ignore', 'inherit'],
  })
  process.on('exit', () => {
    if (preview && !preview.killed) preview.kill('SIGTERM')
  })
  await waitForServer(BASE + '/')
}

const browser = await chromium.launch({
  channel: 'chrome',
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
})
const page = await browser.newPage({
  viewport: { width: 1200, height: 630 },
  deviceScaleFactor: 2,
})
await page.goto(BASE + '/', { waitUntil: 'networkidle' })

// the fixed nav pill doesn't belong on a social card
await page.addStyleTag({ content: 'header { display: none !important }' })

// wait for the WebGL sky's first frame (canvas reveals via opacity)…
await page.waitForFunction(() => {
  const c = document.querySelector('canvas')
  return c && Number(getComputedStyle(c).opacity) > 0.5
})
// …and for the hero intro to reach its settled composition. The typewriter
// never "finishes" (the tech-word cycle loops forever), so the moment to
// capture is: both lines typed, "fun stuff" settled, and the first tech word
// ("Java") fully typed and sitting in its 1200ms hold (~20s in).
await page.waitForFunction(
  () => {
    const fun = document.querySelector('.fun-text')
    return (
      !!fun?.classList.contains('fun-settled') &&
      /with Java$/.test((fun.closest('p')?.innerText ?? '').trim())
    )
  },
  undefined,
  { timeout: 45_000 },
)
await page.waitForTimeout(300)

const shot = await page.screenshot({ type: 'png' })
await browser.close()

await sharp(shot).resize(1200, 630).png({ compressionLevel: 9 }).toFile(OUT)
const { size } = await stat(OUT)
console.log(`wrote ${OUT} (${Math.round(size / 1024)} kB)`)
