"use client";

import * as React from 'react';
import {
  LiquidMetal,
  liquidMetalPresets,
  type LiquidMetalProps,
} from '@paper-design/shaders-react';
import { motion, useMotionValueEvent, useReducedMotion } from 'framer-motion';

import { Mark } from '@/components/mark';
import { Button } from '@/components/ui/button';
import { useFormation } from '@/hooks/use-formation';
import { usePointerDrift } from '@/hooks/use-pointer-drift';
import { useScrollProgress } from '@/hooks/use-parallax';
import { asset } from '@/lib/asset';
import { cn } from '@/lib/utils';

/* liquidMetalPresets[2] is the "Backdrop" preset. Spread `.params`, never the preset
 * itself: a preset is `{ name, params }` and LiquidMetal takes the params flattened,
 * so spreading the wrapper passes an inert name/params pair and the shader silently
 * falls back to its defaults. */
const backdrop = liquidMetalPresets[2].params;

/* The masked layer's ground is transparent, not the page colour: it is what lets the
 * silhouette have an alpha channel, which is what the extrusion below is built out
 * of. An opaque ground would cast its own rectangle instead of the letter. */
const CLEAR = 'rgba(8, 8, 10, 0)';

/* Silver, not violet — the accent read as painted plastic burned through metal, and
 * it stays where it belongs, in the rest of the page. Deeper than it was: the tint is
 * the body of the surface, so leaving it near-white left the highlights nowhere to go
 * and the whole thing read as one flat bright plane. */
const SILVER = '#c9c9d2';

/** How long the metal takes to gather itself into the mark, once it can. */
const FORMATION_MS = 6000;

/* The runway. 340vh of section wrapping a viewport-tall sticky stage gives 240vh of
 * scroll during which the hero is held on screen and the metal works through its
 * journey. It is the page's one pinned moment — the Intro below it used to pin too and
 * gave that up for this, because two in a row reads as a demo reel. */
const RUNWAY_VH = 340;

const lerp = (from: number, to: number, t: number) => from + (to - from) * t;
/** Zoom has to be interpolated geometrically or the last third of it does all the work. */
const zoom = (from: number, to: number, t: number) => from * Math.pow(to / from, t);
const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
/** 0 below `from`, 1 above `to`, linear in between. */
const ramp = (t: number, from: number, to: number) => clamp01((t - from) / (to - from));
/** Ramps up across a→b, holds at 1 to c, ramps back down across c→d. */
const hump = (t: number, a: number, b: number, c: number, d: number) =>
  Math.min(ramp(t, a, b), 1 - ramp(t, c, d));
/** The mark never turns further than this off-face, on either axis. */
const MAX_TILT = 30;
/** How much of that budget the hover tilt spends; the rest is the drag's to use. */
const HOVER_TILT_X = 11;
const HOVER_TILT_Y = 13;

/* Degrees per pixel dragged, eased onto a ceiling rather than clamped at one: tanh
 * only ever approaches its limit, so the turn stays smooth however far the drag
 * runs and never hits a wall. */
const swing = (px: number, max: number) => max * Math.tanh((px * 0.19) / max);

/* Where each silhouette rests. They need separate numbers because `fit="contain"`
 * treats them differently — the mark is 1.22:1 and fits to height in a landscape
 * window, the wordmark is 2.76:1 and fits to width — so one shared size had the word
 * running off both edges of the screen. Each also keeps a portrait value, for the
 * reason the mark always did: fitted to width on a narrow screen it reads as a badge
 * rather than a backdrop.
 *
 * `lift` is the shader's own offsetY axis, where negative is up. Both shapes have to
 * leave the CTA row its ground, and the wordmark needs more of a lift than the mark
 * because it is a band across the middle rather than a tall letter. */
type Rest = { wide: number; compact: number; lift: number };
const MARK_REST: Rest = { wide: 0.49, compact: 0.74, lift: -0.03 };
const WORD_REST: Rest = { wide: 0.52, compact: 0.9, lift: -0.1 };

/* Glass, over metal.
 *
 * Four things together, and it stops working if any of them is dropped: a heavy
 * backdrop blur so the mark behind smears rather than showing through legibly; a
 * saturation lift so what does come through keeps its colour instead of going grey;
 * a hairline top-edge inset highlight, which is the specular catch that makes a pane
 * read as a solid object rather than a translucent rectangle; and a soft drop shadow
 * so it sits above the metal instead of being painted onto it.
 *
 * The two buttons differ only in how much light they hold, which is what keeps the
 * primary action primary now that neither is a solid fill. */
const GLASS =
  'rounded-full border backdrop-blur-2xl backdrop-saturate-150 ' +
  'transition-[background-color,border-color] duration-300';

const GLASS_PRIMARY =
  'border-white/25 bg-white/[0.18] text-foreground hover:border-white/40 hover:bg-white/[0.26]';

const GLASS_SECONDARY =
  'border-white/15 bg-white/[0.07] text-foreground hover:border-white/30 hover:bg-white/[0.13]';

/* The shadows go in a style attribute, not a Tailwind arbitrary value. `shadow-[…]`
 * with two shadows and rgba() commas inside silently generates nothing — the computed
 * box-shadow came back as Tailwind's empty default and the specular edge, the part
 * that does the actual work, was simply absent. */
const glassShadow = (specular: number, drop: number, spread: number) =>
  `inset 0 1px 0 rgba(255,255,255,${specular}), 0 ${drop}px ${spread}px rgba(0,0,0,0.45)`;

/**
 * A side wall for a flat shader.
 *
 * Chained `drop-shadow`s each cast from the *result* of the one before, so three of
 * them at a few pixels apart smear into one continuous extrusion rather than three
 * separate copies — a solid edge on the mark for a couple of filter operations
 * rather than a second WebGL context. The last one is a real shadow, blurred, which
 * is what stops the whole thing reading as a sticker.
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
 * nothing to draw and paints its flat ground over everything beneath it, which is
 * what an early version of this did: the open field came up, went black for two
 * seconds, and the mark appeared out of the dark. `suspendWhenProcessingImage` holds
 * the layer out of the tree entirely until its mask is ready, and `onReady` is what
 * starts the formation — so the two are never out of step, on any machine.
 *
 * `onReady` is optional because only the layer that is on screen at load has anything
 * to say about when the opening may begin.
 */
function MarkMetal({ onReady, ...props }: LiquidMetalProps & { onReady?: () => void }) {
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
 * above it. That shipped once: `/mark.svg` resolved to the domain root on GitHub
 * Pages instead of the project path, and the site rendered as an empty black
 * document rather than a hero without a shader in it.
 *
 * The mark's layer falls back to the flat mark — the same `Mark` the nav and the
 * footer draw, so there is no second asset to keep in step. The wordmark's layer
 * passes `fallback={null}`: it is the second half of a scroll journey, not the hero,
 * so if only that mask fails the metal simply never changes shape and everything else
 * carries on. Each gets its own boundary so one failing cannot take the other with it.
 */
class MetalBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.error('[hero] a metal mask failed to load', error);
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

export interface LiquidMetalHeroProps {
  /** Carried by the mark visually; kept in the DOM for screen readers and search. */
  title: string;
  subtitle?: string;
  /**
   * The shape the metal settles into. Any image with transparency: the shader reads
   * its alpha as the mask and its edges as the flow contour.
   */
  image?: string;
  /** The shape it melts into and back out of, halfway down the journey. */
  wordmark?: string;
  primaryCtaLabel: string;
  secondaryCtaLabel?: string;
  onPrimaryCtaClick: () => void;
  onSecondaryCtaClick?: () => void;
  className?: string;
}

export default function LiquidMetalHero({
  title,
  subtitle,
  image = asset('/mark-mask.png'),
  wordmark = asset('/wordmark-mask.png'),
  primaryCtaLabel,
  secondaryCtaLabel,
  onPrimaryCtaClick,
  onSecondaryCtaClick,
  className,
}: LiquidMetalHeroProps) {
  const reduceMotion = useReducedMotion();

  /* Two refs with two jobs. The runway is the tall section, and its pass is the
     journey; the stage is the viewport-sized sticky child, and it is what the pointer
     measures against and what decides whether the shader is worth drawing. Putting
     either on the other is a real bug: pointer coordinates taken from a 340vh box are
     wrong by a factor of three, and a 340vh box goes on intersecting long after the
     pin has released, so the shader would keep burning frames through the Intro. */
  const { ref: runwayRef, progress } = useScrollProgress();
  const stageRef = React.useRef<HTMLDivElement | null>(null);

  const [journey, setJourney] = React.useState(0);
  useMotionValueEvent(progress, 'change', (v) => {
    /* Rounded for the same reason `usePointerDrift` rounds: these numbers feed a
       dozen shader uniforms through React, and sub-pixel scroll noise should not
       cost a render. */
    setJourney(Math.round(v * 1000) / 1000);
  });

  /* The shader is a per-frame GPU program with no natural end. Left alone it keeps
     drawing for the whole length of the page, long after the hero has scrolled away
     — so it is parked whenever it is off screen or the tab is hidden. speed 0 holds
     the current frame rather than resetting it, so coming back is seamless. */
  const [live, setLive] = React.useState(true);

  React.useEffect(() => {
    const node = stageRef.current;
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

  /* The mark is fitted, so on a narrow portrait window it is fitted to the width and
     ends up reading as a badge rather than a backdrop. It keeps more of the frame
     there. */
  const [compact, setCompact] = React.useState(false);

  React.useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const sync = () => setCompact(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  const [ready, setReady] = React.useState(false);
  const onReady = React.useCallback(() => setReady(true), []);

  /* 0 = a shapeless body of metal, 1 = the shape set. */
  const formation = useFormation(FORMATION_MS, ready, Boolean(reduceMotion));

  /* ── the journey ──────────────────────────────────────────────────────────
     Scrolling melts the mark down, sets the wordmark out of the liquid, holds it, and
     brings the mark back. `contour` is what makes that possible — it is the only
     parameter that deforms the silhouette rather than the pattern painted over it, so
     running it up melts the mask into a shapeless mass and walking it down sets a
     shape out of that mass.

     Which means the shape swap can hide *inside* the melt: at the peak there is no
     letter on screen, only liquid, so that is where one mask hands over to the other.
     The alternative was a crossfade between two legible shapes, and this hero already
     tried handing one shader to another in plain view — it read as exactly what it was
     and was deleted. */
  const j = reduceMotion ? 0 : journey;

  /* Two humps with a hold between them. The first 10% is a dead zone so a stray
     scroll does not disturb a mark that has only just finished forming. */
  const melt = Math.max(hump(j, 0.1, 0.38, 0.44, 0.66), hump(j, 0.74, 0.86, 0.9, 1));

  /* 0 = the mark, 1 = the wordmark. Both switches sit inside a melt peak. */
  const shape = ramp(j, 0.38, 0.44) - ramp(j, 0.86, 0.9);

  /* One axis, two drivers. The load formation melts the metal once, on a timer; the
     journey melts it again, on scroll. Whichever wants it more molten wins, so a
     reader who starts scrolling during the opening blends into the journey instead of
     fighting it — the same trick `grip` plays for the pointer. Every `lerp` below
     reads set-value first, molten-value second. */
  const molten = Math.max(1 - formation, melt);
  const setness = 1 - molten;

  /* One layer, one move. There used to be a second `metaballs` layer under this one,
     covering the moment the mask spends being computed, with a 200ms crossfade
     between them — and it read as exactly what it was: a different material
     dissolving into this one. Two *different* shaders cannot hand over invisibly.

     So the opening is a plain fade up from the page ground, slow enough to read as
     the start of the shot rather than a layer switching on. */
  const markOpacity = ramp(formation, 0, 0.28);

  /* The two silhouettes are separate shader instances with independent phase, so at
     the midpoint of a swap they are two similar molten masses rather than the same
     one. Pooling the pair's opacity through the crossing covers that: there is no
     legible shape to protect at peak melt, and a shallow dip reads as the metal
     gathering rather than as a cut. Raise the 0.35 if it ever ghosts. */
  const cross = 1 - Math.abs(shape * 2 - 1);
  const dip = 1 - 0.35 * cross;
  const markLayerOpacity = (1 - shape) * markOpacity * dip;
  const wordLayerOpacity = shape * markOpacity * dip;

  /* Pointer response is scaled by the formation, so nothing steers the metal until
     there is a mark to steer. */
  /* Deliberately not gated on `live`. That flag exists to stop the shader burning a
     GPU on frames nobody is looking at; it has nothing to say about whether the mark
     should answer a pointer. Tying the two together meant a document that reported
     itself hidden at mount — a background tab, a restore from bfcache, an embedded
     view — came back with the handlers stripped off and a hero that ignored the
     cursor. The drift loop costs nothing while no one is interacting: it only runs
     between a pointer event and the value settling. */
  const interactive = !reduceMotion;
  const { drift, handlers } = usePointerDrift(interactive);
  const grip = formation;

  /* The tilt is a real rotation of the plane the shader is drawn on, under a
     perspective — the mark turns to face the cursor rather than sliding around
     under it. The press nudge pushes it away and lets it come back.

     Dragging turns it further, and only turns it: the mark holds its place in the
     composition and swings on the spot, roughly a degree for every five pixels
     dragged. Letting go walks the angle back rather than snapping it.

     The two share one budget. Hover spends a fixed slice of MAX_TILT and the drag
     eases onto whatever is left, so however hard it is thrown the mark never turns
     more than 30° off-face — far enough to read as a solid, never so far that it
     goes edge-on and disappears. */
  const tiltX = (-drift.y * HOVER_TILT_X - swing(drift.dragY, MAX_TILT - HOVER_TILT_X)) * grip;
  const tiltY = (drift.x * HOVER_TILT_Y + swing(drift.dragX, MAX_TILT - HOVER_TILT_Y)) * grip;

  /* The press swells the mark very slightly — and the origin of that swell travels
     to wherever the press landed and back again, so the surface moves outward from
     the point that was touched instead of from the middle of the letter. That is the
     whole ripple: a scale of two percent about a moving origin, with the shader's
     own churn under it. */
  const push = 1 + drift.pulse * 0.022;
  const originX = lerp(50, ((drift.pressX + 1) / 2) * 100, drift.pulse);
  const originY = lerp(46, ((drift.pressY + 1) / 2) * 100, drift.pulse);

  /* The rise, and the opening only — the journey melts in place rather than dropping
     back under the fold. Done here rather than through the shader's own offset: the
     offset is measured against the fitted object box, so it moves the mark by a
     couple of percent of the viewport where this moves it by a visible distance. */
  const rise = lerp(90, 0, formation);

  /* The side wall leans opposite the tilt, so the mark keeps a consistent light — and
     it belongs to a solid, so it goes as the metal melts and comes back as it sets.
     At load `setness` is the formation, so this is unchanged there. */
  const depth = setness * (1 - drift.pulse * 0.35);
  const filter = extrusion(2.4 * depth - drift.x * 1.6 * grip, 2.9 * depth - drift.y * 1.2 * grip, depth);

  /* The CTAs duck for the melt, so they follow it rather than a scroll number — which
     makes them symmetric for free, out on the way into each melt and back on the way
     out, without a second set of thresholds to keep in step.

     `melt` and not `molten`: the opening is molten too, and hanging the buttons off
     that left them at a tenth of their opacity for the whole six seconds the mark
     takes to gather. Their arrival is the framer transition below, as it always was;
     this only takes them away again once scrolling melts what they sit under. */
  const ctaOpacity = clamp01(1 - melt * 1.4);

  /* Everything the two layers hold in common. Only the mask, the resting size and the
     opacity differ, so those are passed per layer and this is spread into both. */
  const surface = {
    ...backdrop,
    colorBack: CLEAR,
    colorTint: SILVER,
    /* contain, not cover: cover crops, and the whole point is the silhouette. */
    fit: 'contain' as const,
    /* the press also shoves the pattern away from where it landed, so the churn has a
       direction rather than just happening everywhere */
    offsetX: (drift.x * 0.02 - drift.pressX * drift.pulse * 0.045) * grip,
    /* `contour` is the morph — see the journey block above. Everything else here is
       the surface: molten and soft while it flows, banded and tight once set, which
       is the difference between plastic and metal. */
    softness: lerp(0.16, 0.85, molten),
    contour: lerp(0.26, 1, molten),
    shiftRed: lerp(0.03, 0.02, molten),
    shiftBlue: lerp(0.04, 0.03, molten),
    rotation: lerp(0, 7, molten),
    /* the pointer drives the flow once there is a mark to drive */
    angle: 64 + drift.x * 46 * grip,
    repetition: lerp(3.8, 1.5, molten) + (drift.y * 0.35 + drift.pulse * 0.9) * grip,
    distortion:
      lerp(0.28, 1, molten) +
      (drift.energy * 0.04 + Math.abs(drift.y) * 0.04 + drift.pulse * 0.18) * grip,
    frame: reduceMotion ? 8200 : 0,
  };

  const layerStyle = {
    position: 'absolute' as const,
    inset: 0,
    width: '100%',
    height: '100%',
  };

  /** A layer nobody can see is parked, not merely transparent. */
  const speedFor = (opacity: number) =>
    reduceMotion || !live || opacity < 0.01
      ? 0
      : lerp(0.42, 1.1, molten) + drift.energy * 0.3 + drift.pulse * 0.6;

  /* Where a silhouette sits and how big it is at rest, inflated back toward a single
     shapeless mass as it melts — so both shapes converge on the same body of metal at
     the swap, which is half of why the swap cannot be seen. */
  const geometry = (rest: Rest) => ({
    scale: zoom(compact ? rest.compact : rest.wide, 1.15, molten) + drift.energy * 0.012 * grip,
    offsetY:
      lerp(rest.lift, -0.03, molten) +
      (drift.y * 0.02 - drift.pressY * drift.pulse * 0.045) * grip,
  });

  const stage = (
    <div
      ref={stageRef}
      {...handlers}
      /* No overflow-hidden here — the shader layer below clips itself, and clipping at
         this level would cut the CTA row on a short window. */
      className="sticky top-0 h-[100svh]"
    >
      {/* ── the metal ──────────────────────────────────────────────────────
        Scoped to the hero rather than fixed at z-index -10. A negative z-index
        only stays visible while nothing above it paints an opaque ground, and
        every section below this one does. */}
      <div className="absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
        {/* the ground the shader composites onto, and the fallback if the browser
            hands back no WebGL context at all */}
        <div className="absolute inset-0 bg-background" />

        {/* Both silhouettes. With an image the `shape` prop is ignored: the metal
            fills the mask's alpha and everything outside it stays transparent. They
            share this one transformed wrapper, so the tilt, the drag, the ripple and
            the extrusion apply to whichever is visible without being duplicated. */}
        <div className="absolute inset-0" style={{ perspective: '1500px' }}>
          <div
            className="absolute inset-0"
            style={{
              transform: `translate3d(0, ${rise.toFixed(1)}px, 0) rotateX(${tiltX.toFixed(2)}deg) rotateY(${tiltY.toFixed(2)}deg) scale(${push.toFixed(4)})`,
              transformOrigin: `${originX.toFixed(2)}% ${originY.toFixed(2)}%`,
              filter,
              willChange: 'transform, filter',
            }}
          >
            {/* Two masks, both mounted for the life of the hero. Swapping `image` on
                one layer instead would blank the hero for the length of a Poisson
                solve every time the reader crossed a transition — and again on the
                way back up. Two layers is fewer moving parts than making one layer
                safe to re-mask. Separate Suspense boundaries so the wordmark's mask
                being slower cannot hold the mark's opening back. */}
            <MetalBoundary>
              <React.Suspense fallback={null}>
                <MarkMetal
                  {...surface}
                  onReady={onReady}
                  image={image}
                  {...geometry(MARK_REST)}
                  speed={speedFor(markLayerOpacity)}
                  style={{ ...layerStyle, opacity: markLayerOpacity }}
                />
              </React.Suspense>
            </MetalBoundary>

            <MetalBoundary fallback={null}>
              <React.Suspense fallback={null}>
                <MarkMetal
                  {...surface}
                  image={wordmark}
                  {...geometry(WORD_REST)}
                  speed={speedFor(wordLayerOpacity)}
                  style={{ ...layerStyle, opacity: wordLayerOpacity }}
                />
              </React.Suspense>
            </MetalBoundary>
          </div>
        </div>

        {/* The metal is the page now, so there is no full-field scrim over it. This
            is the one exception: a short vignette at the foot of the hero, so the
            CTAs sit on a settled ground however bright the frame under them runs. */}
        <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-background via-background/75 to-transparent" />
        <div className="grain absolute inset-0" />
      </div>

      <motion.div
        className="absolute inset-x-0 bottom-0 z-10 flex justify-center px-6 pb-14 sm:pb-16"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        <div
          className="flex flex-col items-center gap-4 sm:flex-row"
          /* Not clickable while invisible — a faded button is still a target, and one
             floating over molten metal is not something anyone meant to press. */
          style={{ opacity: ctaOpacity, pointerEvents: ctaOpacity < 0.2 ? 'none' : 'auto' }}
        >
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Button
              onClick={onPrimaryCtaClick}
              size="lg"
              className={cn('h-12 px-8 text-[15px] font-medium', GLASS, GLASS_PRIMARY)}
              style={{ boxShadow: glassShadow(0.45, 10, 34) }}
            >
              {primaryCtaLabel}
            </Button>
          </motion.div>

          {secondaryCtaLabel && onSecondaryCtaClick && (
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Button
                onClick={onSecondaryCtaClick}
                variant="outline"
                size="lg"
                className={cn('h-12 px-8 text-[15px] font-medium', GLASS, GLASS_SECONDARY)}
                style={{ boxShadow: glassShadow(0.25, 8, 28) }}
              >
                {secondaryCtaLabel}
              </Button>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );

  return (
    <section
      ref={runwayRef}
      id="home"
      /* Reduced motion gets no runway at all, rather than the same runway with the
         journey switched off: a reader who asked for less motion should not have to
         scroll through 240vh of a held screen to reach the page. */
      className={cn('relative isolate', className)}
      style={reduceMotion ? { minHeight: '100svh' } : { height: `${RUNWAY_VH}vh` }}
    >
      {/* The mark carries the name visually. This keeps it in the document. */}
      <h1 className="sr-only">
        {title}
        {subtitle ? ' — ' + subtitle : ''}
      </h1>

      {stage}
    </section>
  );
}
