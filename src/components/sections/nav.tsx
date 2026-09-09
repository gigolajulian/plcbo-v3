import * as React from 'react';
import { Menu, X } from 'lucide-react';

import { Mark } from '@/components/mark';
import { Button } from '@/components/ui/button';
import { useScrollSpy } from '@/hooks/use-scroll-spy';
import { cn } from '@/lib/utils';

const LINKS = [
  { id: 'work', label: 'Work' },
  { id: 'services', label: 'Services' },
  { id: 'studio', label: 'Studio' },
  { id: 'connect', label: 'Connect' },
];

/* `intro` has no nav link of its own, but the spy still needs to know it exists —
   without it, reading the intro lights up whichever neighbour is nearest and the nav
   claims you are somewhere you are not. */
const IDS = ['home', 'intro', ...LINKS.map((l) => l.id)];

export function Nav() {
  const active = useScrollSpy(IDS);
  /* The hero is a 340vh scroll journey now, so a fixed pixel threshold would pop the
     header over the melting mark 80px in. The spy already knows when the hero stops
     being the section you are in, which is the same answer for any hero height and
     stays right if that height changes. */
  const past = active !== 'home';
  const [open, setOpen] = React.useState(false);

  /* The links stay out of the way while the hero owns the screen, then come back.
   * Focusing anything inside brings them straight back too, so this is never a
   * keyboard trap — the header is only visually quiet, never inert. */
  const [focusWithin, setFocusWithin] = React.useState(false);
  const revealed = past || focusWithin || open;

  React.useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <header
      onFocus={() => setFocusWithin(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setFocusWithin(false);
      }}
      className={cn(
        'fixed inset-x-0 top-0 z-50 transition-colors duration-500',
        past && 'border-b border-border bg-background/80 backdrop-blur-xl',
      )}
    >
      <a
        href="#work"
        className="sr-only focus:not-sr-only focus:absolute focus:left-6 focus:top-4 focus:z-50 focus:rounded-md focus:bg-accent focus:px-4 focus:py-2 focus:text-sm focus:text-accent-foreground"
      >
        Skip to content
      </a>

      <div className="shell flex h-[72px] items-center justify-between">
        <a
          href="#home"
          className="flex min-h-[44px] items-center gap-4 py-2 text-foreground transition-opacity hover:opacity-70"
          aria-label="PLCBO — home"
        >
          <Mark className="w-7" />
          <span className="font-display text-sm font-semibold uppercase tracking-[0.28em]">
            PLCBO
          </span>
        </a>

        <nav
          aria-label="Primary"
          className={cn(
            'hidden items-center gap-10 transition-[opacity,transform] duration-500 md:flex',
            revealed
              ? 'pointer-events-auto translate-y-0 opacity-100'
              : 'pointer-events-none -translate-y-1 opacity-0',
          )}
        >
          {LINKS.map((link) => (
            <a
              key={link.id}
              href={`#${link.id}`}
              aria-current={active === link.id ? 'true' : undefined}
              className={cn(
                'inline-flex min-h-[44px] items-center font-mono text-[11px] uppercase tracking-[0.18em] transition-colors duration-300',
                active === link.id
                  ? 'text-foreground'
                  : 'text-ink-3 hover:text-foreground',
              )}
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <Button
            asChild
            size="sm"
            className={cn(
              'hidden h-9 rounded-full bg-foreground px-5 font-mono text-[11px] uppercase tracking-[0.14em] text-background transition-[opacity,transform] duration-500 hover:bg-foreground/90 md:inline-flex',
              revealed ? 'opacity-100' : 'pointer-events-none opacity-0',
            )}
          >
            <a href="#connect">Start a project</a>
          </Button>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? 'Close menu' : 'Open menu'}
            className="grid h-11 w-11 place-items-center rounded-full border border-border text-foreground transition-colors hover:bg-foreground/10 md:hidden"
          >
            {open ? <X aria-hidden="true" className="h-4 w-4" /> : <Menu aria-hidden="true" className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div
        id="mobile-nav"
        hidden={!open}
        className="border-t border-border bg-background/95 backdrop-blur-xl md:hidden"
      >
        <nav aria-label="Primary, mobile" className="shell flex flex-col py-6">
          {LINKS.map((link) => (
            <a
              key={link.id}
              href={`#${link.id}`}
              onClick={() => setOpen(false)}
              className="border-b border-border py-4 font-display text-2xl font-semibold tracking-tight text-foreground last:border-0"
            >
              {link.label}
            </a>
          ))}
        </nav>
      </div>
    </header>
  );
}
