/**
 * Textmuster für SignalScores (AP3, DE-First).
 * Zentral gepflegt — Regeln lesen vorzugsweise Signale, nicht Rohtext (Zieldokument §5 Konvention).
 */

/** @type {RegExp[]} */
export const CONTRAST_PATTERNS = [
  /\bnicht\b[\s\S]{0,120}\bsondern\b/i,
  /\beigentlich\b[\s\S]{0,80}\baber\b/i,
  /\bdoch\b/i,
  /\btrotzdem\b/i,
];

/** @type {RegExp[]} */
export const PAIN_PATTERNS = [
  /\bProblem(e|)?\b/i,
  /\bscheitert(e|)?\b/i,
  /\bAufwand\b/i,
  /\btut weh\b/i,
  /\bRisiko\b/i,
  /\bvergisst\b/i,
  /\bHerausforderung\b/i,
  /\bzu hoch\b/i,
  /\bReibung\b/i,
];

/** @type {RegExp[]} */
export const BENEFIT_PATTERNS = [
  /\bÜberblick\b/i,
  /\bweniger Aufwand\b/i,
  /\beinfacher\b/i,
  /\bHebel\b/i,
  /\bspart\b/i,
  /\bNutzen\b/i,
  /\bklar(er|e)?\b/i,
  /\bhilft\b/i,
  /\bsparen\b/i,
];

/** @type {RegExp[]} */
export const PERSONAL_PATTERNS = [
  /\bich\b/i,
  /\bmein(e|er|em|en)?\b/i,
  /\bmir\b/i,
  /\bbei mir\b/i,
  /\buns\b/i,
  /\bwir\b/i,
];

/** @type {RegExp[]} */
export const SPECIFICITY_PATTERNS = [/\d/, /€/, /%/, /\b\d+[.,]\d+\b/];

/** @type {RegExp[]} */
export const RISK_KEYWORD_PATTERNS = [
  /\bSchwarzarbeit\b/i,
  /\bSteuerhinterziehung\b/i,
  /\billegal(e|er|es)?\b/i,
  /\bBetrug\b/i,
];

/** @type {RegExp[]} */
export const PROOF_PATTERNS = [
  /\bStudie(n)?\b/i,
  /\bDaten\b/i,
  /\bBeleg\b/i,
  /\bQuelle(n)?\b/i,
  /\bStatistik\b/i,
  /\bBeweis\b/i,
  /\bnachgewiesen\b/i,
  /\bForschung\b/i,
];

/** @type {RegExp[]} */
export const EXAMPLE_PATTERNS = [
  /z\.\s*B\.|z\.B\.|zum Beispiel|beispielsweise|case study|Beispiel:/i,
];

/** Rhetorische Frage / Leserbezug (CTA-Heuristik) */
export const CTA_QUESTION_LEAD = /\b(Was|Wie|Welche|Warum|Wer|Wo|Welchen|Welchem)\b/i;
export const CTA_AUDIENCE_PRONOUN = /\b(ihr|du|euch|uns|dir|dich|euer|dein)\b/i;

/** Buzzword / Corporate-Sprech (heuristisch) */
export const BUZZWORD_PATTERN =
  /\b(Synergie|synergy|Disruption|disrupt|Holistic|holistisch|Paradigm|paradigma|Blockchain|AI-First|Leverage|leverage|Full-Stack|Game\s*Changer|Mindset|deep\s*dive|Think\s*outside|empower|Empowerment|Impact|impactful|scalieren|skalieren)\b/i;
