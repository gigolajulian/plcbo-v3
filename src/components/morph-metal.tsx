"use client";

import * as React from 'react';
import { ShaderMount } from '@paper-design/shaders-react';
import {
  LiquidMetalShapes,
  ShaderFitOptions,
  getShaderColorFromString,
  liquidMetalFragmentShader,
  toProcessedLiquidMetal,
} from '@paper-design/shaders';

/**
 * The same liquid metal, with two silhouettes and a real morph between them.
 *
 * The first attempt at this crossfaded two shader layers and you could read both shapes
 * at once. The second fused them under a blur-and-threshold filter, which did produce
 * one body — but a 36px gaussian over the canvas destroys the thing the material is
 * actually made of. The chrome's character is its banding, and blurring it leaves grey
 * smoke.
 *
 * Both were attacking the problem from outside the shader. Inside it, the silhouette is
 * one line: `edgeRaw = img.r`, sampled from an image the library preprocesses into a
 * distance field. Distance fields are the one representation of a shape that
 * interpolates correctly — blend two of them and the result is a real shape the whole
 * way through, not a dissolve between two. So the morph belongs on that line, and
 * nothing else about the material has to change.
 *
 * This patches the stock fragment shader to sample a second field and mix, then mounts
 * it directly. No Three.js: `ShaderMount` already compiles arbitrary GLSL onto a full
 * screen quad, and pulling in a scene graph to host one quad would cost ~150KB of
 * bundle to do what twenty lines already do.
 *
 * The one constraint this imposes: the vertex shader carries a single
 * `u_imageAspectRatio`, derived from `u_image` by naming convention, so both fields
 * must share a frame. `morph-a.png` and `morph-b.png` are both 1400x506 — the wordmark
 * sets that aspect and the mark is fitted to height and centred in it.
 */

const MORPH_SHADER = (() => {
  const src = liquidMetalFragmentShader;

  const uniformAnchor = 'uniform sampler2D u_image;';
  const sampleAnchor = '  vec4 img = textureGrad(u_image, uv, dudx, dudy);';
  const edgeAnchor = `  if (u_isImage == true) {
    float edgeRaw = img.r;
    edge = blurEdge3x3(u_image, uv, dudx, dudy, 6., edgeRaw);`;
  const opacityAnchor = `    opacity = img.g;`;

  for (const [name, anchor] of Object.entries({ uniformAnchor, sampleAnchor, edgeAnchor, opacityAnchor })) {
    if (!src.includes(anchor)) {
      /* The patch is pinned to exact source text, so a library bump that rewrites any
         of these sites must fail loudly rather than silently rendering one shape. */
      throw new Error(`[morph-metal] liquidMetalFragmentShader no longer matches ${name}`);
    }
  }

  return src
    .replace(
      uniformAnchor,
      `uniform sampler2D u_image;
uniform sampler2D u_image2;
uniform float u_morph;
uniform float u_flow;`
    )
    .replace(
      sampleAnchor,
      `  vec4 img = textureGrad(u_image, uv, dudx, dudy);
  vec4 img2 = textureGrad(u_image2, uv, dudx, dudy);

  /* A single mix would change every part of the shape at the same instant, which reads
     as a machine blending two pictures. Offsetting the crossover by drifting noise
     makes the change arrive as a front travelling across the body — one edge gives way
     before another, the way something molten actually loses its shape. At u_flow = 0
     this collapses back to a plain mix.

     Computed here, before the branch, because the silhouette is built from two separate
     channels further down and both have to travel together. */
  float morphGrain = snoise(uv * 2.4 + vec2(t * 0.22, -t * 0.16)) * 0.5 + 0.5;
  float morphMix = smoothstep(0., 1., clamp(u_morph * (1. + u_flow) - morphGrain * u_flow, 0., 1.));`
    )
    .replace(
      edgeAnchor,
      `  if (u_isImage == true) {
    /* Assign, never declare: \`edge\` already exists in main, and a second declaration
       here would shadow it and leave the real one at zero. */
    edge = mix(
      blurEdge3x3(u_image, uv, dudx, dudy, 6., img.r),
      blurEdge3x3(u_image2, uv, dudx, dudy, 6., img2.r),
      morphMix
    );`
    )
    .replace(
      opacityAnchor,
      `    /* The other half of the silhouette. \`.r\` carries the contour and \`.g\` carries
       the coverage, and morphing only the first changes how the metal is banded while
       leaving the shape exactly where it was. */
    opacity = mix(img.g, img2.g, morphMix);`
    );
})();

/* The two prepared fields live for the life of the page, keyed by the pair that made
 * them.
 *
 * Nothing revokes these object URLs, and that is deliberate. An effect that revoked on
 * cleanup tore down the URLs while the shader was still loading them, because React
 * runs every effect twice in development and the second cleanup lands after the first
 * resolve. Two blobs held until navigation is the cheaper mistake, and the cache earns
 * it back anyway: preparing a field runs a Poisson solve, and this is what stops that
 * happening twice on mount and again on every hot reload. */
const fieldCache = {
  entries: new Map<string, Promise<[string, string]>>(),
  resolved: new Map<string, [string, string]>(),
  key: (a: string, b: string) => `${a}|${b}`,
  peek(a: string, b: string) {
    return this.resolved.get(this.key(a, b)) ?? null;
  },
  get(a: string, b: string) {
    const key = this.key(a, b);
    let pending = this.entries.get(key);
    if (!pending) {
      pending = Promise.all([toProcessedLiquidMetal(a), toProcessedLiquidMetal(b)]).then(
        ([fieldA, fieldB]) => {
          const pair: [string, string] = [
            URL.createObjectURL(fieldA.pngBlob),
            URL.createObjectURL(fieldB.pngBlob),
          ];
          this.resolved.set(key, pair);
          return pair;
        }
      );
      this.entries.set(key, pending);
    }
    return pending;
  },
};

export interface MorphMetalProps {
  /** Mask at morph 0. Must share pixel dimensions with `imageB`. */
  imageA: string;
  /** Mask at morph 1. */
  imageB: string;
  /** 0 = the first silhouette, 1 = the second. */
  morph: number;
  /** How far the crossover is spread across the body. 0 is a uniform blend. */
  flow?: number;
  colorBack: string;
  colorTint: string;
  scale: number;
  offsetX: number;
  offsetY: number;
  softness: number;
  contour: number;
  shiftRed: number;
  shiftBlue: number;
  rotation: number;
  angle: number;
  repetition: number;
  distortion: number;
  speed: number;
  frame: number;
  style?: React.CSSProperties;
  onReady?: () => void;
}

export function MorphMetal({
  imageA,
  imageB,
  morph,
  flow = 0.55,
  colorBack,
  colorTint,
  scale,
  offsetX,
  offsetY,
  softness,
  contour,
  shiftRed,
  shiftBlue,
  rotation,
  angle,
  repetition,
  distortion,
  speed,
  frame,
  style,
  onReady,
}: MorphMetalProps) {
  const [fields, setFields] = React.useState<[string, string] | null>(() => fieldCache.peek(imageA, imageB));

  const ready = React.useRef(onReady);
  ready.current = onReady;

  React.useEffect(() => {
    let alive = true;
    fieldCache
      .get(imageA, imageB)
      .then((pair) => {
        if (!alive) return;
        setFields(pair);
        ready.current?.();
      })
      .catch((error: unknown) => {
        /* A mask that fails to resolve must not take the page with it. MaskBoundary
           draws the flat mark instead. */
        console.error('[morph-metal] could not prepare a mask', error);
      });
    return () => {
      alive = false;
    };
  }, [imageA, imageB]);

  if (!fields) return null;

  return (
    <ShaderMount
      fragmentShader={MORPH_SHADER}
      frame={frame}
      mipmaps={['u_image', 'u_image2']}
      speed={speed}
      style={style}
      uniforms={{
        u_image: fields[0],
        u_image2: fields[1],
        u_morph: morph,
        u_flow: flow,
        u_colorBack: getShaderColorFromString(colorBack),
        u_colorTint: getShaderColorFromString(colorTint),
        u_contour: contour,
        u_distortion: distortion,
        u_softness: softness,
        u_repetition: repetition,
        u_shiftRed: shiftRed,
        u_shiftBlue: shiftBlue,
        u_angle: angle,
        u_isImage: true,
        u_shape: LiquidMetalShapes.none ?? 0,
        u_fit: ShaderFitOptions.contain,
        u_scale: scale,
        u_rotation: rotation,
        u_offsetX: offsetX,
        u_offsetY: offsetY,
        u_originX: 0.5,
        u_originY: 0.5,
        u_worldWidth: 0,
        u_worldHeight: 0,
      }}
    />
  );
}
