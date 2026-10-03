import { Reveal } from '@/components/reveal';

/**
 * Every section opens the same way: a Spencerian title at display size with its index
 * set small beside it, then the lede.
 *
 * The script is doing real work rather than decorating. The page is otherwise a strict
 * grotesque on a ruled grid, and one calligraphic word per section is what stops that
 * from reading as a template — it is the single gesture that says a person laid this
 * out. It only survives at size: Ballet is an optical-size variable face and its
 * hairlines break up below about 4rem, which is why `.section-title` pins `opsz` to 72
 * rather than letting the browser interpolate.
 *
 * The old version set these as a tracked grotesque with a ↘ glued on, which gave the
 * page six identical headings and no hierarchy between a section and a project title.
 */
export function SectionHead({
  label,
  title,
  lede,
  index,
}: {
  label: string;
  title: string;
  lede: string;
  /** "01", "02" — the reference's section numbering, set beside the title. */
  index: string;
}) {
  return (
    <header className="mb-[clamp(2.5rem,7vh,5rem)]">
      <Reveal>
        <p className="eyebrow">({label})</p>
      </Reveal>

      <Reveal delay={1}>
        <h2 className="mt-4 flex items-start gap-3">
          <span className="section-title">{title}</span>
          <span className="mt-6 text-[13px] text-ink-3">({index})</span>
        </h2>
      </Reveal>

      <Reveal delay={2}>
        <p className="mt-6 max-w-xl text-pretty text-[17px] leading-relaxed text-ink-2">
          {lede}
        </p>
      </Reveal>
    </header>
  );
}
