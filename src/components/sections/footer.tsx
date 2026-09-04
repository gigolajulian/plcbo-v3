import { Mark } from '@/components/mark';

const SOCIAL = [
  { label: 'Instagram', href: 'https://instagram.com/plcbo' },
  { label: 'LinkedIn', href: 'https://linkedin.com' },
];

export function Footer() {
  return (
    <footer className="border-t border-border py-16">
      <div className="shell flex flex-col gap-10 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Mark className="w-8 text-foreground" />
          <p className="eyebrow mt-6">
            SF <span aria-hidden="true">⟡</span> NY <span aria-hidden="true">⟡</span> LA{' '}
            <span aria-hidden="true">⟡</span> Worldwide
          </p>
        </div>

        <div className="flex flex-col gap-6 sm:items-end">
          <ul className="flex gap-8">
            {SOCIAL.map((item) => (
              <li key={item.label}>
                <a
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-[44px] items-center py-3 font-mono text-[11px] uppercase tracking-[0.18em] text-ink-2 transition-colors hover:text-foreground"
                >
                  {item.label} <span aria-hidden="true">↗</span>
                </a>
              </li>
            ))}
          </ul>
          <p className="font-mono text-[11px] tracking-[0.1em] text-ink-3">
            © {new Date().getFullYear()} PLCBO <span aria-hidden="true">⟡</span> All rights
            reserved
          </p>
        </div>
      </div>
    </footer>
  );
}
