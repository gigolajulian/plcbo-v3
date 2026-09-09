"use client";

import { motion, useReducedMotion } from 'framer-motion';

import { MetalMark } from '@/components/metal-mark';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/* Glass, over metal.
 *
 * Four things together, and it stops working if any of them is dropped: a heavy backdrop
 * blur so the metal behind smears rather than showing through legibly; a saturation lift
 * so what does come through keeps its colour instead of going grey; a hairline top-edge
 * inset highlight, which is the specular catch that makes a pane read as a solid object
 * rather than a translucent rectangle; and a soft drop shadow so it sits above the metal
 * instead of being painted onto it.
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

/* The shadows go in a style attribute, not a Tailwind arbitrary value. `shadow-[…]` with
 * two shadows and rgba() commas inside silently generates nothing — the computed
 * box-shadow came back as Tailwind's empty default and the specular edge, the part that
 * does the actual work, was simply absent. */
const glassShadow = (specular: number, drop: number, spread: number) =>
  `inset 0 1px 0 rgba(255,255,255,${specular}), 0 ${drop}px ${spread}px rgba(0,0,0,0.45)`;

export interface LiquidMetalHeroProps {
  /** Carried by the metal visually; kept in the DOM for screen readers and search. */
  title: string;
  subtitle?: string;
  primaryCtaLabel: string;
  secondaryCtaLabel?: string;
  onPrimaryCtaClick: () => void;
  onSecondaryCtaClick?: () => void;
  className?: string;
}

/**
 * The first screen: the mark, in metal, and the two CTAs.
 *
 * Exactly one viewport tall. It used to be a 210vh runway holding a sticky screen, so
 * that a fixed object beneath the page had room to melt out of the mark and into the
 * wordmark as you scrolled — which meant two screens of content cost three and a half
 * screens of scrolling. The mark and the wordmark are now simply two screens, each
 * carrying its own shape, and the runway is gone with the transition it existed for.
 */
export default function LiquidMetalHero({
  title,
  subtitle,
  primaryCtaLabel,
  secondaryCtaLabel,
  onPrimaryCtaClick,
  onSecondaryCtaClick,
  className,
}: LiquidMetalHeroProps) {
  const reduceMotion = useReducedMotion();

  return (
    <section
      id="home"
      className={cn('relative isolate flex h-[100svh] flex-col justify-end', className)}
    >
      <h1 className="sr-only">
        {title}
        {subtitle ? ' — ' + subtitle : ''}
      </h1>

      {/* Centred, and the subject of its own screen. It answers the pointer: tilts
          toward it, turns on the spot when dragged, ripples from wherever it is
          clicked. */}
      <MetalMark mask="/mark-mask.png" scale={0.49} compactScale={0.74} y={-0.02} primary />

      {/* The metal is the page here, so there is no full-field scrim over it. This is
          the one exception: a short vignette at the foot of the screen, so the CTAs sit
          on a settled ground however bright the frame under them runs. */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-background via-background/75 to-transparent" />

      <motion.div
        className="relative flex justify-center px-6 pb-14 sm:pb-16"
        initial={reduceMotion ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="flex flex-col items-center gap-4 sm:flex-row">
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
    </section>
  );
}
