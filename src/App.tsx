import { Cursor } from '@/components/cursor';
import { Connect } from '@/components/sections/connect';
import { Footer } from '@/components/sections/footer';
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

      <main>
        <LiquidMetalHero
          title="PLCBO"
          subtitle="Visual identity, photography, film and digital design. Working out of the Bay Area since 2018."
          image={asset('/mark.svg')}
          primaryCtaLabel="Start a project"
          secondaryCtaLabel="See the work"
          onPrimaryCtaClick={() => scrollTo('connect')}
          onSecondaryCtaClick={() => scrollTo('work')}
        />

        <Work />
        <Services />
        <Studio />
        <Connect />
      </main>

      <Footer />
    </>
  );
}
