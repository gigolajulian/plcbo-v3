import { motion } from 'framer-motion';

import { Reveal } from '@/components/reveal';
import { SectionHead } from '@/components/sections/section-head';
import { useCountUp } from '@/hooks/use-count-up';
import { useParallax } from '@/hooks/use-parallax';
import { asset } from '@/lib/asset';

const STATS = [
  { n: 8, suffix: '', label: 'Years working' },
  { n: 120, suffix: '+', label: 'Projects shipped' },
  { n: 24, suffix: 'h', label: 'Reply time' },
];

function Stat({ n, suffix, label }: { n: number; suffix: string; label: string }) {
  const { ref, value } = useCountUp(n);
  return (
    <div className="border-t border-border pt-6">
      <span
        ref={ref}
        className="block font-display text-[clamp(3rem,7vw,5.5rem)] font-semibold leading-none tracking-tight text-foreground tabular-nums"
      >
        {value}
        {suffix}
      </span>
      <span className="eyebrow mt-4 block">{label}</span>
    </div>
  );
}

/**
 * The studio.
 *
 * The photograph leaves the shell and runs off the right edge of the window. Everything
 * in the body used to sit inside the same 1200px box, which is most of why the page read
 * as a stack of equal blocks; one image breaking the container does more for the rhythm
 * than any amount of adjustment inside it.
 *
 * The counters run across the full width underneath rather than stacking in a column
 * beside the picture, so the numbers are the section's floor instead of its margin.
 */
export function Studio() {
  const { ref, y } = useParallax(0.07);

  return (
    <section id="studio" className="scroll-mt-24 py-26">
      <div className="shell">
        <SectionHead
          label="Who we are"
          title="Studio"
          lede="A small studio in the Bay Area. We shoot, design and build in-house."
        />
      </div>

      {/* Clipped because the `plate` reveal starts at scale 1.045, and a full-bleed
          element scaled up has nowhere to grow but off the side of the window — 13px
          of horizontal document scroll on every load until it settles. Inside the
          shell the page margins absorbed that; out here nothing does. */}
      <div className="grid grid-cols-1 items-center gap-16 overflow-hidden lg:grid-cols-[1fr_1.15fr]">
        <div className="shell lg:ml-auto lg:mr-0 lg:max-w-[34rem] lg:px-0 lg:pl-16">
          <Reveal>
            {/* Relocated from the intro, which had become a pinned sentence and had no
                room for a paragraph. It says who we are, so it belongs here. */}
            <p className="max-w-md text-pretty text-lg leading-relaxed text-ink-2">
              We work with apparel, product and editorial brands from the first mark
              through to launch — shooting, designing and building in-house, so the
              pieces actually match. About a dozen projects a year, so each one gets
              the room it needs.
            </p>
            <p className="mt-8 font-display text-xl font-semibold tracking-tight text-foreground">
              Julian Gigola <span className="text-ink-3">⟡ Photographer</span>
            </p>
          </Reveal>
        </div>

        {/* Bleeds off the right edge of the window on wide screens; inside the shell on
            narrow ones, where there is no margin to bleed into. */}
        <Reveal variant="plate" delay={1} className="order-first lg:order-last">
          <div
            ref={ref}
            className="relative aspect-[4/3] overflow-hidden lg:rounded-l-lg"
          >
            {/* The frame owns the ratio and the drift lives on the layer inside it, so
                nothing writes `transform` on the same node twice. The layer is 114% tall
                and offset up by 7%, which is exactly the slack the drift travels into —
                without it the photograph runs off its own end. */}
            <motion.div style={{ y }} className="absolute left-0 top-[-7%] h-[114%] w-full">
              <img
                src={asset('/img/studio.webp')}
                alt="Julian Gigola at work in the studio"
                loading="lazy"
                decoding="async"
                width={1200}
                height={900}
                className="h-full w-full object-cover"
              />
            </motion.div>
          </div>
        </Reveal>
      </div>

      <div className="shell mt-26 grid grid-cols-1 gap-10 sm:grid-cols-3">
        {STATS.map((stat) => (
          <Stat key={stat.label} {...stat} />
        ))}
      </div>
    </section>
  );
}
