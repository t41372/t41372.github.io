import { expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import metadata from '../src/data/bright-stars.meta.json'
import { J2000_MS, JULIAN_YEAR_MS, projectStar, relativeFlux, SKY_OBSERVER, STAR_RECORD_FLOATS, starColor } from '../src/lib/astronomy'

const bytes = readFileSync(new URL('../src/data/bright-stars.bin', import.meta.url))
const catalog = new Float32Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 4)
const record = (id: number) => {
  for (let i = 0; i < catalog.length; i += STAR_RECORD_FLOATS) {
    if (catalog[i] === id) return catalog.slice(i, i + STAR_RECORD_FLOATS)
  }
  throw new Error(`Missing HYG ${id}`)
}
const at = (star: Float32Array, date: Date) => {
  const years = (date.getTime() - J2000_MS) / JULIAN_YEAR_MS
  const xyz = [1, 2, 3].map(index => star[index]! + years * star[index + 3]!)
  const norm = Math.hypot(...xyz)
  return xyz.map(value => value / norm)
}

test('the derived catalog retains pinned source coordinates and finite unit vectors', () => {
  expect(createHash('sha256').update(bytes).digest('hex')).toBe(metadata.sha256)
  expect(catalog.length / STAR_RECORD_FLOATS).toBe(metadata.count)
  for (let i = 0; i < catalog.length; i += STAR_RECORD_FLOATS) {
    expect(catalog[i]).toBeGreaterThan(0)
    expect(Math.hypot(catalog[i + 1]!, catalog[i + 2]!, catalog[i + 3]!)).toBeCloseTo(1, 6)
    expect(catalog[i + 7]).toBeLessThanOrEqual(6.5)
  }
  for (const landmark of Object.values(metadata.landmarks)) {
    const star = record(landmark.id)
    const ra = landmark.raHours * Math.PI / 12, dec = landmark.decDegrees * Math.PI / 180
    const expected = [Math.cos(dec) * Math.cos(ra), Math.cos(dec) * Math.sin(ra), Math.sin(dec)]
    const actual = at(star, new Date(J2000_MS))
    // Angular separation remains meaningful at the pole, where a tiny change
    // in direction can produce a large change in the RA coordinate alone.
    const dot = expected.reduce((sum, value, index) => sum + value * actual[index]!, 0)
    expect(Math.acos(Math.min(1, dot)) * 180 / Math.PI).toBeLessThan(0.001)
  }
})

test('Polaris stays above geographic north while the surrounding sky turns with real time', () => {
  const polaris = record(metadata.landmarks.Polaris.id)
  const dubhe = record(metadata.landmarks.Dubhe.id)
  const midnight = new Date('2026-09-07T08:00:00Z')
  const noon = new Date('2026-09-07T20:00:00Z')
  for (let hour = 0; hour < 24; hour++) {
    const date = new Date(midnight.getTime() + hour * 3600000)
    const p = projectStar(at(polaris, date), date, 1.5)
    expect(p.visible).toBe(true)
    expect(Math.abs(p.altitude - SKY_OBSERVER.latitude)).toBeLessThan(1)
    expect(Math.abs(p.x)).toBeLessThan(0.025)
  }
  const before = projectStar(at(dubhe, midnight), midnight, 1.5)
  const after = projectStar(at(dubhe, noon), noon, 1.5)
  expect(Math.hypot(before.x - after.x, before.y - after.y)).toBeGreaterThan(0.6)
  const oneSiderealDay = new Date(midnight.getTime() + 86164090.5)
  const returned = projectStar(at(dubhe, oneSiderealDay), oneSiderealDay, 1.5)
  expect(Math.hypot(before.x - returned.x, before.y - returned.y)).toBeLessThan(0.001)
})

test('five magnitudes correspond to 100x flux; B−V sets warm/cool rather than random colours', () => {
  expect(relativeFlux(1) / relativeFlux(6)).toBeCloseTo(100, 8)
  const hot = starColor(-0.2), cool = starColor(1.5)
  expect(hot[2]).toBeGreaterThan(hot[0])
  expect(cool[0]).toBeGreaterThan(cool[2])
  expect(starColor(NaN)).toEqual([1, 1, 1])
})
