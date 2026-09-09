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
    /* One viewport tall, with its content centred in it, so this screen is the same
       height as the hero's and the two read as two panels rather than a full screen
       followed by a slightly taller one. It also puts the statement optically level
       with the wordmark, which parks vertically centred in the frame. `min-h` rather
       than `h`, so a narrow screen where the capabilities stack can still grow — and
       every vertical gap in here is a `clamp` against `vh` rather than a fixed step. At
       fixed spacing the content plus its padding came to 902px and overflowed the very
       minimum it was supposed to sit inside; scaling the gaps with the window keeps the
       two screens equal down to about 700px tall. Below that a three-line statement and
       three capability rows genuinely need more room than one screen, and this grows
       rather than clipping them.

       The statement takes its own size rather than the shared `text-mega`, and that
       size is capped against the window's *height* as well as its width:
       `min(7.5vw, 11vh)`. Sized off width alone, three lines of it came to 328px on a
       1366x768 laptop and pushed this screen 40px past the hero's. `text-mega` is left
       alone because Work's heading and the contact address do not have three lines of
       anything under them. */
    <section
      id="intro"
      className="flex min-h-[100svh] scroll-mt-24 items-center py-[clamp(2rem,7vh,4rem)]"
    >
      <div className="shell w-full">
        <div className="md:max-w-[52%]">
          <Reveal>
            <p className="eyebrow">
              PLCBO <span aria-hidden="true">⟡</span> Creative Studios
            </p>
          </Reveal>

          <Words
            text="The whole picture, in-house."
            delay={1}
            className="mt-[clamp(1.25rem,3.5vh,2.5rem)] font-display text-[clamp(2.5rem,min(7.5vw,11vh),6rem)] font-semibold leading-[0.94] tracking-tight text-foreground"
          />

          <ul className="mt-[clamp(1.75rem,6vh,4rem)]">
            {CAPABILITIES.map((item, i) => (
              <li key={item.label} className="border-t border-border py-[clamp(0.6rem,1.6vh,1.25rem)]">
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
