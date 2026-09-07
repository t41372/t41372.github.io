export interface Puff {
  x: number
  y: number
  driftX: number
  driftY: number
  riseSpeed: number
  wobblePhase: number
  wobbleFreq: number
  wobbleAmp: number
  baseRadius: number
  age: number
  life: number
  scatterCooldown: number // seconds before another distinct swipe can scatter it
}

/** A new swipe can stir the same smoke again. Cooldown prevents one stroke
 * from consuming all fragmentation in consecutive animation frames. Small
 * wisps and a full particle budget still receive the hand's impulse. freeSlots
 * counts unused particle slots; replacing a puff with three needs two. */
export function scatterPuff(puff: Puff, hand: { vx: number; vy: number }, freeSlots: number): Puff[] | null {
  const speed = Math.hypot(hand.vx, hand.vy)
  if (puff.scatterCooldown > 0 || speed <= 160) return null
  const dirX = hand.vx / speed, dirY = hand.vy / speed
  puff.scatterCooldown = 0.35
  if (puff.baseRadius <= 5 || freeSlots < 2) {
    puff.driftX += dirX * 55
    puff.driftY += dirY * 55
    return null
  }
  const radius = puff.baseRadius * (1 + (puff.age / puff.life) * 2.6)
  return [-1, 0, 1].map(k => ({
    ...puff,
    x: puff.x - dirY * radius * 0.4 * k,
    y: puff.y + dirX * radius * 0.4 * k,
    driftX: puff.driftX + dirX * 55 - dirY * 75 * k,
    driftY: puff.driftY + dirY * 55 + dirX * 75 * k,
    riseSpeed: puff.riseSpeed * (0.9 + Math.random() * 0.2),
    wobblePhase: Math.random() * Math.PI * 2,
    wobbleFreq: 0.3 + Math.random() * 0.4,
    wobbleAmp: 5 + Math.random() * 5,
    baseRadius: puff.baseRadius * 0.55,
    // Keep enough remaining life for another stroke, without reviving old smoke.
    life: puff.age + (puff.life - puff.age) * 0.9,
  }))
}
