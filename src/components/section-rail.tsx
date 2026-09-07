import { motion, useReducedMotion } from 'framer-motion';

import { useScrollSpy, useScrolledPast } from '@/hooks/use-scroll-spy';
import { cn } from '@/lib/utils';

const SECTIONS = [
  { id: 'intro', label: 'Intro' },
  { id: 'work', label: 'Work' },
  { id: 'services', label: 'Services' },
  { id: 'studio', label: 'Studio' },
  { id: 'connect', label: 'Connect' },
];

const IDS = SECTIONS.map((s) => s.id);

/**
 * The rail — where you are in the page, down the right-hand edge.
 *
 * Right rather than left: every heading in the body is flush left, and a left rail
 * starts colliding with the type as soon as the window is narrower than the 1200px
 * shell plus two rails.
 *
 * It reads `useScrollSpy`, the same hook the header already uses, so the rail and the
 * nav can never disagree about which section you are in. That hook compares `offsetTop`
 * against a line 120px down the viewport, which is why the 260vh pinned intro does not
 * confuse it — a tall section simply stays current for longer, which is true.
 *
 * The travelling marker is a single element with a `layoutId`, rendered inside whichever
 * entry is active. Framer measures both positions and tweens between them itself, so
 * there is no offset arithmetic here to drift out of step when the labels reflow or the
 * window resizes.
 */
export function SectionRail() {
  const active = useScrollSpy(IDS);
  const scrolled = useScrolledPast(80);
  const reduceMotion = useReducedMotion();

  return (
    <nav
      aria-label="Sections"
      className={cn(
        'group fixed right-6 top-1/2 z-40 hidden -translate-y-1/2 transition-opacity duration-500 lg:block',
        scrolled ? 'opacity-100' : 'pointer-events-none opacity-0',
      )}
    >
      <ul className="flex flex-col items-end">
        {SECTIONS.map((section) => {
          const current = active === section.id;
          return (
            <li key={section.id}>
              <a
                href={`#${section.id}`}
                aria-current={current ? 'true' : undefined}
                className="flex min-h-[44px] items-center justify-end gap-3 pl-6"
              >
                {/* The label is laid out at full size at all times and only faded, so
                    the ticks never shift sideways as it appears — a rail that jitters
                    when you look at it is worse than no rail. */}
                <span
                  className={cn(
                    'font-mono text-[11px] uppercase tracking-[0.18em] transition-[color,opacity] duration-300',
                    current ? 'text-foreground' : 'text-ink-3',
                    'opacity-0 group-hover:opacity-100',
                    current && 'opacity-100',
                  )}
                >
                  {section.label}
                </span>

                <span className="relative flex h-px w-8 items-center justify-end">
                  <span
                    className={cn(
                      'h-px w-4 origin-right transition-[transform,background-color] duration-500 ease-smooth',
                      current ? 'bg-transparent' : 'bg-ink-3 group-hover:bg-ink-2',
                    )}
                  />
                  {current ? (
                    <motion.span
                      layoutId="rail-marker"
                      className="absolute right-0 h-px w-8 bg-foreground"
                      transition={
                        reduceMotion
                          ? { duration: 0 }
                          : { type: 'spring', stiffness: 380, damping: 34 }
                      }
                    />
                  ) : null}
                </span>
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
