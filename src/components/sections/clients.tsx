import { useReducedMotion } from 'framer-motion';

import { Reveal } from '@/components/reveal';

const CLIENTS = ['Google', '/Paradox/', 'WIRED', 'Nikoo', 'Strom', 'Oakley'];

function Name({ children }: { children: string }) {
  return (
    <li className="shrink-0 px-10 font-display text-2xl font-semibold tracking-tight text-ink-3 transition-colors duration-300 hover:text-foreground sm:text-3xl">
      {children}
    </li>
  );
}

/**
 * The client ribbon.
 *
 * Moved up out of the foot of Studio: names are proof, and proof is worth more before
 * someone has decided than after. It runs continuously because a static row of six
 * names reads as a list, and a moving one reads as a roster.
 */
export function Clients() {
  const reduceMotion = useReducedMotion();

  return (
    <section aria-label="Selected clients" className="border-y border-border py-12">
      <Reveal>
        <p className="eyebrow shell mb-8">Selected clients</p>
      </Reveal>

      {reduceMotion ? (
        /* Not the animated track with the animation switched off. The global
           reduced-motion rule forces `animation-duration: 0.01ms`, which would run the
           marquee instantly to its -50% end state and park it there, cutting the list
           in half. A reader who asked for less motion gets a plain wrapped row. */
        <ul className="shell flex flex-wrap gap-x-10 gap-y-4">
          {CLIENTS.map((client) => (
            <li
              key={client}
              className="font-display text-2xl font-semibold tracking-tight text-ink-3 sm:text-3xl"
            >
              {client}
            </li>
          ))}
        </ul>
      ) : (
        <div
          className="group relative flex overflow-hidden"
          /* names fade out at the edges instead of being sliced off by the viewport */
          style={{
            maskImage:
              'linear-gradient(to right, transparent, black 8%, black 92%, transparent)',
            WebkitMaskImage:
              'linear-gradient(to right, transparent, black 8%, black 92%, transparent)',
          }}
        >
          {/* One track holding two copies of the list, travelling exactly -50% of
              its own width — which is one whole copy — so the second lands precisely
              where the first began and the loop has no seam. Animating the two copies
              separately would move each by half of *itself* and tear. */}
          <div className="flex animate-marquee items-center group-hover:[animation-play-state:paused]">
            {[0, 1].map((copy) => (
              <ul key={copy} aria-hidden={copy === 1} className="flex shrink-0 items-center">
                {CLIENTS.map((client) => (
                  <Name key={client}>{client}</Name>
                ))}
              </ul>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
