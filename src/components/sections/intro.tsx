import * as React from 'react';
import { motion, useReducedMotion, useTransform } from 'framer-motion';

import { useScrollProgress } from '@/hooks/use-parallax';

/* The three things a project actually arrives asking for. Recovered from the hero,
 * which used to carry them under the wordmark and now carries nothing but the mark. */
const CAPABILITIES = [
  { label: 'Identity', body: 'Marks, systems and the rules that keep them intact.' },
  { label: 'Photography ⟡ Film', body: 'Editorial and campaign work, shot in-house.' },
  { label: 'Digital', body: 'Sites and product surfaces, designed and built.' },
];

const STATEMENT =
  'One studio for the whole picture. Identity, photography, film and the sites they live on.';

const DIM = '#7a7a85'; /* --ink-3 */
const LIT = '#f4f4f6'; /* --foreground */

/** Each word lights across its own slice of the scroll, the last one landing at 0.72. */
function Word({ word, index, count, progress }: {
  word: string;
  index: number;
  count: number;
  progress: ReturnType<typeof useScrollProgress>['progress'];
}) {
  const start = (index / count) * 0.72;
  const color = useTransform(progress, [start, start + 0.14], [DIM, LIT]);
  return <motion.span style={{ color }}>{word} </motion.span>;
}

/**
 * The statement, and the one place on the page where scrolling drives the design
 * rather than merely triggering it.
 *
 * The section is 260vh of runway wrapping a viewport-tall sticky child, so there are
 * 160vh of scroll during which the sentence is held still on screen and reads itself
 * a word at a time. One such moment is a decision; three would be a demo reel.
 */
export function Intro() {
  const { ref, progress } = useScrollProgress();
  const reduceMotion = useReducedMotion();

  const words = STATEMENT.split(' ');

  /* The capabilities arrive on the tail of the pass, once the sentence has finished
     lighting — so the section resolves into its own footnote rather than showing you
     the answer before you have read the question. */
  const railOpacity = useTransform(progress, [0.74, 0.92], [0, 1]);
  const railY = useTransform(progress, [0.74, 0.92], [24, 0]);

  if (reduceMotion) {
    return (
      <section id="intro" className="scroll-mt-24 py-26">
        <Body statement={<span className="text-foreground">{STATEMENT}</span>} />
      </section>
    );
  }

  return (
    <section id="intro" ref={ref} className="relative h-[260vh] scroll-mt-24">
      <div className="sticky top-0 flex h-screen flex-col justify-center overflow-hidden">
        <Body
          statement={words.map((word, i) => (
            <Word key={`${word}-${i}`} word={word} index={i} count={words.length} progress={progress} />
          ))}
          railStyle={{ opacity: railOpacity, y: railY }}
        />
      </div>
    </section>
  );
}

function Body({
  statement,
  railStyle,
}: {
  statement: React.ReactNode;
  railStyle?: React.ComponentProps<typeof motion.ul>['style'];
}) {
  return (
    <div className="shell">
      <p className="eyebrow">
        PLCBO <span aria-hidden="true">⟡</span> Creative Studios
      </p>

      {/* Full width, not a 20ch column: this is the first sentence anyone reads on the
          site and it should occupy the screen the way the mark above it does. */}
      <h2 className="mt-10 max-w-[16ch] font-display text-mega font-semibold tracking-tight">
        {statement}
      </h2>

      <motion.ul
        style={railStyle}
        className="mt-16 grid grid-cols-1 gap-x-10 sm:grid-cols-3"
      >
        {CAPABILITIES.map((item) => (
          <li key={item.label} className="border-t border-border pb-6 pt-5 sm:pb-0">
            <p className="eyebrow">{item.label}</p>
            <p className="mt-3 max-w-[34ch] text-pretty leading-relaxed text-ink-2">
              {item.body}
            </p>
          </li>
        ))}
      </motion.ul>
    </div>
  );
}
