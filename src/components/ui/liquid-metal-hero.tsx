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
/** Ramps up across `a → b`, holds at 1 through `c`, ramps back down across `c → d`. */
const hump = (t: number, a: number, b: number, c: number, d: number) =>
  Math.min(ramp(t, a, b), 1 - ramp(t, c, d));

/* Where each silhouette wants to sit.
 *
 * The mark is 1.22:1 and parks hard right, bleeding off the edge — an object the page
 * is a window onto. The wordmark is 2.76:1 and fits to width, so the same position
 * would push most of the name off screen; it comes to the middle to be read, then the
 * mark takes the margin back. The object travelling is not decoration, it is the only
 * way both shapes get a composition that suits them. */
const MARK = { fx: 1, px: -230, y: -0.2 };
const WORD = { fx: 0, px: 0, y: -0.1 };

/**
 * The first screen, and the only pinned moment on the page.
 *
 * Scrolling drives the metal rather than a timer: the mark melts into a shapeless body,
 * sets as the PLCBO wordmark, holds, melts again and returns to the mark as the hero
 * releases. Two silhouettes, two transitions — the four-shape version was offered and
 * the brand reading chosen over it.
 *
 * `contour` is the only shader parameter that deforms the silhouette rather than the
 * pattern painted over it, so the shape swap hides inside the melt peak: at `melt: 1`
 * there is no letter on screen to betray the handover, only liquid. That is why this is
 * seamless by construction rather than by crossfade — a crossfade between two different
 * shaders was tried in this hero and deleted for reading as exactly what it was.
 *
 * Both layers stay mounted for the life of the hero. Swapping `image` on a single layer
 * is not an option: `suspendWhenProcessingImage` is what lets `MaskBoundary` catch a
 * missing mask instead of rendering an empty document, and it unmounts the layer while
 * a new mask is solved — so a single-layer swap would blank the hero mid-scroll, every
 * time the reader scrubbed back over it.
 *
 * The runway only exists from `md` up. Below that the section is one screen tall,
 * `useScrollProgress` reports a container it cannot pin as finished, and the journey
 * lands on its own resting state — the mark, set — with the second layer at zero
 * opacity and, by `layerOpacity`, not drawing. Two full-screen shader programs on a
 * phone GPU is the one cost here that is not worth finding out about in the wild.
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
  const melt = Math.max(hump(j, 0.1, 0.38, 0.44, 0.66), hump(j, 0.74, 0.86, 0.9, 1));
  /* 0 = the mark, 1 = the wordmark. Both handovers sit inside a melt peak. */
  const shape = ramp(j, 0.38, 0.44) - ramp(j, 0.86, 0.9);

  const place = {
    fx: lerp(MARK.fx, WORD.fx, shape),
    px: lerp(MARK.px, WORD.px, shape),
    y: lerp(MARK.y, WORD.y, shape),
  };

  /* The copy follows the state of the metal, not the scroll: present whenever there is
     a set shape to read it against, gone while there is only liquid. One expression, so
     it is symmetric on the way back up for free. */
  const copyOpacity = clamp01(1 - melt * 1.4);

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
          mask="/mark-mask.png"
          scale={0.46}
          compactScale={0.56}
          fx={place.fx}
          px={place.px}
          y={place.y}
          compactY={-0.26}
          melt={melt}
          layerOpacity={1 - shape}
          primary
        />

        {/* Fits to width rather than height, so it carries a larger resting scale to
            read as the same object at the same distance rather than a smaller one. */}
        <MetalMark
          mask="/wordmark-mask.png"
          scale={0.62}
          compactScale={0.86}
          fx={place.fx}
          px={place.px}
          y={place.y}
          compactY={-0.12}
          melt={melt}
          layerOpacity={shape}
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
