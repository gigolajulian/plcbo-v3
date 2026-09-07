import * as React from 'react';
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from 'framer-motion';

import { Reveal } from '@/components/reveal';
import { asset } from '@/lib/asset';
import { cn } from '@/lib/utils';

type Project = {
  title: string;
  tags: string;
  year: string;
  img: string;
};

const PROJECTS: Project[] = [
  { title: 'PLYGR3D', tags: 'Art direction ⟡ Photography', year: '2025', img: '/img/work-01.webp' },
  { title: 'ANGEL', tags: 'Editorial ⟡ Film', year: '2025', img: '/img/work-02.webp' },
  { title: 'CHROME', tags: 'Product ⟡ Identity', year: '2024', img: '/img/work-03.webp' },
  { title: 'DRIP', tags: 'Apparel ⟡ Campaign', year: '2024', img: '/img/work-04.webp' },
  { title: 'CIRCUIT', tags: 'Brand system ⟡ Motion', year: '2024', img: '/img/work-05.webp' },
];

const CARD = { w: 300, h: 380 };

/**
 * Does this reader have a pointer that can hover?
 *
 * Read once in the initialiser rather than in an effect, so the correct branch renders
 * on the first paint — flipping afterwards would tear five lazy photographs out of the
 * layout on every desktop load. There is no SSR here, so `window` is safe.
 */
function useFinePointer() {
  const query = '(hover: hover) and (pointer: fine)';
  const [fine, setFine] = React.useState(() => window.matchMedia(query).matches);

  React.useEffect(() => {
    const mq = window.matchMedia(query);
    const onChange = () => setFine(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return fine;
}

/**
 * Work, as an index rather than a gallery.
 *
 * Five photographs in a card grid is what every studio site does, and it makes the type
 * decorative. Rows make the type the work: the name is set large enough to read from
 * across the room, and the photograph is what you get for showing interest in one.
 *
 * There is exactly one floating image for the whole section, not one per row. Its
 * position is a pair of springs fed by a single `pointermove` on the list, so it trails
 * the cursor with weight instead of being welded to it, and five rows cost five `src`
 * swaps rather than five listeners and five animated elements.
 */
export function Work() {
  const fine = useFinePointer();
  const reduceMotion = useReducedMotion();
  const floats = fine && !reduceMotion;

  const [hovered, setHovered] = React.useState<number | null>(null);

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 220, damping: 26, mass: 0.6 });
  const springY = useSpring(y, { stiffness: 220, damping: 26, mass: 0.6 });

  const place = (e: React.PointerEvent, instant = false) => {
    x.set(e.clientX - CARD.w / 2);
    y.set(e.clientY - CARD.h / 2);
    /* On the first row entered there is no previous position to travel from — without
       this the card sails in from the top-left corner of the window. */
    if (instant) {
      springX.jump(x.get());
      springY.jump(y.get());
    }
  };

  return (
    <section id="work" className="scroll-mt-24 py-32">
      {/* Work opens on its own terms — a name set against the count, not the same
          eyebrow / rule / heading / lede stack that Services and Studio share. */}
      <header className="shell mb-20 flex flex-wrap items-end justify-between gap-8">
        <Reveal>
          <p className="eyebrow mb-5">Selected work</p>
          <h2 className="font-display text-mega font-semibold tracking-tight text-foreground">
            Work
          </h2>
        </Reveal>
        <Reveal delay={1}>
          <p className="max-w-xs text-pretty leading-relaxed text-ink-2">
            Identity systems, campaigns, editorial shoots and the sites they live on.
            Five recent projects.
          </p>
        </Reveal>
      </header>

      <ul
        className="border-t border-border"
        onPointerMove={floats ? (e) => place(e) : undefined}
      >
        {PROJECTS.map((project, i) => (
          <Reveal as="li" key={project.title} delay={i % 3} className="border-b border-border">
            <a
              href="#connect"
              aria-label={`${project.title} — ${project.tags.replace(' ⟡ ', ' and ')}, ${project.year}`}
              className="group block"
              onPointerEnter={
                floats
                  ? (e) => {
                      place(e, true);
                      setHovered(i);
                    }
                  : undefined
              }
              onPointerLeave={floats ? () => setHovered(null) : undefined}
            >
              <div className="shell flex items-baseline gap-6 py-8 sm:gap-10">
                <span
                  className={cn(
                    'font-mono text-[11px] tracking-[0.18em] transition-colors duration-500',
                    hovered === i ? 'text-accent' : 'text-ink-3',
                  )}
                >
                  {String(i + 1).padStart(2, '0')}
                </span>

                {/* The title is the only thing that moves. A row where four elements
                    all slide on hover reads as a wobble, not a response. */}
                <h3 className="flex-1 font-display text-index font-semibold uppercase tracking-tight text-ink-2 transition-[color,transform] duration-500 ease-smooth group-hover:translate-x-3 group-hover:text-foreground motion-reduce:group-hover:translate-x-0">
                  {project.title}
                </h3>

                <span className="hidden max-w-[22ch] text-right leading-snug text-ink-3 md:block">
                  {project.tags}
                </span>
                <span className="eyebrow shrink-0">{project.year}</span>
              </div>

              {/* No hover to reveal it with, so the photograph is simply here. A
                  different element for a different reader, not the same one disabled. */}
              {floats ? null : (
                <div className="shell pb-8">
                  <img
                    src={asset(project.img)}
                    alt={`${project.title} — ${project.tags.replace(' ⟡ ', ' and ')}`}
                    loading="lazy"
                    decoding="async"
                    width={1200}
                    height={800}
                    className="aspect-[3/2] w-full rounded-lg object-cover"
                  />
                </div>
              )}
            </a>
          </Reveal>
        ))}
      </ul>

      <div className="shell">
        <Reveal delay={1}>
          <a
            href="#connect"
            className="mt-16 inline-flex min-h-[44px] items-center gap-2 py-3 font-mono text-[11px] uppercase tracking-[0.18em] text-ink-2 transition-colors hover:text-foreground"
          >
            View all projects
            <span aria-hidden="true">→</span>
          </a>
        </Reveal>
      </div>

      {floats ? (
        <AnimatePresence>
          {hovered !== null ? (
            <motion.div
              key="peek"
              aria-hidden="true"
              className="pointer-events-none fixed left-0 top-0 z-40 overflow-hidden rounded-lg"
              style={{ x: springX, y: springY, width: CARD.w, height: CARD.h }}
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            >
              <img
                src={asset(PROJECTS[hovered].img)}
                alt=""
                width={CARD.w}
                height={CARD.h}
                className="h-full w-full object-cover"
              />
            </motion.div>
          ) : null}
        </AnimatePresence>
      ) : null}
    </section>
  );
}
