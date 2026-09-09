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
          className="pointer-events-none h-4 w-auto select-none md:h-5"
          height={logo.height}
          loading="lazy"
          src={asset(logo.src)}
          /* Not a Tailwind class: `brightness-0` and the paper band's own colour would
             both want the filter property, and this one is unconditional. */
          style={{ filter: 'brightness(0)' }}
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
