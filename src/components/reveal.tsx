import * as React from 'react';
import { motion, useReducedMotion, type Variants } from 'framer-motion';

import { useReveal } from '@/hooks/use-reveal';

/* Scroll reveal.
 *
 * Deliberately NOT framer-motion's `whileInView`: the visibility decision lives in
 * `useReveal`, which pairs an IntersectionObserver with an unconditional timer so a
 * page opened in a background tab is never left blank. See that hook for why.
 *
 * One component with a vocabulary rather than five components. What is being revealed
 * should decide how it arrives — a photograph settling is not a paragraph rising, and
 * a hairline drawing itself is neither — but they must all share one visibility rule.
 */

export type RevealVariant = 'rise' | 'plate' | 'rule' | 'wipe';

/* A hidden state must never clip its own element to zero area.
 *
 * The first cut of `wipe` started at `clip-path: polygon(0% 0%, 0% 0%, …)`, which is
 * a shape with no area — and IntersectionObserver measures the *visible* rect, so it
 * reported ratio 0 for a cell sitting in the middle of the screen and never fired.
 * The element was hidden so thoroughly that the observer meant to reveal it could not
 * see it. Six service cells sat at opacity 0 with no error anywhere.
 *
 * So the hidden states here move and fade; they do not clip. Where something really
 * does need to wipe out from behind an edge — the word-by-word headings below — the
 * clip goes on a wrapper and the observer watches the unclipped parent. */
const VARIANTS: Record<RevealVariant, Variants> = {
  /** the default: copy lifts into place */
  rise: {
    hidden: { opacity: 0, y: 28 },
    visible: { opacity: 1, y: 0 },
  },
  /** photographs settle rather than slide — already the right size, just too close */
  plate: {
    hidden: { opacity: 0, scale: 1.045 },
    visible: { opacity: 1, scale: 1 },
  },
  /** a hairline draws itself across from the left */
  rule: {
    hidden: { scaleX: 0 },
    visible: { scaleX: 1 },
  },
  /** dealt out — a diagonal drift, for cells arriving in a grid */
  wipe: {
    hidden: { opacity: 0, x: -14, y: 18 },
    visible: { opacity: 1, x: 0, y: 0 },
  },
};

/** Slower for the ones that travel further, so they all feel like one gesture. */
const DURATION: Record<RevealVariant, number> = {
  rise: 0.75,
  plate: 1.05,
  rule: 0.85,
  wipe: 0.8,
};

export function Reveal({
  children,
  delay = 0,
  className,
  as = 'div',
  variant = 'rise',
  style,
}: {
  children?: React.ReactNode;
  /** Stagger index, not seconds — each step is 90ms. */
  delay?: number;
  className?: string;
  as?: 'div' | 'li' | 'article' | 'header' | 'span' | 'p' | 'figure' | 'section';
  variant?: RevealVariant;
  style?: React.CSSProperties;
}) {
  const { ref, shown } = useReveal<HTMLDivElement>();
  const reduceMotion = useReducedMotion();

  const MotionTag = motion[as];

  return (
    <MotionTag
      ref={ref as never}
      className={className}
      /* a rule that grows from its centre reads as a mistake, not a drawn line */
      style={variant === 'rule' ? { transformOrigin: 'left center', ...style } : style}
      variants={VARIANTS[variant]}
      initial={reduceMotion ? 'visible' : 'hidden'}
      animate={shown ? 'visible' : undefined}
      transition={{
        duration: DURATION[variant],
        delay: delay * 0.09,
        ease: [0.16, 1, 0.3, 1],
      }}
    >
      {children}
    </MotionTag>
  );
}

/**
 * A heading that builds a word at a time.
 *
 * The words share one `useReveal` — a single observer and a single timer for the whole
 * line — rather than one per word, so a ten-word heading does not put ten observers on
 * the page and cannot half-reveal. The source string stays whole in the DOM for
 * selection and for screen readers; only the visual boxes are split.
 */
export function Words({
  text,
  className,
  as = 'h2',
  delay = 0,
  suffix,
}: {
  text: string;
  className?: string;
  as?: 'h1' | 'h2' | 'h3' | 'p' | 'span';
  delay?: number;
  /** Rendered after the words, inside the heading, without its own animation. */
  suffix?: React.ReactNode;
}) {
  const { ref, shown } = useReveal<HTMLHeadingElement>();
  const reduceMotion = useReducedMotion();
  const Tag = as;

  if (reduceMotion) {
    return (
      <Tag className={className}>
        {text}
        {suffix}
      </Tag>
    );
  }

  const words = text.split(' ');

  return (
    <Tag ref={ref as never} className={className}>
      {words.map((word, i) => (
        <React.Fragment key={`${word}-${i}`}>
          <span
            /* The clip goes on a wrapper, not on the element being moved: overflow on
               the animating span would clip its own descenders as it travels. And the
               joining space stays OUTSIDE this wrapper — inside an inline-block with
               overflow hidden it collapses, and every word runs into the next. */
            style={{ display: 'inline-block', overflow: 'hidden', verticalAlign: 'bottom' }}
          >
            <motion.span
              style={{ display: 'inline-block', willChange: 'transform' }}
              initial={{ y: '110%' }}
              animate={shown ? { y: '0%' } : undefined}
              transition={{
                duration: 0.85,
                delay: delay * 0.09 + i * 0.055,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              {word}
            </motion.span>
          </span>
          {i < words.length - 1 ? ' ' : null}
        </React.Fragment>
      ))}
      {suffix}
    </Tag>
  );
}
