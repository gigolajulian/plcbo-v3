const SOCIAL = [
  { label: 'Instagram', href: 'https://instagram.com/plcbo' },
  { label: 'LinkedIn', href: 'https://linkedin.com' },
];

const MENU = [
  { label: 'Work', href: '#work' },
  { label: 'Services', href: '#services' },
  { label: 'Studio', href: '#studio' },
  { label: 'Connect', href: '#connect' },
];

/**
 * The foot of the page is the wordmark, set enormous in the didone and allowed to run
 * off both edges.
 *
 * It is the one place the name is the largest thing on screen, and it is the reference's
 * closing move: the page spends itself on the work and then signs it. Setting it in
 * Bodoni rather than the grotesque is what makes it read as a signature instead of a
 * header repeated at the bottom — and the terracotta rule under it is the identity
 * system's accent spending its one appearance where nothing else competes.
 *
 * `select-none` and `aria-hidden` because it is a graphic: the accessible name of this
 * page is the h1 in the hero, and a screen reader meeting "PLCBO" again at the end
 * learns nothing.
 */
export function Footer() {
  return (
    <footer className="overflow-hidden border-t border-border pt-[clamp(3rem,8vh,5rem)]">
      <div className="shell">
        <div className="grid gap-10 sm:grid-cols-3">
          <nav aria-label="Footer">
            <p className="eyebrow">(Menu)</p>
            <ul className="mt-5 space-y-1">
              {MENU.map((item) => (
                <li key={item.label}>
                  <a
                    href={item.href}
                    className="inline-flex py-1 text-[22px] tracking-tight text-ink-2 transition-colors hover:text-ink"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <p className="eyebrow">(Contact)</p>
            <a
              href="mailto:hello@plcbo.co"
              className="mt-5 inline-flex text-[22px] tracking-tight text-ink transition-colors hover:text-terracotta"
            >
              hello@plcbo.co
            </a>
            <p className="mt-3 text-[13px] text-ink-3">
              SF <span aria-hidden="true">⟡</span> NY <span aria-hidden="true">⟡</span> LA{' '}
              <span aria-hidden="true">⟡</span> Worldwide
            </p>
          </div>

          <div className="sm:text-right">
            <p className="eyebrow sm:justify-end">(Media)</p>
            <ul className="mt-5 space-y-1">
              {SOCIAL.map((item) => (
                <li key={item.label}>
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-[40px] items-center text-[15px] text-ink-2 transition-colors hover:text-ink"
                  >
                    {item.label} <span aria-hidden="true">&nbsp;↗</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Full-bleed, not inside the shell: it is meant to touch both edges. */}
      <div className="mt-[clamp(3rem,9vh,6rem)] select-none px-4" aria-hidden="true">
        <p className="whitespace-nowrap text-center font-serif font-medium leading-[0.78] text-ink [font-size:clamp(5rem,22vw,20rem)] [font-variation-settings:'opsz'_96]">
          PLCBO
        </p>
        <div className="mx-auto mt-2 h-[3px] w-full max-w-[92vw] bg-terracotta" />
      </div>

      <div className="shell flex flex-col gap-2 py-8 sm:flex-row sm:justify-between">
        <p className="text-[12px] text-ink-3">
          © {new Date().getFullYear()} PLCBO <span aria-hidden="true">⟡</span> All rights
          reserved
        </p>
        <a href="#home" className="text-[12px] text-ink-3 transition-colors hover:text-ink">
          Back to top ↑
        </a>
      </div>
    </footer>
  );
}
