"use client";

import * as React from 'react';
import { useReducedMotion } from 'framer-motion';

import { Mark } from '@/components/mark';
import { BLOBS, BLOB_ASPECT, MARK_BLOBS, WORD_BLOBS } from '@/lib/blob-field';
import { cn } from '@/lib/utils';

/**
 * The mark, as a field of blobs that can become the wordmark.
 *
 * Three earlier versions tried to transition the *image* — crossfading two shader
 * layers, fusing them under a blur-and-threshold filter, blending two distance fields.
 * All three failed the same way, because all three had two shapes present at once and
 * had to hide one. This transitions the *geometry* instead: every blob has one identity
 * and a home in each shape, and the surface is whatever the blobs currently say it is.
 * There is no second shape to hide, so there is nothing to hide it behind.
 *
 * The surface is a metaball field — `sum(r^2 / d^2)`, drawn at the `f = 1` iso-line.
 * Neighbouring blobs merge rather than overlap, which is the whole reason the swarm
 * reads as one body and not as 128 circles. Pulling them toward their centroid mid-way
 * collapses that body into a single mass, and letting them back out resolves it into
 * the other mark.
 *
 * Raw WebGL on a fullscreen triangle. Three.js was offered and declined: a scene graph
 * to host one quad is ~160KB of bundle for nothing, and this shader needs no camera, no
 * geometry and no material system.
 */

const VERT = `#version 300 es
void main() {
  /* One oversized triangle rather than two triangles: no shared edge to crack, one
     fewer vertex, and the rasteriser clips the excess for free. */
  vec2 p = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2);
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`;

const FRAG = `#version 300 es
precision highp float;

uniform vec2 u_res;
uniform vec4 u_blobs[${BLOBS}];   // xy = centre, z = radius, w unused
uniform vec2 u_centre;            // where the frame's middle sits, in screen units
uniform float u_scale;
uniform vec3 u_ink;
uniform vec3 u_accent;
uniform float u_settle;           // 1 = resolved and crisp, 0 = still gathering

out vec4 fragColor;

void main() {
  /* Screen to frame space, y up, x widened by aspect so blobs stay circular. */
  vec2 p = (gl_FragCoord.xy - 0.5 * u_res) / u_res.y;
  p = (p - u_centre) / u_scale;

  /* Wyvill kernel, not the textbook r^2/d^2.
     Inverse-square has infinite support, so with this many blobs the distant tails sum
     past the iso-value everywhere and the whole frame fills in as one black mass. This
     one is exactly zero past its influence radius, so a blob only ever affects its own
     neighbourhood and the surface stays where the shape is. */
  float f = 0.0;
  vec2 grad = vec2(0.0);
  for (int i = 0; i < ${BLOBS}; i++) {
    vec2 dv = p - u_blobs[i].xy;
    float R = u_blobs[i].z * 1.9;
    float x = 1.0 - dot(dv, dv) / (R * R);
    if (x <= 0.0) continue;
    float x2 = x * x;
    f += x2 * x;
    /* Analytic gradient — the surface normal falls straight out of it. */
    grad += (-6.0 / (R * R)) * x2 * dv;
  }

  /* Where a lone blob's surface lands exactly on its own radius, for the 1.9x
     influence above: (1 - 1/1.9^2)^3. Derived rather than eyeballed, because picking it
     by hand leaves every circle either fat or starved and the packing stops matching
     the letter — a wider influence closes the P's counter entirely. */
  const float ISO = 0.378;
  float e = max(fwidth(f), 1e-4);
  float alpha = smoothstep(ISO - e, ISO + e, f);
  if (alpha <= 0.001) discard;

  float h = clamp((f - ISO) * 1.6, 0.0, 1.0);
  vec3 n = normalize(vec3(-grad * 0.30, 2.2));

  vec3 L = normalize(vec3(-0.40, 0.70, 0.60));
  float dif = max(dot(n, L), 0.0);
  float spec = pow(max(dot(reflect(-L, n), vec3(0.0, 0.0, 1.0)), 0.0), 32.0);
  float rim = pow(1.0 - clamp(n.z, 0.0, 1.0), 3.0);

  /* Dense ink rather than chrome: one broad key, a tight highlight, and the studio's
     terracotta as bounced light on the turning edge rather than as paint. */
  vec3 col = u_ink * (0.62 + 0.38 * dif) * (0.88 + 0.12 * h);
  col += u_accent * rim * 0.13;
  col += vec3(spec) * (0.10 + 0.16 * u_settle);

  fragColor = vec4(col, alpha);
}`;

function compile(gl: WebGL2RenderingContext, type: number, src: string) {
  const shader = gl.createShader(type);
  if (!shader) throw new Error('could not create shader');
  gl.shaderSource(shader, src);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader);
    console.error('[blob-mark] shader log:', log, src);
    throw new Error((log && log.trim()) || 'shader failed to compile (no log)');
  }
  return shader;
}

const ease = (t: number) => t * t * (3 - 2 * t);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export interface BlobMarkProps {
  /** 0 = the mark, 1 = the wordmark. Everything between is one body in transit. */
  morph: number;
  /** Fraction of the container's height the frame occupies. */
  scale: number;
  /** Frame centre, in units of container height, from the middle. */
  centreX: number;
  centreY: number;
  className?: string;
}

export function BlobMark({ morph, scale, centreX, centreY, className }: BlobMarkProps) {
  const hostRef = React.useRef<HTMLDivElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const [failed, setFailed] = React.useState(false);
  const reduceMotion = useReducedMotion();

  /* The shader is driven from a ref rather than from props, so a scroll frame updates
     the uniforms without re-rendering React. */
  const state = React.useRef({ morph, scale, centreX, centreY });
  state.current = { morph, scale, centreX, centreY };

  React.useEffect(() => {
    const canvas = canvasRef.current;
    const host = hostRef.current;
    if (!canvas || !host) return;

    const gl = canvas.getContext('webgl2', {
      alpha: true,
      antialias: false,
      premultipliedAlpha: false,
      powerPreference: 'high-performance',
    });
    if (!gl) {
      setFailed(true);
      return;
    }
    if (gl.isContextLost()) {
      /* A context that arrives already dead cannot be revived by us; the fallback mark
         is better than an empty hero. */
      setFailed(true);
      return;
    }

    let program: WebGLProgram | null = null;
    try {
      program = gl.createProgram();
      if (!program) throw new Error('could not create program');
      gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, VERT));
      gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, FRAG));
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        throw new Error(gl.getProgramInfoLog(program) ?? 'program failed to link');
      }
    } catch (error) {
      console.error('[blob-mark]', error);
      setFailed(true);
      return;
    }

    gl.useProgram(program);
    const loc = {
      res: gl.getUniformLocation(program, 'u_res'),
      blobs: gl.getUniformLocation(program, 'u_blobs'),
      centre: gl.getUniformLocation(program, 'u_centre'),
      scale: gl.getUniformLocation(program, 'u_scale'),
      ink: gl.getUniformLocation(program, 'u_ink'),
      accent: gl.getUniformLocation(program, 'u_accent'),
      settle: gl.getUniformLocation(program, 'u_settle'),
    };
    gl.uniform3f(loc.ink, 0.263, 0.263, 0.263);
    gl.uniform3f(loc.accent, 0.824, 0.431, 0.322);
    gl.enable(gl.BLEND);
    gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);

    /* Reused every frame rather than reallocated — this runs at 60fps and a fresh
       512-float array per frame is work the garbage collector has to undo. */
    const packed = new Float32Array(BLOBS * 4);

    let live = true;
    let visible = true;
    let frame = 0;

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    }, { threshold: 0 });
    io.observe(host);

    const onVisibility = () => {
      visible = !document.hidden && visible;
    };
    document.addEventListener('visibilitychange', onVisibility);

    const resize = () => {
      /* Capped below the device's own ratio on purpose. The field costs 128 kernel
         evaluations per pixel, so pixels are the expensive axis here — and a soft body
         with no fine detail has nothing to gain from the last half of a retina ratio. */
      const dpr = Math.min(1.5, window.devicePixelRatio || 1);
      const w = Math.max(1, Math.round(host.clientWidth * dpr));
      const h = Math.max(1, Math.round(host.clientHeight * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
      return [w, h] as const;
    };

    const ro = new ResizeObserver(resize);
    ro.observe(host);

    const draw = () => {
      if (!live) return;
      frame = requestAnimationFrame(draw);
      if (!visible) return;

      const [w, h] = resize();
      const { morph: m, scale: s, centreX: cx, centreY: cy } = state.current;

      /* The gather. At the midpoint every blob is pulled most of the way to the
         swarm's centroid and swollen to compensate, so the field fuses into one mass
         with no legible shape — then releases into the other mark. Mass roughly holds,
         which is what keeps it reading as the same substance throughout. */
      const t = ease(m);
      const gather = Math.sin(Math.PI * Math.min(1, Math.max(0, m)));

      let sumX = 0;
      let sumY = 0;
      for (let i = 0; i < BLOBS; i++) {
        sumX += lerp(MARK_BLOBS[i][0], WORD_BLOBS[i][0], t);
        sumY += lerp(MARK_BLOBS[i][1], WORD_BLOBS[i][1], t);
      }
      const midX = sumX / BLOBS;
      const midY = sumY / BLOBS;

      for (let i = 0; i < BLOBS; i++) {
        const a = MARK_BLOBS[i];
        const b = WORD_BLOBS[i];
        const bx = lerp(a[0], b[0], t);
        const by = lerp(a[1], b[1], t);
        const br = lerp(a[2], b[2], t);
        const pull = gather * 0.72;
        const o = i * 4;
        packed[o] = lerp(bx, midX, pull);
        packed[o + 1] = -lerp(by, midY, pull);
        packed[o + 2] = br * (1 + gather * 1.05);
        packed[o + 3] = 0;
      }

      gl.uniform2f(loc.res, w, h);
      gl.uniform4fv(loc.blobs, packed);
      gl.uniform2f(loc.centre, cx, -cy);
      gl.uniform1f(loc.scale, s);
      gl.uniform1f(loc.settle, 1 - gather);

      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    const onLost = (event: Event) => {
      /* Without this the context never comes back and the hero is empty for the rest
         of the session. Preventing the default is what lets the browser restore it. */
      event.preventDefault();
      live = false;
      cancelAnimationFrame(frame);
    };
    const onRestored = () => {
      live = true;
      frame = requestAnimationFrame(draw);
    };
    canvas.addEventListener('webglcontextlost', onLost);
    canvas.addEventListener('webglcontextrestored', onRestored);

    frame = requestAnimationFrame(draw);

    return () => {
      live = false;
      cancelAnimationFrame(frame);
      io.disconnect();
      ro.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      canvas.removeEventListener('webglcontextlost', onLost);
      canvas.removeEventListener('webglcontextrestored', onRestored);
      gl.deleteProgram(program);
      /* Deliberately NOT calling loseContext(). `getContext` hands back the same object
         for the same canvas forever, so forcing the context lost here poisons the
         element: React runs every effect twice in development, and the second run would
         fetch the corpse and fail to compile anything against it — with a null info log,
         which makes it look like a shader bug rather than a teardown bug. The context
         dies with the canvas when React really unmounts it. */
    };
  }, [reduceMotion]);

  return (
    <div ref={hostRef} aria-hidden="true" className={cn('absolute inset-0', className)}>
      {failed ? (
        /* No WebGL2, or the program would not build. The page keeps its mark. */
        <div className="absolute inset-0 grid place-items-center">
          <Mark className="w-[34%] max-w-[460px] text-ink-2" title="PLCBO" />
        </div>
      ) : (
        <canvas ref={canvasRef} className="h-full w-full" />
      )}
    </div>
  );
}

export { BLOB_ASPECT };
