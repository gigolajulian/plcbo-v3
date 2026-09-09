"use client";

import { motion, useReducedMotion } from 'framer-motion';

import { Button } from '@/components/ui/button';
import { useStageJourney } from '@/hooks/use-stage-journey';
import { cn } from '@/lib/utils';

/* The runway, and the page's one pinned screen — the Intro used to pin too and gave
 * that up, because two in a row reads as a demo reel.
 *
 * It is 210vh and not more because the object's first change of shape is timed off the
 * Intro's position, not off this section's: a longer runway just means a longer stretch
 * of nothing happening before the metal starts to move. About one screen of the mark
 * holding still, then it melts. */
const RUNWAY_VH = 210;

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

/* Glass, over metal.
 *
 * Four things together, and it stops working if any of them is dropped: a heavy
 * backdrop blur so the metal behind smears rather than showing through legibly; a
 * saturation lift so what does come through keeps its colour instead of going grey; a
 * hairline top-edge inset highlight, which is the specular catch that makes a pane read
 * as a solid object rather than a translucent rectangle; and a soft drop shadow so it
 * sits above the metal instead of being painted onto it.
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
 * The hero, which no longer contains the hero.
 *
 * The metal moved out to `<MetalStage />`, a fixed layer under the whole page, because
 * the object now travels the entire document rather than stopping where this section
 * stops. What is left here is the scroll runway that gives it a screen of its own, the
 * heading that keeps the studio's name in the document, and the two CTAs.
 *
 * The section is `pointer-events-none` on purpose: the object beneath it is dragged,
 * and a transparent 340vh box on top of it would swallow every one of those events.
 * The CTA row takes its own back.
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
  const position = useStageJourney();

  /* The buttons belong to a shape that is holding still, so they go as the metal starts
     to melt into the next one and do not come back — by then the reader is in the page,
     and the page has its own asks. */
  const ctaOpacity = reduceMotion ? 1 : clamp01(1 - position * 2.6);

  return (
    <section
      id="home"
      className={cn('pointer-events-none relative', className)}
      /* Reduced motion gets no runway at all, rather than the same runway with nothing
         happening in it: a reader who asked for less motion should not have to scroll
         through 240vh of a held screen to reach the page. */
      style={reduceMotion ? { minHeight: '100svh' } : { height: `${RUNWAY_VH}vh` }}
    >
      <h1 className="sr-only">
        {title}
        {subtitle ? ' — ' + subtitle : ''}
      </h1>

      <div
        className={cn(
          'flex h-[100svh] flex-col justify-end',
          reduceMotion ? 'relative' : 'sticky top-0',
        )}
      >
        {/* The metal is the page now, so there is no full-field scrim over it. This is
            the one exception: a short vignette at the foot of the first screen, so the
            CTAs sit on a settled ground however bright the frame under them runs. */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-background via-background/75 to-transparent" />

        <motion.div
          className="relative flex justify-center px-6 pb-14 sm:pb-16"
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
    </section>
  );
}
