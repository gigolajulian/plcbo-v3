import { useReducedMotion } from 'framer-motion';

/**
 * The client ribbon — and the only place in the body that is not near-black.
 *
 * Inverting one band is the cheapest rhythm the page has: five thousand pixels of the
 * same ground is the reason the body read flat, and a single hard cut across it does
 * more than any amount of tuning inside the dark. The two values are the identity
 * system's paper and ink, borrowed for this band only. They are written here rather
 * than added to the palette because nothing else on the site is light, and a token
 * would invite a second one.
 *
 * It sits high on purpose: names are proof, and proof is worth more before someone has
 * decided than after.
 */
const PAPER = '#f2f0ea';
const INK = '#0e0e0e';
const GRAPHITE = '#83806f';

const CLIENTS = ['Google', '/Paradox/', 'WIRED', 'Nikoo', 'Strom', 'Oakley'];

/* The one place the site sets a colour outside the palette, so the hover lives in
   the class list with it rather than in a style object elsewhere. */
const NAME =
  'shrink-0 px-10 font-display text-3xl font-semibold tracking-tight text-[#83806f] ' +
  'transition-colors duration-300 hover:text-[#0e0e0e] sm:text-5xl';

export function Clients() {
  const reduceMotion = useReducedMotion();

  return (
    <section
      aria-label="Selected clients"
      className="py-14"
      style={{ backgroundColor: PAPER, color: INK }}
    >
      <p
        className="shell mb-8 font-mono text-[11px] uppercase tracking-[0.18em]"
        style={{ color: GRAPHITE }}
      >
        Selected clients
      </p>

      {reduceMotion ? (
        /* Not the animated track with the animation switched off. The global
           reduced-motion rule forces `animation-duration: 0.01ms`, which would run the
           marquee instantly to its -50% end state and park it there, cutting the list
           in half. A reader who asked for less motion gets a plain wrapped row. */
        <ul className="shell flex flex-wrap gap-x-10 gap-y-4">
          {CLIENTS.map((client) => (
            <li
              key={client}
              className="font-display text-3xl font-semibold tracking-tight sm:text-5xl"
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
                  <li key={client} className={NAME}>
                    {client}
                  </li>
                ))}
              </ul>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
