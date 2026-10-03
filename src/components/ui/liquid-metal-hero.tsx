"use client";

import { motion, useReducedMotion } from 'framer-motion';

import { MetalMark } from '@/components/metal-mark';
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

/**
 * The first screen.
 *
 * The arrangement is the reference's: the object bleeds off the right edge at the top
 * of the screen, and the statement sits low and left, where the eye lands last and
 * stays. The old version centred the mark and put two glass buttons under it — a
 * composition that gave the page no reading order at all, because a centred object
 * has no second place to go.
 *
 * The mark survived the redesign on purpose. Two of the directions Julian rejected
 * retired it, and it is the one piece of this site that is genuinely his: the
 * statement is what changed, not the object.
 *
 * On a light ground the chrome reads as a grey solid rather than the glowing thing it
 * was on near-black, which is the right register here — it is an object on a page now,
 * not the light source of one.
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

  return (
    <section
      id="home"
      className={cn(
        'relative isolate flex min-h-[100svh] flex-col justify-end overflow-hidden pb-[clamp(2.5rem,7vh,5rem)] pt-32',
        className
      )}
    >
      <h1 className="sr-only">
        {title}
        {subtitle ? ' — ' + subtitle : ''}
      </h1>

      {/* Parked hard right and lifted above centre so the statement below it is never
          crowded. It runs off the edge deliberately: an object fully inside the frame
          reads as an illustration, one that leaves reads as a thing the page is a
          window onto. It should leave by about a quarter, not two thirds: the object
          box is a square of `scale x the container's longer edge` with the mask fitted
          inside, so at 0.46 on a 1265px window the mark is 582px wide and sits centred
          in a full-width canvas — `fx: 1` alone pushed its left edge to 1063 and put
          65% of it past the window. The offset is in pixels against that, not a
          fraction, because the copy it has to clear lives in a capped shell. */}
      <MetalMark
        mask="/mark-mask.png"
        scale={0.46}
        compactScale={0.56}
        fx={1}
        px={-230}
        y={-0.2}
        compactY={-0.26}
        primary
      />

      <div className="shell relative z-10">
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
    </section>
  );
}
