import { Cursor } from '@/components/cursor';
import { SectionRail } from '@/components/section-rail';
import { Clients } from '@/components/sections/clients';
import { Connect } from '@/components/sections/connect';
import { Footer } from '@/components/sections/footer';
import { Intro } from '@/components/sections/intro';
import { Nav } from '@/components/sections/nav';
import { Services } from '@/components/sections/services';
import { Studio } from '@/components/sections/studio';
import { Work } from '@/components/sections/work';
import LiquidMetalHero from '@/components/ui/liquid-metal-hero';
import { asset } from '@/lib/asset';

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export default function App() {
  return (
    <>
      <Cursor />
      <Nav />
      <SectionRail />

      <main>
        <LiquidMetalHero
          title="PLCBO"
          subtitle="Visual identity, photography, film and digital design. Working out of the Bay Area since 2018."
          image={asset('/mark-mask.png')}
          primaryCtaLabel="Start a project"
          secondaryCtaLabel="See the work"
          onPrimaryCtaClick={() => scrollTo('connect')}
          onSecondaryCtaClick={() => scrollTo('work')}
        />

        {/* Ordered for someone deciding whether to get in touch: say what this is,
            show who has already trusted it, prove it with the work, then price it
            with services, then introduce the people, then ask. */}
        <Intro />
        <Clients />
        <Work />
        <Services />
        <Studio />
        <Connect />
      </main>

      <Footer />
    </>
  );
}
