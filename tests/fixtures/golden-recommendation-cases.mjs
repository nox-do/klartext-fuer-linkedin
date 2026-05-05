export const GOLDEN_RECOMMENDATION_CASES = [
  {
    id: "gc01_empty_text",
    input: "",
    expect: {
      includes: ["baseline.empty_text"],
      excludes: ["feed.cta_missing", "feed.thesis_too_late", "feed.thesis_after_fold", "risk.overall_high"],
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
      "Wir haben den Ablauf in drei Schritten dokumentiert und alle Uebergaben sichtbar gemacht. Details stehen hier: https://example.com/guide?ref=linkedin&step=1. So wurde klar, wo Informationen haengen bleiben und warum Entscheidungen zu spaet fallen. Seitdem sparen wir woechentlich Zeit in Abstimmungen und vermeiden doppelte Arbeit im Team. Der Beitrag erklaert bewusst nur den Ablauf und enthaelt keine Abschlussfrage fuer Kommentare.",
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
      "DAS IST EIN KRITISCHER FEHLER IM ABLAUF. Mehr Details stehen hier: https://example.com/ops?topic=handover&lang=de. Wir sehen in mehreren Teams, dass Aufgaben ohne klare Priorisierung durch viele Schleifen laufen, Verantwortlichkeiten unklar bleiben, Rueckfragen zu spaet auftauchen, Abstimmungen doppelt stattfinden und dadurch Woche fuer Woche Zeit verloren geht, obwohl alle Beteiligten engagiert arbeiten. Schwarzarbeit wird dann als scheinbar schneller Ausweg diskutiert, was neue Risiken erzeugt und Vertrauen zerstoert. Der Text beschreibt nur die Lage und endet ohne Frage.",
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
    id: "gc11_feed_thesis_after_fold",
    input:
      "Ich teile heute drei Beobachtungen aus Projektuebergaben in den letzten Monaten. Erstens fehlen oft klare Rollen, zweitens werden Abhaengigkeiten zu spaet sichtbar und drittens werden Entscheidungen ohne gemeinsame Kriterien getroffen. Dadurch entstehen viele Rueckfragen und der Fokus auf Kundennutzen geht verloren. Viele Teams arbeiten engagiert, aber ohne klares Entscheidungsmodell. Nicht mehr Aktivitaet, sondern ein klares Entscheidungsmodell reduziert Unsicherheit.",
    options: { analyzeOptions: { kind: "feed", localeHint: "de" } },
    expect: {
      includes: ["feed.thesis_after_fold"],
      excludes: ["baseline.empty_text", "feed.kind_uncertain"],
    },
  },
  {
    id: "gc12_feed_late_thesis_and_missing_cta",
    input:
      "In mehreren Teams laufen Uebergaben noch ueber Zuruf und einzelne Chat-Nachrichten. Neue Anforderungen werden parallel in verschiedenen Dokumenten erfasst, Prioritaeten aendern sich kurzfristig und Entscheidungen werden spaeter erneut aufgemacht. Das erzeugt Unsicherheit und kostet Zeit in jeder Iteration. Zudem fehlen haeufig klare Kriterien, wann etwas wirklich entschieden ist und wer final verantwortlich zeichnet. Viele Meetings erzeugen Aktivitaet, aber keine nachhaltige Klarheit. Nicht mehr Abstimmung, sondern klare Verantwortung beschleunigt Umsetzung im Team.",
    options: { analyzeOptions: { kind: "feed", localeHint: "de" } },
    expect: {
      includes: ["feed.cta_missing", "feed.thesis_after_fold"],
      topIncludes: ["feed.cta_missing"],
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
      "In vielen Organisationen werden Entscheidungen noch in inoffiziellen Runden vorbereitet und spaeter formal bestaetigt. Das fuehrt zu Reibung, weil Teams nicht wissen, welche Kriterien am Ende wirklich zaehlen.\n\nWenn Priorisierung nicht transparent ist, entstehen Schleifen zwischen Produkt, Vertrieb und Operations. Jede Schleife wirkt klein, in Summe blockiert sie jedoch die Umsetzung und verlangsamt Lernen im Markt.\n\nDazu kommen Unsicherheiten bei Verantwortlichkeiten. Aufgaben werden angefasst, aber nicht abgeschlossen. Meetings erzeugen Aktivitaet, aber keinen Abschluss.\n\nNicht mehr Abstimmung, sondern ein explizites Entscheidungsmodell wird zum Hebel fuer Wachstum.",
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
      excludes: ["feed.thesis_too_late", "feed.thesis_after_fold", "feed.cta_missing"],
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
      excludes: ["feed.thesis_too_late", "feed.thesis_after_fold"],
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
      "We documented the process in detail and shared examples from two teams. Details: https://example.com/playbook?lang=en&ref=post. Decision criteria were mapped, ownership gaps were listed, and handover delays were measured over several weeks. The post intentionally ends without a direct audience question so the engine can detect a missing CTA without mistaking the URL query string for a real question.",
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
  {
    id: "gc31_anti_fp_caps_acronym_only",
    input:
      "B2B KPI ROI: Drei Beobachtungen aus dem letzten Quartal. Klare Kriterien beschleunigen Entscheidungen.",
    expect: {
      excludes: ["baseline.all_caps_opening"],
    },
  },
  {
    id: "gc32_anti_fp_intentional_rhythm_not_long_sentence",
    input:
      "Wir haben Kriterien geklaert; wir haben Rollen geklaert; wir haben Uebergaben geklaert. Das Team arbeitet ruhiger.",
    expect: {
      excludes: ["baseline.long_sentence"],
    },
  },
  {
    id: "gc33_anti_fp_link_required_context_late",
    input:
      "Die Kernaussage vorweg: klare Entscheidungsregeln reduzieren Reibung. Wir haben den Prozess in zwei Teams ueber mehrere Wochen beobachtet und die Ergebnisse intern verglichen. Die Auswertung zeigt weniger Schleifen und schnellere Entscheidungen in den Uebergaben. Datengrundlage und Methodik stehen hier: https://example.com/study.",
    options: { analyzeOptions: { kind: "feed", localeHint: "de" } },
    expect: {
      excludes: ["baseline.url_in_main_text"],
    },
  },
  {
    id: "gc34_anti_fp_no_cta_for_non_feed_context",
    input:
      "Verbindliche Rollen und klare Entscheidungsregeln sind Voraussetzung fuer belastbare Prozesse.\n\nDieser Text ist als kurzer Leitartikel-Hinweis gedacht und nicht als Diskussionsfrage formuliert.\n\nEr beschreibt einen Standard fuer interne Kommunikation und endet bewusst ohne Frage.",
    options: {
      selectedPacks: ["feed"],
      analyzeOptions: { kind: "article", localeHint: "de" },
    },
    expect: {
      excludes: ["feed.cta_missing"],
    },
  },
  {
    id: "gc35_anti_fp_narrative_hook_with_early_claim",
    input:
      "Der Kernpunkt zuerst: Klare Verantwortung beschleunigt Umsetzung. Letzte Woche haben wir trotzdem zwei Schleifen gebraucht, bis ein Team die Entscheidung final getroffen hat. Die Geschichte dient hier als Kontext, nicht als Ersatz fuer die Aussage.",
    options: { analyzeOptions: { kind: "feed", localeHint: "de" } },
    expect: {
      excludes: ["feed.thesis_too_late", "feed.thesis_after_fold"],
    },
  },
  {
    id: "gc36_anti_fp_sensitive_in_distanced_context",
    input:
      "Der Begriff \"Schwarzarbeit\" wird hier als Negativbeispiel in einer kritischen Einordnung verwendet, um Risiken transparent zu benennen.",
    expect: {
      excludesPrefixes: ["risk.sensitive."],
    },
  },
  {
    id: "gc37_article_core_claim_needs_summary",
    input:
      "In den letzten Quartalen haben wir in mehreren Banken beobachtet, dass Digitalisierungsprogramme oft gleichzeitig auf Kostenreduktion, regulatorische Sicherheit, bessere Nutzererfahrung, neue Partnerprozesse und schnellere Markteinfuehrung zielen.\n\nDiese Kombination fuehrt in der Praxis dazu, dass Verantwortung zwischen Produkt, IT, Compliance und Vertrieb verteilt bleibt und Entscheidungen trotz vieler Meetings nicht klar priorisiert werden.\n\nDadurch entstehen nebeneinander mehrere Initiativen mit jeweils plausiblen Teilzielen, aber ohne gemeinsame Verdichtung auf den zentralen Hebel.\n\nEs gibt in all diesen Projekten sinnvolle Einzelmassnahmen, nur die durchgehende Kernbotschaft bleibt oft implizit und wird erst in spaeteren Abstimmungen sichtbar gemacht.\n\nWenn Teams dann unter Zeitdruck liefern muessen, steigt die Zahl der Rueckfragen und der operative Fokus geht in der Koordination verloren.",
    options: {
      selectedPacks: ["article"],
      analyzeOptions: { kind: "article", localeHint: "de" },
    },
    expect: {
      includes: ["article.core_claim_needs_summary"],
    },
  },
  {
    id: "gc38_article_core_claim_summary_anti_fp",
    input:
      "Mein Kernpunkt zuerst: Klare Entscheidungsregeln reduzieren Reibung in komplexen Organisationen.\n\nIn mehreren Programmen sehen wir dieselben Muster aus unklaren Verantwortlichkeiten und zu spaeter Priorisierung.\n\nWenn diese Regeln frueh benannt werden, sinken Rueckfragen und Teams koennen schneller liefern.\n\nFazit: Erst klare Entscheidungslogik, dann Tooling.",
    options: {
      selectedPacks: ["article"],
      analyzeOptions: { kind: "article", localeHint: "de" },
    },
    expect: {
      excludes: ["article.core_claim_needs_summary"],
    },
  },
  {
    id: "gc39_article_too_many_threads",
    input:
      "In grossen Transformationsprogrammen werden parallel Governance, Kostenmodelle und Partnersteuerung diskutiert. Gleichzeitig laufen operative Releases weiter. Regulatorische Vorgaben werden in bestehende Prozesse eingebaut.\n\nDanach verschieben sich Prioritaeten erneut. Strategie und Betrieb entscheiden zeitversetzt. Teilprojekte entwickeln eigene Narrative. Jede Sicht ist fuer sich plausibel.\n\nAm Ende entsteht viel Aktivitaet. Die Linien bleiben jedoch nebeneinander stehen. Fuer Leser ist schwer erkennbar, welche Richtung wirklich fuehrt.",
    options: {
      selectedPacks: ["article"],
      analyzeOptions: { kind: "article", localeHint: "de" },
    },
    expect: {
      includes: ["article.too_many_threads"],
    },
  },
  {
    id: "gc40_article_too_many_threads_anti_fp",
    input:
      "Leitgedanke: Ohne klares Entscheidungsmodell verliert selbst gute Technologie an Wirkung.\n\nAbschnitt 1 ordnet den Markt ein und zeigt, warum bestehende Systeme fuer viele Nutzer ausreichend funktionieren.\n\nAbschnitt 2 beschreibt den eigentlichen Hebel: Differenzierung ueber Identitaet und Verifikation statt reiner Payment-Kopie.\n\nAbschnitt 3 leitet daraus den operativen Schluss ab: erst Nutzenversprechen schaerfen, dann Rollout skalieren.\n\nFazit: Ein klarer roter Faden reduziert Reibung zwischen Strategie und Umsetzung.",
    options: {
      selectedPacks: ["article"],
      analyzeOptions: { kind: "article", localeHint: "de" },
    },
    expect: {
      excludes: ["article.too_many_threads"],
    },
  },
  {
    id: "gc41_article_closing_takeaway_missing",
    input:
      "Die Einfuehrung neuer Zahlungssysteme scheitert selten an Technik, sondern an unklarer Positionierung.\n\nWenn Marktbedarf und Differenzierung nicht frueh greifbar sind, verteilen sich Entscheidungen auf viele Gremien und verlieren Geschwindigkeit.\n\nIn der Umsetzung fuehrt das zu parallelen Initiativen, die jeweils sinnvoll wirken, aber den Gesamtfokus verwaessern.",
    options: {
      selectedPacks: ["article"],
      analyzeOptions: { kind: "article", localeHint: "de" },
    },
    expect: {
      includes: ["article.closing_takeaway_missing"],
    },
  },
  {
    id: "gc42_article_closing_takeaway_anti_fp",
    input:
      "Die Einfuehrung neuer Zahlungssysteme scheitert selten an Technik, sondern an unklarer Positionierung.\n\nWenn Marktbedarf und Differenzierung nicht frueh greifbar sind, verteilen sich Entscheidungen auf viele Gremien und verlieren Geschwindigkeit.\n\nMein Fazit: Erst klaren Nutzen belegen, dann skalieren.",
    options: {
      selectedPacks: ["article"],
      analyzeOptions: { kind: "article", localeHint: "de" },
    },
    expect: {
      excludes: ["article.closing_takeaway_missing"],
    },
  },
  {
    id: "gc43_article_meta_intro_needs_claim_summary",
    input:
      "Warum Entscheidungsmodelle in Transformationsprojekten oft zu spät greifen\n\nKurz vorweg: Dieser Text ist etwas länger geworden und fasst mehrere Beobachtungen aus unterschiedlichen Programmen zusammen, weil die Muster in Banken, Versicherungen und Plattformorganisationen überraschend ähnlich sind.\n\nIn vielen Programmen werden Prioritäten mehrfach geöffnet, weil die Entscheidungslogik nicht explizit genug ist und einzelne Bereiche mit jeweils plausiblen Kriterien arbeiten, die lokal funktionieren, aber übergreifend nicht sauber aufeinander einzahlen.\n\nDadurch entstehen wiederholte Abstimmungen zwischen Produkt, IT, Compliance und Vertrieb, in denen Entscheidungen formal bestätigt werden, obwohl wesentliche Zielkonflikte bereits bekannt sind und erst spät transparent gemacht werden.\n\nWenn Kriterien und Rollen früh geklärt werden, sinken Rückfragen deutlich und Teams liefern stabiler, aber genau diese Verdichtung auf den zentralen Hebel bleibt im Alltag oft implizit und wird erst am Ende einzelner Projektphasen klar benannt.",
    options: {
      selectedPacks: ["article"],
      analyzeOptions: { kind: "article", localeHint: "de" },
    },
    expect: {
      includes: ["article.core_claim_needs_summary"],
      excludes: ["article.too_many_threads"],
    },
  },
  {
    id: "gc44_article_rhetorical_opening_no_thread_warning",
    input:
      "Warum manche Strategien auf dem Papier klar wirken und in der Umsetzung stocken\n\nKennst du das auch? Warum dauern Entscheidungen trotz vieler Meetings so lange?\n\nDer Kernpunkt: Nicht mehr Abstimmung, sondern klare Entscheidungskriterien reduzieren Reibung und schaffen Verbindlichkeit.\n\nMit dieser Klärung werden Übergaben einfacher und Prioritäten bleiben stabil.",
    options: {
      selectedPacks: ["article"],
      analyzeOptions: { kind: "article", localeHint: "de" },
    },
    expect: {
      excludes: ["article.too_many_threads", "article.core_claim_needs_summary"],
    },
  },
  {
    id: "gc45_article_compact_but_clear_no_article_pressure",
    input:
      "Leitthese: Klare Entscheidungsregeln reduzieren Reibung.\n\nOhne diese Regeln entstehen Schleifen in Priorisierung und Übergaben.\n\nFazit: Erst Entscheidungslogik klären, dann skalieren.",
    options: {
      selectedPacks: ["article"],
      analyzeOptions: { kind: "article", localeHint: "de" },
    },
    expect: {
      excludes: [
        "article.thesis_late",
        "article.too_many_threads",
        "article.core_claim_needs_summary",
        "article.closing_takeaway_missing",
      ],
    },
  },
  {
    id: "gc46_article_multi_thread_with_late_thesis",
    input:
      "In großen Transformationsprogrammen werden parallel Governance, Kostenmodelle und Partnersteuerung diskutiert. Gleichzeitig laufen operative Releases weiter. Regulatorische Vorgaben werden in bestehende Prozesse eingebaut.\n\nDanach verschieben sich Prioritäten erneut. Strategie und Betrieb entscheiden zeitversetzt. Teilprojekte entwickeln eigene Narrative. Jede Sicht ist für sich plausibel.\n\nAm Ende entsteht viel Aktivität. Die Linien bleiben jedoch nebeneinander stehen. Für Leser ist schwer erkennbar, welche Richtung wirklich führt.\n\nDie Leitthese wird erst hier klar: Nicht mehr Aktivität, sondern ein explizites Entscheidungsmodell reduziert Reibung zwischen Strategie und Umsetzung.",
    options: {
      selectedPacks: ["article"],
      analyzeOptions: { kind: "article", localeHint: "de" },
    },
    expect: {
      includes: ["article.thesis_late"],
      excludes: ["article.too_many_threads"],
    },
  },
  {
    id: "gc47_article_has_clear_takeaway_anti_fp",
    input:
      "Warum Positionierung bei neuen Zahlungssystemen wichtiger ist als reine Technik\n\nWenn Differenzierung nicht früh benannt wird, verteilen sich Entscheidungen auf zu viele Gremien und verlieren Tempo.\n\nTeams wirken aktiv, aber ohne gemeinsamen Fokus.\n\nTakeaway: Erst den klaren Kundennutzen formulieren, dann den Rollout skalieren.",
    options: {
      selectedPacks: ["article"],
      analyzeOptions: { kind: "article", localeHint: "de" },
    },
    expect: {
      excludes: ["article.closing_takeaway_missing"],
    },
  },
  {
    id: "gc48_baseline_wall_of_text_triggers",
    input:
      "Viele Teams arbeiten engagiert und trotzdem bleibt die Wirkung in wichtigen Übergaben aus. Entscheidungen werden mehrfach geöffnet, weil Kriterien nur implizit vorliegen. Dadurch wächst der Abstimmungsaufwand von Woche zu Woche, obwohl alle Beteiligten das gleiche Ziel verfolgen. Gleichzeitig werden Verantwortlichkeiten situationsabhängig neu verhandelt und nicht verbindlich dokumentiert. Am Ende steigt die Aktivität, aber die Umsetzung verliert Fokus und Tempo.\n\nWenn Entscheidungslogik früh geklärt wird, sinken Schleifen deutlich und Teams liefern stabiler.",
    options: { selectedPacks: ["baseline"], analyzeOptions: { localeHint: "de" } },
    expect: {
      includes: ["baseline.wall_of_text"],
      topIncludes: ["baseline.wall_of_text"],
    },
  },
  {
    id: "gc49_baseline_wall_of_text_anti_fp_short_post",
    input:
      "Viele Teams kämpfen mit Priorisierung. Rollen bleiben oft unklar. Das erzeugt Schleifen in Übergaben.",
    options: { selectedPacks: ["baseline"], analyzeOptions: { localeHint: "de" } },
    expect: {
      excludes: ["baseline.wall_of_text"],
    },
  },
  {
    id: "gc50_baseline_wall_of_text_anti_fp_structured_long_post",
    input:
      "Klare These: Entscheidungslogik reduziert Reibung.\n\nAbschnitt eins beschreibt das Problem in Teams knapp und konkret.\n\nAbschnitt zwei zeigt, wie Kriterien Verantwortung und Tempo verbessern.\n\nAbschnitt drei fasst den Hebel zusammen und gibt einen nächsten Schritt.\n\nSo bleibt der Text lang genug für Tiefe, aber visuell gut lesbar.",
    options: { selectedPacks: ["baseline"], analyzeOptions: { localeHint: "de" } },
    expect: {
      excludes: ["baseline.wall_of_text"],
    },
  },
  {
    id: "gc51_feed_thesis_after_fold",
    input:
      "Ich habe lange über LinkedIn-Texte nachgedacht und in vielen Entwürfen gesehen, wie schnell die Aufmerksamkeit im Feed abfällt. Viele Posts wirken ordentlich, aber bleiben wirkungslos, weil sie zuerst Kontext schichten, Beispiele aneinanderreihen und den eigentlichen Hebel erst ganz am Ende benennen. Sie erklären viel, sortieren sauber, liefern Beobachtungen aus Projekten und wollen verständlich sein, verlieren dabei aber den früh sichtbaren Kern. Nicht die Menge an Kontext überzeugt im Feed, sondern eine früh sichtbare Kernthese.",
    options: { analyzeOptions: { kind: "feed", localeHint: "de" } },
    expect: {
      includes: ["feed.thesis_after_fold"],
      topIncludes: ["feed.thesis_after_fold"],
    },
  },
  {
    id: "gc52_feed_thesis_before_fold_anti_fp",
    input:
      "Der stärkste Satz steht oft zu spät. Ich habe lange über LinkedIn-Texte nachgedacht. Viele Posts erklären viel, aber verlieren im Feed früh Aufmerksamkeit.",
    options: { analyzeOptions: { kind: "feed", localeHint: "de" } },
    expect: {
      excludes: ["feed.thesis_after_fold"],
    },
  },
  {
    id: "gc53_feed_implicit_cta_no_missing",
    input:
      "Viele Teams verlieren Wirkung im Feed, obwohl der Inhalt substanziell ist und konkrete Erfahrungen enthält. Oft fehlt kein Wissen, sondern ein klarer nächster Schritt für Leserinnen und Leser. Wir sehen das regelmäßig in Texten, die sauber argumentieren, aber offen enden. Schreib mir eine DM, wenn du dafür eine kompakte Checkliste willst.",
    options: { analyzeOptions: { kind: "feed", localeHint: "de" } },
    expect: {
      excludes: ["feed.cta_missing"],
    },
  },
  {
    id: "gc54_feed_newsletter_mention_is_not_cta",
    input:
      "Viele Teams strukturieren ihre Beiträge sauber und liefern nachvollziehbare Beispiele aus dem Alltag. Trotzdem fehlt am Ende oft eine konkrete Anschlussbewegung für die Leserschaft. In Reviews sehen wir dann lange Texte, die informativ wirken, aber ohne klaren nächsten Schritt auslaufen und dadurch wenig Reaktion erzeugen. Der Newsletter war in unserem internen Workshop nur ein Beispiel für Kanalvergleich, nicht die eigentliche Handlungsempfehlung. Zusätzlich wurde gezeigt, wie Formulierungen ohne Frage oder klare Aktion die Interaktion sichtbar senken. Der Text endet bewusst ohne Frage oder konkrete Aufforderung.",
    options: { analyzeOptions: { kind: "feed", localeHint: "de" } },
    expect: {
      includes: ["feed.cta_missing"],
    },
  },
  {
    id: "gc55_baseline_buzzword_dense_triggers",
    input:
      "Unsere AI-First Transformation schafft skalierbare Synergien und ein holistisches End-to-End Operating Model für nachhaltige Value Creation im gesamten Unternehmen. Durch datengetriebene Innovation optimieren wir den Full-Stack-Prozess, heben Effizienzpotenziale und erzeugen maximalen Impact für alle Stakeholder im Markt. Dieses Paradigm ist als Blueprint für Disruption gedacht, damit Teams mit mehr Leverage schneller skalieren und gleichzeitig ein neues Mindset in der Organisation verankern. Zusätzlich entsteht Empowerment durch ein holistisch gedachtes Framework, das Synergie, Impact und Deep Dive als wiederkehrende Leitbegriffe für die Transformation setzt.",
    options: { selectedPacks: ["baseline"], analyzeOptions: { localeHint: "de" } },
    expect: {
      includes: ["baseline.buzzword_dense"],
      topIncludes: ["baseline.buzzword_dense"],
    },
  },
  {
    id: "gc56_baseline_buzzword_dense_anti_fp_critical_framing",
    input:
      "AI-first ist oft nur ein Etikett. Entscheidend ist, ob der Prozess danach weniger Medienbrüche hat und Entscheidungen schneller werden.",
    options: { selectedPacks: ["baseline"], analyzeOptions: { localeHint: "de" } },
    expect: {
      excludes: ["baseline.buzzword_dense"],
    },
  },
  {
    id: "gc57_feed_reflection_cta_no_missing",
    input:
      "Viele Posts verlieren Wirkung, weil die zentrale Aussage zu spät sichtbar wird. Der Text kann fachlich richtig sein und trotzdem im Feed untergehen. Prüf beim nächsten Post, ob deine These vor dem Fold sichtbar ist.",
    options: { analyzeOptions: { kind: "feed", localeHint: "de" } },
    expect: {
      excludes: ["feed.cta_missing"],
    },
  },
];
