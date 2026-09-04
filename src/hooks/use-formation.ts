import * as React from 'react';

/* Slow in, slow out — smootherstep. The mark should not snap into focus; it should
 * drift toward legibility and then hold. */
const ease = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);

/**
 * A one-shot 0 → 1 ramp for the hero's opening, driven off wall-clock time.
 *
 * `run` starts it — the hero holds it back until the shader's mask is actually
 * ready, so the formation never plays against a layer that has nothing to draw.
 * `skip` lands it at 1 immediately, for reduced motion.
 *
 * rAF gets no frames in a background tab, so the ramp is paired with an
 * unconditional `setTimeout` that forces it home. A reader who opens the site in a
 * background tab and comes back five minutes later finds the finished mark, never
 * the cloud it started as. (Same rule as `Reveal` and `useCountUp`.)
 */
export function useFormation(duration: number, run: boolean, skip = false) {
  const [progress, setProgress] = React.useState(skip ? 1 : 0);

  React.useEffect(() => {
    if (skip) {
      setProgress(1);
      return;
    }
    if (!run) return;

    let done = false;
    const start = performance.now();

    const tick = (now: number) => {
      if (done) return;
      const t = Math.min(1, (now - start) / duration);
      setProgress(ease(t));
      if (t < 1) frame = requestAnimationFrame(tick);
    };

    let frame = requestAnimationFrame(tick);
    const forced = window.setTimeout(() => {
      done = true;
      setProgress(1);
    }, duration + 400);

    return () => {
      done = true;
      cancelAnimationFrame(frame);
      window.clearTimeout(forced);
    };
  }, [duration, run, skip]);

  return progress;
}
