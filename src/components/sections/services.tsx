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

/**
 * Six things, as a list.
 *
 * They were six identical bordered cells, which is the least interesting arrangement a
 * list of six can have — every one the same size, so none of them is worth reading
 * first. Rows give the titles somewhere to be large and the descriptions somewhere to
 * be quiet, and the hairlines between them come from the layout rather than from six
 * boxes each drawing its own.
 *
 * The description stays visible at all times. Hiding it behind the hover would look
 * tidier and would mean a keyboard reader, a touch reader and a printer all get a list
 * of six words with no explanation.
 */
export function Services() {
  return (
    <section id="services" className="scroll-mt-24 py-32">
      <div className="shell">
        <SectionHead
          label="What we do"
          title="Services"
          lede="Six things we do. Most projects use three or four of them."
        />
      </div>

      <ul className="border-t border-border">
        {SERVICES.map((service, i) => (
          <Reveal
            as="li"
            key={service.no}
            variant="wipe"
            delay={i % 3}
            className="group border-b border-border transition-colors duration-500 hover:bg-card"
          >
            <div className="shell grid grid-cols-1 items-baseline gap-x-10 gap-y-4 py-10 md:grid-cols-[3.5rem_1fr_28rem]">
              <span className="font-mono text-[11px] tracking-[0.18em] text-ink-3 transition-colors duration-500 group-hover:text-accent">
                {service.no}
              </span>
              <h3 className="font-display text-[clamp(1.75rem,4.5vw,3.25rem)] font-semibold leading-none tracking-tight text-foreground transition-transform duration-500 ease-smooth group-hover:translate-x-2 motion-reduce:group-hover:translate-x-0">
                {service.title}
              </h3>
              <p className="max-w-prose text-pretty leading-relaxed text-ink-3 transition-colors duration-500 group-hover:text-ink-2 md:col-start-3">
                {service.body}
              </p>
            </div>
          </Reveal>
        ))}
      </ul>
    </section>
  );
}
