import { horizonMatrix, J2000_MS, JULIAN_YEAR_MS, relativeFlux, SKY_ALTITUDE_DEG, SKY_VERTICAL_FOV_DEG, STAR_RECORD_FLOATS, starColor } from './astronomy'

export const STAR_OVERDRAW_PX = 144
const VERTEX = /* glsl */ `
precision highp float;
attribute vec3 aPosition;
attribute vec3 aVelocity;
attribute vec3 aColor;
attribute float aFlux;
attribute float aPhase;
uniform mat3 uHorizon;
uniform float uYears;
uniform float uAspect;
uniform float uVerticalScale;
uniform float uDpr;
uniform float uPointMax;
uniform vec3 uCamera; // cos(altitude), sin(altitude), focal length
varying vec3 vColor;
varying float vFlux;
varying float vSize;
varying float vRadius;
varying float vPixel;
varying float vPhase;
varying float vAltitude;
void main() {
  vec3 horizon = uHorizon * normalize(aPosition + uYears * aVelocity);
  float forward = horizon.x * uCamera.x + horizon.z * uCamera.y;
  float up = -horizon.x * uCamera.y + horizon.z * uCamera.x;
  // HOR +y is WEST: east belongs on the right when the camera faces north.
  vec2 projected = vec2(-horizon.y / uAspect, up) * uCamera.z / max(forward, 0.001);
  gl_Position = vec4(projected.x, projected.y * uVerticalScale, 0.0, 1.0);
  if (forward <= 0.0 || horizon.z <= 0.0) gl_Position = vec4(2.0, 2.0, 2.0, 1.0);

  // Pogson's magnitude scale, plus gentle clear-air horizon extinction.
  float airmass = 1.0 / max(horizon.z, 0.12);
  vFlux = aFlux * pow(10.0, -0.4 * 0.18 * (airmass - 1.0));
  // Stars are unresolved. Brighter stars have wider apparent point-spread
  // functions, not literal stellar discs or randomized physical radii.
  vRadius = 0.55 + 1.10 * pow(vFlux, 0.20);
  vPixel = 1.0 / uDpr;
  vSize = min(uPointMax / uDpr, 12.0 + 12.0 * pow(vFlux, 0.15));
  gl_PointSize = vSize * uDpr;
  // Faint stars lose colour at night; the bright ones retain their B−V tint.
  vColor = mix(vec3(1.0), aColor, smoothstep(0.0025, 0.12, vFlux));
  vPhase = aPhase;
  vAltitude = horizon.z;
}
`
const FRAGMENT = /* glsl */ `
precision highp float;
uniform float uTime;
uniform float uBoot;
uniform float uReduced;
varying vec3 vColor;
varying float vFlux;
varying float vSize;
varying float vRadius;
varying float vPixel;
varying float vPhase;
varying float vAltitude;
void main() {
  vec2 p = (gl_PointCoord - 0.5) * vSize;
  float radius = length(p);
  // A resolved screen point with a subpixel antialiased rim. A Gaussian
  // across the whole point looks defocused, especially under browser zoom.
  float aa = 0.65 * vPixel;
  float core = 1.0 - smoothstep(vRadius - aa, vRadius + aa, radius);
  float outside = max(radius - vRadius, 0.0);
  float haloWidth = 0.75 + 0.5 * sqrt(min(vFlux, 1.0));
  float glare = (1.0 - core) * exp(-outside * outside / (2.0 * haloWidth * haloWidth))
    * 0.045 * pow(min(vFlux, 1.0), 0.55);
  // Compress real flux for a screen, keeping more contrast between bright
  // constellation landmarks and the faint field. Soft, short glints make
  // those landmarks read as stars without adding arbitrary bright points.
  float peak = 1.0 - exp(-3.4 * pow(vFlux, 0.52));
  float glint = (exp(-abs(p.x) * 4.0 - abs(p.y) * 0.75)
              + exp(-abs(p.y) * 4.0 - abs(p.x) * 0.75))
              * 0.10 * smoothstep(0.06, 0.5, vFlux);
  float twinkle = 1.0 + (1.0 - uReduced) * (0.14 + 0.08 * (1.0 - vAltitude))
    * (0.65 * sin(uTime * 1.3 + vPhase) + 0.35 * sin(uTime * 2.6 + vPhase * 1.7));
  float alpha = min(1.0, (core * peak + glare + glint) * twinkle * smoothstep(0.0, 1.0, uBoot));
  if (alpha < 0.002) discard;
  gl_FragColor = vec4(vColor * alpha, alpha);
}
`

export function createStarRenderer(canvas: HTMLCanvasElement, catalog: Float32Array) {
  const gl = canvas.getContext('webgl', { alpha: true, antialias: false, depth: false, powerPreference: 'low-power' })
  if (!gl) return
  const shaders: WebGLShader[] = []
  const program = gl.createProgram()
  const buffer = gl.createBuffer()
  const dispose = () => {
    gl.deleteProgram(program)
    gl.deleteBuffer(buffer)
    shaders.forEach(shader => gl.deleteShader(shader))
  }
  if (!program || !buffer) { dispose(); return }
  for (const [type, source] of [[gl.VERTEX_SHADER, VERTEX], [gl.FRAGMENT_SHADER, FRAGMENT]] as const) {
    const shader = gl.createShader(type)
    if (!shader) { dispose(); return }
    shaders.push(shader)
    gl.shaderSource(shader, source)
    gl.compileShader(shader)
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) { dispose(); return }
    gl.attachShader(program, shader)
  }
  gl.linkProgram(program)
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) { dispose(); return }
  gl.useProgram(program)
  const count = catalog.length / STAR_RECORD_FLOATS
  const vertices = new Float32Array(count * 11)
  for (let i = 0; i < count; i++) {
    const offset = i * STAR_RECORD_FLOATS
    vertices.set(catalog.subarray(offset + 1, offset + 7), i * 11)
    vertices.set(starColor(catalog[offset + 8]!), i * 11 + 6)
    vertices[i * 11 + 9] = relativeFlux(catalog[offset + 7]!)
    // Identity changes the scintillation phase only, never position/photometry.
    vertices[i * 11 + 10] = (catalog[offset]! * 0.754877666 % 1) * 2 * Math.PI
  }
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW)
  for (const [name, size, offset] of [['aPosition', 3, 0], ['aVelocity', 3, 3], ['aColor', 3, 6], ['aFlux', 1, 9], ['aPhase', 1, 10]] as const) {
    const location = gl.getAttribLocation(program, name)
    gl.enableVertexAttribArray(location)
    gl.vertexAttribPointer(location, size, gl.FLOAT, false, 44, offset * 4)
  }
  const uniform = (name: string) => gl.getUniformLocation(program, name)
  const horizon = uniform('uHorizon'), years = uniform('uYears'), time = uniform('uTime')
  const boot = uniform('uBoot'), reduced = uniform('uReduced')
  const altitude = SKY_ALTITUDE_DEG * Math.PI / 180
  gl.uniform3f(uniform('uCamera'), Math.cos(altitude), Math.sin(altitude), 1 / Math.tan(SKY_VERTICAL_FOV_DEG * Math.PI / 360))
  gl.uniform1f(uniform('uPointMax'), gl.getParameter(gl.ALIASED_POINT_SIZE_RANGE)[1])
  gl.enable(gl.BLEND)
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)
  gl.clearColor(0, 0, 0, 0)
  let second = -1
  let started = -1
  const resize = () => {
    const width = Math.max(1, canvas.clientWidth)
    const height = Math.max(1, canvas.clientHeight)
    const viewport = Math.max(1, height - STAR_OVERDRAW_PX * 2)
    // Honour Retina / 3x phones and desktop browser zoom. The aurora remains
    // inexpensive at its original resolution; only these sparse points use
    // the sharper buffer, bounded by the GPU's actual dimensions.
    const limit = Math.min(gl.getParameter(gl.MAX_TEXTURE_SIZE), gl.getParameter(gl.MAX_RENDERBUFFER_SIZE))
    const dpr = Math.min(devicePixelRatio || 1, 4, limit / width, limit / height)
    const bufferWidth = Math.round(width * dpr), bufferHeight = Math.round(height * dpr)
    if (canvas.width !== bufferWidth || canvas.height !== bufferHeight) {
      canvas.width = bufferWidth
      canvas.height = bufferHeight
      gl.viewport(0, 0, canvas.width, canvas.height)
    }
    gl.uniform1f(uniform('uAspect'), width / viewport)
    gl.uniform1f(uniform('uVerticalScale'), viewport / height)
    gl.uniform1f(uniform('uDpr'), dpr)
  }
  resize()
  return {
    resize,
    dispose,
    draw(date: Date, now: number, reduce: boolean) {
      if (started < 0) started = now
      const nextSecond = Math.floor(date.getTime() / 1000)
      if (nextSecond !== second) {
        second = nextSecond
        gl.uniformMatrix3fv(horizon, false, horizonMatrix(date))
        gl.uniform1f(years, (date.getTime() - J2000_MS) / JULIAN_YEAR_MS)
      }
      gl.uniform1f(time, now / 1000)
      gl.uniform1f(boot, reduce ? 1 : Math.min(1, (now - started) / 1200))
      gl.uniform1f(reduced, reduce ? 1 : 0)
      gl.clear(gl.COLOR_BUFFER_BIT)
      gl.drawArrays(gl.POINTS, 0, count)
      canvas.dataset.starsReady = String(count)
    },
  }
}
