"use client";

import * as React from 'react';
import {
  LiquidMetal,
  liquidMetalPresets,
  type LiquidMetalProps,
} from '@paper-design/shaders-react';
import { useReducedMotion } from 'framer-motion';

import { Mark } from '@/components/mark';
import { useFormation } from '@/hooks/use-formation';
import { usePointerDrift } from '@/hooks/use-pointer-drift';
import { asset } from '@/lib/asset';
import { cn } from '@/lib/utils';

/* liquidMetalPresets[2] is the "Backdrop" preset. Spread `.params`, never the preset
 * itself: a preset is `{ name, params }` and LiquidMetal takes the params flattened,
 * so spreading the wrapper passes an inert name/params pair and the shader silently
 * falls back to its defaults. */
const backdrop = liquidMetalPresets[2].params;

/* The ground is transparent, not the page colour: it is what lets the silhouette have
 * an alpha channel, which is what the extrusion below is built out of. An opaque
 * ground would cast its own rectangle instead of the shape. */
const CLEAR = 'rgba(8, 8, 10, 0)';

/* Silver, not violet — the accent read as painted plastic burned through metal, and it
 * stays where it belongs, in the rest of the page. Deep enough that the highlights have
 * somewhere to go; near-white left the whole thing one flat bright plane. */
const SILVER = '#c9c9d2';

/** How long the metal takes to gather itself into the mark, once it can. */
const FORMATION_MS = 6000;

const lerp = (from: number, to: number, t: number) => from + (to - from) * t;
const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
/** 0 below `from`, 1 above `to`, linear in between. */
const ramp = (t: number, from: number, to: number) => clamp01((t - from) / (to - from));

/** The shape never turns further than this off-face, on either axis. */
const MAX_TILT = 30;
/** How much of that budget the hover tilt spends; the rest is the drag's to use. */
const HOVER_TILT_X = 11;
const HOVER_TILT_Y = 13;

/* Degrees per pixel dragged, eased onto a ceiling rather than clamped at one: tanh only
 * ever approaches its limit, so the turn stays smooth however far the drag runs and
 * never hits a wall. */
const swing = (px: number, max: number) => max * Math.tanh((px * 0.19) / max);

/**
 * A side wall for a flat shader.
 *
 * Chained `drop-shadow`s each cast from the *result* of the one before, so three of them
 * a few pixels apart smear into one continuous extrusion rather than three separate
 * copies — a solid edge for a couple of filter operations rather than a second WebGL
 * context. The last one is a real shadow, blurred, which is what stops the whole thing
 * reading as a sticker.
 */
function extrusion(dx: number, dy: number, depth: number) {
  if (depth < 0.01) return 'none';
  const step = (n: number) => `drop-shadow(${(dx * n).toFixed(2)}px ${(dy * n).toFixed(2)}px 0 `;
  return (
    step(1) + '#20202a) ' +
    step(2) + '#15151c) ' +
    step(3) + '#0d0d12) ' +
    `drop-shadow(0 ${(16 * depth).toFixed(1)}px ${(28 * depth).toFixed(1)}px rgba(0,0,0,0.6))`
  );
}

/**
 * The masked layer, behind a Suspense boundary.
 *
 * Turning an image into the distance field the shader masks with is a rasterise plus a
 * Poisson solve — hundreds of milliseconds, not nothing. Until it lands the layer has
 * nothing to draw, and `suspendWhenProcessingImage` holds it out of the tree entirely
 * rather than letting it paint its flat ground over everything beneath it. `onReady` is
 * what starts the formation, so the two can never drift apart on a slower machine.
 */
function Masked({ onReady, ...props }: LiquidMetalProps & { onReady?: () => void }) {
  React.useEffect(() => {
    onReady?.();
  }, [onReady]);

  return <LiquidMetal suspendWhenProcessingImage {...props} />;
}

/**
 * A mask that 404s is not allowed to take the page down with it.
 *
 * `suspendWhenProcessingImage` throws the image load, so a bad path, a bad deploy or a
 * cache miss rethrows on render and unmounts the whole tree above it. That shipped once:
 * `/mark.svg` resolved to the domain root on GitHub Pages instead of the project path,
 * and the site rendered as an empty black document rather than a hero without a shader.
 */
class MaskBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.error('[metal] a mask failed to load', error);
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

export interface MetalMarkProps {
  /** A mask in `public/`; the shader reads its alpha as the silhouette. */
  mask: string;
  /**
   * The shader's own scale. From its vertex source the object box is a square whose
   * side is `scale × the container's longer edge`, with the mask contain-fitted inside
   * it — and since both PLCBO masks are wider than tall, drawn width = `scale × the
   * longer edge`. On a 1440-wide screen the 2.76:1 wordmark at 0.62 is 893px wide.
   *
   * Do not check that figure against the mark: its tint runs white to near-black, the
   * dark side of the letter vanishes into the near-black page, and the silhouette looks
   * about 78% of its real width.
   */
  scale: number;
  /** Portrait screens fit to width, so most shapes want to be bigger there. */
  compactScale: number;
  /**
   * Where the centre sits, as `fx × 50% + px` from the middle of the section. `fx: 0`
   * is centred; `fx: 1, px: -110` is 110px in from the right edge. Anchored to an edge
   * in pixels rather than scaled off the viewport because the copy it has to clear
   * lives in a shell that stops growing at 1200px — anything sized off the viewport
   * alone drifts across the text as the window widens.
   */
  fx?: number;
  px?: number;
  /** Vertical offset as a fraction of the section's height, negative up. */
  y?: number;
  /** Portrait screens have no margin to park in, so shapes come back to the middle. */
  compactFx?: number;
  compactPx?: number;
  compactY?: number;
  /**
   * Whether this one answers the pointer and plays the opening. Only the mark on the
   * first screen does: it is the thing the site opens on, and a second shape lower down
   * that tilted and could be thrown would be a toy rather than an interaction.
   */
  primary?: boolean;
  className?: string;
}

/**
 * One shape, in metal, inside the section it belongs to.
 *
 * This used to be a single fixed layer that travelled the whole document, melting and
 * setting into a different silhouette at each section it passed. That is gone. The two
 * screens are two screens: the mark belongs to the first and the wordmark to the second,
 * each drawn inside its own section and scrolling with it, with no transition between
 * them and no run of extra scroll to carry one into the other.
 *
 * The component parks itself when it is off screen — the shader is a per-frame GPU
 * program with no natural end, and `speed={0}` holds the current frame rather than
 * resetting it, so coming back is seamless.
 */
export function MetalMark({
  mask,
  scale,
  compactScale,
  fx = 0,
  px = 0,
  y = 0,
  compactFx = 0,
  compactPx = 0,
  compactY = 0,
  primary = false,
  className,
}: MetalMarkProps) {
  const reduceMotion = useReducedMotion();
  const frameRef = React.useRef<HTMLDivElement | null>(null);

  const [live, setLive] = React.useState(true);
  const [compact, setCompact] = React.useState(false);

  React.useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const sync = () => setCompact(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  React.useEffect(() => {
    const node = frameRef.current;
    const onVisibility = () => setLive(!document.hidden);
    document.addEventListener('visibilitychange', onVisibility);

    if (!node || typeof IntersectionObserver === 'undefined') {
      return () => document.removeEventListener('visibilitychange', onVisibility);
    }

    const io = new IntersectionObserver(
      ([entry]) => setLive(entry.isIntersecting && !document.hidden),
      { threshold: 0 },
    );
    io.observe(node);

    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      io.disconnect();
    };
  }, []);

  const [ready, setReady] = React.useState(false);
  const onReady = React.useCallback(() => setReady(true), []);

  /* 0 = a shapeless body of metal, 1 = the shape set. Only the opening plays this; the
     wordmark is simply there when you arrive at its screen. */
  const formation = useFormation(FORMATION_MS, ready, Boolean(reduceMotion) || !primary);
  const molten = 1 - formation;

  /* Pointer response is scaled by the formation, so nothing steers the metal until
     there is a shape to steer.

     Deliberately not gated on `live`. That flag exists to stop the shader burning a GPU
     on frames nobody is looking at; it has nothing to say about whether the shape should
     answer a pointer. Tying the two together meant a document that reported itself
     hidden at mount — a background tab, a restore from bfcache, an embedded view — came
     back with the handlers stripped off and a hero that ignored the cursor. */
  const { drift, handlers } = usePointerDrift(primary && !reduceMotion);
  const grip = primary ? formation : 0;

  /* The tilt is a real rotation of the plane the shader is drawn on, under a perspective
     — the shape turns to face the cursor rather than sliding around under it. Dragging
     turns it further and only turns it: it holds its place and swings on the spot,
     roughly a degree for every five pixels, walking back rather than snapping when let
     go. Hover and drag share one budget, so however hard it is thrown the shape never
     turns more than 30° off-face — far enough to read as a solid, never so far that it
     goes edge-on and disappears. */
  const tiltX = (-drift.y * HOVER_TILT_X - swing(drift.dragY, MAX_TILT - HOVER_TILT_X)) * grip;
  const tiltY = (drift.x * HOVER_TILT_Y + swing(drift.dragX, MAX_TILT - HOVER_TILT_Y)) * grip;

  /* The press swells the shape very slightly — and the origin of that swell travels to
     wherever the press landed and back again, so the surface moves outward from the
     point that was touched instead of from the middle. That is the whole ripple. */
  const push = 1 + drift.pulse * 0.022;
  const originX = lerp(50, ((drift.pressX + 1) / 2) * 100, drift.pulse);
  const originY = lerp(46, ((drift.pressY + 1) / 2) * 100, drift.pulse);

  /* The rise, and the opening only. */
  const rise = primary ? lerp(90, 0, formation) : 0;

  /* The side wall leans opposite the tilt, so the light stays consistent — and it
     belongs to a solid, so it arrives as the metal sets. Its offsets are in pixels, so
     they are scaled by how big this shape is: a seven-pixel wall on a small shape is a
     different object from one on the hero's mark. */
  const depth =
    (primary ? formation : 1) *
    (1 - drift.pulse * 0.35) *
    clamp01((compact ? compactScale : scale) / 0.49);
  const filter = extrusion(
    2.4 * depth - drift.x * 1.6 * grip,
    2.9 * depth - drift.y * 1.2 * grip,
    depth,
  );

  const placeFx = compact ? compactFx : fx;
  const placePx = compact ? compactPx : px;
  const placeY = compact ? compactY : y;

  /* The opening is a plain fade up from the page ground, slow enough to read as the
     start of the shot rather than a layer switching on. */
  const opacity = primary ? ramp(formation, 0, 0.28) : 1;

  return (
    <div
      ref={frameRef}
      aria-hidden="true"
      className={cn('absolute inset-0 overflow-hidden', className)}
      {...(primary ? handlers : {})}
    >
      <div className="absolute inset-0" style={{ perspective: '1500px' }}>
        <div
          className="absolute inset-0"
          style={{
            transform:
              `translate(calc(${placeFx} * 50% + ${placePx}px), ${(placeY * 100).toFixed(2)}%) ` +
              `translateY(${rise.toFixed(1)}px) ` +
              `rotateX(${tiltX.toFixed(2)}deg) rotateY(${tiltY.toFixed(2)}deg) ` +
              `scale(${push.toFixed(4)})`,
            transformOrigin: `${originX.toFixed(2)}% ${originY.toFixed(2)}%`,
            filter,
            willChange: 'transform, filter',
          }}
        >
          <MaskBoundary
            fallback={
              primary ? (
                <div className="absolute inset-0 grid place-items-center">
                  <Mark className="w-[46%] max-w-[560px] text-ink-2" title="PLCBO" />
                </div>
              ) : null
            }
          >
            <React.Suspense fallback={null}>
              <Masked
                {...backdrop}
                onReady={primary ? onReady : undefined}
                image={asset(mask)}
                colorBack={CLEAR}
                colorTint={SILVER}
                /* contain, not cover: cover crops, and the whole point is the
                   silhouette. */
                fit="contain"
                scale={(compact ? compactScale : scale) * (1 + molten * 1.35)}
                offsetX={(drift.x * 0.02 - drift.pressX * drift.pulse * 0.045) * grip}
                offsetY={(drift.y * 0.02 - drift.pressY * drift.pulse * 0.045) * grip}
                /* `contour` is the only parameter that deforms the silhouette rather
                   than the pattern painted over it, so it is what lets the opening churn
                   out of a shapeless mass. At rest it stays low, where the outline is
                   intact. Everything else here is the surface: molten and soft on the
                   way in, banded and tight once set, which is the difference between
                   plastic and metal. */
                softness={lerp(0.16, 0.85, molten)}
                contour={lerp(0.26, 1, molten)}
                shiftRed={lerp(0.03, 0.02, molten)}
                shiftBlue={lerp(0.04, 0.03, molten)}
                rotation={lerp(0, 7, molten)}
                angle={64 + drift.x * 46 * grip}
                repetition={lerp(3.8, 1.5, molten) + (drift.y * 0.35 + drift.pulse * 0.9) * grip}
                distortion={
                  lerp(0.28, 1, molten) +
                  (drift.energy * 0.04 + Math.abs(drift.y) * 0.04 + drift.pulse * 0.18) * grip
                }
                speed={
                  reduceMotion || !live
                    ? 0
                    : lerp(0.42, 1.1, molten) + drift.energy * 0.3 + drift.pulse * 0.6
                }
                frame={reduceMotion ? 8200 : 0}
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  opacity,
                }}
              />
            </React.Suspense>
          </MaskBoundary>
        </div>
      </div>
    </div>
  );
}
