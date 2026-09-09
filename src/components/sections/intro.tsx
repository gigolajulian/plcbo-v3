import { MetalMark } from '@/components/metal-mark';
import { Reveal, Words } from '@/components/reveal';

/* The three things a project actually arrives asking for. */
const CAPABILITIES = [
  { label: 'Identity', body: 'Marks, systems and the rules that keep them intact.' },
  { label: 'Photography ⟡ Film', body: 'Editorial and campaign work, shot in-house.' },
  { label: 'Digital', body: 'Sites and product surfaces, designed and built.' },
];

/**
 * The second screen: the statement, and the PLCBO wordmark in metal beside it.
 *
 * One viewport tall, the same as the first, so the two read as two pages rather than a
 * screen followed by a slightly taller one. `min-h` rather than `h` so a short window
 * grows instead of clipping — and every vertical gap in here is a `clamp` against `vh`,
 * with the statement sized `min(7.5vw, 11vh)`, because at fixed spacing the content
 * walked straight through the minimum it was meant to sit inside: three lines of 8vw
 * type is 328px whatever the window's height, which put this 40px past the hero on a
 * 1366×768 laptop.
 *
 * The wordmark is drawn inside this section rather than by a fixed layer that travelled
 * the page, so there is no transition into it and no extra scroll spent carrying one
 * shape into another — you arrive on this screen and it is already here. The copy is
 * held to the left half on wide screens to clear it, and the capabilities stack for the
 * same reason: three columns squeezed into half a page were four words wide each.
 */
export function Intro() {
  return (
    <section
      id="intro"
      className="relative isolate flex min-h-[100svh] scroll-mt-24 items-center py-[clamp(2rem,7vh,4rem)]"
    >
      {/* Parked right and running off the edge, lifted off centre to sit level with the
          statement: this section centres its whole content block — eyebrow, heading and
          three capability rows — so the heading lands in the upper part of it, and a
          shape centred on the screen read as a second unrelated object lower down.
          On a portrait screen there is no margin beside the copy to park in, so it
          takes a band of its own instead of sitting behind the headline. The object box
          is sized off the longer edge, which on a phone is the height, so 0.42 of 812 is
          341px across a 375px screen — inside the margins rather than cropped by them.
          It goes *below* the copy rather than above: above, the only clear space is
          138px between the header and the eyebrow, and the eyebrow already names the
          studio there. Underneath it reads as a signature. */}
      <MetalMark
        mask="/wordmark-mask.png"
        scale={0.62}
        compactScale={0.42}
        fx={1}
        px={-110}
        y={-0.15}
        compactY={0.37}
      />

      <div className="shell relative z-10 w-full">
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
