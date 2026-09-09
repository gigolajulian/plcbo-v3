import { Reveal, Words } from '@/components/reveal';

/* The three things a project actually arrives asking for. */
const CAPABILITIES = [
  { label: 'Identity', body: 'Marks, systems and the rules that keep them intact.' },
  { label: 'Photography ⟡ Film', body: 'Editorial and campaign work, shot in-house.' },
  { label: 'Digital', body: 'Sites and product surfaces, designed and built.' },
];

/**
 * The statement — the first words anyone reads on the site.
 *
 * Two things shape this section. It used to pin for 260vh and light its sentence a word
 * at a time off scroll position; it gave that up so the hero could be the page's one
 * held screen. And the metal now parks the PLCBO wordmark in the right of the frame and
 * holds it there while this scrolls past, so every line here is kept to the left half
 * on wide screens rather than crossing it. The capabilities stack for the same reason —
 * three columns squeezed into half a page were four words wide each.
 */
export function Intro() {
  return (
    <section id="intro" className="scroll-mt-24 py-32">
      <div className="shell">
        <div className="md:max-w-[52%]">
          <Reveal>
            <p className="eyebrow">
              PLCBO <span aria-hidden="true">⟡</span> Creative Studios
            </p>
          </Reveal>

          <Words
            text="The whole picture, in-house."
            delay={1}
            className="mt-10 font-display text-mega font-semibold tracking-tight text-foreground"
          />

          <ul className="mt-16">
            {CAPABILITIES.map((item, i) => (
              <li key={item.label} className="border-t border-border py-5">
                <Reveal delay={i + 1}>
                  <p className="eyebrow">{item.label}</p>
                  <p className="mt-2 max-w-[42ch] text-pretty leading-relaxed text-ink-2">
                    {item.body}
                  </p>
                </Reveal>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
