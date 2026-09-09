import * as React from 'react';

/**
 * The object's itinerary.
 *
 * Two shapes, and one change between them: the mark the site opens on, and the PLCBO
 * wordmark it becomes beside the statement. It does not turn back, and it does not go
 * on changing down the page — an aperture, a film frame and an arrow were tried and cut,
 * along with the per-transition flourishes that made each change of shape spin and
 * stretch and shear. All of that read as forced, which is what happens when the motion
 * is decoration laid over the material rather than something the material is doing.
 *
 * What is left is the one move that was always convincing: the metal melts, and a
 * different shape sets out of the melt.
 */

/**
 * Where a shape sits and how big it is.
 *
 * `scale` is the shader's own, and it has to be reasoned about rather than eyeballed:
 * this page cannot be screenshotted reliably or read back at all, so there is no
 * looking at it.
 *
 * From the shader's vertex source the object box is a **square whose side is
 * `scale × the viewport's longer edge`**, with the mask contain-fitted inside it — and
 * since both masks are wider than tall, that means **drawn width = scale × the longer
 * edge**, with the height following the mask's aspect. On a 1440-wide window the 2.76:1
 * wordmark at 0.62 is `0.62 × 1440 = 893px` wide and 324px tall. Confirmed against a
 * settled frame: measured left edge 884, predicted 884.
 *
 * Do not "calibrate" that factor down by measuring the mark. Its tint runs from white
 * to near-black and the dark side of the letter disappears into a near-black page, so
 * the silhouette looks about 78% of its real width and reasoning from it sends every
 * other shape 25% too big. The wordmark, which is bright across most of its length, is
 * the one to measure against.
 *
 * Position is `fx × 50vw + px`, from the centre of the screen. `fx: 0` is centred;
 * `fx: 1, px: -110` is a centre 110px in from the right edge. Written this way rather
 * than as a fraction of the viewport because the copy it has to clear lives in a shell
 * that stops growing at 1200px: anything sized off the viewport alone drifts across the
 * text as the window widens.
 */
type Placement = { scale: number; fx: number; px: number; y: number };

export type Pose = {
  /** the section whose arrival brings this shape on */
  anchor: string;
  /** a mask in `public/`; the shader reads its alpha as the silhouette */
  mask: string;
  wide: Placement;
  compact: Placement;
};

export const POSES: Pose[] = [
  {
    /* Centred, and the subject of its own screen. */
    anchor: 'home',
    mask: '/mark-mask.png',
    wide: { scale: 0.49, fx: 0, px: 0, y: -0.02 },
    compact: { scale: 0.74, fx: 0, px: 0, y: -0.02 },
  },
  {
    /* A nameplate beside the statement, running off the right edge. At 1440 that is
       893px wide with its centre 110px in from the edge: the left edge lands at 884,
       150px clear of the Intro's copy, which the `md:max-w-[52%]` there stops at 734,
       and 336px of it runs off the side. Both halves of that matter — a smaller shape
       sat 258px away from the copy with a gap in the middle of the composition, and one
       that does not bleed reads as a picture placed on the page rather than the object
       carrying on past it. Checked down to 768, where it still clears the copy by 22px,
       which is why the placement is anchored to the edge in pixels rather than scaled
       off the viewport.
       On a portrait screen there is no margin to park in, so it stays centred and the
       object simply leaves once the statement has been read. */
    anchor: 'intro',
    mask: '/wordmark-mask.png',
    wide: { scale: 0.62, fx: 1, px: -110, y: 0 },
    compact: { scale: 0.86, fx: 0, px: 0, y: -0.04 },
  },
];

/* The object's life ends as this section arrives. Without it the wordmark would ride
 * the rest of the page parked over the work, the services copy and the form. */
const FAREWELL = 'work';

/* The window a change of shape happens in, as fractions of the viewport height before
 * its section reaches the top of the screen — so it begins while the previous section
 * is still being read and finishes just as the new one lands.
 *
 * ENTER is nearly a screen and a half because the melt needs room to be a movement
 * rather than a flicker. */
const ENTER = 1.3;
const LAND = 0.35;

export type Journey = {
  /** 0 at the first pose, 1 at the second; the fraction between is the change of shape. */
  position: number;
  /** 0 → 1 as the object's last section approaches and it takes its leave. */
  exit: number;
};

/**
 * How far along the object is, measured off the real position of the sections it
 * answers to.
 *
 * Measured per frame from `getBoundingClientRect`, and scheduled cancel-and-re-arm.
 * Both are the same decisions as `useParallax`, for the same reasons: section tops move
 * as the webfont lands and the photographs arrive, so a measurement cached at mount is
 * of a page that no longer exists; and a frame queued just before the tab is
 * backgrounded never fires, so a "skip if one is pending" guard would wedge the loop
 * for good.
 *
 * Nothing is hidden until this runs — it reports the first pose synchronously on mount,
 * so a reader who never gets a frame still sees the mark, sitting still.
 */
export function useStageJourney(): Journey {
  const [journey, setJourney] = React.useState<Journey>({ position: 0, exit: 0 });

  React.useEffect(() => {
    let frame: number | null = null;

    /** How far past the point where `id` starts pulling, 0 → 1. */
    const approach = (id: string, vh: number) => {
      const el = document.getElementById(id);
      if (!el) return 0;
      const top = el.getBoundingClientRect().top + window.scrollY;
      const start = top - vh * ENTER;
      return Math.min(1, Math.max(0, (window.scrollY - start) / (vh * (ENTER - LAND))));
    };

    const measure = () => {
      frame = null;
      const vh = window.innerHeight;
      if (!vh) return;

      /* Every change contributes its own 0 → 1 to one running total. A loop rather than
         a state machine, so overlapping windows on a short screen simply add up and the
         value stays monotonic through them. */
      let position = 0;
      for (let i = 1; i < POSES.length; i++) position += approach(POSES[i].anchor, vh);

      /* Rounded because these drive a dozen shader uniforms through React, and
         sub-pixel scroll noise should not cost a render. */
      const round = (n: number) => Math.round(n * 1000) / 1000;
      setJourney({ position: round(position), exit: round(approach(FAREWELL, vh)) });
    };

    const schedule = () => {
      if (frame !== null) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    document.addEventListener('visibilitychange', schedule);
    /* Sections move once the webfont lands and the lazy photographs arrive, and neither
       fires a scroll event. */
    const settle = window.setTimeout(measure, 800);

    return () => {
      if (frame !== null) cancelAnimationFrame(frame);
      window.clearTimeout(settle);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      document.removeEventListener('visibilitychange', schedule);
    };
  }, []);

  return journey;
}
