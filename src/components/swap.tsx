import { cn } from '@/lib/utils';

/**
 * A line of text that rolls over to a copy of itself on hover.
 *
 * This is the reference's row hover, rebuilt. Its markup gives the trick away: an
 * absolutely-positioned visible line sitting over an `invisible` copy that reserves the
 * width, plus a second `opacity-0` duplicate of the same string. That is a vertical
 * swap — the line leaves upward while its duplicate arrives from below — and the only
 * reason it needs three copies of the text there is that the animation is driven by
 * GSAP from JavaScript.
 *
 * In CSS it needs two: one track holding both lines, translated by exactly one line. The
 * track is what moves, so there is one transform per row rather than one per line, and
 * nothing reflows because only the first copy is in flow — the second is parked a line
 * below it, which is what gives the clipping box a single line to reserve.
 *
 * The duplicate is `aria-hidden`, so the accessible name stays a single string rather
 * than the doubled "MayweatherMayweather" the reference actually exposes.
 */
export function Swap({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  return (
    <span className={cn('swap', className)}>
      <span className="swap-track">
        <span className="block">{text}</span>
        <span className="swap-next" aria-hidden="true">
          {text}
        </span>
      </span>
    </span>
  );
}

/**
 * The arrow that wipes in from its own clipped slot.
 *
 * The reference keeps it in a 12px `overflow: hidden` box so the arrow has somewhere to
 * be before it arrives — without the box it would either pop or push the row's layout
 * around as it moves.
 */
export function SwapArrow({ className }: { className?: string }) {
  return (
    <span className={cn('swap-arrow', className)} aria-hidden="true">
      <span className="swap-arrow-inner">→</span>
    </span>
  );
}
