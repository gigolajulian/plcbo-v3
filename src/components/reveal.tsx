import * as React from 'react';
import { motion, useReducedMotion, type Variants } from 'framer-motion';

/* Scroll reveal.
 *
 * Deliberately NOT framer-motion's `whileInView`, and deliberately not gated on
 * requestAnimationFrame. Both IntersectionObserver callbacks and animation frames
 * are delivered only when the browser has a rendering opportunity, so a page opened
 * in a background tab gets neither — and anyone who opens the site in a new tab and
 * switches to it later would find a blank page. This bug has shipped twice.
 *
 * So: IntersectionObserver drives the normal case, and a plain setTimeout force-
 * reveals everything at 3000ms regardless. Timers fire in background tabs. */
const FORCE_REVEAL_MS = 3000;

const variants: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0 },
};

export function Reveal({
  children,
  delay = 0,
  className,
  as = 'div',
}: {
  children: React.ReactNode;
  /** Stagger index, not seconds — each step is 90ms. */
  delay?: number;
  className?: string;
  as?: 'div' | 'li' | 'article' | 'header';
}) {
  const ref = React.useRef<HTMLDivElement | null>(null);
  const [shown, setShown] = React.useState(false);
  const reduceMotion = useReducedMotion();

  React.useEffect(() => {
    const forced = window.setTimeout(() => setShown(true), FORCE_REVEAL_MS);

    const node = ref.current;
    if (!node || typeof IntersectionObserver === 'undefined') {
      return () => window.clearTimeout(forced);
    }

    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setShown(true);
          io.disconnect();
        }
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.05 },
    );
    io.observe(node);

    return () => {
      window.clearTimeout(forced);
      io.disconnect();
    };
  }, []);

  const MotionTag = motion[as];

  return (
    <MotionTag
      ref={ref as never}
      className={className}
      variants={variants}
      initial={reduceMotion ? 'visible' : 'hidden'}
      animate={shown ? 'visible' : undefined}
      transition={{ duration: 0.75, delay: delay * 0.09, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </MotionTag>
  );
}
