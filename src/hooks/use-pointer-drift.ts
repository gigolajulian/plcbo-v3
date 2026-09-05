import * as React from 'react';

export type Drift = {
  /** -1 (left edge) to 1 (right edge) */
  x: number;
  /** -1 (top edge) to 1 (bottom edge) */
  y: number;
  /** 0 at rest, 1 while the pointer is over the element */
  energy: number;
  /** spikes to 1 on press and decays back to 0 */
  pulse: number;
  /** how far the mark has been dragged from home, in px */
  dragX: number;
  dragY: number;
};

const REST: Drift = { x: 0, y: 0, energy: 0, pulse: 0, dragX: 0, dragY: 0 };

/* How fast the value chases the pointer. Low numbers read as weight — the metal
 * lags behind the cursor and keeps moving after it stops, which is the whole point
 * of an interactive backdrop rather than a reactive one. */
const TRACK = 0.055;
const SETTLE = 0.032;
const DECAY = 0.07;
/* A drag is direct manipulation: it has to feel held, not chased. Letting go is the
 * opposite — the mark takes its time coming home. */
const HELD = 0.4;
const HOMING = 0.055;
const EPSILON = 0.0012;

const round = (n: number) => Math.round(n * 1000) / 1000;

/**
 * Smoothed pointer state for driving a tilt, a drag and a set of shader uniforms.
 *
 * The rAF loop here animates a value that is already on screen; it is never the
 * thing standing between a reader and the content. At rest it does not run at all —
 * it starts on a pointer event and stops itself once the value has settled.
 */
export function usePointerDrift(enabled: boolean) {
  const [drift, setDrift] = React.useState<Drift>(REST);
  const target = React.useRef<Drift>(REST);
  const value = React.useRef<Drift>(REST);
  const frame = React.useRef<number | null>(null);
  const dragging = React.useRef(false);
  const origin = React.useRef({ x: 0, y: 0 });

  const tick = React.useCallback(() => {
    const t = target.current;
    const v = value.current;
    const rate = t.energy > 0 ? TRACK : SETTLE;
    const pull = dragging.current ? HELD : HOMING;

    const next: Drift = {
      x: v.x + (t.x - v.x) * rate,
      y: v.y + (t.y - v.y) * rate,
      energy: v.energy + (t.energy - v.energy) * SETTLE,
      /* the press impulse only ever decays — it is set directly, not chased */
      pulse: v.pulse * (1 - DECAY),
      dragX: v.dragX + (t.dragX - v.dragX) * pull,
      dragY: v.dragY + (t.dragY - v.dragY) * pull,
    };

    const settled =
      !dragging.current &&
      Math.abs(next.x - t.x) < EPSILON &&
      Math.abs(next.y - t.y) < EPSILON &&
      Math.abs(next.energy - t.energy) < EPSILON &&
      Math.abs(next.dragX - t.dragX) < 0.05 &&
      Math.abs(next.dragY - t.dragY) < 0.05 &&
      next.pulse < EPSILON;

    value.current = settled
      ? { ...t, pulse: 0, dragX: t.dragX, dragY: t.dragY }
      : next;

    setDrift({
      x: round(value.current.x),
      y: round(value.current.y),
      energy: round(value.current.energy),
      pulse: round(value.current.pulse),
      dragX: Math.round(value.current.dragX * 10) / 10,
      dragY: Math.round(value.current.dragY * 10) / 10,
    });
    frame.current = settled ? null : requestAnimationFrame(tick);
  }, []);

  const run = React.useCallback(() => {
    if (frame.current === null) frame.current = requestAnimationFrame(tick);
  }, [tick]);

  React.useEffect(() => {
    if (enabled) return;
    dragging.current = false;
    target.current = REST;
    value.current = REST;
    setDrift(REST);
  }, [enabled]);

  React.useEffect(
    () => () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current);
    },
    [],
  );

  const handlers = React.useMemo(() => {
    if (!enabled) return {};

    /* The drag is tracked on the window rather than through pointer capture: capture
       on the section would swallow the CTAs' clicks, and a drag that stops the moment
       the cursor leaves the hero is not a drag. */
    const onWindowMove = (event: PointerEvent) => {
      if (!dragging.current) return;
      target.current = {
        ...target.current,
        dragX: event.clientX - origin.current.x,
        dragY: event.clientY - origin.current.y,
      };
      run();
    };

    const release = () => {
      dragging.current = false;
      target.current = { ...target.current, dragX: 0, dragY: 0 };
      window.removeEventListener('pointermove', onWindowMove);
      window.removeEventListener('pointerup', release);
      window.removeEventListener('pointercancel', release);
      run();
    };

    return {
      onPointerMove: (event: React.PointerEvent<HTMLElement>) => {
        const rect = event.currentTarget.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        target.current = {
          ...target.current,
          x: ((event.clientX - rect.left) / rect.width) * 2 - 1,
          y: ((event.clientY - rect.top) / rect.height) * 2 - 1,
          energy: 1,
        };
        run();
      },
      onPointerDown: (event: React.PointerEvent<HTMLElement>) => {
        /* set straight on the value, not the target: a press is an impulse the
           surface absorbs, not a position it travels to */
        value.current = { ...value.current, pulse: 1 };
        dragging.current = true;
        origin.current = { x: event.clientX, y: event.clientY };
        window.addEventListener('pointermove', onWindowMove, { passive: true });
        window.addEventListener('pointerup', release);
        window.addEventListener('pointercancel', release);
        run();
      },
      onPointerLeave: () => {
        target.current = { ...REST, dragX: target.current.dragX, dragY: target.current.dragY };
        run();
      },
    };
  }, [enabled, run]);

  return { drift, handlers };
}
