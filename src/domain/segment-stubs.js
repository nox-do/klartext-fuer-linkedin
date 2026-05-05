/** Platzhalter für Tests/Mocks: Live-Pipeline setzt Signale (AP3) und Rollen (AP4) in `segment-document.js`. */

/**
 * @returns {import('./types.js').SignalScores}
 */
export function emptySignalScores() {
  return {
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
  };
}

/**
 * @returns {import('./types.js').RoleScores}
 */
export function emptyRoleScores() {
  return {
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
  };
}

/**
 * @returns {{ signals: import('./types.js').SignalScores, roles: import('./types.js').RoleScores }}
 */
export function emptySignalsAndRoles() {
  return {
    signals: emptySignalScores(),
    roles: emptyRoleScores(),
  };
}
