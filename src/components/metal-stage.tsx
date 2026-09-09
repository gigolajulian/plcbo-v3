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
import { MORPHS, POSES, useStageJourney } from '@/hooks/use-stage-journey';
import { asset } from '@/lib/asset';

/* liquidMetalPresets[2] is the "Backdrop" preset. Spread `.params`, never the preset
 * itself: a preset is `{ name, params }` and LiquidMetal takes the params flattened,
 * so spreading the wrapper passes an inert name/params pair and the shader silently
 * falls back to its defaults. */
const backdrop = liquidMetalPresets[2].params;

/* The ground is transparent, not the page colour: it is what lets the silhouette have
 * an alpha channel, which is what the extrusion below is built out of. An opaque
 * ground would cast its own rectangle instead of the shape — and here it would also
 * paint over every section on the page. */
const CLEAR = 'rgba(8, 8, 10, 0)';

/* Silver, not violet — the accent read as painted plastic burned through metal, and
 * it stays where it belongs, in the rest of the page. Deep enough that the highlights
 * have somewhere to go; near-white left the whole thing one flat bright plane. */
const SILVER = '#c9c9d2';

/** How long the metal takes to gather itself into the mark, once it can. */
const FORMATION_MS = 6000;

/* How much a shape swells as it melts, as a multiple of its own resting size. One
 * rule for every pose, rather than a molten size per shape: the mark blooms to about
 * what it always did, and the small companions bloom proportionally instead of
 * exploding into a full-screen blob halfway down the page. */
const MELT_SWELL = 2.3;

const lerp = (from: number, to: number, t: number) => from + (to - from) * t;
/** Zoom has to be interpolated geometrically or the last third of it does all the work. */
const zoom = (from: number, to: number, t: number) => from * Math.pow(to / from, t);
const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
/** 0 below `from`, 1 above `to`, linear in between. */
const ramp = (t: number, from: number, to: number) => clamp01((t - from) / (to - from));
/** Ramps up across a→b, holds at 1 to c, ramps back down across c→d. */
const hump = (t: number, a: number, b: number, c: number, d: number) =>
  Math.min(ramp(t, a, b), 1 - ramp(t, c, d));
/** Slow in, slow out. */
const ease = (t: number) => t * t * (3 - 2 * t);

/** The shape never turns further than this off-face, on either axis. */
const MAX_TILT = 30;
/** How much of that budget the hover tilt spends; the rest is the drag's to use. */
const HOVER_TILT_X = 11;
const HOVER_TILT_Y = 13;

/* Degrees per pixel dragged, eased onto a ceiling rather than clamped at one: tanh
 * only ever approaches its limit, so the turn stays smooth however far the drag runs
 * and never hits a wall. */
const swing = (px: number, max: number) => max * Math.tanh((px * 0.19) / max);

/** A media query as a boolean, kept in sync. */
function useMedia(query: string) {
  const [matches, setMatches] = React.useState(false);

  React.useEffect(() => {
    const mq = window.matchMedia(query);
    const sync = () => setMatches(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, [query]);

  return matches;
}

/**
 * A side wall for a flat shader.
 *
 * Chained `drop-shadow`s each cast from the *result* of the one before, so three of
 * them a few pixels apart smear into one continuous extrusion rather than three
 * separate copies — a solid edge for a couple of filter operations rather than a
 * second WebGL context. The last one is a real shadow, blurred, which is what stops
 * the whole thing reading as a sticker.
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
 * A masked layer, behind its own Suspense boundary.
 *
 * Turning an image into the distance field the shader masks with is a rasterise plus a
 * Poisson solve — hundreds of milliseconds, not nothing. Until it lands the layer has
 * nothing to draw, and `suspendWhenProcessingImage` holds it out of the tree entirely
 * rather than letting it paint its flat ground over everything beneath it. `onReady`
 * is what starts the formation, so the two can never drift apart on a slower machine.
 *
 * Optional, because only the shape on screen at load has anything to say about when
 * the opening may begin.
 */
function StageLayer({ onReady, ...props }: LiquidMetalProps & { onReady?: () => void }) {
  React.useEffect(() => {
    onReady?.();
  }, [onReady]);

  return <LiquidMetal suspendWhenProcessingImage {...props} />;
}

/**
 * Nothing about a mask is allowed to take the page down with it.
 *
 * `suspendWhenProcessingImage` throws the image load, so a mask that 404s — a bad
 * path, a bad deploy, a cache miss — rethrows on render and unmounts the whole tree
 * above it. That shipped once: `/mark.svg` resolved to the domain root on GitHub Pages
 * instead of the project path, and the site rendered as an empty black document.
 *
 * The first shape falls back to the flat mark, the same one the nav and footer draw.
 * Every later shape falls back to nothing: they are company on a page that reads
 * perfectly well without them. Each gets its own boundary so one failing mask cannot
 * take the others with it.
 */
class MaskBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.error('[stage] a metal mask failed to load', error);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    if (this.props.fallback !== undefined) return this.props.fallback;

    return (
      <div className="absolute inset-0 grid place-items-center">
        <Mark className="w-[46%] max-w-[560px] text-ink-2" title="PLCBO" />
      </div>
    );
  }
}

/**
 * One body of metal, for the whole page.
 *
 * It used to live inside the hero and stop existing below it. Now it is fixed to the
 * viewport and travels the entire document, melting and setting into a different shape
 * at each of the sections listed in `POSES` — the mark, the wordmark, an aperture, a
 * film frame, an arrow.
 *
 * **Every change of shape hides inside a melt.** `contour` is the only shader
 * parameter that deforms the silhouette rather than the pattern painted over it, so
 * running it up turns a mask into a shapeless mass. Each swap is timed to the peak of
 * that mass, where there is no legible shape on screen for a transition to be seen
 * happening to. The alternative is crossfading two legible shapes, and this component
 * already tried handing one shader to another in plain view — it read as exactly what
 * it was, and was deleted.
 *
 * It sits at `z-0` under `<main>`, so every section paints over it: the copy stays
 * legible, and the Clients band — the one section with an opaque ground — covers the
 * object completely, which is exactly what that hard cut in the page wants.
 */
export function MetalStage() {
  const reduceMotion = useReducedMotion();
  const position = useStageJourney();

  /* Two thresholds, because two different things are being decided.
     `compact` is which placement a shape flies: on a portrait screen the wordmark
     stays centred rather than parking off the right edge, where it would be almost
     entirely off screen.
     `roomy` is whether the parked companions exist at all. They live in the margin
     beside the copy, and that margin only exists on a wide window — below it they land
     on the Services descriptions and the Studio counters. It is also what keeps five
     WebGL contexts off phones, which is the heaviest thing on the site. */
  const compact = useMedia('(max-width: 767px)');
  const roomy = useMedia('(min-width: 1400px)');

  const shapes = roomy ? POSES.length : 2;

  const [ready, setReady] = React.useState(false);
  const onReady = React.useCallback(() => setReady(true), []);

  /* 0 = a shapeless body of metal, 1 = the shape set. */
  const formation = useFormation(FORMATION_MS, ready, Boolean(reduceMotion));

  /* Where on the itinerary we are. Held at the first pose for a reader who asked for
     less motion — the object is then simply the mark, sitting still. */
  const pos = reduceMotion ? 0 : Math.min(position, shapes - 1);
  const index = Math.min(Math.floor(pos), shapes - 1);
  const next = Math.min(index + 1, shapes - 1);
  const blend = pos - index;

  /* The melt, and the swap inside it. `hump` holds the metal at full molten across the
     middle fifth of the change, and the crossfade sits inside that plateau — so the
     mask being exchanged is never a shape anybody can see. */
  const melt = hump(blend, 0, 0.4, 0.6, 1);
  const swap = ramp(blend, 0.44, 0.56);

  /* One axis, two drivers. The load formation melts the metal once, on a timer; the
     journey melts it again at every change of shape, on scroll. Whichever wants it
     more molten wins, so a reader who starts scrolling during the opening blends into
     the journey instead of fighting it. */
  const molten = Math.max(1 - formation, melt);
  const setness = 1 - molten;

  /* The opening: a plain fade up from the page ground, slow enough to read as the
     start of the shot rather than a layer switching on. */
  const born = ramp(formation, 0, 0.28);

  /* Two similar molten masses are not the same molten mass — the layers are separate
     shader instances with independent phase. Pooling the pair's opacity through the
     crossing covers that: there is no legible shape to protect at peak melt, and a
     shallow dip reads as the metal gathering rather than as a cut. */
  const dip = 1 - 0.35 * (1 - Math.abs(swap * 2 - 1));

  /* Where there is no margin to park in, the object leaves once the hero and the
     statement have had their moment, rather than riding down the page on top of the
     copy. */
  const farewell = roomy ? 1 : 1 - clamp01(position - 1);

  /* The pose being flown, blended across the change. Both layers read the same
     geometry, which is the other half of why the swap cannot be seen. */
  const here = compact ? POSES[index].compact : POSES[index].wide;
  const there = compact ? POSES[next].compact : POSES[next].wide;
  const t = ease(blend);
  const rest = lerp(here.scale, there.scale, t);
  const presence = lerp(POSES[index].opacity, POSES[next].opacity, t);

  /* How this particular change carries itself. Four identical melts down one page read
     as a mechanism; these give each one its own movement, and all of them are scaled by
     the melt so they are exactly zero wherever a shape is set and legible. */
  const morph = MORPHS[Math.min(index, MORPHS.length - 1)];
  const arc = Math.sin(Math.PI * blend);

  /* Position is `fx * 50vw + px`, so both halves interpolate and the CSS below can
     stay one calc(). See the note on `Placement` for why it is not a plain fraction. */
  const placeFx = lerp(here.fx, there.fx, t);
  const placePx = lerp(here.px, there.px, t);
  /* The path bows rather than sliding straight between two parking spots. */
  const placeY = lerp(here.y, there.y, t) + morph.bow * arc;
  const spin = lerp(POSES[index].tilt, POSES[next].tilt, t) + morph.spin * melt;
  const stretchX = 1 + morph.stretchX * melt;
  const stretchY = 1 + morph.stretchY * melt;
  const skew = morph.skew * melt;

  /* Pointer response belongs to the hero. It is scaled by the formation, so nothing
     steers the metal until there is a shape to steer, and faded out as the object
     leaves its first pose — dragging a companion parked in the margin while reading
     the work would be a toy, not an interaction. */
  /* Deliberately not gated on anything to do with visibility. Tying the handlers to a
     "is this on screen" flag meant a document that reported itself hidden at mount — a
     background tab, a restore from bfcache, an embedded view — came back with them
     stripped off and a hero that ignored the cursor. The drift loop costs nothing
     while no one is interacting: it only runs between a pointer event and the value
     settling. */
  const grip = formation * clamp01(1 - pos * 1.6);
  const { drift, handlers } = usePointerDrift(!reduceMotion);

  /* The tilt is a real rotation of the plane the shader is drawn on, under a
     perspective — the shape turns to face the cursor rather than sliding around under
     it. Dragging turns it further and only turns it: it holds its place and swings on
     the spot, roughly a degree for every five pixels, walking back rather than
     snapping when let go.
     Hover and drag share one budget, so however hard it is thrown the shape never
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

  /* The rise, and the opening only: the journey moves the object around the screen
     rather than dropping it back under the fold. */
  const rise = lerp(90, 0, formation);

  /* The side wall leans opposite the tilt, so the light stays consistent — and it
     belongs to a solid, so it goes as the metal melts and comes back as it sets. Its
     offsets are in pixels, so they are scaled by how big the shape currently is:
     a seven-pixel wall on a ninety-pixel aperture is a different object from a
     seven-pixel wall on the hero's mark. */
  const depth = setness * (1 - drift.pulse * 0.35) * clamp01(rest / POSES[0].wide.scale);
  const filter = extrusion(
    2.4 * depth - drift.x * 1.6 * grip,
    2.9 * depth - drift.y * 1.2 * grip,
    depth,
  );

  /** Only the shape being left and the shape arriving are ever legible. */
  const layerOpacity = (i: number) => {
    const share = i === index ? 1 - swap : i === next && next !== index ? swap : 0;
    return share * dip * presence * born * farewell;
  };

  /** A layer nobody can see is parked, not merely transparent. */
  const speedFor = (opacity: number) =>
    reduceMotion || opacity < 0.01
      ? 0
      : lerp(0.42, 1.1, molten) + drift.energy * 0.3 + drift.pulse * 0.6;

  /* Everything the layers hold in common. Only the mask and the opacity differ. */
  const surface = {
    ...backdrop,
    colorBack: CLEAR,
    colorTint: SILVER,
    /* contain, not cover: cover crops, and the whole point is the silhouette. */
    fit: 'contain' as const,
    scale: zoom(rest, rest * MELT_SWELL, molten) + drift.energy * 0.012 * grip,
    /* the press also shoves the pattern away from where it landed, so the churn has a
       direction rather than just happening everywhere */
    offsetX: (drift.x * 0.02 - drift.pressX * drift.pulse * 0.045) * grip,
    offsetY: (drift.y * 0.02 - drift.pressY * drift.pulse * 0.045) * grip,
    /* `contour` is the morph — see the note on the component above. Everything else
       here is the surface: molten and soft while it flows, banded and tight once set,
       which is the difference between plastic and metal. */
    softness: lerp(0.16, 0.85, molten),
    contour: lerp(0.26, 1, molten),
    shiftRed: lerp(0.03, 0.02, molten),
    shiftBlue: lerp(0.04, 0.03, molten),
    rotation: lerp(0, 7, molten),
    /* the pointer drives the flow once there is a shape to drive */
    angle: 64 + drift.x * 46 * grip,
    repetition: lerp(3.8, 1.5, molten) + (drift.y * 0.35 + drift.pulse * 0.9) * grip,
    distortion:
      lerp(0.28, 1, molten) +
      (drift.energy * 0.04 + Math.abs(drift.y) * 0.04 + drift.pulse * 0.18) * grip,
    frame: reduceMotion ? 8200 : 0,
    style: { position: 'absolute' as const, inset: 0, width: '100%', height: '100%' },
  };

  return (
    /* Fixed, at the bottom of the stack. `<main>` is z-10 above it and its sections are
       transparent, so the object shows through the page rather than behind it — and the
       hero section is `pointer-events-none` so the drag reaches this layer, with only
       the CTA row inside it taking clicks back. */
    <div
      aria-hidden="true"
      className="fixed inset-0 z-0 overflow-hidden"
      style={{ pointerEvents: grip > 0.05 ? 'auto' : 'none' }}
      {...handlers}
    >
      <div className="absolute inset-0" style={{ perspective: '1500px' }}>
        <div
          className="absolute inset-0"
          style={{
            transform:
              `translate(calc(${placeFx.toFixed(4)} * 50vw + ${placePx.toFixed(1)}px), ` +
              `${(placeY * 100).toFixed(2)}%) ` +
              `translateY(${rise.toFixed(1)}px) ` +
              `rotateX(${tiltX.toFixed(2)}deg) rotateY(${tiltY.toFixed(2)}deg) ` +
              `rotate(${spin.toFixed(2)}deg) skewX(${skew.toFixed(2)}deg) ` +
              `scale(${(push * stretchX).toFixed(4)}, ${(push * stretchY).toFixed(4)})`,
            transformOrigin: `${originX.toFixed(2)}% ${originY.toFixed(2)}%`,
            filter,
            willChange: 'transform, filter',
          }}
        >
          {/* Every mask mounted for the life of the page, one layer each. Swapping the
              image on a single layer instead would blank the object for a Poisson
              solve at every change of shape, and again on the way back up; all but the
              one or two on screen are parked at speed 0. */}
          {POSES.slice(0, shapes).map((pose, i) => {
            const opacity = layerOpacity(i);
            return (
              <MaskBoundary key={pose.mask} fallback={i === 0 ? undefined : null}>
                <React.Suspense fallback={null}>
                  <StageLayer
                    {...surface}
                    onReady={i === 0 ? onReady : undefined}
                    image={asset(pose.mask)}
                    speed={speedFor(opacity)}
                    style={{ ...surface.style, opacity }}
                  />
                </React.Suspense>
              </MaskBoundary>
            );
          })}
        </div>
      </div>

      <div className="grain absolute inset-0" />
    </div>
  );
}
