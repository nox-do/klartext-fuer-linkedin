/** Schwellen für Oberflächen-/Heuristiken (AP2/AP3, Zieldokument). */

/** Ab dieser Wortzahl gilt ein Satz als „lang“ (z. B. Snippet-Ranker-PoC). */
export const LONG_SENTENCE_WORDS = 40;

/** Ab dieser Zeichenzahl gilt ein Satz als „lang“ (Fallback). */
export const LONG_SENTENCE_CHARS = 280;

/** Ab dieser Zeichenzahl gilt ein Absatz als „dicht“ (Wall of Text). */
export const LONG_PARAGRAPH_CHARS = 320;

/** Ab dieser Satzanzahl gilt ein Absatz als „dicht“ (Wall of Text). */
export const LONG_PARAGRAPH_SENTENCES = 4;

/** Wall-of-Text-Hinweis erst bei ausreichend langen Gesamttexten. */
export const WALL_OF_TEXT_MIN_POST_CHARS = 500;

/** Buzzword-Dichte erst ab ausreichender Textlänge bewerten. */
export const BUZZWORD_DENSE_MIN_WORDS = 80;

/** Minimale Anzahl auffälliger Sätze für Buzzword-Dichte-Hinweis. */
export const BUZZWORD_DENSE_MIN_SEGMENTS = 3;

/** Minimaler Anteil auffälliger Sätze für Buzzword-Dichte-Hinweis. */
export const BUZZWORD_DENSE_SEGMENT_RATIO = 0.22;
