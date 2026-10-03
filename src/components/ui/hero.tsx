"use client";

import * as React from 'react';
import { motion, useMotionValueEvent, useReducedMotion } from 'framer-motion';

import { BlobMark } from '@/components/blob-mark';
import { useScrollProgress } from '@/hooks/use-parallax';
import { cn } from '@/lib/utils';

export interface HeroProps {
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

/* Where the frame sits for each mark, in units of the container's height.
 *
 * The mark parks right and bleeds off the edge — an object the page is a window onto.
 * The wordmark comes to the middle, because it has to be read. */
const MARK_PLACE = { x: 0.46, y: -0.1, scale: 0.46 };
const WORD_PLACE = { x: 0.0, y: -0.06, scale: 0.3 };

/* Portrait needs its own numbers rather than a tweak of those.
 *
 * Both are in units of the container's HEIGHT — which is what the shader works in, so
 * that a blob stays round. On a tall narrow screen that means the landscape values put
 * the mark most of a screen-width to the right and about three times too wide. There is
 * no single pair that suits both; a phone gets the mark centred and much smaller. */
const MARK_COMPACT = { x: 0, y: -0.12, scale: 0.26 };
const WORD_COMPACT = { x: 0, y: -0.1, scale: 0.15 };

/** Matches the `md` breakpoint the runway itself uses, so the two never disagree. */
function useCompact() {
  const [compact, setCompact] = React.useState(
    () => typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches
  );
  React.useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const sync = () => setCompact(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);
  return compact;
}

/**
 * The first screen, and the only pinned moment on the page.
 *
 * Scrolling drives the mark into the PLCBO wordmark and back. Two marks, two
 * transitions, one continuous body.
 *
 * Three earlier versions transitioned the *image* and all three failed the same way.
 * Crossfading two shader layers showed both silhouettes at once. Fusing them under a
 * blur and alpha threshold made one body but destroyed the material. Blending two
 * distance fields produced real intermediate shapes but smeared, because two very
 * different silhouettes overlapping still look like two silhouettes overlapping.
 *
 * This transitions the *geometry*. The mark is approximated as a swarm of blobs with a
 * home in each shape, drawn as a metaball field, and the surface is simply wherever the
 * blobs currently are. Mid-way they gather into one mass with no legible shape and then
 * release into the other mark. There is never a second shape to hide, which is why
 * nothing has to hide it. See `blob-mark.tsx`.
 *
 * The runway only exists from `md` up. Below that the section is one screen tall,
 * `useScrollProgress` reports a container it cannot pin as finished, and the journey
 * lands on its resting state — the mark, set.
 */
export default function Hero({
  title,
  subtitle,
  statement,
  primaryCtaLabel,
  secondaryCtaLabel,
  onPrimaryCtaClick,
  onSecondaryCtaClick,
  className,
}: HeroProps) {
  const reduceMotion = useReducedMotion();
  const compact = useCompact();
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

  /* 0 = the mark, 1 = the wordmark. Nothing fades between them: the blobs that define
     the surface simply travel, and the surface follows. */
  const morph = clamp01(ramp(j, 0.14, 0.42) - ramp(j, 0.64, 0.9));

  const mark = compact ? MARK_COMPACT : MARK_PLACE;
  const word = compact ? WORD_COMPACT : WORD_PLACE;

  /* 1 while a transformation is under way — used only to step the copy back. */
  const transition = Math.max(hump(j, 0.14, 0.26, 0.3, 0.42), hump(j, 0.64, 0.76, 0.8, 0.9));

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

        <BlobMark
          morph={morph}
          scale={lerp(mark.scale, word.scale, morph)}
          centreX={lerp(mark.x, word.x, morph)}
          centreY={lerp(mark.y, word.y, morph)}
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
