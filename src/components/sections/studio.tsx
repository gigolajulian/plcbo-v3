import { asset } from '@/lib/asset';

import { Reveal } from '@/components/reveal';
import { SectionHead } from '@/components/sections/section-head';
import { useCountUp } from '@/hooks/use-count-up';

const STATS = [
  { n: 8, suffix: '', label: 'Years working' },
  { n: 120, suffix: '+', label: 'Projects shipped' },
  { n: 24, suffix: 'h', label: 'Reply time' },
];


function Stat({ n, suffix, label }: { n: number; suffix: string; label: string }) {
  const { ref, value } = useCountUp(n);
  return (
    <div className="border-b border-border py-8 first:pt-0 last:border-0 last:pb-0">
      <span
        ref={ref}
        className="block font-display text-5xl font-semibold tracking-tight text-foreground tabular-nums"
      >
        {value}
        {suffix}
      </span>
      <span className="eyebrow mt-3 block">{label}</span>
    </div>
  );
}

export function Studio() {
  return (
    <section id="studio" className="scroll-mt-24 border-t border-border py-26">
      <div className="shell">
        <SectionHead
          label="Who we are"
          title="Studio"
          lede="A small studio in the Bay Area. We shoot, design and build in-house, and take on about a dozen projects a year."
        />

        <div className="grid grid-cols-1 gap-16 lg:grid-cols-[1.1fr_1fr] lg:items-start">
          <Reveal>
            <figure className="overflow-hidden rounded-lg border border-border">
              <img
                src={asset('/img/studio.webp')}
                alt="Julian Gigola at work in the studio"
                loading="lazy"
                decoding="async"
                className="aspect-[4/3] w-full object-cover"
              />
              <figcaption className="flex items-baseline justify-between gap-4 bg-card px-6 py-5">
                <span className="font-display text-lg font-semibold tracking-tight text-foreground">
                  Julian Gigola
                </span>
                <span className="eyebrow">Photographer</span>
              </figcaption>
            </figure>
          </Reveal>

          <Reveal delay={1}>
            <div>
              {STATS.map((stat) => (
                <Stat key={stat.label} {...stat} />
              ))}
            </div>
          </Reveal>
        </div>

      </div>
    </section>
  );
}
