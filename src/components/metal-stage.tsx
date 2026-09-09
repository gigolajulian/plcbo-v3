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
import { POSES, useStageJourney } from '@/hooks/use-stage-journey';
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

/* How much a shape swells while it is molten, as a multiple of its resting size — one
 * figure per driver, because the two want very different things.
 *
 * The opening is allowed to be expansive: the metal arrives as a body with no shape at
 * all and gathers itself into the mark, and that wants room. A change of shape mid-page
 * does not. At the same 2.35 the mark swelled to 98% of the viewport's width and sat
 * there formless for 490px of scroll, which is why the transition read as broken rather
 * than as one shape becoming another — you saw the logo turn into a smear, not into a
 * wordmark. Capped now so the mass is always something you can see the whole of. */
const LOAD_SWELL = 2.35;
const MELT_SWELL = 1.28;

/* Rubber band.
 *
 * `easeInOutBack` draws the shape *back* before it lets go, flings it across, overshoots
 * its parking spot and settles — so the travel has a beginning, a release and a landing
 * instead of sliding at one speed. Velocity is zero at both ends, which matters: an
 * ease that starts fast would snap the stretch on at the first frame of the change.
 *
 * The mass elongates along the direction it is being pulled, hardest where the travel is
 * quickest and back to true at both ends. That is the difference between this and the
 * spin-and-shear flourishes that came out: this one is derived from the motion rather
 * than laid on top of it, so it is the band doing the stretching. */
const BACK = 1.70158;
const BACK_IO = BACK * 1.525;

const easeInOutBack = (t: number) =>
  t < 0.5
    ? (Math.pow(2 * t, 2) * ((BACK_IO + 1) * 2 * t - BACK_IO)) / 2
    : (Math.pow(2 * t - 2, 2) * ((BACK_IO + 1) * (2 * t - 2) + BACK_IO) + 2) / 2;

/** 0 at either end of the travel, 1 where it is moving fastest. */
const pullOf = (t: number) => 4 * t * (1 - t);

/** How far the mass elongates at full pull. */
const BAND_STRETCH = 0.24;

const lerp = (from: number, to: number, t: number) => from + (to - from) * t;
const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
/** 0 below `from`, 1 above `to`, linear in between. */
const ramp = (t: number, from: number, to: number) => clamp01((t - from) / (to - from));
/** Ramps up across a→b, holds at 1 to c, ramps back down across c→d. */
const hump = (t: number, a: number, b: number, c: number, d: number) =>
  Math.min(ramp(t, a, b), 1 - ramp(t, c, d));

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
  const { position, exit } = useStageJourney();

  /* Which placement a shape flies. On a portrait screen the wordmark stays centred
     rather than parking off the right edge, where there is no margin to park in and it
     would be almost entirely off screen. */
  const compact = useMedia('(max-width: 767px)');

  const [ready, setReady] = React.useState(false);
  const onReady = React.useCallback(() => setReady(true), []);

  /* 0 = a shapeless body of metal, 1 = the shape set. */
  const formation = useFormation(FORMATION_MS, ready, Boolean(reduceMotion));

  /* Where on the itinerary we are. Held at the first pose for a reader who asked for
     less motion — the object is then simply the mark, sitting still. */
  const last = POSES.length - 1;
  const pos = reduceMotion ? 0 : Math.min(position, last);
  const index = Math.min(Math.floor(pos), last);
  const next = Math.min(index + 1, last);
  const blend = pos - index;

  /* The melt, and the swap inside it. The metal loses its shape quickly, is held
     formless just long enough to exchange the mask under cover, and is set again by
     0.78 — well before the band has finished landing, so what you watch settle into
     place is the wordmark itself rather than an anonymous mass. */
  const melt = hump(blend, 0, 0.26, 0.42, 0.78);
  const swap = ramp(blend, 0.3, 0.38);

  /* One axis, three drivers. The load formation melts the metal once, on a timer; the
     change of shape melts it again, on scroll; and taking its leave melts it a third
     time, so the object goes back to being liquid and drains away rather than ghosting
     out at full polish. Whichever wants it more molten wins, so a reader who starts
     scrolling during the opening blends into the journey instead of fighting it. */
  const molten = Math.max(1 - formation, melt, exit * 0.85);
  const setness = 1 - molten;

  /* The opening: a plain fade up from the page ground, slow enough to read as the
     start of the shot rather than a layer switching on. */
  const born = ramp(formation, 0, 0.28);

  /* Two similar molten masses are not the same molten mass — the layers are separate
     shader instances with independent phase. Pooling the pair's opacity through the
     crossing covers that: there is no legible shape to protect at peak melt, and a
     shallow dip reads as the metal gathering rather than as a cut. */
  const dip = 1 - 0.35 * (1 - Math.abs(swap * 2 - 1));

  /* The object has two shapes and then it is done. It takes its leave as the work
     arrives rather than riding the rest of the page parked over the index, the services
     copy and the form. */
  const farewell = reduceMotion ? 1 : 1 - exit;

  /* The pose being flown, blended across the change. Both layers read the same
     geometry, which is the other half of why the swap cannot be seen. */
  const here = compact ? POSES[index].compact : POSES[index].wide;
  const there = compact ? POSES[next].compact : POSES[next].wide;
  /* The travel runs on the band's easing, so position and size both draw back,
     overshoot and settle together. */
  const t = easeInOutBack(blend);
  const pull = pullOf(blend);
  const rest = lerp(here.scale, there.scale, t);

  /* Position is `fx * 50vw + px`, so both halves interpolate and the CSS below can stay
     one calc(). See the note on `Placement` for why it is not a plain fraction.

     Nothing here spins, shears or bows. An earlier cut gave the change of shape its own
     roll and stretch and a curved path, on the theory that four identical melts down a
     page would read as a mechanism — and it read as forced instead, which is what
     motion laid *over* a material does rather than motion the material is doing. The
     melt is the whole move: the metal loses its shape, travels, and a new shape sets
     out of it. */
  const placeFx = lerp(here.fx, there.fx, t);
  const placePx = lerp(here.px, there.px, t);
  const placeY = lerp(here.y, there.y, t);

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
    return share * dip * born * farewell;
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
    scale:
      rest *
        (1 +
          Math.max(
            (1 - formation) * (LOAD_SWELL - 1),
            Math.max(melt, exit * 0.85) * (MELT_SWELL - 1),
          )) +
      drift.energy * 0.012 * grip,
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
              `scale(${(push * (1 + BAND_STRETCH * pull)).toFixed(4)}, ` +
              `${(push * (1 - BAND_STRETCH * 0.45 * pull)).toFixed(4)})`,
            transformOrigin: `${originX.toFixed(2)}% ${originY.toFixed(2)}%`,
            filter,
            willChange: 'transform, filter',
          }}
        >
          {/* Every mask mounted for the life of the page, one layer each. Swapping the
              image on a single layer instead would blank the object for a Poisson
              solve at every change of shape, and again on the way back up; all but the
              one or two on screen are parked at speed 0. */}
          {POSES.map((pose, i) => {
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
