import { Fragment, type CSSProperties } from "react";

/**
 * Faux italic for `.headline-italic`: Geist has no italic face, so each word is skewed on
 * its own baseline. Skewing per word (not the whole block) keeps wrapped lines aligned; the
 * spaces stay outside the inline-block words so lines can still break between them.
 */
export function Slanted({ text }: { text: string }) {
  const words = text.split(/\s+/).filter(Boolean);
  return words.map((word, index) => (
    <Fragment key={index}>
      {index > 0 ? " " : null}
      <span className="slant">{word}</span>
    </Fragment>
  ));
}

/**
 * Inline style for `.fit-words`: the longest word's length, so the headline shrinks until
 * that word fits one line of the nearest inline-size container.
 */
export function fitWords(text: string): CSSProperties {
  const longest = Math.max(6, ...text.split(/\s+/).map((word) => word.length));
  return { "--fit-chars": longest } as CSSProperties;
}
