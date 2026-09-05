import * as React from 'react';

export type Drift = {
  /** -1 (left edge) to 1 (right edge) */
  x: number;
  /** -1 (top edge) to 1 (bottom edge) */
  y: number;
  /** 0 at rest, 1 while the pointer is over the element */
  energy: number;
  /** 0 → 1 → 0 across a press: a short rise and a long tail, never a jump */
  pulse: number;
  /** where the last press landed, in the same -1..1 frame as x and y */
  pressX: number;
  pressY: number;
  /** how far the mark has been dragged from home, in px */
  dragX: number;
  dragY: number;
};

const REST: Drift = { x: 0, y: 0, energy: 0, pulse: 0, pressX: 0, pressY: 0, dragX: 0, dragY: 0 };

/* How fast the value chases the pointer. Low numbers read as weight — the metal
 * lags behind the cursor and keeps moving after it stops, which is the whole point
 * of an interactive backdrop rather than a reactive one. */
const TRACK = 0.055;
const SETTLE = 0.032;

/* The press is an envelope, not a spike. Snapping the value to 1 and decaying from
 * there put the whole of the motion on the release; holding it up for a beat and
 * chasing it in both directions gives the press a rise you can see, and a tail long
 * enough to read as the surface settling rather than a value expiring. */
const PRESS_HOLD_MS = 150;
const PRESS_RISE = 0.2;
const PRESS_FALL = 0.045;
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
  const pressedAt = React.useRef(Number.NEGATIVE_INFINITY);

  const tick = React.useCallback(() => {
    const t = target.current;
    const v = value.current;
    const rate = t.energy > 0 ? TRACK : SETTLE;
    const pull = dragging.current ? HELD : HOMING;

    /* held up for the length of the press, then let go of */
    const held = performance.now() - pressedAt.current < PRESS_HOLD_MS ? 1 : 0;
    const pulse = v.pulse + (held - v.pulse) * (held > v.pulse ? PRESS_RISE : PRESS_FALL);

    const next: Drift = {
      x: v.x + (t.x - v.x) * rate,
      y: v.y + (t.y - v.y) * rate,
      energy: v.energy + (t.energy - v.energy) * SETTLE,
      pulse,
      pressX: t.pressX,
      pressY: t.pressY,
      dragX: v.dragX + (t.dragX - v.dragX) * pull,
      dragY: v.dragY + (t.dragY - v.dragY) * pull,
    };

    const settled =
      !dragging.current &&
      !held &&
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
      pressX: round(value.current.pressX),
      pressY: round(value.current.pressY),
      dragX: Math.round(value.current.dragX * 10) / 10,
      dragY: Math.round(value.current.dragY * 10) / 10,
    });
    frame.current = settled ? null : requestAnimationFrame(tick);
  }, []);

  /* Cancel and re-arm rather than "schedule only if nothing is pending".
     `requestAnimationFrame` does not fire in a hidden document, so a frame scheduled
     just before the tab went to the background stays pending for ever — and a guard
     that skips scheduling while something is pending then skips scheduling for the
     rest of the session. One moment in a background tab and the mark stops answering
     the pointer, permanently, with no error anywhere. Re-arming costs nothing (a
     pointer event fires at most once a frame) and cannot wedge. */
  const run = React.useCallback(() => {
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(tick);
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
        const rect = event.currentTarget.getBoundingClientRect();
        /* where the press landed, so whatever it sets off can start from there
           rather than from the middle of the mark */
        if (rect.width && rect.height) {
          target.current = {
            ...target.current,
            pressX: ((event.clientX - rect.left) / rect.width) * 2 - 1,
            pressY: ((event.clientY - rect.top) / rect.height) * 2 - 1,
          };
        }
        pressedAt.current = performance.now();
        dragging.current = true;
        origin.current = { x: event.clientX, y: event.clientY };
        window.addEventListener('pointermove', onWindowMove, { passive: true });
        window.addEventListener('pointerup', release);
        window.addEventListener('pointercancel', release);
        run();
      },
      onPointerLeave: () => {
        target.current = {
          ...REST,
          pressX: target.current.pressX,
          pressY: target.current.pressY,
          dragX: target.current.dragX,
          dragY: target.current.dragY,
        };
        run();
      },
    };
  }, [enabled, run]);

  return { drift, handlers };
}
