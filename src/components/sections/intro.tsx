import { Reveal, Words } from '@/components/reveal';

/* The three things a project actually arrives asking for. Recovered from the hero,
 * which used to carry them under the wordmark and now carries nothing but the mark. */
const CAPABILITIES = [
  { label: 'Identity', body: 'Marks, systems and the rules that keep them intact.' },
  { label: 'Photography ⟡ Film', body: 'Editorial and campaign work, shot in-house.' },
  { label: 'Digital', body: 'Sites and product surfaces, designed and built.' },
];

export function Intro() {
  return (
    <section id="intro" className="scroll-mt-24 py-26">
      <div className="shell">
        <Reveal>
          <p className="eyebrow">
            PLCBO <span aria-hidden="true">⟡</span> Creative Studios
          </p>
        </Reveal>

        {/* The sentence the site was missing. When the hero became the mark alone,
            every word went with it — this is the first thing anyone actually reads. */}
        <Words
          text="One studio for the whole picture. Identity, photography, film and the sites they live on."
          className="mt-8 max-w-[20ch] font-display text-[clamp(2rem,5.4vw,4.25rem)] font-semibold leading-[1.02] tracking-tight text-foreground"
        />

        <div className="mt-16 grid grid-cols-1 gap-12 lg:grid-cols-[1fr_1.1fr] lg:gap-26">
          <Reveal delay={1}>
            <p className="max-w-md text-pretty text-lg leading-relaxed text-ink-2">
              We work with apparel, product and editorial brands from the first mark
              through to launch — shooting, designing and building in-house, so the
              pieces actually match. About a dozen projects a year, so each one gets
              the room it needs.
            </p>
            <a
              href="#connect"
              className="mt-8 inline-flex min-h-[44px] items-center gap-2 py-3 font-display text-xl font-semibold tracking-tight text-foreground transition-colors hover:text-accent"
            >
              Start a project
              <span aria-hidden="true">→</span>
            </a>
          </Reveal>

          <ul className="grid grid-cols-1 sm:grid-cols-3 lg:gap-8">
            {CAPABILITIES.map((item, i) => (
              <li key={item.label}>
                {/* the rule draws itself in above each one, so the row assembles */}
                <Reveal variant="rule" delay={i} className="h-px w-full bg-border" />
                <Reveal delay={i + 1} className="pb-8 pt-5 sm:pb-0">
                  <p className="eyebrow">{item.label}</p>
                  <p className="mt-3 text-pretty leading-relaxed text-ink-2">{item.body}</p>
                </Reveal>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
