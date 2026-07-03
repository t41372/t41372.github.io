import { useEffect, useRef } from 'react'

const VERT = /* glsl */ `
attribute vec2 aPos;
void main() {
  gl_Position = vec4(aPos, 0.0, 1.0);
}
`

const FRAG = /* glsl */ `
precision highp float;

uniform vec2 uRes;
uniform float uTime;

// ---------- noise ----------
float hash21(vec2 p) {
  p = fract(p * vec2(234.34, 435.345));
  p += dot(p, p + 34.23);
  return fract(p.x * p.y);
}

float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = hash21(i);
  float b = hash21(i + vec2(1.0, 0.0));
  float c = hash21(i + vec2(0.0, 1.0));
  float d = hash21(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 4; i++) {
    v += a * vnoise(p);
    p = p * 2.03 + vec2(13.7, 7.1);
    a *= 0.5;
  }
  return v;
}

// ---------- stars ----------
// One layer of round, gaussian star points with jittered positions,
// per-star size / brightness / color temperature, compound twinkle.
vec3 starLayer(vec2 p, float t, float minBright) {
  vec2 cell = floor(p);
  vec2 f = fract(p);
  vec3 acc = vec3(0.0);

  // check 3x3 neighborhood so gaussians are not clipped at cell borders
  for (int oy = -1; oy <= 1; oy++) {
    for (int ox = -1; ox <= 1; ox++) {
      vec2 o = vec2(float(ox), float(oy));
      vec2 c = cell + o;
      float h = hash21(c);
      if (h < minBright) continue;

      // jittered position inside the cell
      vec2 pos = o + vec2(hash21(c + 17.3), hash21(c + 31.7));
      vec2 d = f - pos;
      float dist = length(d);

      // size & brightness: mostly tiny, rare big ones (cubic bias)
      float sel = (h - minBright) / (1.0 - minBright);
      float mag = pow(sel, 3.0);
      float size = mix(0.045, 0.16, mag);
      float core = exp(-dist * dist / (size * size));

      // compound twinkle: two incommensurate frequencies -> organic flicker
      float ph = h * 43.7;
      float tw = 0.62 + 0.38 * sin(t * (0.4 + h * 1.6) + ph);
      tw *= 0.80 + 0.20 * sin(t * (2.1 + h * 2.7) + ph * 1.7);

      // slight color temperature variation: cool blue-white ... warm ivory
      float temp = hash21(c + 57.1);
      vec3 col = mix(vec3(0.72, 0.82, 1.0), vec3(1.0, 0.93, 0.80), temp * temp);

      float bright = (0.25 + 0.75 * mag) * tw;
      acc += col * core * bright;

      // 4-point diffraction glint only on the largest stars
      if (mag > 0.55) {
        float spike = exp(-abs(d.x) * 22.0) * exp(-d.y * d.y * 260.0)
                    + exp(-abs(d.y) * 22.0) * exp(-d.x * d.x * 260.0);
        acc += col * spike * 0.30 * tw * (mag - 0.55) / 0.45;
      }
    }
  }
  return acc;
}

void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  float aspect = uRes.x / uRes.y;
  vec2 suv = vec2(uv.x * aspect, uv.y);

  // ---------- night sky ----------
  vec3 nTop = vec3(0.045, 0.075, 0.225);
  vec3 nLow = vec3(0.10, 0.145, 0.33);
  float skyGrad = smoothstep(0.0, 1.0, uv.y);
  vec3 scene = mix(nLow, nTop, skyGrad);

  // faint milky haze for depth
  float haze = fbm(suv * 2.2 + vec2(3.1, 8.7));
  scene += vec3(0.05, 0.07, 0.13) * haze * haze * 0.5;

  // ---------- stars: two depth layers ----------
  // distant dense faint layer + near sparse bright layer (with glints)
  scene += starLayer(suv * 55.0, uTime, 0.985) * 0.45;
  scene += starLayer(suv * 22.0 + 47.0, uTime, 0.978) * 0.95;

  // ---------- aurora curtain ----------
  // undulating base line of the curtain, drifting slowly
  float baseY = 0.24 + 0.16 * (fbm(vec2(suv.x * 0.9 + uTime * 0.022, uTime * 0.03)) - 0.5) * 2.0;
  float hgt = uv.y - baseY; // height above the curtain's lower edge

  // domain warp -> drapery folds
  float warp = (fbm(vec2(suv.x * 1.6 - uTime * 0.035, uv.y * 1.1 + uTime * 0.012)) - 0.5) * 0.55;

  // vertical rays: anisotropic noise (high freq in x, stretched in y)
  float rays = fbm(vec2((suv.x + warp) * 5.5, uv.y * 0.22 - uTime * 0.045));
  rays = smoothstep(0.28, 0.78, rays);
  // finer secondary ray detail
  float rays2 = vnoise(vec2((suv.x + warp * 1.4) * 22.0, uv.y * 0.6 - uTime * 0.07));
  rays *= 0.72 + 0.28 * rays2;

  // vertical profile: sharp bright lower edge, long fade upward
  float profile = smoothstep(-0.015, 0.045, hgt) * exp(-max(hgt, 0.0) * 2.6);

  // waves of brightness traveling along the curtain
  float shimmer = 0.78 + 0.22 * sin(suv.x * 9.0 - uTime * 0.55 + warp * 8.0);

  // gentle horizontal mask (fades only at the far edges)
  float edgeMask = smoothstep(0.0, 0.18, uv.x) * smoothstep(1.0, 0.80, uv.x);

  float aur = clamp(rays * profile * shimmer * edgeMask * 2.4, 0.0, 1.0);

  // second, fainter and higher curtain for depth
  float baseY2 = baseY + 0.30 + 0.05 * sin(uTime * 0.05 + 2.0);
  float hgt2 = uv.y - baseY2;
  float rays2b = fbm(vec2((suv.x - warp * 0.8) * 5.0 + 31.0, uv.y * 0.4 + uTime * 0.03));
  rays2b = smoothstep(0.42, 0.85, rays2b);
  float profile2 = smoothstep(-0.02, 0.06, hgt2) * exp(-max(hgt2, 0.0) * 4.5);
  float aur2 = clamp(rays2b * profile2 * edgeMask * 1.4, 0.0, 1.0);

  // ---------- aurora color ramp (by height above lower edge) ----------
  vec3 cFringe = vec3(0.92, 0.45, 0.62); // pink fringe at the very bottom
  vec3 cGreen  = vec3(0.32, 0.94, 0.55); // oxygen green
  vec3 cTeal   = vec3(0.30, 0.84, 0.86); // teal mid
  vec3 cPurple = vec3(0.52, 0.38, 0.88); // purple top
  float ch = clamp(hgt * 1.9, 0.0, 1.0);
  vec3 aurCol = mix(cGreen, cTeal, smoothstep(0.05, 0.45, ch));
  aurCol = mix(aurCol, cPurple, smoothstep(0.45, 1.0, ch));
  aurCol = mix(cFringe, aurCol, smoothstep(-0.005, 0.05, hgt));

  vec3 aurCol2 = mix(cTeal, cPurple, clamp(hgt2 * 2.5, 0.0, 1.0));

  // combine: primary curtain wins, secondary fills behind
  float dotB = max(aur, aur2 * 0.7);
  vec3 dotCol = aur >= aur2 * 0.7 ? aurCol : aurCol2;

  // soft atmospheric glow behind the halftone dots (ties dots to the sky)
  scene += aurCol * aur * 0.14 + aurCol2 * aur2 * 0.08;

  // ---------- halftone dots ----------
  float cellPx = max(4.0, uRes.y / 130.0);
  vec2 g = gl_FragCoord.xy / cellPx;
  vec2 cell = floor(g);
  vec2 gv = fract(g) - 0.5;

  float jitter = hash21(cell);
  float twinkle = 0.78 + 0.22 * sin(uTime * (1.2 + jitter * 2.4) + jitter * 6.283);
  float b = clamp(dotB, 0.0, 1.0) * twinkle;
  float radius = 0.42 * sqrt(b);
  float dotMask = smoothstep(radius, radius - 0.18, length(gv)) * step(0.02, b);

  vec3 color = scene + dotCol * dotMask * (0.35 + 0.65 * b);

  // ---------- vignette + grain ----------
  vec2 vc = uv - 0.5;
  color *= 1.0 - dot(vc, vc) * 0.5;
  color += (hash21(gl_FragCoord.xy + uTime) - 0.5) * 0.015;

  gl_FragColor = vec4(color, 1.0);
}
`

/**
 * Night-sky aurora WebGL background.
 * Halftone-dot aurora curtains + twinkling gaussian stars.
 * 40fps cap, DPR clamped at 1.5, frozen frame under prefers-reduced-motion.
 */
export default function AuroraBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const gl = canvas.getContext('webgl', { antialias: false, alpha: false })
    if (!gl) return

    const compile = (type: number, src: string) => {
      const sh = gl.createShader(type)
      if (!sh) return null
      gl.shaderSource(sh, src)
      gl.compileShader(sh)
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
        return null
      }
      return sh
    }

    const vs = compile(gl.VERTEX_SHADER, VERT)
    const fs = compile(gl.FRAGMENT_SHADER, FRAG)
    if (!vs || !fs) return

    const prog = gl.createProgram()
    if (!prog) return
    gl.attachShader(prog, vs)
    gl.attachShader(prog, fs)
    gl.linkProgram(prog)
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return
    gl.useProgram(prog)

    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
    const aPos = gl.getAttribLocation(prog, 'aPos')
    gl.enableVertexAttribArray(aPos)
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0)

    const uRes = gl.getUniformLocation(prog, 'uRes')
    const uTime = gl.getUniformLocation(prog, 'uTime')

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
      const w = Math.floor(canvas.clientWidth * dpr)
      const h = Math.floor(canvas.clientHeight * dpr)
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w
        canvas.height = h
        gl.viewport(0, 0, w, h)
      }
    }
    resize()
    window.addEventListener('resize', resize)

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let raf = 0
    let last = 0
    const frameInterval = 1000 / 40 // 40 fps cap
    const start = performance.now()

    const render = (now: number) => {
      raf = requestAnimationFrame(render)
      if (now - last < frameInterval) return
      last = now
      resize()
      gl.uniform2f(uRes, canvas.width, canvas.height)
      // reduced motion: render a single frozen frame
      gl.uniform1f(uTime, reduced ? 2.0 : (now - start) / 1000)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
      if (reduced) cancelAnimationFrame(raf)
    }
    raf = requestAnimationFrame(render)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      gl.deleteProgram(prog)
      gl.deleteShader(vs)
      gl.deleteShader(fs)
      gl.deleteBuffer(buf)
    }
  }, [])

  return <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-hidden="true" />
}
