import { LogoCloud, type Logo } from '@/components/ui/logo-cloud-2';

/**
 * The client wall — and the only place in the body that is not near-black.
 *
 * Inverting one band is the cheapest rhythm the page has: five thousand pixels of the
 * same ground is the reason the body read flat, and a single hard cut across it does
 * more than any amount of tuning inside the dark. The two values are the identity
 * system's paper and ink, borrowed for this band only. They are written here rather
 * than added to the palette because nothing else on the site is light, and a token
 * would invite a second one.
 *
 * It sits high on purpose: names are proof, and proof is worth more before someone has
 * decided than after. It used to be a marquee of names set in the display face; a ruled
 * grid of the actual marks is the stronger proof, and it holds still long enough to be
 * read.
 */
const PAPER = '#f2f0ea';
const INK = '#0e0e0e';
const GRAPHITE = '#83806f';

/* Every file here was pulled from the brand's own site or from Wikimedia Commons and
 * committed, rather than hotlinked the way the upstream component did — a client wall
 * that goes blank when someone else's CDN moves a file is worse than no wall.
 *
 * Three of the seven have no published mark at all: UKIYO'S UNKNOWN and Jojo's Chicken
 * both set their name as live type in the page header, and SAGO was never pinned to a
 * specific company. Those render as type until a file arrives — the cell is the same
 * either way, so dropping a logo in later is a one-line change. */
const CLIENTS: Logo[] = [
  { name: 'Google', src: '/clients/google.svg', width: 272, height: 92 },
  { name: 'WIRED', src: '/clients/wired.svg', width: 125, height: 25 },
  { name: 'Aurora Solar', src: '/clients/aurora-solar.svg', width: 79, height: 14 },
  { name: 'JUBO', src: '/clients/jubo.png', width: 640, height: 300 },
  { name: "Ukiyo's Unknown" },
  { name: 'SAGO' },
  { name: "Jojo's Chicken" },
];

export function Clients() {
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

      {/* The ruling is the ink at a tenth, not the ink itself: at full strength seven
          hairlines across a sheet of paper draw more attention than the marks sitting
          in them. */}
      <div className="shell" style={{ '--rule': 'rgba(14,14,14,0.12)' } as React.CSSProperties}>
        <LogoCloud logos={CLIENTS} />
      </div>
    </section>
  );
}
