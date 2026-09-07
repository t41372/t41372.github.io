import { Observer, Rotation_EQJ_HOR } from 'astronomy-engine'

/** Fixed viewpoint, never inferred from the visitor's clock zone/location. */
export const SKY_OBSERVER = new Observer(64.84, -147.72, 136)
export const SKY_ALTITUDE_DEG = 50
export const SKY_VERTICAL_FOV_DEG = 80
export const J2000_MS = Date.UTC(2000, 0, 1, 12)
export const JULIAN_YEAR_MS = 365.25 * 86400000
export const STAR_RECORD_FLOATS = 9

/** Astronomy Engine stores columns, matching WebGL's column-major matrices.
 * Includes precession, nutation and the Earth's rotation at the actual UTC. */
export function horizonMatrix(date: Date) {
  return new Float32Array(Rotation_EQJ_HOR(date, SKY_OBSERVER).rot.flat())
}

export const relativeFlux = (magnitude: number) => 10 ** (-0.4 * magnitude)

/** Approximate display colour from observed B−V: Ballesteros (2012) gives a
 * black-body temperature, then three Planck samples give a subdued RGB tint.
 * This is a screen rendering, not calibrated photometry. Unknown B−V is white. */
export function starColor(bv: number): [number, number, number] {
  if (!Number.isFinite(bv)) return [1, 1, 1]
  const index = Math.max(-0.4, Math.min(2.0, bv))
  const temperature = 4600 * (1 / (0.92 * index + 1.7) + 1 / (0.92 * index + 0.62))
  const samples = [650, 550, 450].map(nm => {
    const c = 1.438776877e7 / nm
    return Math.expm1(c / 6500) / Math.expm1(c / temperature)
  })
  const maximum = Math.max(...samples)
  return samples.map(value => 0.35 + 0.65 * value / maximum) as [number, number, number]
}

/** Same rectilinear camera used in the vertex shader; useful for checking
 * known stars/constellations without depending on the WebGL implementation. */
export function projectStar(direction: readonly number[], date: Date, aspect: number) {
  const m = horizonMatrix(date)
  const [x, y, z] = direction
  const north = m[0]! * x! + m[3]! * y! + m[6]! * z!
  const west = m[1]! * x! + m[4]! * y! + m[7]! * z!
  const up = m[2]! * x! + m[5]! * y! + m[8]! * z!
  const altitude = SKY_ALTITUDE_DEG * Math.PI / 180
  const forward = north * Math.cos(altitude) + up * Math.sin(altitude)
  const vertical = -north * Math.sin(altitude) + up * Math.cos(altitude)
  const focal = 1 / Math.tan(SKY_VERTICAL_FOV_DEG * Math.PI / 360)
  return { x: -west * focal / (forward * aspect), y: vertical * focal / forward, visible: forward > 0 && up > 0, altitude: Math.asin(up) * 180 / Math.PI }
}
