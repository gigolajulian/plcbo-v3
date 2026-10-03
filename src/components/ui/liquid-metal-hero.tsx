"use client";

import * as React from 'react';
import { motion, useMotionValueEvent, useReducedMotion } from 'framer-motion';

import { MetalMark } from '@/components/metal-mark';
import { useScrollProgress } from '@/hooks/use-parallax';
import { cn } from '@/lib/utils';

export interface LiquidMetalHeroProps {
  /** Carried by the metal visually; kept in the DOM for screen readers and search. */
  title: string;
  subtitle?: string;
  statement: string;
  primaryCtaLabel: string;
  secondaryCtaLabel?: string;
  onPrimaryCtaClick: () => void;
  onSecondaryCtaClick?: () => void;
  className?: string;
}

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
const lerp = (from: number, to: number, t: number) => from + (to - from) * t;
const ramp = (t: number, from: number, to: number) => clamp01((t - from) / (to - from));
/** Ramps up across `a -> b`, holds at 1 through `c`, ramps back down across `c -> d`. */
const hump = (t: number, a: number, b: number, c: number, d: number) =>
  Math.min(ramp(t, a, b), 1 - ramp(t, c, d));

/* Where the shared frame sits for each silhouette.
 *
 * The mark parks hard right and bleeds off the edge — an object the page is a window
 * onto. The wordmark comes to the middle, because it has to be read. Both shapes live
 * at the centre of one frame now, so this moves the frame rather than the shape. */
const MARK = { fx: 1, px: -230, y: -0.2 };
const WORD = { fx: 0, px: 0, y: -0.1 };

/* Both fields share a 1400x506 canvas, so one scale drives two very different shapes:
 * the mark is fitted to that height and takes 44% of the width, the wordmark fills it.
 * These are the multipliers that land each at the size it wants. */
const MARK_SCALE = 0.8;
const WORD_SCALE = 0.636;
const MARK_SCALE_COMPACT = 1.92;
const WORD_SCALE_COMPACT = 0.9;

/**
 * The first screen, and the only pinned moment on the page.
 *
 * Scrolling drives the metal rather than a timer: the mark becomes the PLCBO wordmark
 * and returns. Two silhouettes, two transitions.
 *
 * Getting that to read as one shape becoming another took three attempts, and the first
 * two are worth recording because both are the obvious thing to reach for. Crossfading
 * two shader layers shows both silhouettes at once — `contour` does not destroy a shape
 * at full melt, so there is no moment to hide a swap inside. Fusing those layers under a
 * blur-and-threshold filter does produce a single body, but a 36px gaussian over the
 * canvas destroys what the material is made of: the chrome's character is its banding,
 * and blurred it is grey smoke.
 *
 * Both were working outside the shader. Inside it the silhouette is a single sample from
 * a preprocessed distance field, and a distance field is the one representation of a
 * shape that interpolates correctly — so the morph belongs there, and the material never
 * has to be touched at all. See `morph-metal.tsx`.
 *
 * What is left here is choreography. The melt no longer has to obliterate anything, so
 * it only loosens the surface while the shape is in motion.
 *
 * The runway only exists from `md` up. Below that the section is one screen tall,
 * `useScrollProgress` reports a container it cannot pin as finished, and the journey
 * lands on its resting state — the mark, set.
 */
export default function LiquidMetalHero({
  title,
  subtitle,
  statement,
  primaryCtaLabel,
  secondaryCtaLabel,
  onPrimaryCtaClick,
  onSecondaryCtaClick,
  className,
}: LiquidMetalHeroProps) {
  const reduceMotion = useReducedMotion();
  const rise = reduceMotion
    ? {}
    : { initial: { opacity: 0, y: 24 }, animate: { opacity: 1, y: 0 } };

  const { ref: runwayRef, progress } = useScrollProgress();
  const [journey, setJourney] = React.useState(0);
  /* The shader takes plain props, so the motion value is read into state — rounded to
     three places, the way `usePointerDrift` already rounds, so sub-pixel scroll noise
     does not re-render the tree. */
  useMotionValueEvent(progress, 'change', (v) => setJourney(Math.round(v * 1000) / 1000));

  const j = reduceMotion ? 0 : journey;

  /* 0 = the mark, 1 = the wordmark. This is the shape itself, not a fade between two of
     them: the hero holds each silhouette, then spends a long stretch of scroll genuinely
     between the two. */
  const morph = clamp01(ramp(j, 0.14, 0.42) - ramp(j, 0.64, 0.9));

  /* 1 while a transformation is under way. The melt rides this at half strength — enough
     to loosen the surface and let the metal run, nowhere near enough to erase the shape,
     which is no longer its job. */
  const transition = Math.max(hump(j, 0.14, 0.26, 0.3, 0.42), hump(j, 0.64, 0.76, 0.8, 0.9));
  const melt = transition * 0.5;

  const place = {
    fx: lerp(MARK.fx, WORD.fx, morph),
    px: lerp(MARK.px, WORD.px, morph),
    y: lerp(MARK.y, WORD.y, morph),
  };

  /* The copy steps back while the metal is changing and returns once it has settled. */
  const copyOpacity = clamp01(1 - transition * 1.2);

  return (
    <section
      id="home"
      ref={runwayRef}
      className={cn('relative', reduceMotion ? 'h-[100svh]' : 'h-[100svh] md:h-[340vh]')}
    >
      <div
        className={cn(
          'isolate flex h-[100svh] flex-col justify-end overflow-hidden pb-[clamp(2.5rem,7vh,5rem)] pt-32',
          reduceMotion ? 'relative' : 'relative md:sticky md:top-0',
          className
        )}
      >
        <h1 className="sr-only">
          {title}
          {subtitle ? ' — ' + subtitle : ''}
        </h1>

        <MetalMark
          mask="/morph-a.png"
          maskB="/morph-b.png"
          morph={morph}
          scale={lerp(MARK_SCALE, WORD_SCALE, morph)}
          compactScale={lerp(MARK_SCALE_COMPACT, WORD_SCALE_COMPACT, morph)}
          fx={place.fx}
          px={place.px}
          y={place.y}
          compactY={-0.26}
          melt={melt}
          primary
        />

        <div
          className="shell relative z-10"
          style={{
            opacity: copyOpacity,
            pointerEvents: copyOpacity < 0.05 ? 'none' : undefined,
          }}
          aria-hidden={copyOpacity < 0.05 || undefined}
        >
          <motion.p
            className="eyebrow"
            {...rise}
            transition={{ duration: 0.7, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
          >
            (Atelier)
          </motion.p>

          <motion.p
            className="mt-5 max-w-[22ch] font-display text-mega font-medium track-display text-ink sm:max-w-[16ch]"
            {...rise}
            transition={{ duration: 0.8, delay: 0.45, ease: [0.16, 1, 0.3, 1] }}
          >
            {statement}
          </motion.p>

          <motion.div
            className="mt-[clamp(1.75rem,4vh,2.75rem)] flex flex-wrap items-center gap-3"
            {...rise}
            transition={{ duration: 0.7, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <button type="button" onClick={onPrimaryCtaClick} className="pill-dark">
              {primaryCtaLabel}
              <span aria-hidden="true">→</span>
            </button>

            {secondaryCtaLabel && onSecondaryCtaClick && (
              <button type="button" onClick={onSecondaryCtaClick} className="pill-ghost">
                {secondaryCtaLabel}
                <span aria-hidden="true">→</span>
              </button>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
