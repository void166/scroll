/**
 * TextReveal — markup for the two type animations.
 *
 * `lines` gives each line its own overflow mask, so the type slides up from
 * behind an invisible rule. `text` splits a paragraph into word masks for a
 * looser, slower drift. Both start hidden in CSS; scrollAnimations decides
 * when they play.
 */

import { createElement, type ReactNode } from 'react';
import '../styles/text.css';

interface LineProps {
  lines: string[];
  text?: never;
  as?: string;
  className?: string;
  children?: never;
}

interface WordProps {
  text: string;
  lines?: never;
  as?: string;
  className?: string;
  children?: never;
}

type Props = LineProps | WordProps;

export function TextReveal(props: Props) {
  const { as = 'p', className } = props;

  let content: ReactNode;

  if ('lines' in props && props.lines) {
    content = props.lines.map((line, i) => (
      <span className="reveal-line" key={i}>
        <span>{line}</span>
      </span>
    ));
  } else {
    const words = (props as WordProps).text.split(/\s+/);
    content = words.map((word, i) => (
      <span className="word" key={i}>
        <span>{word}</span>
      </span>
    ));
  }

  return createElement(as, { className }, content);
}
