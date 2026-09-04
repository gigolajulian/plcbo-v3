import { Reveal } from '@/components/reveal';

export function SectionHead({
  label,
  title,
  lede,
}: {
  label: string;
  title: string;
  lede: string;
}) {
  return (
    <header className="mb-16 max-w-3xl">
      <Reveal>
        <p className="eyebrow mb-6">{label}</p>
      </Reveal>
      <Reveal delay={1}>
        <h2 className="font-display text-[clamp(2.5rem,6vw,4.5rem)] font-semibold leading-[0.95] tracking-[-0.02em] text-foreground">
          {title} <span className="text-ink-3">↘</span>
        </h2>
      </Reveal>
      <Reveal delay={2}>
        <p className="mt-6 max-w-xl text-pretty text-lg leading-relaxed text-ink-2">
          {lede}
        </p>
      </Reveal>
    </header>
  );
}
