import * as React from 'react';

const SIZE = 26;
/** How hard the ring chases the pointer. High enough to feel attached, low enough to breathe. */
const TRACK = 0.32;
const DECAY = 0.09;

/**
 * A ring in place of the pointer.
 *
 * Only on a device that has a real pointer, and only when the reader has not asked
 * for less motion — everywhere else the native cursor is left alone, because a
 * lagging ring on a trackpad-less device is a broken cursor, not a flourish.
 *
 * The rAF loop is decorative: it starts on the first pointer event, stops itself
 * once the ring has caught up, and nothing on the page waits on it.
 */
export function Cursor() {
  const ref = React.useRef<HTMLDivElement | null>(null);
  const [active, setActive] = React.useState(false);

  React.useEffect(() => {
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)');
    const still = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setActive(fine.matches && !still.matches);

    sync();
    fine.addEventListener('change', sync);
    still.addEventListener('change', sync);

    return () => {
      fine.removeEventListener('change', sync);
      still.removeEventListener('change', sync);
    };
  }, []);

  React.useEffect(() => {
    if (!active) return;

    const root = document.documentElement;
    root.classList.add('cursor-ring');

    const target = { x: -100, y: -100 };
    const value = { x: -100, y: -100 };
    let pulse = 0;
    let seen = false;
    let frame: number | null = null;

    const paint = () => {
      const node = ref.current;
      if (!node) return;
      node.style.transform =
        `translate3d(${value.x - SIZE / 2}px, ${value.y - SIZE / 2}px, 0) ` +
        `scale(${(1 + pulse * 0.55).toFixed(3)})`;
      node.style.opacity = seen ? String(0.55 + pulse * 0.45) : '0';
      /* hollow at rest, filled solid on the press */
      node.style.backgroundColor = 'rgba(255, 255, 255, ' + pulse.toFixed(3) + ')';
    };

    const tick = () => {
      value.x += (target.x - value.x) * TRACK;
      value.y += (target.y - value.y) * TRACK;
      pulse *= 1 - DECAY;

      const settled =
        Math.abs(target.x - value.x) < 0.1 && Math.abs(target.y - value.y) < 0.1 && pulse < 0.004;

      if (settled) {
        value.x = target.x;
        value.y = target.y;
        pulse = 0;
      }

      paint();
      frame = settled ? null : requestAnimationFrame(tick);
    };

    const run = () => {
      if (frame === null) frame = requestAnimationFrame(tick);
    };

    const onMove = (event: PointerEvent) => {
      target.x = event.clientX;
      target.y = event.clientY;
      if (!seen) {
        /* first sighting: put the ring under the pointer rather than flying it in
           from the corner */
        seen = true;
        value.x = event.clientX;
        value.y = event.clientY;
      }
      run();
    };

    const onDown = () => {
      pulse = 1;
      run();
    };

    const onLeave = () => {
      seen = false;
      run();
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerdown', onDown, { passive: true });
    document.addEventListener('pointerleave', onLeave);

    return () => {
      root.classList.remove('cursor-ring');
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerdown', onDown);
      document.removeEventListener('pointerleave', onLeave);
      if (frame !== null) cancelAnimationFrame(frame);
    };
  }, [active]);

  if (!active) return null;

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none fixed left-0 top-0 z-[100] rounded-full border-[1.5px] border-white opacity-0"
      style={{ width: SIZE, height: SIZE, willChange: 'transform, opacity' }}
    />
  );
}
