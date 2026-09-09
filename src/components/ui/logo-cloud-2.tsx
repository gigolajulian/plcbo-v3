import { PlusIcon } from 'lucide-react';

import { asset } from '@/lib/asset';
import { cn } from '@/lib/utils';

export type Logo = {
  /** The client's name. Used as the `alt`, and drawn as type when there is no `src`. */
  name: string;
  /** Path under `public/`. Omit for a client with no published mark. */
  src?: string;
  /** Intrinsic size, so the cell reserves its space before the file lands. */
  width?: number;
  height?: number;
};

/* How much bigger or smaller than the base height a mark is drawn, so that every mark
 * covers roughly the same area of the cell.
 *
 * Setting them all to one height is the obvious thing and it is what makes a client wall
 * look wrong: height is not what the eye measures, area is. At a flat 20px these four ran
 * from 43px wide (JUBO, 2.1:1) to 113px (Aurora, 5.6:1), so the widest mark carried two
 * and a half times the ink of the narrowest and read as the important client.
 *
 * Area is `h² × aspect`, so holding it constant means `h ∝ 1/√aspect`. REF is the aspect
 * that comes out at exactly the base height; the clamp stops a future extreme — a very
 * long lockup, or a square badge — from being scaled into nothing or over the cell. */
const REF_ASPECT = 3.5;

function opticalScale({ width, height }: Logo) {
  if (!width || !height) return 1;
  return Math.min(1.35, Math.max(0.75, Math.sqrt(REF_ASPECT / (width / height))));
}

export type LogoCloudProps = React.ComponentProps<'div'> & {
  logos: Logo[];
};

/**
 * A ruled grid of client marks.
 *
 * The upstream version hand-wrote the border and background of all eight cells, which
 * fixed the count at eight and the checker at one specific breakpoint. Here every cell
 * carries `border-r border-b` and the frame carries the two opposite edges, so the
 * ruling closes itself at any number of logos and at either column count.
 *
 * The upstream rules that bled past the grid to the window edges are gone: they only
 * line up when the logo count fills the last row, and seven in four columns left the
 * bottom one running under an empty quarter of the grid with nothing above it.
 *
 * Every mark is forced to a single ink with `brightness(0)`: the sources are a
 * four-colour logotype, two black wordmarks and a white PNG, and a client wall that
 * keeps each brand's own colour reads as a pile of assets rather than a list of names.
 * It works on all four because the filter maps every opaque pixel to black and leaves
 * alpha alone.
 */
export function LogoCloud({ logos, className, ...props }: LogoCloudProps) {
  return (
    <div
      className={cn(
        'relative grid grid-cols-2 md:grid-cols-4',
        className
      )}
      {...props}
    >
      {logos.map((logo) => (
        <LogoCard key={logo.name} logo={logo} />
      ))}
    </div>
  );
}

function LogoCard({ logo }: { logo: Logo }) {
  return (
    /* Every cell carries all four rules and pulls itself a pixel up and left, so
       adjacent rules collapse into one. Ruling only the right and bottom edges is
       shorter, but it leaves the frame open wherever the last row is short — seven
       logos in four columns notch the right edge — and it makes the closed frame
       depend on the count dividing evenly into both column counts. */
    <div className="relative -mt-px -ml-px flex items-center justify-center border border-[color:var(--rule)] px-4 py-8 md:p-8">
      {logo.src ? (
        <img
          alt={logo.name}
          /* The base height is a variable rather than an `h-*` class so the per-logo
             correction can multiply it and still change at the breakpoint. */
          className="pointer-events-none w-auto select-none [--logo-h:1rem] md:[--logo-h:1.25rem]"
          height={logo.height}
          loading="lazy"
          src={asset(logo.src)}
          /* Not a Tailwind class: `brightness-0` and the paper band's own colour would
             both want the filter property, and this one is unconditional. */
          style={{
            filter: 'brightness(0)',
            height: `calc(var(--logo-h) * ${opticalScale(logo).toFixed(3)})`,
          }}
          width={logo.width}
        />
      ) : (
        /* No published mark. Set the name instead of dropping the client — optically
           matched to the logo row rather than to the body text. */
        <span className="select-none whitespace-nowrap font-display text-[11px] font-semibold uppercase leading-none tracking-[0.14em] md:text-[15px]">
          {logo.name}
        </span>
      )}

      {/* A registration cross on the cell's corner. On the frame's outer edge it is
          half-drawn, which is what a crop mark looks like. */}
      <PlusIcon
        aria-hidden="true"
        className="-right-[12.5px] -bottom-[12.5px] absolute z-10 size-6"
        strokeWidth={1}
      />
    </div>
  );
}
