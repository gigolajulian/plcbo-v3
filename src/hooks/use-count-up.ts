import * as React from 'react';

/* Counts up to `target` once the element is on screen.
 *
 * Two deliberate choices, both for the same reason — background tabs get no
 * rendering opportunities, so neither requestAnimationFrame nor IntersectionObserver
 * is allowed to be the only thing standing between the reader and the real number:
 *
 *   1. The value STARTS at the target and is only knocked down to zero once we know
 *      an animation is actually going to run. Nothing can leave a 0 on screen.
 *   2. The tween runs on setInterval, and a setTimeout snaps to the target at 3s
 *      whatever happened. Timers fire in background tabs; frames do not.
 */
const FORCE_MS = 3000;
const TICK_MS = 16;
const DURATION_MS = 1400;

export function useCountUp(target: number) {
  const ref = React.useRef<HTMLSpanElement | null>(null);
  const [value, setValue] = React.useState(target);

  React.useEffect(() => {
    const node = ref.current;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion || !node || typeof IntersectionObserver === 'undefined') return;

    setValue(0);

    let tick: number | undefined;
    let done = false;

    const finish = () => {
      done = true;
      if (tick) window.clearInterval(tick);
      setValue(target);
    };

    const run = () => {
      if (done || tick) return;
      const start = Date.now();
      tick = window.setInterval(() => {
        const t = Math.min(1, (Date.now() - start) / DURATION_MS);
        const eased = 1 - Math.pow(1 - t, 3);
        setValue(Math.round(target * eased));
        if (t >= 1) finish();
      }, TICK_MS);
    };

    const forced = window.setTimeout(finish, FORCE_MS);
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          run();
          io.disconnect();
        }
      },
      { threshold: 0.4 },
    );
    io.observe(node);

    return () => {
      window.clearTimeout(forced);
      if (tick) window.clearInterval(tick);
      io.disconnect();
    };
  }, [target]);

  return { ref, value };
}
