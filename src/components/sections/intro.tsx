import { Reveal, Words } from '@/components/reveal';

/* The three things a project actually arrives asking for. */
const CAPABILITIES = [
  { label: 'Identity', body: 'Marks, systems and the rules that keep them intact.' },
  { label: 'Photography ⟡ Film', body: 'Editorial and campaign work, shot in-house.' },
  { label: 'Digital', body: 'Sites and product surfaces, designed and built.' },
];

/**
 * The second beat: the sentence under the claim, and what the claim is made of.
 *
 * Two things changed here in the redesign. The statement moved to the hero, so this
 * section no longer repeats it — the page was saying "The whole picture, in-house."
 * twice in the first two screens, which reads as a template that lost its content
 * rather than as emphasis. And the wordmark shader came out: one WebGL context is a
 * deliberate expense on the first screen, two is a page that spends its frame budget
 * on its own background.
 *
 * What is left is the reference's own second move — a long line revealed a word at a
 * time as it enters, over ruled rows. The rows carry the span the hero asserts, which
 * is the only evidence this part of the page has.
 */
export function Intro() {
  return (
    <section
      id="intro"
      className="relative scroll-mt-24 py-[clamp(4rem,12vh,8rem)]"
    >
      <div className="shell">
        <Reveal>
          <p className="eyebrow">(Studio)</p>
        </Reveal>

        <Words
          text="A creative studio in the Bay Area. Identity, photography, film and the sites they live on — made under one roof, by the people who shot it."
          delay={1}
          className="mt-6 max-w-[26ch] font-display text-[clamp(1.5rem,3.4vw,2.75rem)] font-normal leading-[1.18] tracking-tight text-ink sm:max-w-[34ch]"
        />

        <ul className="mt-[clamp(2.5rem,7vh,4.5rem)] border-b border-border">
          {CAPABILITIES.map((item, i) => (
            <li key={item.label} className="rule-row grid-cols-1 sm:grid-cols-[14rem_1fr]">
              <Reveal delay={i}>
                <p className="text-[15px] font-medium tracking-tight text-ink">{item.label}</p>
              </Reveal>
              <Reveal delay={i}>
                <p className="max-w-[46ch] text-pretty text-[15px] leading-relaxed text-ink-2">
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
