import { Reveal, Words } from '@/components/reveal';

/* The three things a project actually arrives asking for. Recovered from the hero,
 * which used to carry them under the wordmark and now carries nothing but the mark. */
const CAPABILITIES = [
  { label: 'Identity', body: 'Marks, systems and the rules that keep them intact.' },
  { label: 'Photography ⟡ Film', body: 'Editorial and campaign work, shot in-house.' },
  { label: 'Digital', body: 'Sites and product surfaces, designed and built.' },
];

/**
 * The statement — the first words anyone reads on the site.
 *
 * This used to pin for 260vh and light its sentence a word at a time off scroll
 * position. It gave that up when the hero became a scroll journey of its own: the
 * hero is the better place to spend a held screen, and two pinned sections back to
 * back read as a demo reel rather than as a decision.
 *
 * The sentence still builds a word at a time, through `Words` — on entry now rather
 * than across a pin, which is the same gesture in a tenth of the scroll.
 */
export function Intro() {
  return (
    <section id="intro" className="scroll-mt-24 py-32">
      <div className="shell">
        <Reveal>
          <p className="eyebrow">
            PLCBO <span aria-hidden="true">⟡</span> Creative Studios
          </p>
        </Reveal>

        <Words
          text="One studio for the whole picture. Identity, photography, film and the sites they live on."
          delay={1}
          className="mt-10 max-w-[16ch] font-display text-mega font-semibold tracking-tight text-foreground"
        />

        <ul className="mt-16 grid grid-cols-1 gap-x-10 sm:grid-cols-3">
          {CAPABILITIES.map((item, i) => (
            <li key={item.label} className="border-t border-border pb-6 pt-5 sm:pb-0">
              <Reveal delay={i + 1}>
                <p className="eyebrow">{item.label}</p>
                <p className="mt-3 max-w-[34ch] text-pretty leading-relaxed text-ink-2">
                  {item.body}
                </p>
              </Reveal>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
