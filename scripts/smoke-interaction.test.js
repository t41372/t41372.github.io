import { expect, test } from 'bun:test'
import { scatterPuff } from '../src/lib/smoke'

const puff = () => ({ x: 100, y: 100, driftX: 0, driftY: 0, riseSpeed: 25,
  wobblePhase: 0, wobbleFreq: 0.3, wobbleAmp: 5, baseRadius: 12,
  age: 3, life: 28, scatterCooldown: 0 })

test('separate strokes can split the same smoke again, then keep stirring its wisps', () => {
  const first = scatterPuff(puff(), { vx: 400, vy: 0 }, 20)
  expect(first).toHaveLength(3)
  const child = first[1]
  const velocity = child.driftX
  expect(scatterPuff(child, { vx: 400, vy: 0 }, 18)).toBeNull()
  expect(child.driftX).toBe(velocity) // the same stroke cannot cascade each frame
  child.scatterCooldown = 0 // another stroke after the cooldown
  const second = scatterPuff(child, { vx: -400, vy: 0 }, 18)
  expect(second).toHaveLength(3)
  const wisp = second[1]
  const remainingLife = wisp.life
  for (let stroke = 0; stroke < 4; stroke++) {
    wisp.scatterCooldown = 0
    const before = wisp.driftX
    expect(scatterPuff(wisp, { vx: -400, vy: 0 }, 16)).toBeNull()
    expect(wisp.driftX).toBeLessThan(before)
  }
  expect(wisp.life).toBe(remainingLife) // repeated interaction never revives smoke
})

test('a full particle budget still responds without allocating extra shards', () => {
  for (const freeSlots of [0, 1]) {
    const cloud = puff()
    expect(scatterPuff(cloud, { vx: 400, vy: 0 }, freeSlots)).toBeNull()
    expect(cloud.driftX).toBeGreaterThan(0)
  }
  expect(scatterPuff(puff(), { vx: 400, vy: 0 }, 2)).toHaveLength(3)
})

test('a stationary hand neither scatters smoke nor starts a cooldown', () => {
  const cloud = puff()
  expect(scatterPuff(cloud, { vx: 0, vy: 0 }, 20)).toBeNull()
  expect(cloud.scatterCooldown).toBe(0)
  expect(cloud.driftX).toBe(0)
})
