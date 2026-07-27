import { formatMoney } from './financialTemplates'

/**
 * Structure-analysis readings — thresholds cross-checked from:
 * - Investopedia / CFI: current ratio >1 cover; ~1–2 often healthy; >3 may signal idle WC
 * - Algerian university pedagogy (Annaba, Béchar, OEB): FRNG≥0 golden rule; TN=FRNG−BFR; LG>1
 * - Billy / Sefap: financial autonomy (equity/total) <20% fragile, 20–40% OK, >40% strong
 * - SCF functional analysis guides: permanent resources must finance non-current assets
 * - Market caveat: bank Basel leverage ≠ SME autonomy; do not mix without labeling
 *
 * Future modules: follow `.cursor/rules/financial-indicator-research.mdc`.
 */

function fill(template, vars) {
  return String(template || '').replace(/\{(\w+)\}/g, (_, key) =>
    vars[key] == null ? '' : String(vars[key]),
  )
}

const COPY = {
  ar: {
    sections: {
      explain: 'شرح المؤشر',
      cases: 'القراءة الأكاديمية حسب الحالات',
      verdict: 'قراءة النتيجة الحالية',
    },
    totalActif: {
      explain: 'مجموع الأصول = أصول غير جارية + أصول جارية. يعبّر عن حجم الموارد الاقتصادية التي تتحكّم فيها المؤسسة.',
      cases:
        '• حجم كبير نسبياً: قدرة استثمارية وتشغيلية أوسع، مع مسؤولية أكبر في تمويلها.\n• حجم صغير: مرونة أعلى لكن قدرة محدودة على امتصاص الصدمات.\n• يجب دائماً مقارنته بمجموع الخصوم للتحقق من توازن الميزانية.',
      verdict: ({ value, gap, balanced, lang }) =>
        balanced
          ? `مجموع الأصول يبلغ ${formatMoney(value, lang)}، والميزانية متوازنة مع الخصوم.`
          : `مجموع الأصول يبلغ ${formatMoney(value, lang)}. يوجد فرق مع الخصوم قدره ${formatMoney(gap, lang)}؛ راجع إدخال الميزانية.`,
    },
    totalPassif: {
      explain: 'مجموع الخصوم = رؤوس الأموال الخاصة + خصوم غير جارية + خصوم جارية. يُظهر مصادر تمويل الأصول.',
      cases:
        '• هيمنة رؤوس الأموال: استقلالية أعلى.\n• هيمنة الديون: تبعية للممولين الخارجيين ومخاطر ملاءة أكبر.\n• يجب أن يساوي مجموع الأصول في ميزانية متوازنة.',
      verdict: ({ value, gap, balanced, lang }) =>
        balanced
          ? `مجموع الخصوم يبلغ ${formatMoney(value, lang)} ويطابق الأصول.`
          : `مجموع الخصوم يبلغ ${formatMoney(value, lang)}. الفرق مع الأصول ${formatMoney(gap, lang)}.`,
    },
    treasuryNet: {
      explain: 'الخزينة الصافية ≈ FRNG − BFR. تلخّص هل الموارد الدائمة تغطي احتياج الاستغلال وتترك فائضاً نقدياً.',
      cases:
        '• TN > 0: فائض سيولة؛ هيكل تمويلي مريح وقدرة على امتصاص الطوارئ.\n• TN ≈ 0: توازن هش بلا هامش أمان.\n• TN < 0: فجوة سيولة واعتماد محتمل على التمويل قصير الأجل/السحب على المكشوف ([Finceo](https://www.finceo.com/comptabilite-gestion/tresorerie-nette-calcul)، [Compta-Facile](https://www.compta-facile.com/ratios-financiers-calculs-et-explications/)).',
      verdict: ({ value, lang }) => {
        if (Math.abs(value) < 0.005) return `الخزينة الصافية ≈ ${formatMoney(0, lang)}: توازن هش بين FRNG وBFR دون هامش سيولة.`
        if (value > 0)
          return `الخزينة الصافية موجبة (${formatMoney(value, lang)}): المؤسسة تحتفظ بفائض سيولة بعد تمويل احتياج الاستغلال.`
        return `الخزينة الصافية سالبة (${formatMoney(value, lang)}): احتياج الاستغلال يتجاوز هامش الموارد الدائمة؛ وضع يتطلب تمويل قصير الأجل أو خفض BFR.`
      },
    },
    actifStructure: {
      explain: 'هيكل الأصول يوزّع الوزن بين الأصول الجارية وغير الجارية لمعرفة طبيعة النشاط (تشغيلي/رأسمالي).',
      cases:
        '• وزن جاري مرتفع (>60%): نشاط يعتمد على المخزون/الزبائن/الخزينة؛ مرونة أعلى وحساسية لدورة الاستغلال.\n• وزن غير جاري مرتفع: نشاط كثيف رأس المال (تثبيتات)؛ يحتاج تمويلاً دائماً قوياً.\n• لا يوجد «نسبة مثالية» مطلقة؛ تُقرأ مع القطاع وFRNG.',
      verdict: ({ shareCourant, shareNonCourant }) => {
        if (shareCourant >= 60)
          return `الأصول الجارية تهيمن (${shareCourant.toFixed(1)}% مقابل ${shareNonCourant.toFixed(1)}% غير جارية): الهيكل تشغيلي/سريع الدوران، فالأداء مرتبط بإدارة المخزون والزبائن.`
        if (shareNonCourant >= 60)
          return `الأصول غير الجارية تهيمن (${shareNonCourant.toFixed(1)}%): هيكل رأسمالي يحتاج موارد دائمة كافية (وإلا يضعف FRNG).`
        return `توزيع متوازن نسبياً: جارية ${shareCourant.toFixed(1)}% وغير جارية ${shareNonCourant.toFixed(1)}%.`
      },
    },
    passifStructure: {
      explain:
        'هيكل الخصوم يقارن التمويل الذاتي بالديون. نسبة الاستقلالية ≈ رؤوس الأموال ÷ مجموع الخصوم (شائعة في التحليل وتمويل المؤسسات غير المالية).',
      cases:
        '• استقلالية > 40%: تمويل ذاتي قوي (مراجع مهنية مثل Billy).\n• 20%–40%: مقبول مع مراقبة المديونية.\n• < 20%: تبعية مرتفعة للدائنين.\n• عتبات بازل للبنوك لا تُطبَّق حرفياً على مؤسسة غير مالية دون تحفظ.',
      verdict: ({ shareEquity, shareDebt }) => {
        if (shareEquity >= 40)
          return `الاستقلالية ${shareEquity.toFixed(1)}% (ديون ${shareDebt.toFixed(1)}%): تمويل ذاتي قوي وفق النطاق المهني الشائع (>40%).`
        if (shareEquity >= 20)
          return `الاستقلالية ${shareEquity.toFixed(1)}% (ديون ${shareDebt.toFixed(1)}%): نطاق متوسط (20–40%)؛ راقب تكلفة الدين وآجاله.`
        return `الاستقلالية ${shareEquity.toFixed(1)}% (ديون ${shareDebt.toFixed(1)}%): ضعيفة (<20%)؛ تبعية تمويل خارجي مرتفعة.`
      },
    },
    liquidity: {
      explain:
        'السيولة العامة (نسبة التداول) = الأصول الجارية ÷ الخصوم الجارية. معيار شائع في التحليل المالي والأسواق لقياس القدرة على سداد الالتزامات قصيرة الأجل.',
      cases:
        '• < 1: الأصول الجارية لا تغطي الخصوم الجارية → توتر سيولة (إلا في نماذج رأس مال عامل سالب كالتجارة السريعة).\n• 1 إلى 1.5: تغطية مقبولة بهامش محدود.\n• 1.5 إلى 3: نطاق غالباً مريح لدى كثير من القطاعات الصناعية/الخدمية.\n• > 3: أمان قصير الأجل قوي، وقد يشير إلى أصول جارية راكدة أو نقد غير موظَّف (Investopedia / CFI).\n• في المقررات الجزائرية: كلما زادت عن 1 دلّ ذلك على قدرة أفضل على السداد وغالباً FRNG موجب.',
      verdict: ({ liquidity }) => {
        if (liquidity == null) return 'لا يمكن حساب السيولة: الخصوم الجارية منعدمة أو غير كافية.'
        if (liquidity < 1)
          return `السيولة العامة = ${liquidity.toFixed(2)} (< 1): عجز تغطية قصيرة الأجل؛ الأولوية لتحسين دورة الاستغلال أو دعم الموارد الجارية.`
        if (liquidity < 1.5)
          return `السيولة العامة = ${liquidity.toFixed(2)} (1–1.5): تغطية مقبولة بهامش أمان محدود.`
        if (liquidity <= 3)
          return `السيولة العامة = ${liquidity.toFixed(2)} (1.5–3): وضع سيولة مريح وفق النطاق الشائع للتحليل العملي.`
        return `السيولة العامة = ${liquidity.toFixed(2)} (> 3): تغطية مفرطة قصير الأجل؛ راجع إن كان المخزون/الزبائن/النقد أعلى من حاجة النشاط.`
      },
    },
    frng: {
      explain:
        'FRNG (رأس المال العامل الصافي الإجمالي) = الموارد الدائمة − الأصول غير الجارية. قاعدة التوازن الذهبي في التحليل الوظيفي (SCF/مقررات جزائرية): تمويل الاستخدامات الثابتة بموارد دائمة.',
      cases:
        '• FRNG > 0: الموارد الموارد الدائمة تغطي التثبيتات ويتبقى فائض لتمويل جزء من BFR أو دعم الخزينة (جامعة بشار وغيرها).\n• FRNG ≈ 0: توازن هش؛ لا هامش لتمويل الاستغلال.\n• FRNG < 0: جزء من الأصول غير الجارية يُموَّل بموارد قصيرة الأجل → هشاشة هيكلية.\n• يُقرأ دائماً مع BFR لأن TN = FRNG − BFR.',
      verdict: ({ value, lang }) => {
        if (Math.abs(value) < 0.005) return `FRNG ≈ ${formatMoney(0, lang)}: لا هامش دائم فوق التثبيتات (توازن هش).`
        if (value > 0)
          return `FRNG موجب (${formatMoney(value, lang)}): الموارد الدائمة تغطي التثبيتات وفق قاعدة التمويل الذهبي، مع فائض يمكنه دعم BFR.`
        return `FRNG سالب (${formatMoney(value, lang)}): خرق قاعدة التمويل الذهبي؛ تثبيتات ممولة جزئياً بموارد قصيرة الأجل.`
      },
    },
    bfr: {
      explain: 'BFR (تبسيط ميزانياتي) ≈ أصول جارية − خصوم جارية. يقرّب الاحتياج التمويلي لدورة الاستغلال.',
      cases:
        '• BFR > 0: النشاط يجمّد سيولة (مخزون/زبائن أكبر من تمويل الموردين) → يحتاج تمويلاً.\n• BFR < 0: الدورة تولّد موارد (تمويل مورّدين أقوى من الاستخدامات الجارية).\n• يُقرأ دائماً مع FRNG لأن TN = FRNG − BFR.',
      verdict: ({ value, lang }) => {
        if (Math.abs(value) < 0.005) return `BFR ≈ ${formatMoney(0, lang)}: دورة الاستغلال شبه متعادلة تمويلياً.`
        if (value > 0)
          return `BFR موجب (${formatMoney(value, lang)}): الاستغلال يخلق احتياجاً يجب تمويله (من FRNG أو خزينة قصيرة).`
        return `BFR سالب (${formatMoney(value, lang)}): الدورة توفّر موارد وتخفّف الضغط على الخزينة.`
      },
    },
    overview: {
      explain:
        'تحليل الهيكل المالي يجمع قراءة توزيع الأصول/الخصوم مع مثلث التوازن: FRNG، BFR، والخزينة الصافية، إضافة إلى السيولة العامة.',
      cases:
        'الوضع السليم عادةً: موارد دائمة ≥ تثبيتات (FRNG≥0)، BFR مموَّل بـ FRNG، TN≥0، وسيولة عامة ≥1، مع استقلالية مالية كافية.\nوضع هش: FRNG<0 أو TN<0 أو سيولة <1.\nوضع مفرط السيولة: سيولة مرتفعة جداً مع أصول جارية كبيرة قد تخفي ضعفاً في المردودية التشغيلية.',
      verdict: (m, lang) => {
        const parts = []
        parts.push(
          `هيكل الأصول: جارية ${m.shareCourant.toFixed(1)}% / غير جارية ${m.shareNonCourant.toFixed(1)}%.`,
        )
        parts.push(`التمويل الذاتي ${m.shareEquity.toFixed(1)}% مقابل ديون ${m.shareDebt.toFixed(1)}%.`)
        if (m.liquidity == null) parts.push('السيولة غير قابلة للحساب.')
        else if (m.liquidity < 1) parts.push(`سيولة ضعيفة (${m.liquidity.toFixed(2)}).`)
        else if (m.liquidity < 1.5) parts.push(`سيولة مقبولة (${m.liquidity.toFixed(2)}).`)
        else if (m.liquidity <= 3) parts.push(`سيولة مريحة (${m.liquidity.toFixed(2)}).`)
        else parts.push(`سيولة مرتفعة جداً (${m.liquidity.toFixed(2)}) قد تخفي أصولاً جارية راكدة.`)
        parts.push(m.frng >= 0 ? `FRNG موجب (${formatMoney(m.frng, lang)}).` : `FRNG سالب (${formatMoney(m.frng, lang)}).`)
        parts.push(m.bfr > 0 ? `BFR موجب (${formatMoney(m.bfr, lang)}).` : `BFR غير موجب (${formatMoney(m.bfr, lang)}).`)
        if (Math.abs(m.tresorerie) < 0.005) parts.push('الخزينة الصافية≈0 (توازن هش).')
        else if (m.tresorerie > 0) parts.push(`خزينة صافية موجبة (${formatMoney(m.tresorerie, lang)}).`)
        else parts.push(`خزينة صافية سالبة (${formatMoney(m.tresorerie, lang)}).`)

        let synth = 'الخلاصة: '
        if (m.frng >= 0 && m.tresorerie >= 0 && (m.liquidity == null || m.liquidity >= 1) && m.shareEquity >= 20) {
          synth += 'الهيكل متوازن نسبياً مع هامش أمان تمويلي.'
        } else if (m.frng < 0 || m.tresorerie < 0 || (m.liquidity != null && m.liquidity < 1)) {
          synth += 'الهيكل يُظهر نقاط توتر (تمويل دائم أو سيولة أو خزينة)؛ راجع FRNG/BFR/السيولة أولاً.'
        } else {
          synth += 'الهيكل مقبول مع نقاط تستحق المتابعة.'
        }
        return `${parts.join(' ')} ${synth}`
      },
    },
  },
  fr: {
    sections: {
      explain: 'Explication de l’indicateur',
      cases: 'Lecture académique selon les cas',
      verdict: 'Lecture du résultat actuel',
    },
    totalActif: {
      explain: 'Total actif = Actif non courant + Actif courant. Mesure la taille du patrimoine économique contrôlé.',
      cases:
        '• Total élevé : capacité d’investissement/exploitation plus large, mais financement à assurer.\n• Total faible : plus de flexibilité, moindre capacité d’absorption des chocs.\n• Toujours à rapprocher du total passif (équilibre du bilan).',
      verdict: ({ value, gap, balanced, lang }) =>
        balanced
          ? `Total actif = ${formatMoney(value, lang)}, bilan équilibré avec le passif.`
          : `Total actif = ${formatMoney(value, lang)}. Écart avec le passif : ${formatMoney(gap, lang)} ; vérifier la saisie.`,
    },
    totalPassif: {
      explain: 'Total passif = Capitaux propres + Passif non courant + Passif courant. Décrit l’origine du financement.',
      cases:
        '• Dominante capitaux propres : plus d’autonomie.\n• Dominante dettes : dépendance aux financeurs externes.\n• Doit égaler le total actif si le bilan est équilibré.',
      verdict: ({ value, gap, balanced, lang }) =>
        balanced
          ? `Total passif = ${formatMoney(value, lang)}, cohérent avec l’actif.`
          : `Total passif = ${formatMoney(value, lang)}. Écart avec l’actif : ${formatMoney(gap, lang)}.`,
    },
    treasuryNet: {
      explain: 'Trésorerie nette ≈ FRNG − BFR. Indique si les ressources durables couvrent le BFR avec un excédent de cash.',
      cases:
        '• TN > 0 : excédent de liquidités, structure saine.\n• TN ≈ 0 : équilibre fragile, aucune marge.\n• TN < 0 : dépendance au court terme / découvert ([Finceo](https://www.finceo.com/comptabilite-gestion/tresorerie-nette-calcul)).',
      verdict: ({ value, lang }) => {
        if (Math.abs(value) < 0.005)
          return `TN ≈ ${formatMoney(0, lang)} : équilibre fragile entre FRNG et BFR.`
        if (value > 0)
          return `TN positive (${formatMoney(value, lang)}) : l’entreprise dispose d’un excédent de liquidités après financement du BFR.`
        return `TN négative (${formatMoney(value, lang)}) : le BFR dépasse le FRNG ; tension de trésorerie / recours au court terme.`
      },
    },
    actifStructure: {
      explain: 'Répartition de l’actif entre courant et non courant : profil d’activité (exploitation vs capitalistique).',
      cases:
        '• Actif courant dominant (>60%) : cycle d’exploitation important (stocks/clients).\n• Actif non courant dominant : activité capitalistique, besoin de ressources stables.\n• Pas de norme unique : lire avec le secteur et le FRNG.',
      verdict: ({ shareCourant, shareNonCourant }) => {
        if (shareCourant >= 60)
          return `Actif courant dominant (${shareCourant.toFixed(1)}% vs ${shareNonCourant.toFixed(1)}%) : structure orientée exploitation.`
        if (shareNonCourant >= 60)
          return `Actif non courant dominant (${shareNonCourant.toFixed(1)}%) : structure capitalistique exigeant un FRNG solide.`
        return `Répartition équilibrée : courant ${shareCourant.toFixed(1)}% / non courant ${shareNonCourant.toFixed(1)}%.`
      },
    },
    passifStructure: {
      explain:
        'Compare financement propre et dettes. Autonomie ≈ capitaux propres ÷ total passif (analyse PME / non bancaire).',
      cases:
        '• Autonomie > 40% : structure solide (guides pro. type Billy).\n• 20–40% : acceptable, à surveiller.\n• < 20% : forte dépendance aux créanciers.\n• Les seuils Bâle/banques ne s’appliquent pas tels quels aux PME non financières.',
      verdict: ({ shareEquity, shareDebt }) => {
        if (shareEquity >= 40)
          return `Autonomie ${shareEquity.toFixed(1)}% (dettes ${shareDebt.toFixed(1)}%) : financement propre solide (>40%).`
        if (shareEquity >= 20)
          return `Autonomie ${shareEquity.toFixed(1)}% (dettes ${shareDebt.toFixed(1)}%) : zone moyenne (20–40%).`
        return `Autonomie ${shareEquity.toFixed(1)}% (dettes ${shareDebt.toFixed(1)}%) : faible (<20%), dépendance externe élevée.`
      },
    },
    liquidity: {
      explain:
        'Liquidité générale (current ratio) = Actif courant ÷ Passif courant. Standard d’analyse et de marché pour la solvabilité court terme.',
      cases:
        '• < 1 : couverture insuffisante (sauf modèles à BFR négatif / rotation très rapide).\n• 1–1,5 : acceptable, marge limitée.\n• 1,5–3 : zone souvent confortable (industrie/services).\n• > 3 : sécurité forte mais possible inefficacité du WC (Investopedia / CFI).\n• Pédagogie algérienne : LG > 1 associé à une meilleure capacité de paiement et souvent FRNG > 0.',
      verdict: ({ liquidity }) => {
        if (liquidity == null) return 'Liquidité non calculable (passif courant nul/insuffisant).'
        if (liquidity < 1)
          return `Liquidité = ${liquidity.toFixed(2)} (< 1) : déficit de couverture court terme.`
        if (liquidity < 1.5)
          return `Liquidité = ${liquidity.toFixed(2)} (1–1,5) : couverture acceptable, marge limitée.`
        if (liquidity <= 3)
          return `Liquidité = ${liquidity.toFixed(2)} (1,5–3) : zone confortable selon les pratiques d’analyse.`
        return `Liquidité = ${liquidity.toFixed(2)} (> 3) : couverture excessive ; vérifier stocks/créances/cash inutilisés.`
      },
    },
    frng: {
      explain:
        'FRNG = ressources durables − actif non courant. Règle d’or du bilan fonctionnel (SCF / cours univ. algériens).',
      cases:
        '• FRNG > 0 : emplois stables financés par ressources stables, surplus pour BFR/TN (ex. cours Univ. Béchar).\n• FRNG ≈ 0 : équilibre précaire.\n• FRNG < 0 : immobilisations partiellement financées en court terme.\n• Toujours lire avec BFR (TN = FRNG − BFR).',
      verdict: ({ value, lang }) => {
        if (Math.abs(value) < 0.005) return `FRNG ≈ ${formatMoney(0, lang)} : aucune marge durable (équilibre fragile).`
        if (value > 0)
          return `FRNG positif (${formatMoney(value, lang)}) : règle d’or respectée ; surplus disponible pour le BFR.`
        return `FRNG négatif (${formatMoney(value, lang)}) : rupture de la règle d’or de financement.`
      },
    },
    bfr: {
      explain: 'BFR (approximation bilan) ≈ Actif courant − Passif courant. Besoin (ou ressource) du cycle d’exploitation.',
      cases:
        '• BFR > 0 : l’exploitation immobilise du cash.\n• BFR < 0 : l’exploitation dégage une ressource.\n• Toujours lire avec FRNG (TN = FRNG − BFR).',
      verdict: ({ value, lang }) => {
        if (Math.abs(value) < 0.005) return `BFR ≈ ${formatMoney(0, lang)} : cycle d’exploitation quasi neutre.`
        if (value > 0)
          return `BFR positif (${formatMoney(value, lang)}) : besoin d’exploitation à financer.`
        return `BFR négatif (${formatMoney(value, lang)}) : le cycle dégage des ressources et allège la trésorerie.`
      },
    },
    overview: {
      explain:
        'Synthèse de la structure financière : répartition Actif/Passif, liquidité générale, et triangle FRNG–BFR–TN.',
      cases:
        'Cible pédagogique fréquente : FRNG ≥ 0, TN ≥ 0, liquidité ≥ 1, autonomie suffisante.\nAlerte : FRNG < 0, TN < 0 ou liquidité < 1.\nExcès de liquidité : ratio très élevé avec actif courant volumineux sans rentabilité claire.',
      verdict: (m, lang) => {
        const parts = [
          `Actif courant ${m.shareCourant.toFixed(1)}% / non courant ${m.shareNonCourant.toFixed(1)}%.`,
          `Fonds propres ${m.shareEquity.toFixed(1)}% / dettes ${m.shareDebt.toFixed(1)}%.`,
        ]
        if (m.liquidity == null) parts.push('Liquidité N/A.')
        else if (m.liquidity < 1) parts.push(`Liquidité faible (${m.liquidity.toFixed(2)}).`)
        else if (m.liquidity < 1.5) parts.push(`Liquidité acceptable (${m.liquidity.toFixed(2)}).`)
        else if (m.liquidity <= 3) parts.push(`Liquidité confortable (${m.liquidity.toFixed(2)}).`)
        else parts.push(`Liquidité très élevée (${m.liquidity.toFixed(2)}) : risque d’actifs courants peu productifs.`)
        parts.push(m.frng >= 0 ? `FRNG + (${formatMoney(m.frng, lang)}).` : `FRNG − (${formatMoney(m.frng, lang)}).`)
        parts.push(m.bfr > 0 ? `BFR + (${formatMoney(m.bfr, lang)}).` : `BFR (${formatMoney(m.bfr, lang)}).`)
        if (Math.abs(m.tresorerie) < 0.005) parts.push('TN ≈ 0.')
        else if (m.tresorerie > 0) parts.push(`TN + (${formatMoney(m.tresorerie, lang)}).`)
        else parts.push(`TN − (${formatMoney(m.tresorerie, lang)}).`)

        let synth = 'Synthèse : '
        if (m.frng >= 0 && m.tresorerie >= 0 && (m.liquidity == null || m.liquidity >= 1) && m.shareEquity >= 20) {
          synth += 'structure globalement équilibrée avec marge de sécurité.'
        } else if (m.frng < 0 || m.tresorerie < 0 || (m.liquidity != null && m.liquidity < 1)) {
          synth += 'points de tension détectés (FRNG / liquidité / TN) à traiter en priorité.'
        } else {
          synth += 'structure acceptable avec points de vigilance.'
        }
        return `${parts.join(' ')} ${synth}`
      },
    },
  },
}

function stripMdLinks(text) {
  return String(text || '').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
}

/**
 * Build explain / academic cases / live verdict for structure-analysis metrics.
 */
export function buildStructureMetricInfo(metricId, metrics, lang = 'ar') {
  const pack = COPY[lang === 'fr' ? 'fr' : 'ar']
  const sections = pack.sections
  const def = pack[metricId]
  if (!def || !metrics || metrics.empty) {
    return {
      sections,
      explanation: '',
      cases: '',
      verdict: lang === 'fr' ? 'Aucune donnée à interpréter.' : 'لا توجد بيانات للتفسير.',
    }
  }

  const gap = metrics.totalActif - metrics.totalPassif
  const balanced = Math.abs(gap) < 0.005
  const ctx = {
    ...metrics,
    value:
      metricId === 'totalActif'
        ? metrics.totalActif
        : metricId === 'totalPassif'
          ? metrics.totalPassif
          : metricId === 'treasuryNet'
            ? metrics.tresorerie
            : metricId === 'frng'
              ? metrics.frng
              : metricId === 'bfr'
                ? metrics.bfr
                : null,
    gap,
    balanced,
    lang,
  }

  let verdict
  if (metricId === 'overview') verdict = def.verdict(metrics, lang)
  else if (typeof def.verdict === 'function') verdict = def.verdict(ctx)
  else verdict = String(def.verdict || '')

  return {
    sections,
    explanation: stripMdLinks(def.explain),
    cases: stripMdLinks(def.cases),
    verdict,
  }
}

export { fill }
