/** Pedagogical blurbs for statistical analysis section ! buttons. */

export function buildStatsSectionInfo(sectionId, lang = 'ar') {
  const ar = {
    sections: { explain: 'شرح', cases: 'ملاحظات منهجية', verdict: 'متى تستخدمه هنا' },
    descriptive: {
      explanation: 'الإحصاء الوصفي يلخّص سلسلة رقمية: متوسط، وسيط، تشتت (انحراف معياري)، ومدى.',
      cases:
        '• مع سنوات قليلة (n صغير) الوصفي أوثق من الاستدلال.\n• معامل الاختلاف يقارن التشتت النسبي بين مؤشرات بوحدات مختلفة.',
      verdict: 'استخدمه لقراءة استقرار المؤشر المالي عبر السنوات قبل أي اختبار.',
    },
    correlation: {
      explanation: 'ارتباط Pearson يقيس العلاقة الخطية بين سلسلتين (−1 إلى +1) مع قيمة p تقريبية.',
      cases:
        '• |r| مرتفع لا يعني سببية.\n• n < 8: p-value هشة؛ ركّز على اتجاه r لا على الدلالة.',
      verdict: 'مفيد لاكتشاف تزامن حركة FRNG/BFR/السيولة عبر السنوات.',
    },
    regression: {
      explanation: 'الانحدار الخطي البسيط OLS: Y ≈ a + bX مع R²، ميل، وDurbin–Watson للبواقي.',
      cases:
        '• يحتاج n ≥ 3 على الأقل؛ الأفضل أكثر.\n• DW بعيد عن 2 قد يشير لارتباط ذاتي في البواقي عبر الزمن.',
      verdict: 'استخدمه لاختبار علاقة مفترضة (مثلاً TN بدلالة FRNG) مع قراءة البواقي.',
    },
    multiReg: {
      explanation: 'الانحدار المتعدد يقدّر عدة مستقلات معاً عبر المعادلات الطبيعية.',
      cases: '• احذر الإفراط في المتغيرات مع n صغير.\n• R² المعدّل أفضل للمقارنة بين نماذج.',
      verdict: 'مناسب لقوالب مثل تفسير الخزينة بـ FRNG وBFR.',
    },
    compare: {
      explanation: 'مقارنة شركات على نفس المؤشر: وصف لكل سلسلة + ANOVA / Mann–Whitney عند مجموعتين+.',
      cases: '• ANOVA تفترض تقريباً تجانساً؛ العينات الصغيرة تُضعف الاستنتاج.\n• Mann–Whitney بديل رتبي لعينتين.',
      verdict: 'قارن الشركات قيد الدراسة على مؤشر واحد عبر الزمن.',
    },
  }
  const fr = {
    sections: { explain: 'Explication', cases: 'Notes méthodologiques', verdict: 'Usage ici' },
    descriptive: {
      explanation: 'Le descriptif résume une série : moyenne, médiane, dispersion (écart-type), étendue.',
      cases:
        '• Avec peu d’exercices, le descriptif est plus fiable que l’inférence.\n• Le CV compare la dispersion relative.',
      verdict: 'Lisez d’abord la stabilité de l’indicateur avant tout test.',
    },
    correlation: {
      explanation: 'Pearson mesure une liaison linéaire (−1 à +1) avec p approx.',
      cases: '• Corrélation ≠ causalité.\n• n < 8 : p fragile.',
      verdict: 'Utile pour voir si FRNG/BFR/liquidité co-évoluent.',
    },
    regression: {
      explanation: 'OLS simple : Y ≈ a + bX, R², pente, Durbin–Watson.',
      cases: '• n ≥ 3 minimum.\n• DW loin de 2 : possible autocorrélation.',
      verdict: 'Testez une relation (ex. TN vs FRNG) et lisez les résidus.',
    },
    multiReg: {
      explanation: 'Régression multiple via équations normales.',
      cases: '• Évitez trop de X si n est petit.\n• Préférez R² ajusté.',
      verdict: 'Adapté aux modèles prêts (ex. TN ~ FRNG + BFR).',
    },
    compare: {
      explanation: 'Comparaison multi-entreprises : descriptif + ANOVA / Mann–Whitney.',
      cases: '• Petits n : conclusions prudentes.',
      verdict: 'Comparez un même indicateur entre entreprises.',
    },
  }
  const pack = lang === 'fr' ? fr : ar
  const def = pack[sectionId]
  if (!def) {
    return { sections: pack.sections, explanation: '', cases: '', verdict: '' }
  }
  return { sections: pack.sections, ...def }
}
