import * as React from 'react';

/* Background tabs are delivered neither IntersectionObserver callbacks nor animation
 * frames, so anything that waits for one to show its content shows nothing at all to
 * a reader who opens the site in a new tab and switches to it later. Timers do fire
 * in background tabs. That bug has shipped on this site twice, which is why the
 * escape hatch lives in a hook rather than in a component: every reveal on the page
 * goes through here and inherits it by construction.
 *
 * But the escape hatch has to know when it is needed. An unconditional timer — which
 * is what this was — reveals the entire page three seconds after load whether anyone
 * has scrolled to it or not, so on a normal visible tab nothing below the fold ever
 * animates in; by the time you reach it, it revealed itself minutes ago. The hero's
 * own opening takes six seconds, so that was everything under it.
 *
 * So: the observer governs while the document is visible, and the timer only steps in
 * when it cannot — when the document is hidden, or when there is no observer at all.
 * A reader who is looking gets the choreography; a reader who is not gets the page
 * whole the moment they look. */
const FORCE_REVEAL_MS = 3000;

/** Fires once, when the element first comes into view or when nobody can be watching. */
export function useReveal<T extends HTMLElement = HTMLElement>() {
  const ref = React.useRef<T | null>(null);
  const [shown, setShown] = React.useState(false);

  React.useEffect(() => {
    const node = ref.current;
    const canObserve = Boolean(node) && typeof IntersectionObserver !== 'undefined';

    let settled = false;
    let io: IntersectionObserver | undefined;

    const reveal = () => {
      if (settled) return;
      settled = true;
      setShown(true);
      io?.disconnect();
    };

    /* Backgrounded before it was ever read: give up on the observer and show it. */
    const onVisibility = () => {
      if (document.hidden) reveal();
    };
    document.addEventListener('visibilitychange', onVisibility);

    /* Registered before any early return, so no code path can skip it. Fires in a
       background tab, where rAF and the observer do not. */
    const timer = window.setTimeout(() => {
      if (document.hidden || !canObserve) reveal();
    }, FORCE_REVEAL_MS);

    if (canObserve) {
      io = new IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting)) reveal();
        },
        { rootMargin: '0px 0px -12% 0px', threshold: 0.05 },
      );
      io.observe(node as T);
    }

    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.clearTimeout(timer);
      io?.disconnect();
    };
  }, []);

  return { ref, shown };
}
