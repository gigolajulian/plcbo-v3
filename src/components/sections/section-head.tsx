import { Reveal, Words } from '@/components/reveal';

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

      {/* the rule draws itself across under the label, so the section opens with a
          line being struck rather than a block fading up */}
      <Reveal variant="rule" delay={1} className="mb-6 h-px w-full max-w-sm bg-border" />

      <Words
        as="h2"
        delay={1}
        text={title}
        suffix={<span className="text-ink-3"> ↘</span>}
        className="font-display text-[clamp(2.5rem,6vw,4.5rem)] font-semibold leading-[0.95] tracking-tight text-foreground"
      />

      <Reveal delay={3}>
        <p className="mt-6 max-w-xl text-pretty text-lg leading-relaxed text-ink-2">
          {lede}
        </p>
      </Reveal>
    </header>
  );
}
