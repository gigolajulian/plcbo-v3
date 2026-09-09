import * as React from 'react';

/**
 * The object's itinerary down the page.
 *
 * One body of metal travels the whole site, and at each of these sections it melts and
 * sets into a different shape. Only five, not one per section: Clients, Studio and the
 * footer inherit whatever arrived, which keeps a change of shape meaning something
 * rather than happening every screen.
 *
 * `scale` is the shader's own, which is bigger-is-bigger against a `fit="contain"` box.
 * `x` and `y` are fractions of the viewport from its centre. `opacity` is how present
 * the shape is: the first two are the subject of their screens, the last three are
 * company parked in the right-hand margin while the reader reads something else.
 *
 * The insets are why the companions only appear on a wide window. The shell caps at
 * 1200px with 64px of padding, so clear space beside the copy only exists past about
 * 1400 — below that the shell fills the screen and a parked shape sits directly on the
 * Services descriptions and the Studio counters, which is where the first cut of this
 * put it. Every one of these numbers was checked against the real content rects rather
 * than eyeballed, because the shader cannot be screenshotted: at 1440 the wordmark,
 * the aperture and the arrow clear the copy outright and the frame clears it by 4px. */
/**
 * Where a shape sits and how big it is.
 *
 * `scale` is the shader's own. From its vertex shader: the object box is a **square
 * whose side is `scale × the viewport's longer edge`**, with the mask contain-fitted
 * inside it. So on a landscape window a 2.76:1 wordmark at scale 0.46 is
 * `0.46 × 1440 = 662px` wide and `662 / 2.76 = 240px` tall — which is what makes these
 * numbers checkable against the layout instead of guesswork.
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
  /** resting rotation, so a shape can be placed rather than stamped */
  tilt: number;
  opacity: number;
};

export const POSES: Pose[] = [
  {
    /* The subject of its own screen, and the only shape in the middle of the page. */
    anchor: 'home',
    mask: '/mark-mask.png',
    wide: { scale: 0.49, fx: 0, px: 0, y: -0.02 },
    compact: { scale: 0.74, fx: 0, px: 0, y: -0.02 },
    tilt: 0,
    opacity: 1,
  },
  {
    /* A nameplate beside the statement, running off the right edge. At 1440 that is
       662px wide centred 110px in from the edge, so its left edge lands at 999 — well
       clear of the Intro's copy, which the `md:max-w-[52%]` there stops at 741. */
    anchor: 'intro',
    mask: '/wordmark-mask.png',
    wide: { scale: 0.46, fx: 1, px: -110, y: 0 },
    compact: { scale: 0.86, fx: 0, px: 0, y: -0.05 },
    tilt: 0,
    opacity: 1,
  },
  {
    /* An aperture over the work — high, so it reads as an eye above the index rather
       than a badge beside it, and above the rail rather than across it. */
    anchor: 'work',
    mask: '/aperture-mask.png',
    wide: { scale: 0.15, fx: 1, px: -80, y: -0.26 },
    compact: { scale: 0.15, fx: 1, px: -80, y: -0.26 },
    tilt: 0,
    opacity: 0.66,
  },
  {
    /* The frame crosses to the other margin, level with the middle of the list, so the
       object is not simply riding one corner down the whole page. Tilted a few degrees,
       because a frame set dead square reads as a border. */
    anchor: 'services',
    mask: '/frame-mask.png',
    wide: { scale: 0.17, fx: -1, px: 50, y: 0.02 },
    compact: { scale: 0.17, fx: -1, px: 50, y: 0.02 },
    tilt: -6,
    opacity: 0.66,
  },
  {
    /* And an arrow at the one place on the page that asks for something: low, back on
       the right, and turned into the page so it points down at the form. */
    anchor: 'connect',
    mask: '/arrow-mask.png',
    wide: { scale: 0.15, fx: 1, px: -80, y: 0.3 },
    compact: { scale: 0.15, fx: 1, px: -80, y: 0.3 },
    tilt: 28,
    opacity: 0.66,
  },
];

/**
 * How each change of shape carries itself.
 *
 * Without this every transition is the same event — melt to a round mass, swap, set —
 * and four identical melts down one page reads as a mechanism rather than a life. Each
 * of these deforms the mass while it is molten and unwinds as it sets, so the metal
 * spreads into the wordmark, coils down into the aperture, unfolds into the frame and
 * shears into the arrow. `bow` curves the path it travels rather than sliding it in a
 * straight line between two parking spots.
 *
 * Entry N is the change out of pose N. All of it is scaled by the melt, so at either
 * end of a transition every one of these is exactly zero and the shape is square on.
 */
export type Morph = {
  /** degrees of roll at full melt */
  spin: number;
  /** how much wider and taller the mass goes, as a fraction */
  stretchX: number;
  stretchY: number;
  /** degrees of shear at full melt */
  skew: number;
  /** how far the path bows off the straight line, in fractions of the viewport */
  bow: number;
};

export const MORPHS: Morph[] = [
  /* the mark spreads sideways into the word */
  { spin: 0, stretchX: 0.38, stretchY: -0.18, skew: 0, bow: -0.05 },
  /* the word gathers and coils down into the iris */
  { spin: -26, stretchX: -0.28, stretchY: 0.16, skew: 0, bow: 0.1 },
  /* the iris unfolds across the page into the frame */
  { spin: 14, stretchX: 0.12, stretchY: 0.42, skew: -8, bow: -0.09 },
  /* and the frame shears into the arrow */
  { spin: -18, stretchX: 0.3, stretchY: -0.22, skew: 10, bow: 0.09 },
];

/* The window each change of shape happens in, as fractions of the viewport height
 * before its section reaches the top of the screen. A change therefore begins while
 * the previous section is still being read and finishes just as the new one lands.
 *
 * ENTER is generous — nearly a screen and a half — because the melt has to have room
 * to be a movement rather than a flicker: at 1.05 the first change did not begin until
 * 1400px down, so the hero held a completely static mark for two and a half screens
 * before anything happened. The hero's runway was cut to match. */
const ENTER = 1.3;
const LAND = 0.35;

/**
 * How far down its itinerary the object is, as a continuous position: 0 is the first
 * pose, 1 the second, and the fractional part is how far through a change of shape.
 *
 * Every transition contributes its own 0 → 1 to one running total, which is why this
 * is a loop and not a state machine — overlapping windows on a short screen simply
 * add up, and the value stays monotonic through them instead of fighting over which
 * section is current.
 *
 * Measured per frame from `getBoundingClientRect`, and scheduled cancel-and-re-arm.
 * Both of those are the same decisions as `useParallax`, for the same reasons: section
 * tops move as fonts land and images arrive, so a measurement cached at mount is of a
 * page that no longer exists; and a frame queued just before the tab is backgrounded
 * never fires, so a "skip if one is pending" guard would wedge the loop for good.
 *
 * Nothing is hidden until this runs. It reports the first pose synchronously on mount,
 * so a reader who never gets a frame still sees the mark, sitting still.
 */
export function useStageJourney(): number {
  const [position, setPosition] = React.useState(0);

  React.useEffect(() => {
    let frame: number | null = null;

    const measure = () => {
      frame = null;
      const vh = window.innerHeight;
      if (!vh) return;

      let total = 0;
      for (let i = 1; i < POSES.length; i++) {
        const el = document.getElementById(POSES[i].anchor);
        if (!el) continue;
        const top = el.getBoundingClientRect().top + window.scrollY;
        const start = top - vh * ENTER;
        const span = vh * (ENTER - LAND);
        total += Math.min(1, Math.max(0, (window.scrollY - start) / span));
      }

      /* Rounded because this drives a dozen shader uniforms through React, and
         sub-pixel scroll noise should not cost a render. */
      setPosition(Math.round(total * 1000) / 1000);
    };

    const schedule = () => {
      if (frame !== null) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    document.addEventListener('visibilitychange', schedule);
    /* Sections move once the webfont lands and the lazy photographs arrive, and
       neither fires a scroll event. */
    const settle = window.setTimeout(measure, 800);

    return () => {
      if (frame !== null) cancelAnimationFrame(frame);
      window.clearTimeout(settle);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      document.removeEventListener('visibilitychange', schedule);
    };
  }, []);

  return position;
}
