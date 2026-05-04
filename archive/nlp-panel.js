import { escapeHtml, firstLine, sentences } from "./text-utils.js";

const ESM_COMPROMISE = "https://esm.sh/compromise@14.14.2";
const ESM_SENTIMENT = "https://esm.sh/sentiment@5.0.2";

let nlpLib = null;
let SentimentCtor = null;
let nlpImportPromise = null;
let nlpLoadError = null;
let sentimentAnalyzer = null;
let nlpSeq = 0;

async function ensureNlp() {
  if (nlpLib && SentimentCtor) return true;
  try {
    if (!nlpImportPromise) {
      nlpImportPromise = Promise.all([import(ESM_COMPROMISE), import(ESM_SENTIMENT)]).then(([cMod, sMod]) => {
        nlpLib = cMod.default;
        SentimentCtor = sMod.default;
      });
    }
    await nlpImportPromise;
    nlpLoadError = null;
    return !!(nlpLib && SentimentCtor);
  } catch (e) {
    nlpLoadError = e;
    nlpImportPromise = null;
    return false;
  }
}

function getSentimentAnalyzer() {
  if (!SentimentCtor) return null;
  if (!sentimentAnalyzer) sentimentAnalyzer = new SentimentCtor();
  return sentimentAnalyzer;
}

function countEmojiExtended(text) {
  try {
    return [...text.matchAll(/\p{Extended_Pictographic}/gu)].length;
  } catch {
    return 0;
  }
}

function hookStrengthScore({ hookText, hookComparative, firstLineLen }) {
  let s = 42;
  const words = hookText.trim().split(/\s+/).filter(Boolean).length;
  if (words >= 5) s += 18;
  if (words >= 8) s += 8;
  if (/\?/.test(hookText)) s += 12;
  if (hookComparative > 0.08) s += 8;
  if (firstLineLen >= 35 && firstLineLen <= 200) s += 12;
  return Math.min(100, Math.round(s));
}

function computeNlpInsightsHtml(text) {
  const doc = nlpLib(text);
  let nSents;
  let nWords;
  try {
    nSents = Math.max(1, doc.sentences().length);
    nWords = doc.terms().length;
  } catch {
    const s = sentences(text);
    nSents = Math.max(1, s.length);
    nWords = text.split(/\s+/).filter(Boolean).length;
  }
  const density = (nWords / nSents).toFixed(1);

  const sa = getSentimentAnalyzer();
  const full = sa ? sa.analyze(text) : { score: 0, comparative: 0, positive: [], negative: [] };
  const hookWords = text.trim().split(/\s+/).slice(0, 10).join(" ");
  const hookAn = hookWords && sa ? sa.analyze(hookWords) : { score: 0, comparative: 0 };

  let toneLabel = "neutral (AFINN)";
  if (full.comparative > 0.05) toneLabel = "eher positiv";
  else if (full.comparative < -0.05) toneLabel = "eher negativ";

  const questions = (text.match(/\?/g) || []).length;
  const emojis = countEmojiExtended(text);
  const hashtags = (text.match(/#[\p{L}\p{N}_]+/gu) || []).length;
  const flLen = firstLine(text).length;
  const hookScore = hookStrengthScore({
    hookText: hookWords,
    hookComparative: hookAn.comparative || 0,
    firstLineLen: flLen,
  });

  const posArr = full.positive || [];
  const negArr = full.negative || [];
  const posHint =
    posArr.length && posArr.length <= 4
      ? `<br><span style="font-size:0.75rem">Positive Treffer: ${posArr.map((w) => escapeHtml(String(w))).join(", ")}</span>`
      : "";
  const negHint =
    negArr.length && negArr.length <= 4
      ? `<br><span style="font-size:0.75rem">Negative Treffer: ${negArr.map((w) => escapeHtml(String(w))).join(", ")}</span>`
      : "";

  return `
<div class="nlp-grid">
  <div class="nlp-card"><strong>Content density</strong>
    <span class="nlp-val">${density}</span> Ø Wörter / Satz (compromise)<br>
    <span style="font-size:0.76rem">${nWords} Wörter · ${nSents} Sätze</span>
  </div>
  <div class="nlp-card"><strong>Tonality (AFINN)</strong>
    <span class="nlp-val">${(full.comparative ?? 0).toFixed(3)}</span> comparative · Score ${full.score ?? 0}
    <br><span style="font-size:0.76rem">${escapeHtml(toneLabel)}</span>${posHint}${negHint}
  </div>
  <div class="nlp-card"><strong>Hook (10 Wörter)</strong>
    <span class="nlp-val">${hookScore}</span> / 100 heuristisch<br>
    <span style="font-size:0.76rem">Snippet: „${escapeHtml(hookWords.slice(0, 120))}${hookWords.length > 120 ? "…" : ""}“</span>
  </div>
  <div class="nlp-card"><strong>Pattern</strong>
    <span class="nlp-val">${questions}</span> Fragezeichen ·
    <span class="nlp-val">${emojis}</span> Emoji ·
    <span class="nlp-val">${hashtags}</span> Hashtags
  </div>
</div>`;
}

/**
 * @param {string} text — Rohtext
 * @param {HTMLElement | null} el
 */
export async function updateNlpPanel(text, el) {
  if (!el) return;
  const seq = ++nlpSeq;
  const t = text.trim();
  if (!t) {
    el.innerHTML =
      '<span style="color:var(--muted)">Noch kein Text — hier erscheinen Dichte, Tonality, Hook &amp; Muster (nach compromise / sentiment).</span>';
    return;
  }
  el.textContent = "Lade / analysiere …";
  const ok = await ensureNlp();
  if (seq !== nlpSeq) return;
  if (!ok) {
    el.innerHTML = `<span class="warn">NLP-Module nicht ladbar (Netzwerk/Blocker?). ${escapeHtml(String(nlpLoadError?.message || nlpLoadError || "Fehler"))}</span>`;
    return;
  }
  el.innerHTML = computeNlpInsightsHtml(t);
}
