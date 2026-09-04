import { Reveal } from '@/components/reveal';
import { SectionHead } from '@/components/sections/section-head';

const SERVICES = [
  {
    no: '01',
    title: 'Brand Strategy',
    body: 'We define the essence of your brand through research, positioning, and strategic storytelling.',
  },
  {
    no: '02',
    title: 'Visual Identity',
    body: 'Distinctive logos, typography systems, and visual languages that set you apart.',
  },
  {
    no: '03',
    title: 'Photography',
    body: 'Editorial and commercial photography that captures the essence of your brand with precision and artistry.',
  },
  {
    no: '04',
    title: 'Video',
    body: 'Cinematic brand films, reels, and content that tell your story and captivate your audience.',
  },
  {
    no: '05',
    title: 'Art Direction',
    body: 'Campaigns and visual content held together by one cohesive creative vision.',
  },
  {
    no: '06',
    title: 'Digital Design',
    body: 'Websites, applications and the systems behind them, built to last.',
  },
];

export function Services() {
  return (
    <section id="services" className="scroll-mt-24 border-t border-border py-26">
      <div className="shell">
        <SectionHead
          label="What we do"
          title="Services"
          lede="Six things we do. Most projects use three or four of them."
        />

        {/* One hairline grid rather than six boxes — the rules come from the layout,
            so nothing needs a border of its own and nothing doubles up at the seams. */}
        <div className="grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map((service, i) => (
            <Reveal
              key={service.no}
              as="article"
              delay={i % 3}
              className="group bg-background p-10 transition-colors duration-500 hover:bg-card"
            >
              <span className="font-mono text-[11px] tracking-[0.18em] text-accent">
                {service.no}
              </span>
              <h3 className="mt-6 font-display text-2xl font-semibold tracking-tight text-foreground">
                {service.title}
              </h3>
              <p className="mt-4 text-pretty leading-relaxed text-ink-2">{service.body}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
