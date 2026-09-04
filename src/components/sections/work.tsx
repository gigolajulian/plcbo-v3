import { ArrowUpRight } from 'lucide-react';

import { asset } from '@/lib/asset';

import { Reveal } from '@/components/reveal';
import { SectionHead } from '@/components/sections/section-head';
import { cn } from '@/lib/utils';

type Project = {
  title: string;
  tags: string;
  year: string;
  img: string;
  wide?: boolean;
};

const PROJECTS: Project[] = [
  { title: 'PLYGR3D', tags: 'Art direction ⟡ Photography', year: '2025', img: '/img/work-01.webp', wide: true },
  { title: 'ANGEL', tags: 'Editorial ⟡ Film', year: '2025', img: '/img/work-02.webp' },
  { title: 'CHROME', tags: 'Product ⟡ Identity', year: '2024', img: '/img/work-03.webp' },
  { title: 'DRIP', tags: 'Apparel ⟡ Campaign', year: '2024', img: '/img/work-04.webp' },
  { title: 'CIRCUIT', tags: 'Brand system ⟡ Motion', year: '2024', img: '/img/work-05.webp', wide: true },
];

export function Work() {
  return (
    <section id="work" className="scroll-mt-24 py-26">
      <div className="shell">
        <SectionHead
          label="Selected work"
          title="Work"
          lede="Identity systems, campaigns, editorial shoots and the sites they live on. Five recent projects."
        />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {PROJECTS.map((project, i) => (
            <Reveal
              key={project.title}
              as="article"
              delay={i % 2}
              className={cn(project.wide && 'md:col-span-2')}
            >
              <a
                href="#connect"
                className="group relative block overflow-hidden rounded-lg border border-border bg-card"
              >
                <div
                  className={cn(
                    'overflow-hidden',
                    project.wide ? 'aspect-[16/9]' : 'aspect-[4/5]',
                  )}
                >
                  <img
                    src={asset(project.img)}
                    alt={`${project.title} — ${project.tags.replace(' ⟡ ', ' and ')}`}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover transition-transform duration-700 ease-smooth motion-safe:group-hover:scale-[1.04]"
                  />
                </div>

                {/* the plate's own scrim, so the caption reads over any photograph */}
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-background via-background/70 to-transparent" />

                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-6 p-6">
                  <div>
                    <h3 className="font-display text-2xl font-semibold uppercase tracking-[0.1em] text-foreground">
                      {project.title}
                    </h3>
                    <p className="eyebrow mt-2">{project.tags}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="eyebrow">{project.year}</span>
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-border text-foreground transition-colors duration-300 group-hover:border-transparent group-hover:bg-foreground group-hover:text-background">
                      <ArrowUpRight className="h-4 w-4" />
                    </span>
                  </div>
                </div>
              </a>
            </Reveal>
          ))}
        </div>

        <Reveal delay={1}>
          <a
            href="#connect"
            className="mt-16 inline-flex min-h-[44px] items-center gap-2 py-3 font-mono text-[11px] uppercase tracking-[0.18em] text-ink-2 transition-colors hover:text-foreground"
          >
            View all projects
            <span aria-hidden="true">→</span>
          </a>
        </Reveal>
      </div>
    </section>
  );
}
