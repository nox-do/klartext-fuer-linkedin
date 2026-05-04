/** Platzhalter für Surface/Signals/Roles bis AP2–AP4 (Zieldokument §5). */
export function emptySegmentSemantics() {
  return {
    surface: {
      length: 0,
      wordCount: 0,
      commaCount: 0,
      hasQuestion: false,
      hasNumber: false,
      hasUrl: false,
      hasHashtag: false,
      hasEmojiRun: false,
      startsWeak: false,
      isAllCaps: false,
    },
    signals: {
      contrast: 0,
      pain: 0,
      benefit: 0,
      personal: 0,
      specificity: 0,
      risk: 0,
      cta: 0,
      proof: 0,
      example: 0,
      buzzword: 0,
    },
    roles: {
      hook: 0,
      context: 0,
      thesis: 0,
      problem: 0,
      benefit: 0,
      example: 0,
      proof: 0,
      transition: 0,
      cta: 0,
      risk: 0,
      filler: 0,
    },
  };
}
