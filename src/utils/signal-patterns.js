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
export const CTA_PATTERNS = {
  dialog: [
    /\bwie\s+(siehst|seht)\s+(du|ihr)\s+das\b/i,
    /\bwas\s+(denkst|denkt)\s+(du|ihr)\b/i,
    /\bwelche\s+erfahrung(en)?\s+hast\s+du\b/i,
  ],
  comment: [
    /\bschreib(e|t)?\s+(es\s+)?(in\s+)?die\s+kommentare\b/i,
    /\bteile\s+(deine|eure)\s+(meinung|erfahrung)\b/i,
    /\bkommentier(e|t)?\s+(gern|gerne|mit)\b/i,
  ],
  dm: [
    /\bschreib(e)?\s+mir\s+(eine\s+)?dm\b/i,
    /\bmeld(e)?\s+dich\s+per\s+dm\b/i,
    /\bper\s+dm\s+(melden|schreiben)\b/i,
  ],
  follow: [
    /\bfolge\s+mir\s+für\b/i,
    /\bfolg(e|t)\s+mir,\s+wenn\b/i,
    /\babonnier(e)?\s+(mich|meinen\s+newsletter)\b/i,
  ],
  resource: [
    /\blink\s+im\s+(ersten\s+)?kommentar\b/i,
    /\bdie\s+(checkliste|vorlage|template)\s+(gibt|findest)\s+du\b/i,
    /\bdownload\s+(im|unter|hier)\b/i,
  ],
  reflection: [
    /\bprüf(e)?\s+(beim|in deinem|vor dem)\b/i,
    /\bachte\s+(beim|in deinem|vor dem)\b/i,
    /\bversuch(e)?\s+beim\s+nächsten\s+mal\b/i,
  ],
  contact: [
    /\bmeld(e)?\s+dich,\s+wenn\b/i,
    /\bsprich\s+mich\s+an,\s+wenn\b/i,
    /\bwenn\s+du\s+.*\s+(brauchst|suchst),?\s+meld(e)?\s+dich\b/i,
  ],
};

/** Buzzword / Corporate-Sprech (heuristisch) */
export const BUZZWORD_PATTERN =
  /\b(Synergie|synergy|Disruption|disrupt|Holistic|holistisch|Paradigm|paradigma|Blockchain|AI-First|Leverage|leverage|Full-Stack|Game\s*Changer|Mindset|deep\s*dive|Think\s*outside|empower|Empowerment|Impact|impactful|scalieren|skalieren)\b/i;
