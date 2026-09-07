import * as React from 'react';
import { useMotionValue, useReducedMotion, type MotionValue } from 'framer-motion';

/**
 * Drift an element inside its frame as the page scrolls past it.
 *
 * The obvious version is `useScroll({ target: ref, offset })`, and it is avoided for
 * one real reason: it measures the target on mount and on resize, and neither is a
 * moment when these plates are their final size. They mount carrying the `scale()`
 * of their own reveal, and their photographs are lazy. A measurement taken then is of
 * something that is not there yet, and the plate spends the rest of the page frozen
 * at whichever end of its travel that measurement implied.
 *
 * Measuring the rect per frame instead cannot go stale for any of those reasons.
 * `measure()` also runs once on mount, so the first position is right without waiting
 * for a frame at all.
 *
 * The scheduler cancels and re-arms rather than skipping while one is pending. A
 * frame queued just before the tab goes to the background never fires, and a
 * "schedule only if nothing is pending" guard would then skip scheduling for the rest
 * of the session — which is exactly how the hero's pointer loop wedged.
 *
 * It moves a transform and nothing else. Nothing waits on it and nothing is hidden
 * until it runs, so a reader who never gets a frame still sees every photograph —
 * sitting still.
 *
 * @param strength how far to travel, as a fraction of the element's own height
 */
export function useParallax(strength = 0.06): {
  ref: React.RefObject<HTMLDivElement>;
  y: MotionValue<string>;
} {
  const ref = React.useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const y = useMotionValue('0%');

  const travel = reduceMotion ? 0 : strength * 100;

  React.useEffect(() => {
    if (travel === 0) {
      y.set('0%');
      return;
    }

    let frame: number | null = null;

    const measure = () => {
      frame = null;
      const node = ref.current;
      if (!node) return;

      const rect = node.getBoundingClientRect();
      const span = window.innerHeight + rect.height;
      if (span <= 0) return;

      /* 0 as the element's top meets the bottom of the viewport, 1 as its bottom
         leaves the top — the whole pass, recentred so the middle of the pass is the
         middle of the travel. */
      const progress = Math.min(1, Math.max(0, (window.innerHeight - rect.top) / span));
      y.set(`${((progress - 0.5) * 2 * travel).toFixed(2)}%`);
    };

    const schedule = () => {
      if (frame !== null) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);

    return () => {
      if (frame !== null) cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, [travel, y]);

  return { ref, y };
}

/**
 * How far a tall container has travelled through its own pin, 0 → 1.
 *
 * 0 when its top meets the top of the viewport, 1 when its bottom meets the bottom —
 * which for a `h-[260vh]` section wrapping an `h-screen` sticky child is exactly the
 * window in which that child is stuck to the top of the screen. Feed it to
 * `useTransform` to drive anything off scroll position rather than off entry.
 *
 * Same scheduler as `useParallax` above, and for the same two reasons: `useScroll`
 * measures its target on mount and on resize, and the cancel-and-re-arm shape is what
 * keeps a frame queued just before the tab is backgrounded from wedging the loop
 * permanently.
 */
export function useScrollProgress(): {
  ref: React.RefObject<HTMLDivElement>;
  progress: MotionValue<number>;
} {
  const ref = React.useRef<HTMLDivElement>(null);
  const progress = useMotionValue(0);

  React.useEffect(() => {
    let frame: number | null = null;

    const measure = () => {
      frame = null;
      const node = ref.current;
      if (!node) return;

      const rect = node.getBoundingClientRect();
      const span = rect.height - window.innerHeight;
      /* A container no taller than the viewport never pins, so it has no pass to be
         partway through. Report it finished rather than dividing by zero. */
      if (span <= 0) {
        progress.set(1);
        return;
      }

      progress.set(Math.min(1, Math.max(0, -rect.top / span)));
    };

    const schedule = () => {
      if (frame !== null) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);

    return () => {
      if (frame !== null) cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, [progress]);

  return { ref, progress };
}
