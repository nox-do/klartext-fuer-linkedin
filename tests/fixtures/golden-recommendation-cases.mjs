export const GOLDEN_RECOMMENDATION_CASES = [
  {
    id: "gc01_empty_text",
    input: "",
    expect: {
      includes: ["baseline.empty_text"],
      excludes: ["feed.cta_missing", "feed.thesis_too_late", "risk.overall_high"],
      topExact: [],
      emptyState: true,
    },
  },
  {
    id: "gc02_strong_feed_clean",
    input:
      "Viele Teams verwechseln Tempo mit Fortschritt. Klarheit in Rollen und Zielen reduziert Reibung und hilft, Entscheidungen ruhiger zu treffen. Wir haben damit in zwei Projekten weniger Schleifen gesehen und Feedback früher eingebaut. Welche Routine hat euch zuletzt am meisten Fokus gebracht?",
    expect: {
      excludes: [
        "feed.cta_missing",
        "feed.thesis_too_late",
        "baseline.all_caps_opening",
        "baseline.long_sentence",
        "baseline.url_in_main_text",
      ],
    },
  },
  {
    id: "gc03_long_feed_missing_cta",
    input:
      "Das Problem in vielen Teams ist nicht Motivation, sondern fehlende Klarheit. Wir verlieren Zeit in Übergaben und Meetings und verzetteln uns in Detailfragen ohne echten Fortschritt. Dadurch bleibt weniger Fokus für Kunden und Produkt, obwohl alle Beteiligten eigentlich das Richtige wollen. Die Folge sind langsame Entscheidungen, Frust im Alltag und unnötige Schleifen in Abstimmungen. Ein klarer Prozess spart Aufwand und verbessert die Zusammenarbeit, wenn Verantwortlichkeiten sauber benannt sind. Zusätzlich hilft ein gemeinsames Zielbild, damit Prioritäten nicht bei jeder Diskussion neu verhandelt werden.",
    options: { analyzeOptions: { kind: "feed", localeHint: "de" } },
    expect: {
      includes: ["feed.cta_missing"],
      topIncludes: ["feed.cta_missing"],
      excludes: ["baseline.empty_text"],
    },
  },
  {
    id: "gc04_url_query_not_cta",
    input:
      "Wir haben den Ablauf in drei Schritten dokumentiert und alle Übergaben sichtbar gemacht. So wurde klar, wo Informationen hängen bleiben und warum Entscheidungen zu spät fallen. Details stehen hier: https://example.com/guide?ref=linkedin&step=1. Seitdem sparen wir wöchentlich Zeit in Abstimmungen und vermeiden doppelte Arbeit im Team. Der Beitrag erklärt bewusst nur den Ablauf und enthält keine Abschlussfrage für Kommentare.",
    options: { analyzeOptions: { kind: "feed", localeHint: "de" } },
    expect: {
      includes: ["baseline.url_in_main_text", "feed.cta_missing"],
      excludes: ["feed.kind_uncertain"],
      topIncludes: ["feed.cta_missing"],
    },
  },
  {
    id: "gc05_all_caps_opening",
    input:
      "DAS IST KEIN SKALIERBARER PROZESS. Wir können so nicht weiterarbeiten und müssen Abläufe klarer schneiden.",
    expect: {
      includes: ["baseline.all_caps_opening"],
      topIncludes: ["baseline.all_caps_opening"],
      excludes: ["baseline.empty_text"],
    },
  },
  {
    id: "gc06_long_sentence_readability",
    input:
      "Wenn wir gleichzeitig Anforderungen sammeln, Prioritäten verschieben, Zuständigkeiten neu verteilen, Rückfragen im Chat klären, in Meetings erneut entscheiden und danach Dokumentation nachziehen, dann verlieren wir trotz hoher Aktivität jede Woche Zeit und erzeugen unnötige Reibung in fast jedem Übergabeschritt.",
    expect: {
      includes: ["baseline.long_sentence"],
      topIncludes: ["baseline.long_sentence"],
      excludes: ["baseline.empty_text"],
    },
  },
  {
    id: "gc07_sensitive_keyword",
    input:
      "Schwarzarbeit wirkt für manche wie eine Abkürzung, ist aber ein hohes Risiko für alle Beteiligten.",
    expect: {
      includesPrefixes: ["risk.sensitive."],
      topIncludesPrefixes: ["risk.sensitive."],
      excludes: ["baseline.empty_text"],
    },
  },
  {
    id: "gc08_feed_kind_uncertain",
    input:
      "Dieser Text hat etwas mehr als eine Headline, bleibt aber kurz und ohne klaren Formatkontext für sichere Zuordnung.",
    expect: {
      includes: ["feed.kind_uncertain"],
      excludes: ["feed.cta_missing", "feed.thesis_too_late"],
      topIncludes: ["feed.kind_uncertain"],
    },
  },
  {
    id: "gc09_anti_fp_short_question_no_cta_missing",
    input:
      "Wie priorisiert ihr diese Woche im Team zwischen Kundenanfragen und strategischer Arbeit?",
    expect: {
      excludes: ["feed.cta_missing"],
    },
  },
  {
    id: "gc10_multi_signal_mix",
    input:
      "DAS IST EIN KRITISCHER FEHLER IM ABLAUF. Wir sehen in mehreren Teams, dass Aufgaben ohne klare Priorisierung durch viele Schleifen laufen, Verantwortlichkeiten unklar bleiben, Rückfragen zu spät auftauchen, Abstimmungen doppelt stattfinden und dadurch Woche für Woche Zeit verloren geht, obwohl alle Beteiligten engagiert arbeiten. Schwarzarbeit wird dann als scheinbar schneller Ausweg diskutiert, was neue Risiken erzeugt und Vertrauen zerstört. Mehr Details stehen hier: https://example.com/ops?topic=handover&lang=de. Der Text beschreibt nur die Lage und endet ohne Frage.",
    options: { analyzeOptions: { kind: "feed", localeHint: "de" } },
    expect: {
      includes: [
        "baseline.all_caps_opening",
        "baseline.long_sentence",
        "baseline.url_in_main_text",
        "feed.cta_missing",
      ],
      includesPrefixes: ["risk.sensitive."],
      topIncludes: ["feed.cta_missing"],
      topIncludesPrefixes: ["risk.sensitive."],
      excludes: ["baseline.empty_text"],
    },
  },
  {
    id: "gc11_feed_thesis_too_late",
    input:
      "Ich teile heute drei Beobachtungen aus Projektuebergaben in den letzten Monaten. Erstens fehlen oft klare Rollen, zweitens werden Abhaengigkeiten zu spaet sichtbar und drittens werden Entscheidungen ohne gemeinsame Kriterien getroffen. Dadurch entstehen viele Rueckfragen und der Fokus auf Kundennutzen geht verloren. Viele Teams arbeiten engagiert, aber ohne klares Entscheidungsmodell. Nicht mehr Aktivitaet, sondern ein klares Entscheidungsmodell reduziert Unsicherheit.",
    options: { analyzeOptions: { kind: "feed", localeHint: "de" } },
    expect: {
      includes: ["feed.thesis_too_late"],
      topIncludes: ["feed.thesis_too_late"],
      excludes: ["baseline.empty_text", "feed.kind_uncertain"],
    },
  },
  {
    id: "gc12_feed_late_thesis_and_missing_cta",
    input:
      "In mehreren Teams laufen Uebergaben noch ueber Zuruf und einzelne Chat-Nachrichten. Neue Anforderungen werden parallel in verschiedenen Dokumenten erfasst, Prioritaeten aendern sich kurzfristig und Entscheidungen werden spaeter erneut aufgemacht. Das erzeugt Unsicherheit und kostet Zeit in jeder Iteration. Zudem fehlen haeufig klare Kriterien, wann etwas wirklich entschieden ist und wer final verantwortlich zeichnet. Viele Meetings erzeugen Aktivitaet, aber keine nachhaltige Klarheit. Nicht mehr Abstimmung, sondern klare Verantwortung beschleunigt Umsetzung im Team.",
    options: { analyzeOptions: { kind: "feed", localeHint: "de" } },
    expect: {
      includes: ["feed.cta_missing", "feed.thesis_too_late"],
      topIncludes: ["feed.cta_missing", "feed.thesis_too_late"],
      excludes: ["feed.kind_uncertain"],
    },
  },
  {
    id: "gc13_url_in_main_text",
    input:
      "Kurzer Kontext zur Auswertung. Die vollständige Notiz liegt hier: https://example.com/report. Danach haben wir die Ergebnisse intern diskutiert.",
    expect: {
      includes: ["baseline.url_in_main_text"],
      topIncludes: ["baseline.url_in_main_text"],
      excludes: ["baseline.empty_text"],
    },
  },
  {
    id: "gc14_anti_fp_no_all_caps",
    input:
      "Das ist kein skalierbarer Prozess. Wir sollten Rollen und Übergaben klarer benennen.",
    expect: {
      excludes: ["baseline.all_caps_opening"],
    },
  },
  {
    id: "gc15_anti_fp_no_long_sentence",
    input:
      "Klare Rollen helfen. Entscheidungen werden schneller. Teams verlieren weniger Zeit.",
    expect: {
      excludes: ["baseline.long_sentence"],
    },
  },
  {
    id: "gc16_sensitive_multiple_terms",
    input:
      "Betrug und Steuerhinterziehung sind keine cleveren Strategien, sondern klare Risiken für Unternehmen.",
    expect: {
      includesPrefixes: ["risk.sensitive."],
      topIncludesPrefixes: ["risk.sensitive."],
      excludes: ["baseline.empty_text"],
    },
  },
  {
    id: "gc17_headline_too_short",
    input: "Besser entscheiden im Team.",
    options: {
      selectedPacks: ["headline"],
      analyzeOptions: { kind: "headline", localeHint: "de" },
    },
    expect: {
      includes: ["headline.too_short"],
      topIncludes: ["headline.too_short"],
    },
  },
  {
    id: "gc18_headline_ok_length_no_warning",
    input:
      "Klarere Verantwortung macht Uebergaben schneller und Entscheidungen robuster fuer Teams im Alltag.",
    options: {
      selectedPacks: ["headline"],
      analyzeOptions: { kind: "headline", localeHint: "de" },
    },
    expect: {
      excludes: ["headline.too_short"],
    },
  },
  {
    id: "gc19_invite_too_long",
    input:
      "Hallo Anna, danke fuer deinen Beitrag und den klaren Blick auf Zusammenarbeit im Netzwerk. Ich moechte mich gern vernetzen und kurz den Anlass teilen: Ich arbeite aktuell an klareren Betriebsprozessen und begleite Teams bei Priorisierung, Rollenabgrenzung, sauberer Uebergabe und verstaendlicher Kommunikation zwischen Produkt, Vertrieb und Operations. Wenn es fuer dich passt, verbinde ich mich gern, lerne von deinen Perspektiven und teile konkrete Erfahrungen aus laufenden Projekten.",
    options: {
      selectedPacks: ["invite"],
      analyzeOptions: { kind: "invite", localeHint: "de" },
    },
    expect: {
      includes: ["invite.too_long"],
      topIncludes: ["invite.too_long"],
    },
  },
  {
    id: "gc20_invite_short_no_warning",
    input: "Hallo Marie, danke fuer deinen Beitrag. Ich vernetze mich gern fuer Austausch zu Prozessen.",
    options: {
      selectedPacks: ["invite"],
      analyzeOptions: { kind: "invite", localeHint: "de" },
    },
    expect: {
      excludes: ["invite.too_long"],
    },
  },
  {
    id: "gc21_article_thesis_late",
    input:
      "In vielen Organisationen werden Entscheidungen noch in inoffiziellen Runden vorbereitet und spaeter formal bestaetigt. Das fuehrt zu Reibung, weil Teams nicht wissen, welche Kriterien am Ende wirklich zaehlen.\n\nWenn Priorisierung nicht transparent ist, entstehen Schleifen zwischen Produkt, Vertrieb und Operations. Jede Schleife wirkt klein, in Summe blockiert sie jedoch die Umsetzung und verlangsamt Lernen im Markt.\n\nDazu kommen Unsicherheiten bei Verantwortlichkeiten. Aufgaben werden angefasst, aber nicht abgeschlossen. Meetings erzeugen Aktivitaet, aber keinen Abschluss.\n\nDie Leitthese dieses Artikels ist einfach: Ohne explizites Entscheidungsmodell wird Koordination zum Risiko fuer Wachstum.",
    options: {
      selectedPacks: ["article"],
      analyzeOptions: { kind: "article", localeHint: "de" },
    },
    expect: {
      includes: ["article.thesis_late"],
      topIncludes: ["article.thesis_late"],
    },
  },
  {
    id: "gc22_article_early_thesis_no_warning",
    input:
      "Die zentrale These dieses Artikels: Klare Entscheidungsregeln reduzieren Reibung und beschleunigen Umsetzung.\n\nIn vielen Teams fehlt genau diese Klarheit. Priorisierungen werden mehrfach aufgemacht und Verantwortlichkeiten nicht sauber geklaert.\n\nMit einem expliziten Modell fuer Kriterien, Rollen und Review-Zeitpunkte sinkt die Zahl der Schleifen deutlich.",
    options: {
      selectedPacks: ["article"],
      analyzeOptions: { kind: "article", localeHint: "de" },
    },
    expect: {
      excludes: ["article.thesis_late"],
    },
  },
  {
    id: "gc23_en_short_post_no_false_semantic_pressure",
    input:
      "Clear ownership beats constant alignment. Teams move faster when decision rules are explicit.",
    expect: {
      excludes: ["feed.thesis_too_late", "feed.cta_missing"],
    },
  },
  {
    id: "gc24_denglish_with_real_question_no_cta_missing",
    input:
      "We changed our handover flow and reduced friction across teams. Welche Routine hilft euch, Entscheidungen schneller zu machen?",
    options: { analyzeOptions: { kind: "feed", localeHint: "auto" } },
    expect: {
      excludes: ["feed.cta_missing"],
    },
  },
  {
    id: "gc25_storytelling_early_thesis_no_late_warning",
    input:
      "Die Kernthese vorweg: Klare Entscheidungsregeln reduzieren Reibung. Letzte Woche hatten wir trotzdem drei Schleifen im Projekt. Im Rueckblick lag es nicht an Motivation, sondern an unklaren Verantwortlichkeiten zwischen Produkt und Operations.",
    options: { analyzeOptions: { kind: "feed", localeHint: "de" } },
    expect: {
      excludes: ["feed.thesis_too_late"],
    },
  },
  {
    id: "gc26_cta_present_in_long_feed",
    input:
      "Viele Teams verlieren Zeit in Abstimmungen, weil Kriterien fuer Entscheidungen nicht transparent sind. Dadurch werden Prioritaeten mehrfach aufgemacht, obwohl alle Beteiligten eigentlich in dieselbe Richtung arbeiten. Ein sichtbares Entscheidungsmodell schafft hier Orientierung und macht Verantwortung klarer. Welche Entscheidung hat euer Team zuletzt schneller gemacht, weil Kriterien vorher klar waren?",
    options: { analyzeOptions: { kind: "feed", localeHint: "de" } },
    expect: {
      excludes: ["feed.cta_missing"],
    },
  },
  {
    id: "gc27_no_sensitive_keyword_no_risk_prefix",
    input:
      "Klare Rollen und transparente Priorisierung helfen Teams, Konflikte frueher zu loesen und Fokus zu behalten.",
    expect: {
      excludesPrefixes: ["risk.sensitive."],
    },
  },
  {
    id: "gc28_en_url_query_no_cta_false_positive",
    input:
      "We documented the process in detail and shared examples from two teams. Decision criteria were mapped, ownership gaps were listed, and handover delays were measured over several weeks. Details: https://example.com/playbook?lang=en&ref=post. The post intentionally ends without a direct audience question so the engine can detect a missing CTA without mistaking the URL query string for a real question.",
    options: { analyzeOptions: { kind: "feed", localeHint: "auto" } },
    expect: {
      includes: ["baseline.url_in_main_text"],
      includesOrPrefixes: ["feed.cta_missing"],
      excludes: ["feed.kind_uncertain"],
    },
  },
  {
    id: "gc29_headline_borderline_12_words_no_warning",
    input:
      "Klare Verantwortungen machen Uebergaben schneller und Entscheidungen stabiler im Tagesgeschaeft heute bei Wachstum",
    options: {
      selectedPacks: ["headline"],
      analyzeOptions: { kind: "headline", localeHint: "de" },
    },
    expect: {
      excludes: ["headline.too_short"],
    },
  },
  {
    id: "gc30_invite_borderline_around_60_words_no_warning",
    input:
      "Hallo Nina, danke fuer deinen Beitrag zu Fuehrung im Alltag. Ich vernetze mich gern fuer Austausch zu klaren Entscheidungswegen. In den letzten Monaten habe ich Teams bei Priorisierung, Rollen und Uebergaben begleitet und suche Impulse aus anderen Branchen. Wenn es fuer dich passt, freue ich mich auf die Verbindung und kurze Perspektiven dazu.",
    options: {
      selectedPacks: ["invite"],
      analyzeOptions: { kind: "invite", localeHint: "de" },
    },
    expect: {
      excludes: ["invite.too_long"],
    },
  },
];
