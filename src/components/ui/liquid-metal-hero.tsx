"use client";

import * as React from 'react';
import {
  LiquidMetal,
  liquidMetalPresets,
  type LiquidMetalProps,
} from '@paper-design/shaders-react';
import { motion, useReducedMotion } from 'framer-motion';

import { Button } from '@/components/ui/button';
import { useFormation } from '@/hooks/use-formation';
import { usePointerDrift } from '@/hooks/use-pointer-drift';
import { asset } from '@/lib/asset';
import { cn } from '@/lib/utils';

/* liquidMetalPresets[2] is the "Backdrop" preset. Spread `.params`, never the preset
 * itself: a preset is `{ name, params }` and LiquidMetal takes the params flattened,
 * so spreading the wrapper passes an inert name/params pair and the shader silently
 * falls back to its defaults. */
const backdrop = liquidMetalPresets[2].params;

/* Silver, not violet. colorBack is the ground the metal is lit against and colorTint
 * is burned over the pattern — a near-neutral tint with a hint of cool in it reads as
 * polished steel, where the accent read as painted plastic. The violet accent stays
 * where it belongs: in the rest of the page. */
const GROUND = '#08080a';
/* The masked layer's ground is transparent, not the page colour: it is what lets the
 * silhouette have an alpha channel, which is what the extrusion below is built out
 * of. An opaque ground would cast its own rectangle instead of the letter. */
const CLEAR = 'rgba(8, 8, 10, 0)';
const SILVER = '#dcdce6';

/** How long the metal takes to gather itself into the mark, once it can. */
const FORMATION_MS = 6000;

const lerp = (from: number, to: number, t: number) => from + (to - from) * t;
/** Zoom has to be interpolated geometrically or the last third of it does all the work. */
const zoom = (from: number, to: number, t: number) => from * Math.pow(to / from, t);
const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
/** 0 below `from`, 1 above `to`, linear in between. */
const ramp = (t: number, from: number, to: number) => clamp01((t - from) / (to - from));

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
 * The masked layer, behind a Suspense boundary.
 *
 * Turning an SVG into the distance field the shader masks with is a rasterise plus a
 * Poisson solve — seconds of work, not milliseconds. Until it lands the layer has
 * nothing to draw and paints its flat ground over everything beneath it, which is
 * what an early version of this did: the open field came up, went black for two
 * seconds, and the mark appeared out of the dark. `suspendWhenProcessingImage` holds
 * the layer out of the tree entirely until its mask is ready, and `onReady` is what
 * starts the formation — so the two are never out of step, on any machine.
 */
function MarkMetal({ onReady, ...props }: LiquidMetalProps & { onReady: () => void }) {
  React.useEffect(() => {
    onReady();
  }, [onReady]);

  return <LiquidMetal suspendWhenProcessingImage {...props} />;
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
  primaryCtaLabel: string;
  secondaryCtaLabel?: string;
  onPrimaryCtaClick: () => void;
  onSecondaryCtaClick?: () => void;
  className?: string;
}

export default function LiquidMetalHero({
  title,
  subtitle,
  image = asset('/mark.svg'),
  primaryCtaLabel,
  secondaryCtaLabel,
  onPrimaryCtaClick,
  onSecondaryCtaClick,
  className,
}: LiquidMetalHeroProps) {
  const reduceMotion = useReducedMotion();
  const sectionRef = React.useRef<HTMLElement | null>(null);

  /* The shader is a per-frame GPU program with no natural end. Left alone it keeps
     drawing for the whole length of the page, long after the hero has scrolled away
     — so it is parked whenever it is off screen or the tab is hidden. speed 0 holds
     the current frame rather than resetting it, so coming back is seamless. */
  const [live, setLive] = React.useState(true);

  React.useEffect(() => {
    const node = sectionRef.current;
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

  /* 0 = an open field of metal with no shape in it, 1 = the mark. */
  const formation = useFormation(FORMATION_MS, ready, Boolean(reduceMotion));
  const settled = formation > 0.999;

  /* The formation is one continuous move on one layer, not a dissolve between two.
     The masked layer opens blown up far past the viewport, so all that is on screen
     is the inside of the letter — an open body of metal with no shape to read — and
     pulls back until the silhouette is the thing you are looking at.

     The open field underneath exists only to cover the moment before the mask is
     ready. It is tuned to the masked layer's opening frame and handed over inside
     the first fifth of the move, while both are still formless, so the swap has
     nothing to show. */
  const fieldOpacity = 1 - ramp(formation, 0.02, 0.2);
  const markOpacity = ramp(formation, 0, 0.16);

  /* Pointer response is scaled by the formation, so nothing steers the metal until
     there is a mark to steer. */
  const interactive = !reduceMotion && live;
  const { drift, handlers } = usePointerDrift(interactive);
  const grip = formation;

  /* The tilt is a real rotation of the plane the shader is drawn on, under a
     perspective — the mark turns to face the cursor rather than sliding around
     under it. The press nudge pushes it away and lets it come back. */
  const tiltX = -drift.y * 11 * grip;
  const tiltY = drift.x * 13 * grip;
  const push = 1 - drift.pulse * 0.022;

  /* The rise. Done here rather than through the shader's own offset: the offset is
     measured against the fitted object box, so it moves the mark by a couple of
     percent of the viewport where this moves it by a visible distance. */
  const rise = lerp(90, 0, formation);

  /* The side wall leans opposite the tilt, so the mark keeps a consistent light. */
  const depth = grip * (1 - drift.pulse * 0.35);
  const filter = extrusion(2.4 * depth - drift.x * 1.6 * grip, 2.9 * depth - drift.y * 1.2 * grip, depth);

  return (
    <section
      ref={sectionRef}
      id="home"
      {...handlers}
      /* No overflow-hidden on the section itself — the shader layer below clips
         itself, and clipping here would cut the CTA row on a short window. */
      className={cn('relative isolate min-h-[100svh]', className)}
    >
      {/* ── the metal ──────────────────────────────────────────────────────
        Scoped to the hero rather than fixed at z-index -10. A negative z-index
        only stays visible while nothing above it paints an opaque ground, and
        every section below this one does. */}
      <div className="absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
        {/* the ground the shader composites onto, and the fallback if the browser
            hands back no WebGL context at all */}
        <div className="absolute inset-0 bg-background" />

        {/* The open field: no image, so it draws on the first frame. Unmounted as
            soon as it has faded out, to hand its WebGL context back rather than idle
            two of them for the life of the page. */}
        {!settled && fieldOpacity > 0.001 && (
          <LiquidMetal
            {...backdrop}
            colorBack={GROUND}
            colorTint={SILVER}
            softness={0.74}
            repetition={1.5}
            distortion={0.5}
            contour={0.04}
            shiftRed={0.02}
            shiftBlue={0.03}
            fit="cover"
            scale={lerp(1.5, 1.3, formation)}
            offsetY={lerp(0.14, 0, formation)}
            angle={64}
            speed={live ? 1.1 : 0}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              opacity: fieldOpacity,
            }}
          />
        )}

        {/* The mark. With an image the `shape` prop is ignored: the metal fills the
            logo's alpha and everything outside it stays transparent. */}
        <div className="absolute inset-0" style={{ perspective: '1500px' }}>
          <div
            className="absolute inset-0"
            style={{
              transform: `translate3d(0, ${rise.toFixed(1)}px, 0) rotateX(${tiltX.toFixed(2)}deg) rotateY(${tiltY.toFixed(2)}deg) scale(${push.toFixed(4)})`,
              transformOrigin: '50% 46%',
              filter,
              willChange: 'transform, filter',
            }}
          >
            <React.Suspense fallback={null}>
              <MarkMetal
                {...backdrop}
                onReady={onReady}
                image={image}
                colorBack={CLEAR}
                colorTint={SILVER}
                /* contain, not cover: cover crops, and the whole point is the
                   silhouette. */
                fit="contain"
                scale={zoom(3.8, compact ? 0.74 : 0.49, formation) + drift.energy * 0.012 * grip}
                /* the rise: it comes up from under the fold and settles just above
                   centre, where the CTA row leaves it room */
                offsetY={-0.03 + drift.y * 0.02 * grip}
                offsetX={drift.x * 0.02 * grip}
                /* soft, wide and turbulent to begin with; tight and calm at rest */
                softness={lerp(0.74, 0.36, formation)}
                contour={lerp(0.04, 0.3, formation)}
                shiftRed={lerp(0.02, 0.07, formation)}
                shiftBlue={lerp(0.03, 0.09, formation)}
                rotation={lerp(7, 0, formation)}
                /* the pointer drives the flow once there is a mark to drive */
                angle={64 + drift.x * 46 * grip}
                repetition={lerp(1.5, 2.2, formation) + drift.y * 0.35 * grip}
                distortion={
                  lerp(0.5, 0.11, formation) +
                  (drift.energy * 0.04 + Math.abs(drift.y) * 0.04 + drift.pulse * 0.12) * grip
                }
                speed={
                  reduceMotion || !live
                    ? 0
                    : lerp(1.1, 0.42, formation) + drift.energy * 0.3 + drift.pulse * 0.6
                }
                frame={reduceMotion ? 8200 : 0}
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  opacity: markOpacity,
                }}
              />
            </React.Suspense>
          </div>
        </div>

        {/* The metal is the page now, so there is no full-field scrim over it. This
            is the one exception: a short vignette at the foot of the hero, so the
            CTAs sit on a settled ground however bright the frame under them runs. */}
        <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-background via-background/75 to-transparent" />
        <div className="grain absolute inset-0" />
      </div>

      {/* The mark carries the name visually. This keeps it in the document. */}
      <h1 className="sr-only">
        {title}
        {subtitle ? ' — ' + subtitle : ''}
      </h1>

      <motion.div
        className="absolute inset-x-0 bottom-0 z-10 flex justify-center px-6 pb-14 sm:pb-16"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="flex flex-col items-center gap-4 sm:flex-row">
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Button
              onClick={onPrimaryCtaClick}
              size="lg"
              className="h-12 rounded-full bg-foreground px-8 text-[15px] font-medium text-background shadow-2xl transition-colors duration-300 hover:bg-foreground/90"
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
                className="h-12 rounded-full border-foreground/25 bg-background/50 px-8 text-[15px] font-medium text-foreground backdrop-blur-md transition-colors duration-300 hover:border-foreground/50 hover:bg-background/70 hover:text-foreground"
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
