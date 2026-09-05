# PLCBO v3

The first cut of the site that is **not** no-build. v1 (root) and `v2/` stay plain
HTML/CSS/JS; v3 is React + TypeScript + Tailwind + shadcn, because the hero is a
WebGL shader component (`@paper-design/shaders-react`) that only ships as React.

```bash
npm install
npm run dev      # http://localhost:4174   — also .claude/launch.json → "plcbo-v3"
npm run build    # tsc -b && vite build → v3/dist
npm run preview
```

The root `serve.js` still serves v1 on 4173 and does not know about v3 — v3 has a
build step, so it is deployed from `v3/dist` rather than served from source.

## Layout

```
index.html                    Vite entry, <head>, Google Fonts
src/index.css                 the tokens — shadcn variables bound to PLCBO colours
src/App.tsx                   section order and the hero's copy
src/components/mark.tsx       the mark, flat, as inline SVG (nav and footer)
src/components/cursor.tsx     the pointer ring
src/components/reveal.tsx     scroll reveal (see "background tabs" below)
src/components/ui/            shadcn — button, badge, card, liquid-metal-hero
src/components/sections/      nav, work, services, studio, connect, footer
src/hooks/                    use-formation, use-pointer-drift, use-scroll-spy, use-count-up
src/lib/asset.ts              resolves public/ paths against the deployed base
public/img/*.webp             the same photography v1 ships (~330 KB)
public/mark.svg               the mask the hero's metal takes the shape of
```

Components go in `src/components/ui/` and utilities in `src/lib/utils.ts` because
that is where `components.json` points the shadcn CLI. Anything added later with
`npx shadcn@latest add <component>` lands there and resolves `@/lib/utils` and the
`@/*` alias without configuration. Moving those folders means editing
`components.json`, `tsconfig.json` and `vite.config.ts` together.

## Tokens

`src/index.css` binds every shadcn variable to the dark cut rather than leaving
them on shadcn's default slate, so the stock components are already on-palette:
`bg-background` is `#08080a`, `text-foreground` is `#f4f4f6`, `accent` is the
violet `#8a73e8`. `--accent-fill` (`#7458e4`) exists because white on `--accent`
alone is 3.69:1; anything filled and violet with white on it uses the deeper step.
The accent stays at 72% saturation — 100% is the loudest tell of a generated palette.

Type is Space Grotesk (display) + Geist (body) + Geist Mono (labels), matching v1.

## The hero

The hero is the mark, in metal, and almost nothing else: no wordmark, no strapline,
no feature cards — a pair of CTAs at the foot and that is the overlay. The name lives
on in an `sr-only` `h1`, since the mark carries it visually.

`src/components/ui/liquid-metal-hero.tsx` holds two `LiquidMetal` layers and one
0 → 1 ramp. Given an `image`, the shader ignores `shape` and reads the file's alpha
as its mask and its edges as the flow contour, so the metal fills the silhouette and
everything outside it stays transparent.

### The formation

One continuous move on one layer, not a dissolve between two. The masked layer opens
with its **`contour` at full** and the mark sets out of it over about six seconds as
that walks down.

`contour` is the whole trick. It is the only parameter that touches the silhouette
rather than the pattern painted over it — the shader calls it *"strength of the
distortion on the shape edges"* — so at 1.0 the letter's own outline churns into a
shapeless body of metal, and walking it to 0.26 lets the mark set out of that. There
is no second mask and no morph target; the shape deforms itself. `softness`,
`distortion` and `repetition` ride the same ramp, molten and soft on the way in,
banded and tight at rest.

Two things make it hold together:

- **The masked layer must not render before its mask exists.** Turning an SVG into
  the distance field the shader samples is a rasterise plus a Poisson solve — seconds,
  not milliseconds — and until it lands the layer paints its flat ground over
  everything beneath it. The first cut of this blacked the screen out for two seconds
  mid-load. So the layer sits behind a `<Suspense>` with `suspendWhenProcessingImage`,
  and its mount is what starts the ramp: the two cannot drift apart, on any machine.
- **The blob underneath exists only to cover that wait.** It carries no image, so it
  draws on the first frame, and it uses the shader's own `metaballs` shape — a liquid
  mass, so the handover reads blob to molten letter rather than field to letter. It
  is tuned to the masked layer's opening frame and handed over inside the first fifth
  of the move, while both are still formless, so the swap has nothing to show, then
  unmounted outright rather than idling a second WebGL context for the life of the
  page.

### Depth, and the pointer

The metal is **silver** (`colorTint` `#dcdce6`) on a transparent ground — transparent
because the alpha silhouette is what the extrusion is built out of. Three chained
`drop-shadow`s each cast from the *result* of the one before, so they smear into one
continuous side wall rather than three offset copies; a fourth, blurred, keeps the
whole thing from reading as a sticker.

`usePointerDrift` smooths the cursor into a lagging value with four channels: a
position, an `energy` that rises while the pointer is over the hero, a `pulse` that
spikes on press and decays, and a `drag` offset in pixels.

Position tilts the plane the shader is drawn on — a real `rotateX`/`rotateY` under a
`perspective`, so the mark turns to face the cursor — and steers `angle`,
`repetition` and `distortion`. The pulse nudges the mark back and kicks the flow.
Dragging turns it further and *only* turns it: the mark holds its place in the
composition and swings on the spot, about a degree for every five pixels. Hover and
drag share one budget — `MAX_TILT`, 30° — with the hover tilt spending a fixed slice
and `swing()` easing the drag onto whatever is left. `swing()` is a `tanh`, so it
approaches that ceiling rather than being clamped at it: however hard the mark is
thrown it never turns more than 30° off-face, and it never hits a wall on the way.
Letting go walks the angle back rather than snapping it.

The drag is tracked on the window rather than through pointer capture — capture on
the section would swallow the CTAs' clicks, and a drag that stops the moment the
cursor leaves the hero is not a drag. All of it is multiplied by the formation, so
nothing steers the metal until there is a mark to steer.

`Cursor` replaces the pointer with a hollow white ring that fills solid on press.
Only on a device with a real pointer and only when the reader has not asked for less
motion — anywhere else a lagging ring is a broken cursor, not a flourish.

### What differs from the source snippet

1. **`{...liquidMetalPresets[2].params}`, not `{...liquidMetalPresets[2]}`.** A preset
   is `{ name, params }` and `LiquidMetal` takes its params flattened, so spreading
   the preset itself passes an inert `name`/`params` pair and the shader silently
   falls back to its defaults.
2. **`fit`.** The preset inherits `fit: "contain"` from `defaultObjectSizing`. The open
   field needs `cover` or it letterboxes into a rounded plate; the masked layer keeps
   `contain`, because cropping the silhouette is the one thing that cannot happen.
   Because it is fitted, a narrow portrait window fits it to the width and it ends up
   reading as a badge — hence the wider rest scale under 768px.
3. **The shader is scoped to the section, not `position: fixed; z-index: -10`.** A
   negative z-index only stays visible while nothing above paints an opaque ground,
   and every section below the hero does.
4. **No `overflow-hidden` on the section.** Clipping there cuts the CTA row off on a
   short window; the shader layer clips itself.

A vignette at the foot of the hero is the only thing between metal and content, so
the buttons sit on a settled ground however bright the frame under them runs.

The shader is a per-frame GPU program with no natural end, so it is parked
(`speed={0}`, which holds the frame rather than resetting it) whenever the hero is
off screen or the tab is hidden.

## Background tabs

Neither `requestAnimationFrame` nor IntersectionObserver is allowed to be the only
thing standing between a reader and the content — background tabs get no rendering
opportunities, so a page opened in a background tab and switched to later would be
blank. This bug has shipped on this site twice.

So `Reveal` runs an IntersectionObserver for the normal case and an unconditional
`setTimeout` that force-reveals everything at 3000ms. `useCountUp` does the same and
additionally *starts* at its target value, dropping to zero only once it knows a
tween is actually going to run — nothing can leave a `0` on screen. `useFormation`
follows the same rule: a `setTimeout` forces the ramp home, so a reader who opens the
site in a background tab and comes back later finds the finished mark, never the
cloud it started as.

The rAF loops in `usePointerDrift` and `Cursor` are exempt for the opposite reason —
they animate things that are already on screen, nothing waits on them, and each stops
itself once its value settles.

`prefers-reduced-motion` lands the formation at its finished state on the first
frame, holds the shader still, drops the pointer response, leaves the native cursor
alone, and skips the reveals and the counters.

## Deploying

`.github/workflows/pages.yml` builds on every push to `main` and publishes `dist` to
GitHub Pages. Pages serves a project site from `/<repo>/` rather than `/`, so the
workflow passes `VITE_BASE` and `vite.config.ts` reads it. Anything in `public/` must
be referenced through `asset()` (`src/lib/asset.ts`) for the same reason — a
hard-coded `/img/…` is a 404 there.
