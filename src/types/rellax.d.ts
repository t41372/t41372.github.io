declare module 'rellax' {
  interface RellaxOptions {
    speed?: number
    center?: boolean
    percentage?: number
    wrapper?: string
    relativeToWrapper?: boolean
    round?: boolean
    vertical?: boolean
    horizontal?: boolean
    breakpoints?: number[]
    callback?: (position: { x: number; y: number }) => void
  }
  class Rellax {
    constructor(selector?: string | HTMLElement, options?: RellaxOptions)
    refresh(): void
    destroy(): void
  }
  export default Rellax
}
