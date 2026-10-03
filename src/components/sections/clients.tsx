import { asset } from '@/lib/asset';
import { Reveal } from '@/components/reveal';
import { Swap } from '@/components/swap';

type Client = {
  name: string;
  /** What PLCBO did for them. */
  work: string;
  /** Path under `public/`. Absent where the brand publishes no retrievable mark. */
  logo?: string;
  w?: number;
  h?: number;
};

/* The seven confirmed names. Four publish a mark worth committing; the other three
 * publish none anywhere retrievable — Ukiyo's Unknown has no favicon and no logo
 * asset on its store, and Jojo's Hot Chicken and SAGO set their names as live type.
 * They sit in the same row either way, named rather than hidden. */
const CLIENTS: Client[] = [
  { name: 'Google', work: 'Photography', logo: '/clients/google.svg', w: 272, h: 92 },
  { name: 'WIRED', work: 'Editorial', logo: '/clients/wired.svg', w: 125, h: 25 },
  { name: 'Aurora Solar', work: 'Identity ⟡ Digital', logo: '/clients/aurora-solar.svg', w: 79, h: 14 },
  { name: 'JUBO', work: 'Campaign ⟡ Film', logo: '/clients/jubo.png', w: 640, h: 300 },
  { name: "Ukiyo's Unknown", work: 'Art direction' },
  { name: 'SAGO', work: 'Identity' },
  { name: "Jojo's Hot Chicken", work: 'Photography ⟡ Digital' },
];

/**
 * The client wall, as a ruled list.
 *
 * This is the one place the redesign argues with its own reference. That site runs a
 * twelve-cell logo grid, and it works there because it is backed by Disney, Sony,
 * Twitch, Vodafone, Cadillac — the persuasion is the sheer count. PLCBO has seven
 * names and four logo files. Seven marks dropped into a grid built for twelve reads
 * as a studio padding its wall, which is worse than showing fewer with confidence.
 *
 * So it takes the reference's other repeating structure instead: the ruled row, name
 * left at display size, the work in the middle, the mark right. A list of seven is a
 * list of seven. It also says what each engagement actually was, which a logo grid
 * cannot, and that is the thing a brand lead is really reading for.
 */
export function Clients() {
  return (
    <section id="clients" aria-label="Selected clients" className="scroll-mt-24 py-[clamp(4rem,12vh,8rem)]">
      <div className="shell">
        <Reveal>
          <p className="eyebrow">(Trusted by)</p>
        </Reveal>

        <ul className="mt-[clamp(2rem,5vh,3.5rem)]">
          {CLIENTS.map((client, i) => (
            <li
              key={client.name}
              className="group rule-row grid-cols-[1fr_auto] gap-x-6 sm:grid-cols-[1fr_11rem_7rem] last:border-b"
            >
              <Reveal delay={Math.min(i, 3)}>
                <span className="block font-display text-index font-normal track-display text-ink">
                  <Swap text={client.name} />
                </span>
              </Reveal>

              <span className="hidden text-[13px] text-ink-3 sm:block">{client.work}</span>

              <span className="flex h-6 items-center justify-end sm:justify-center">
                {client.logo ? (
                  <img
                    alt=""
                    aria-hidden="true"
                    className="pointer-events-none max-h-full w-auto max-w-[6.5rem] select-none opacity-80"
                    height={client.h}
                    loading="lazy"
                    src={asset(client.logo)}
                    /* Every mark to one ink. The sources are a four-colour logotype,
                       two black wordmarks and a white PNG; left alone they read as a
                       pile of assets rather than a list of names. On a light ground
                       the white PNG needs inverting first, which `brightness(0)`
                       does for all four at once by mapping every opaque pixel to
                       black and leaving alpha untouched. */
                    style={{ filter: 'brightness(0)' }}
                    width={client.w}
                  />
                ) : null}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
