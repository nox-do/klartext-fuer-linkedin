import { REF_HEADLINE, REF_FEED } from "./constants.js";

export const KIND_ORDER = ["headline", "invite", "feed", "article"];
export const KIND = {
  headline: { label: "Schlagzeile" },
  invite: { label: "Einladung / Kurznachricht" },
  feed: { label: "Feed-Post" },
  article: { label: "Artikel / langer Beitrag" },
};

/** Grobe Einladungs-/Kurznachrichten-Signale (Sprache, nicht Modell) */
export function inviteSignals(t) {
  const low = t.slice(0, 520).toLowerCase();
  let s = 0;
  if (
    /\b(hallo|hi |liebe |lieber |sehr geehrte|ich schreibe|ich würde mich freuen|vernetz|netzwerk|profil|beitrag|gelesen|zufällig|zum zufall|kontakt|einladung|connect)\b/.test(
      low
    )
  )
    s += 2;
  if (/\b(du|dir|dich|dein|deine|euch|ihr|ihnen|sie\s)\b/.test(low)) s += 2;
  if (/\b(freue|freuen|möchte|würde gerne|kurz melden|kurz vorstellen|ansprechen|melde mich)\b/.test(low)) s += 1;
  if (/^\s*hi[,!]?\s/i.test(t)) s += 1;
  return s;
}

export function deriveKind(text) {
  const t = text.trim();
  if (!t) {
    return { primaryKey: null, scores: { headline: 0, invite: 0, feed: 0, article: 0 }, reasons: [] };
  }
  const L = t.length;
  const words = t.split(/\s+/).filter(Boolean);
  const W = words.length;
  const paras = t.split(/\n\s*\n/).filter((p) => p.trim()).length;
  const nl = (t.match(/\r?\n/g) || []).length;
  const inv = inviteSignals(t);

  const scores = { headline: 0, invite: 0, feed: 0, article: 0 };

  if (L >= 3000 || (W >= 360 && paras >= 2) || (L >= 2200 && paras >= 3)) scores.article += 52;
  else if (L >= 2200 || W >= 280) scores.article += 26;

  scores.invite += inv * 16;
  if (L >= 40 && L <= 520) scores.invite += 24;
  if (L > 850) scores.invite -= 38;
  if (paras >= 3 && L > 700) scores.invite -= 22;

  if (L <= 240 && nl <= 2) scores.headline += 32;
  if (L <= 220) scores.headline += 26;
  if (/[|·•]{2,}/.test(t) && L < 420) scores.headline += 16;
  if (nl > 4) scores.headline -= 22;
  if (L > 300) scores.headline -= 18;
  if (inv >= 3) scores.headline -= 28;

  if (L >= 200 && L <= 3400) scores.feed += 24;
  if (L >= 380 && L <= 3000 && inv < 2) scores.feed += 22;
  if (paras >= 2) scores.feed += 14;
  if (scores.article > 42) scores.feed -= 18;

  let primaryKey = "feed";
  let best = -999;
  for (const k of KIND_ORDER) {
    if (scores[k] > best) {
      best = scores[k];
      primaryKey = k;
    }
  }

  const reasons = [];
  if (inv >= 2) reasons.push("persönliche Ansprache / typische Kurznachrichten-Wörter");
  if (L <= REF_HEADLINE + 40 && nl <= 2) reasons.push("sehr kompakt, wenig Zeilenumbruch");
  if (L > REF_FEED) reasons.push("über typischer Feed-Länge — eher Artikel oder Kommentar-Strategie");
  if (paras >= 2 && L > 500) reasons.push("mehrere Absätze — eher längerer Beitrag");
  if (reasons.length === 0) reasons.push("Länge und Struktur passen am ehesten zu dieser Kategorie");

  return { primaryKey, scores, reasons };
}
