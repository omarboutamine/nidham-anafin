import { formatMoney } from './financialTemplates'
import { formatRatio, interpretConan } from '../services/analysisEngine'

/**
 * Market-module metric readings (liquidity, solvency, profitability, activity, DuPont, Conan).
 * Thresholds cross-checked from:
 * - Investopedia / CFI: current >1 often needed; 1.5–2 common comfort; very high may mean idle WC
 * - Quick (acid-test) ≥1 often cited; cash ratio more conservative (~0.2 pedagogical floor in many textbooks)
 * - Debt/assets: lower better for SME pedagogy; gearing D/E often watch near/above 1–2 by sector
 * - Autonomy (equity/assets or equity/passif): Billy-style >40% strong, 20–40% OK, <20% fragile
 * - Long-term coverage ≥1 (permanent resources / non-current assets) — SCF functional rule cousin
 * - ROE/ROA/margins: sector-dependent; pedagogical bands used in statusTone (not universal laws)
 * - DSO: lower better; 45/75 day teaching bands common in working-capital courses
 * - Conan-Holder: classic French Z-score style pedagogy (safe / watch / risk cutoffs already in interpretConan)
 * Caveat: bank Basel thresholds are NOT applied as SME rules.
 */

function fmtVal(value, { money, percent, lang, digits = 2 }) {
  if (value == null || Number.isNaN(value)) return '—'
  if (money) return formatMoney(value, lang)
  return formatRatio(value, { percent: !!percent, lang, digits })
}

const SECTIONS = {
  ar: { explain: 'شرح المؤشر', cases: 'القراءة الأكاديمية حسب الحالات', verdict: 'قراءة النتيجة الحالية' },
  fr: { explain: 'Explication', cases: 'Lecture académique par cas', verdict: 'Lecture du résultat actuel' },
}

function pack(lang) {
  return lang === 'fr' ? COPY.fr : COPY.ar
}

const COPY = {
  ar: {
    currentRatio: {
      explain: 'السيولة العامة (Current ratio) = أصول جارية ÷ خصوم جارية. مقياس قدرة تغطية الالتزامات قصيرة الأجل.',
      cases:
        '• < 1: تغطية غير كافية غالباً (Investopedia/CFI)، مع استثناءات لدورات سريعة/BFR سالب.\n• 1–1.5: مقبول بهامش محدود.\n• 1.5–3: نطاق مريح شائع في التدريس.\n• > 3: أمان مرتفع وقد يشير إلى أصول جارية غير مستغَلة.',
      verdict: (v, ctx) => {
        if (v == null) return 'لا يمكن حساب السيولة العامة.'
        const s = fmtVal(v, ctx)
        if (v < 1) return `السيولة العامة = ${s} (< 1): ضغط محتمل على الوفاء قصير الأجل.`
        if (v < 1.5) return `السيولة العامة = ${s} (1–1.5): تغطية مقبولة بهامش محدود.`
        if (v <= 3) return `السيولة العامة = ${s} (1.5–3): نطاق مريح وفق الممارسات الشائعة.`
        return `السيولة العامة = ${s} (> 3): تغطية مرتفعة؛ راجع كفاءة المخزون/الزبائن/النقد.`
      },
    },
    quickRatio: {
      explain: 'السيولة السريعة (Acid test) = (أصول جارية − مخزون) ÷ خصوم جارية. تستبعد المخزون الأقل سيولة.',
      cases: '• مرجع شائع ≥ 1.\n• 0.7–1: منطقة مراقبة.\n• < 0.7: هشاشة سيولة فورية أعلى.',
      verdict: (v, ctx) => {
        if (v == null) return 'لا يمكن حساب السيولة السريعة.'
        const s = fmtVal(v, ctx)
        if (v >= 1) return `السيولة السريعة = ${s} (≥ 1): قدرة جيدة دون الاعتماد على بيع المخزون.`
        if (v >= 0.7) return `السيولة السريعة = ${s} (0.7–1): مقبولة مع مراقبة.`
        return `السيولة السريعة = ${s} (< 0.7): اعتماد مرتفع على المخزون أو ضغط قصير الأجل.`
      },
    },
    cashRatio: {
      explain: 'السيولة النقدية = خزينة أصول ÷ خصوم جارية. أكثر المقاييس تحفظاً للقدرة الفورية على الدفع.',
      cases: '• مرجع تعليمي شائع ≥ 0.2.\n• 0.1–0.2: حد أدنى حذر.\n• < 0.1: سيولة نقدية ضعيفة ظاهرية.',
      verdict: (v, ctx) => {
        if (v == null) return 'لا يمكن حساب السيولة النقدية.'
        const s = fmtVal(v, ctx)
        if (v >= 0.2) return `السيولة النقدية = ${s} (≥ 0.2): هامش نقدي مقبول تعليمياً.`
        if (v >= 0.1) return `السيولة النقدية = ${s} (0.1–0.2): ضعيفة نسبياً.`
        return `السيولة النقدية = ${s} (< 0.1): قدرة دفع فوري محدودة.`
      },
    },
    debtRatio: {
      explain: 'نسبة المديونية ≈ إجمالي الديون ÷ إجمالي الأصول. تقيس وزن التمويل بالدين في الهيكل.',
      cases: '• ≤ 0.5: مديونية معتدلة نسبياً في بيداغوجيا SME.\n• 0.5–0.7: مراقبة.\n• > 0.7: تبعية دين مرتفعة (مع مراعاة القطاع).',
      verdict: (v, ctx) => {
        if (v == null) return 'لا يمكن حساب نسبة المديونية.'
        const s = fmtVal(v, ctx)
        if (v <= 0.5) return `المديونية = ${s} (≤ 0.5): وزن دين معتدل نسبياً.`
        if (v <= 0.7) return `المديونية = ${s} (0.5–0.7): مقبولة مع مراقبة.`
        return `المديونية = ${s} (> 0.7): اعتماد مرتفع على الديون.`
      },
    },
    equityRatio: {
      explain: 'وزن رؤوس الأموال = رؤوس أموال ÷ إجمالي الخصوم. يقيس حصة التمويل الذاتي في الخصوم.',
      cases: '• > 40%: تمويل ذاتي قوي (مراجع مهنية شائعة).\n• 20–40%: متوسط.\n• < 20%: تبعية خارجية مرتفعة. عتبات بازل البنكية لا تُطبَّق حرفياً على SME.',
      verdict: (v, ctx) => {
        if (v == null) return 'لا يمكن حساب وزن رؤوس الأموال.'
        const s = fmtVal(v, { ...ctx, percent: true })
        const pct = v * 100
        if (pct >= 40) return `وزن رؤوس الأموال = ${s} (≥ 40%): استقلالية ظاهرة قوية.`
        if (pct >= 20) return `وزن رؤوس الأموال = ${s} (20–40%): نطاق متوسط.`
        return `وزن رؤوس الأموال = ${s} (< 20%): استقلالية ضعيفة.`
      },
    },
    gearing: {
      explain: 'الرافعة (Gearing) ≈ إجمالي الديون ÷ رؤوس الأموال. تقيس تضخيم العائد/المخاطر عبر الدين.',
      cases: '• ≤ 1: حذر غالباً مقبول في كثير من القطاعات التعليمية.\n• 1–2: مراقبة.\n• > 2: رافعة مرتفعة؛ حساسية أكبر للصدمات.',
      verdict: (v, ctx) => {
        if (v == null) return 'لا يمكن حساب الرافعة.'
        const s = fmtVal(v, ctx)
        if (v <= 1) return `الرافعة = ${s} (≤ 1): مستوى حذر نسبياً.`
        if (v <= 2) return `الرافعة = ${s} (1–2): مقبولة مع مراقبة تكلفة الدين.`
        return `الرافعة = ${s} (> 2): رافعة مرتفعة.`
      },
    },
    autonomy: {
      explain: 'الاستقلالية المالية ≈ رؤوس أموال ÷ إجمالي الأصول. وزن التمويل الذاتي في تمويل الأصول.',
      cases: '• ≥ 0.4: قوي تعليمياً.\n• 0.25–0.4: متوسط.\n• < 0.25: هشاشة ظاهرة.',
      verdict: (v, ctx) => {
        if (v == null) return 'لا يمكن حساب الاستقلالية.'
        const s = fmtVal(v, ctx)
        if (v >= 0.4) return `الاستقلالية = ${s} (≥ 0.4): تمويل ذاتي مريح.`
        if (v >= 0.25) return `الاستقلالية = ${s} (0.25–0.4): متوسطة.`
        return `الاستقلالية = ${s} (< 0.25): ضعيفة.`
      },
    },
    coverage: {
      explain: 'تغطية الأصول طويلة الأجل ≈ (رؤوس أموال + خصوم غير جارية) ÷ أصول غير جارية. قريبة من منطق FRNG.',
      cases: '• ≥ 1: الموارد الدائمة تغطي التثبيتات.\n• 0.85–1: توازن هش.\n• < 0.85: جزء من التثبيتات يُموَّل قصير الأجل.',
      verdict: (v, ctx) => {
        if (v == null) return 'لا يمكن حساب التغطية طويلة الأجل.'
        const s = fmtVal(v, ctx)
        if (v >= 1) return `التغطية = ${s} (≥ 1): موارد دائمة كافية للتثبيتات.`
        if (v >= 0.85) return `التغطية = ${s} (0.85–1): هامش ضعيف.`
        return `التغطية = ${s} (< 0.85): اعتماد على تمويل قصير الأجل للتثبيتات.`
      },
    },
    frng: {
      explain: 'FRNG = موارد دائمة − أصول غير جارية. قاعدة ذهبية في التحليل الوظيفي SCF.',
      cases: '• > 0: فائض دائم لتمويل BFR/TN.\n• ≈ 0: توازن هش.\n• < 0: خرق القاعدة الذهبية.',
      verdict: (v, ctx) => {
        if (v == null) return 'لا يمكن حساب FRNG.'
        const s = fmtVal(v, { ...ctx, money: true })
        if (Math.abs(v) < 0.005) return `FRNG ≈ ${s}: بلا هامش دائم.`
        if (v > 0) return `FRNG موجب (${s}): القاعدة الذهبية محترمة.`
        return `FRNG سالب (${s}): خرق تمويل التثبيتات بالموارد الدائمة.`
      },
    },
    bfr: {
      explain: 'BFR التشغيلي = (أصول جارية − خزينة) − (خصوم جارية − تسبيقات بنكية). احتياج أو مورد دورة الاستغلال.',
      cases: '• > 0: الاحتياج يجمّد سيولة.\n• < 0: الدورة تموّل جزئياً نفسها.\n• يُقرأ دائماً مع FRNG (TN = FRNG − BFR).',
      verdict: (v, ctx) => {
        if (v == null) return 'لا يمكن حساب BFR.'
        const s = fmtVal(v, { ...ctx, money: true })
        if (Math.abs(v) < 0.005) return `BFR ≈ ${s}: دورة شبه محايدة.`
        if (v > 0) return `BFR موجب (${s}): احتياج استغلال يجب تمويله.`
        return `BFR سالب (${s}): الدورة توفّر مورداً وتخفّف الضغط على الخزينة.`
      },
    },
    treasuryNet: {
      explain: 'الخزينة الصافية ≈ FRNG − BFR. ملخص فائض/عجز السيولة بعد تمويل الاحتياج.',
      cases: '• > 0: فائض سيولة.\n• ≈ 0: توازن هش.\n• < 0: فجوة سيولة / اعتماد قصير الأجل.',
      verdict: (v, ctx) => {
        if (v == null) return 'لا يمكن حساب الخزينة الصافية.'
        const s = fmtVal(v, { ...ctx, money: true })
        if (Math.abs(v) < 0.005) return `TN ≈ ${s}: توازن هش.`
        if (v > 0) return `TN موجبة (${s}): فائض سيولة بعد تمويل BFR.`
        return `TN سالبة (${s}): فجوة سيولة تتطلب متابعة.`
      },
    },
    netMargin: {
      explain: 'الهامش الصافي = نتيجة صافية ÷ رقم الأعمال (أو الإنتاج). ربحية المبيعات بعد الأعباء.',
      cases: '• يعتمد بقوة على القطاع.\n• عتبات تعليمية داخل المنصة: ≥ 8% مريح، 2–8% مقبول، < 2% ضعيف.',
      verdict: (v, ctx) => marginVerdict('الهامش الصافي', v, ctx),
    },
    opMargin: {
      explain: 'هامش الاستغلال = نتيجة الاستغلال ÷ الإنتاج. ربحية النشاط التشغيلي قبل المالي والاستثنائي.',
      cases: '• أفضل لمقارنة الأداء التشغيلي من الهامش الصافي.\n• نفس العتبات التعليمية للمنصة (≥8 / 2–8 / <2).',
      verdict: (v, ctx) => marginVerdict('هامش الاستغلال', v, ctx),
    },
    ebeMargin: {
      explain: 'هامش EBE = الفائض الإجمالي للاستغلال ÷ الإنتاج. قدرة توليد نقد تشغيلي تقريبية.',
      cases: '• مفيد قبل الاهتلاكات.\n• عتبات تعليمية للمنصة كما في الهوامش الأخرى.',
      verdict: (v, ctx) => marginVerdict('هامش EBE', v, ctx),
    },
    roa: {
      explain: 'ROA = نتيجة صافية ÷ إجمالي الأصول (%). كفاءة استخدام الأصول لتوليد الربح.',
      cases: '• عتبات تعليمية: ≥ 6% جيد، 2–6% مقبول، < 2% ضعيف — مع تحفظ قطاعي.',
      verdict: (v, ctx) => {
        if (v == null) return 'لا يمكن حساب ROA.'
        const s = fmtVal(v, { ...ctx, percent: true })
        if (v >= 6) return `ROA = ${s} (≥ 6%): مردودية أصول مريحة تعليمياً.`
        if (v >= 2) return `ROA = ${s} (2–6%): مقبولة.`
        return `ROA = ${s} (< 2%): ضعيفة.`
      },
    },
    roe: {
      explain: 'ROE = نتيجة صافية ÷ رؤوس الأموال (%). عائد حقوق الملكية؛ يتأثر بالرافعة (DuPont).',
      cases: '• عتبات تعليمية: ≥ 12% جيد، 5–12% مقبول، < 5% ضعيف.\n• ROE مرتفع جداً قد يعكس رافعة لا ربحية حقيقية.',
      verdict: (v, ctx) => {
        if (v == null) return 'لا يمكن حساب ROE.'
        const s = fmtVal(v, { ...ctx, percent: true })
        if (v >= 12) return `ROE = ${s} (≥ 12%): مردودية أموال خاصة مريحة.`
        if (v >= 5) return `ROE = ${s} (5–12%): مقبولة.`
        return `ROE = ${s} (< 5%): ضعيفة أو سلبية الضغط.`
      },
    },
    assetTurn: {
      explain: 'دوران الأصول = المبيعات/الإنتاج ÷ إجمالي الأصول. كفاءة تشغيل الأصول.',
      cases: '• ≥ 1 جيد تعليمياً في أنشطة تجارية كثيرة.\n• 0.5–1 متوسط.\n• < 0.5 بطء دوران (كثافة رأسمالية أو ضعف نشاط).',
      verdict: (v, ctx) => turnoverVerdict('دوران الأصول', v, ctx),
    },
    invTurn: {
      explain: 'دوران المخزون ≈ مشتريات مستهلكة ÷ مخزون. سرعة تصريف المخزون.',
      cases: '• أعلى أفضل عموماً (أقل تجميد سيولة)، مع استثناءات موسمية.',
      verdict: (v, ctx) => turnoverVerdict('دوران المخزون', v, ctx),
    },
    recTurn: {
      explain: 'دوران الزبائن = المبيعات ÷ زبائن. سرعة التحصيل.',
      cases: '• أعلى أفضل؛ يتكامل مع DSO.',
      verdict: (v, ctx) => turnoverVerdict('دوران الزبائن', v, ctx),
    },
    dso: {
      explain: 'DSO ≈ (زبائن × 365) ÷ المبيعات. متوسط أيام التحصيل.',
      cases: '• ≤ 45 يوماً: مريح تعليمياً.\n• 45–75: مراقبة.\n• > 75: بطء تحصيل يضغط BFR.',
      verdict: (v, ctx) => dsoVerdict('DSO', v, ctx),
    },
    dio: {
      explain: 'DIO ≈ (مخزون × 365) ÷ تكلفة/مشتريات. متوسط أيام بقاء المخزون.',
      cases: '• نفس منطق DSO تعليمياً: أقصر أفضل مع مراعاة طبيعة النشاط.',
      verdict: (v, ctx) => dsoVerdict('DIO', v, ctx),
    },
    dupontMargin: {
      explain: 'مكوّن هامش DuPont = نتيجة صافية ÷ مبيعات (كسر عشري).',
      cases: '• يحسّن ROE عبر الربحية.',
      verdict: (v, ctx) =>
        v == null ? 'هامش DuPont غير محسوب.' : `هامش DuPont = ${fmtVal(v * 100, { ...ctx, percent: true })}.`,
    },
    dupontTurn: {
      explain: 'مكوّن دوران DuPont = مبيعات ÷ أصول.',
      cases: '• يحسّن ROE عبر الكفاءة.',
      verdict: (v, ctx) => (v == null ? 'دوران DuPont غير محسوب.' : `دوران DuPont = ${fmtVal(v, ctx)}.`),
    },
    dupontLev: {
      explain: 'مضاعف حقوق الملكية = أصول ÷ رؤوس أموال. رافعة هيكل التمويل في DuPont.',
      cases: '• ارتفاعه يرفع ROE ويزيد المخاطر.',
      verdict: (v, ctx) => (v == null ? 'الرافعة غير محسوبة.' : `مضاعف الأموال = ${fmtVal(v, ctx)}.`),
    },
    dupontRoe: {
      explain: 'ROE عبر DuPont = هامش × دوران × مضاعف. تفكيك كلاسيكي في التحليل الأساسي.',
      cases: '• يفسر مصدر المردودية: ربحية، كفاءة، أو رافعة.',
      verdict: (v, ctx) => {
        if (v == null) return 'ROE (DuPont) غير محسوب.'
        return `ROE (DuPont) = ${fmtVal(v * 100, { ...ctx, percent: true })}.`
      },
    },
    conan: {
      explain: 'درجة Conan-Holder: نموذج فرنسي كلاسيكي لتقدير خطر الفشل انطلاقاً من نسب محاسبية (نسخة تعليمية).',
      cases: '• عتبات المنصة: > 0.16 مريح، 0.04–0.16 مراقبة، < 0.04 خطر.\n• ليست تصنيفاً بنكياً رسمياً.',
      verdict: (v, ctx) => {
        if (v == null) return 'درجة Conan غير محسوبة.'
        const band = interpretConan(v)
        const s = fmtVal(v, { ...ctx, digits: 3 })
        if (band === 'safe') return `Conan = ${s}: نطاق مريح تعليمياً.`
        if (band === 'watch') return `Conan = ${s}: منطقة مراقبة.`
        if (band === 'risk') return `Conan = ${s}: نطاق خطر تعليمي.`
        return `Conan = ${s}.`
      },
    },
    conanX1: {
      explain: 'X1 في Conan-Holder ≈ EBE / إجمالي الأصول.',
      cases: '• يساهم إيجاباً في الدرجة.',
      verdict: (v, ctx) => (v == null ? 'X1 غير محسوب.' : `X1 = ${fmtVal(v, ctx)}.`),
    },
    conanX2: {
      explain: 'X2 ≈ رؤوس أموال / إجمالي الخصوم.',
      cases: '• يProxies الاستقلالية.',
      verdict: (v, ctx) => (v == null ? 'X2 غير محسوب.' : `X2 = ${fmtVal(v, ctx)}.`),
    },
    conanX3: {
      explain: 'X3 ≈ (أصول جارية − مخزون) / إجمالي الأصول.',
      cases: '• وزن الأصول السائلة نسبياً.',
      verdict: (v, ctx) => (v == null ? 'X3 غير محسوب.' : `X3 = ${fmtVal(v, ctx)}.`),
    },
    conanX4: {
      explain: 'X4 ≈ خزينة أصول / إجمالي الأصول.',
      cases: '• وزن النقد.',
      verdict: (v, ctx) => (v == null ? 'X4 غير محسوب.' : `X4 = ${fmtVal(v, ctx)}.`),
    },
    conanX5: {
      explain: 'X5 ≈ إجمالي الديون / إجمالي الخصوم (بإشارة سالبة في الصيغة).',
      cases: '• ارتفاع الدين يخفض الدرجة.',
      verdict: (v, ctx) => (v == null ? 'X5 غير محسوب.' : `X5 = ${fmtVal(v, ctx)}.`),
    },
  },
  fr: {
    currentRatio: {
      explain: 'Liquidité générale (current ratio) = Actif courant ÷ Passif courant.',
      cases:
        '• < 1 : couverture souvent insuffisante (Investopedia/CFI), sauf modèles à rotation rapide / BFR négatif.\n• 1–1,5 : acceptable, marge limitée.\n• 1,5–3 : zone confortable fréquente.\n• > 3 : sécurité élevée, possible inefficacité du BFR.',
      verdict: (v, ctx) => {
        if (v == null) return 'Liquidité générale non calculable.'
        const s = fmtVal(v, ctx)
        if (v < 1) return `Liquidité = ${s} (< 1) : tension court terme possible.`
        if (v < 1.5) return `Liquidité = ${s} (1–1,5) : couverture acceptable.`
        if (v <= 3) return `Liquidité = ${s} (1,5–3) : zone confortable.`
        return `Liquidité = ${s} (> 3) : couverture élevée ; vérifier l’efficacité du BFR.`
      },
    },
    quickRatio: {
      explain: 'Liquidité rapide (acid-test) = (Actif courant − stocks) ÷ Passif courant.',
      cases: '• Repère courant ≥ 1.\n• 0,7–1 : à surveiller.\n• < 0,7 : liquidité immédiate fragile.',
      verdict: (v, ctx) => {
        if (v == null) return 'Liquidité rapide non calculable.'
        const s = fmtVal(v, ctx)
        if (v >= 1) return `Quick = ${s} (≥ 1) : bonne couverture hors stocks.`
        if (v >= 0.7) return `Quick = ${s} (0,7–1) : acceptable.`
        return `Quick = ${s} (< 0,7) : dépendance aux stocks / tension.`
      },
    },
    cashRatio: {
      explain: 'Liquidité de caisse = Trésorerie actif ÷ Passif courant.',
      cases: '• Plancher pédagogique fréquent ≥ 0,2.\n• 0,1–0,2 : faible.\n• < 0,1 : cash immédiat limité.',
      verdict: (v, ctx) => {
        if (v == null) return 'Cash ratio non calculable.'
        const s = fmtVal(v, ctx)
        if (v >= 0.2) return `Cash = ${s} (≥ 0,2) : marge de caisse acceptable.`
        if (v >= 0.1) return `Cash = ${s} (0,1–0,2) : plutôt faible.`
        return `Cash = ${s} (< 0,1) : capacité de paiement immédiat limitée.`
      },
    },
    debtRatio: {
      explain: 'Ratio d’endettement ≈ Dettes totales ÷ Actif total.',
      cases: '• ≤ 0,5 : modéré (pédagogie PME).\n• 0,5–0,7 : à surveiller.\n• > 0,7 : forte dépendance à la dette.',
      verdict: (v, ctx) => {
        if (v == null) return 'Endettement non calculable.'
        const s = fmtVal(v, ctx)
        if (v <= 0.5) return `Endettement = ${s} (≤ 0,5) : modéré.`
        if (v <= 0.7) return `Endettement = ${s} (0,5–0,7) : acceptable.`
        return `Endettement = ${s} (> 0,7) : élevé.`
      },
    },
    equityRatio: {
      explain: 'Poids des capitaux propres = Capitaux ÷ Passif total.',
      cases: '• > 40 % : solide.\n• 20–40 % : moyen.\n• < 20 % : fragile. Pas de seuils Bâle appliqués tels quels aux PME.',
      verdict: (v, ctx) => {
        if (v == null) return 'Poids des capitaux non calculable.'
        const s = fmtVal(v, { ...ctx, percent: true })
        const pct = v * 100
        if (pct >= 40) return `Capitaux = ${s} (≥ 40 %) : autonomie apparente forte.`
        if (pct >= 20) return `Capitaux = ${s} (20–40 %) : zone moyenne.`
        return `Capitaux = ${s} (< 20 %) : autonomie faible.`
      },
    },
    gearing: {
      explain: 'Gearing ≈ Dettes ÷ Capitaux propres.',
      cases: '• ≤ 1 : souvent prudent.\n• 1–2 : surveillance.\n• > 2 : levier élevé.',
      verdict: (v, ctx) => {
        if (v == null) return 'Gearing non calculable.'
        const s = fmtVal(v, ctx)
        if (v <= 1) return `Gearing = ${s} (≤ 1) : prudent.`
        if (v <= 2) return `Gearing = ${s} (1–2) : à surveiller.`
        return `Gearing = ${s} (> 2) : levier élevé.`
      },
    },
    autonomy: {
      explain: 'Autonomie ≈ Capitaux ÷ Actif total.',
      cases: '• ≥ 0,4 : fort.\n• 0,25–0,4 : moyen.\n• < 0,25 : fragile.',
      verdict: (v, ctx) => {
        if (v == null) return 'Autonomie non calculable.'
        const s = fmtVal(v, ctx)
        if (v >= 0.4) return `Autonomie = ${s} (≥ 0,4) : confortable.`
        if (v >= 0.25) return `Autonomie = ${s} (0,25–0,4) : moyenne.`
        return `Autonomie = ${s} (< 0,25) : faible.`
      },
    },
    coverage: {
      explain: 'Couverture LT ≈ (Capitaux + Passif non courant) ÷ Actif non courant.',
      cases: '• ≥ 1 : emplois stables couverts.\n• 0,85–1 : fragile.\n• < 0,85 : financement court des immobilisations.',
      verdict: (v, ctx) => {
        if (v == null) return 'Couverture non calculable.'
        const s = fmtVal(v, ctx)
        if (v >= 1) return `Couverture = ${s} (≥ 1) : OK.`
        if (v >= 0.85) return `Couverture = ${s} (0,85–1) : marge faible.`
        return `Couverture = ${s} (< 0,85) : tension.`
      },
    },
    frng: {
      explain: 'FRNG = ressources durables − actif non courant (règle d’or SCF).',
      cases: '• > 0 : surplus.\n• ≈ 0 : fragile.\n• < 0 : rupture.',
      verdict: (v, ctx) => {
        if (v == null) return 'FRNG non calculable.'
        const s = fmtVal(v, { ...ctx, money: true })
        if (Math.abs(v) < 0.005) return `FRNG ≈ ${s} : sans marge.`
        if (v > 0) return `FRNG positif (${s}).`
        return `FRNG négatif (${s}).`
      },
    },
    bfr: {
      explain: 'BFR d’exploitation = (Actif courant − trésorerie) − (Passif courant − concours bancaires).',
      cases: '• > 0 : besoin.\n• < 0 : ressource.\n• Lire avec FRNG.',
      verdict: (v, ctx) => {
        if (v == null) return 'BFR non calculable.'
        const s = fmtVal(v, { ...ctx, money: true })
        if (Math.abs(v) < 0.005) return `BFR ≈ ${s}.`
        if (v > 0) return `BFR positif (${s}) : besoin d’exploitation.`
        return `BFR négatif (${s}) : ressource d’exploitation.`
      },
    },
    treasuryNet: {
      explain: 'TN ≈ FRNG − BFR.',
      cases: '• > 0 : excédent.\n• < 0 : déficit de liquidités.',
      verdict: (v, ctx) => {
        if (v == null) return 'TN non calculable.'
        const s = fmtVal(v, { ...ctx, money: true })
        if (Math.abs(v) < 0.005) return `TN ≈ ${s}.`
        if (v > 0) return `TN positive (${s}).`
        return `TN négative (${s}).`
      },
    },
    netMargin: {
      explain: 'Marge nette = Résultat net ÷ CA/production.',
      cases: '• Seuils pédagogiques plateforme : ≥ 8 %, 2–8 %, < 2 % (sectoriel).',
      verdict: (v, ctx) => marginVerdict('Marge nette', v, ctx, 'fr'),
    },
    opMargin: {
      explain: 'Marge d’exploitation = Résultat d’exploitation ÷ production.',
      cases: '• Meilleure lecture opérationnelle que la marge nette.',
      verdict: (v, ctx) => marginVerdict('Marge d’exploitation', v, ctx, 'fr'),
    },
    ebeMargin: {
      explain: 'Marge EBE = EBE ÷ production.',
      cases: '• Avant amortissements.',
      verdict: (v, ctx) => marginVerdict('Marge EBE', v, ctx, 'fr'),
    },
    roa: {
      explain: 'ROA = Résultat net ÷ Actif total (%).',
      cases: '• Seuils pédagogiques : ≥ 6 %, 2–6 %, < 2 %.',
      verdict: (v, ctx) => {
        if (v == null) return 'ROA non calculable.'
        const s = fmtVal(v, { ...ctx, percent: true })
        if (v >= 6) return `ROA = ${s} (≥ 6 %).`
        if (v >= 2) return `ROA = ${s} (2–6 %).`
        return `ROA = ${s} (< 2 %).`
      },
    },
    roe: {
      explain: 'ROE = Résultat net ÷ Capitaux propres (%).',
      cases: '• ≥ 12 % / 5–12 % / < 5 % (pédagogique). Attention au levier.',
      verdict: (v, ctx) => {
        if (v == null) return 'ROE non calculable.'
        const s = fmtVal(v, { ...ctx, percent: true })
        if (v >= 12) return `ROE = ${s} (≥ 12 %).`
        if (v >= 5) return `ROE = ${s} (5–12 %).`
        return `ROE = ${s} (< 5 %).`
      },
    },
    assetTurn: {
      explain: 'Rotation des actifs = CA ÷ Actif.',
      cases: '• ≥ 1 / 0,5–1 / < 0,5 (pédagogique).',
      verdict: (v, ctx) => turnoverVerdict('Rotation actifs', v, ctx, 'fr'),
    },
    invTurn: {
      explain: 'Rotation des stocks ≈ achats consommés ÷ stocks.',
      cases: '• Plus élevé = moins d’immobilisation, sauf saisonnalité.',
      verdict: (v, ctx) => turnoverVerdict('Rotation stocks', v, ctx, 'fr'),
    },
    recTurn: {
      explain: 'Rotation clients = CA ÷ clients.',
      cases: '• À lire avec le DSO.',
      verdict: (v, ctx) => turnoverVerdict('Rotation clients', v, ctx, 'fr'),
    },
    dso: {
      explain: 'DSO ≈ (Clients × 365) ÷ CA.',
      cases: '• ≤ 45 j / 45–75 / > 75.',
      verdict: (v, ctx) => dsoVerdict('DSO', v, ctx, 'fr'),
    },
    dio: {
      explain: 'DIO ≈ (Stocks × 365) ÷ coût/achats.',
      cases: '• Plus court souvent préférable.',
      verdict: (v, ctx) => dsoVerdict('DIO', v, ctx, 'fr'),
    },
    dupontMargin: {
      explain: 'Marge DuPont = Résultat net ÷ CA (décimal).',
      cases: '• Levier de rentabilité.',
      verdict: (v, ctx) =>
        v == null ? 'Marge DuPont N/A.' : `Marge DuPont = ${fmtVal(v * 100, { ...ctx, percent: true })}.`,
    },
    dupontTurn: {
      explain: 'Rotation DuPont = CA ÷ Actif.',
      cases: '• Levier d’efficacité.',
      verdict: (v, ctx) => (v == null ? 'Rotation DuPont N/A.' : `Rotation DuPont = ${fmtVal(v, ctx)}.`),
    },
    dupontLev: {
      explain: 'Multiplicateur des capitaux = Actif ÷ Capitaux.',
      cases: '• Levier de structure.',
      verdict: (v, ctx) => (v == null ? 'Levier N/A.' : `Multiplicateur = ${fmtVal(v, ctx)}.`),
    },
    dupontRoe: {
      explain: 'ROE DuPont = marge × rotation × multiplicateur.',
      cases: '• Décomposition classique.',
      verdict: (v, ctx) =>
        v == null ? 'ROE DuPont N/A.' : `ROE DuPont = ${fmtVal(v * 100, { ...ctx, percent: true })}.`,
    },
    conan: {
      explain: 'Score Conan-Holder (version pédagogique).',
      cases: '• > 0,16 / 0,04–0,16 / < 0,04. Pas un rating bancaire officiel.',
      verdict: (v, ctx) => {
        if (v == null) return 'Score Conan N/A.'
        const band = interpretConan(v)
        const s = fmtVal(v, { ...ctx, digits: 3 })
        if (band === 'safe') return `Conan = ${s} : zone confortable.`
        if (band === 'watch') return `Conan = ${s} : surveillance.`
        if (band === 'risk') return `Conan = ${s} : zone de risque pédagogique.`
        return `Conan = ${s}.`
      },
    },
    conanX1: {
      explain: 'X1 ≈ EBE / Actif.',
      cases: '• Contribution positive.',
      verdict: (v, ctx) => (v == null ? 'X1 N/A.' : `X1 = ${fmtVal(v, ctx)}.`),
    },
    conanX2: {
      explain: 'X2 ≈ Capitaux / Passif.',
      cases: '• Proxy d’autonomie.',
      verdict: (v, ctx) => (v == null ? 'X2 N/A.' : `X2 = ${fmtVal(v, ctx)}.`),
    },
    conanX3: {
      explain: 'X3 ≈ (Actif courant − stocks) / Actif.',
      cases: '• Poids des actifs liquides.',
      verdict: (v, ctx) => (v == null ? 'X3 N/A.' : `X3 = ${fmtVal(v, ctx)}.`),
    },
    conanX4: {
      explain: 'X4 ≈ Trésorerie actif / Actif.',
      cases: '• Poids du cash.',
      verdict: (v, ctx) => (v == null ? 'X4 N/A.' : `X4 = ${fmtVal(v, ctx)}.`),
    },
    conanX5: {
      explain: 'X5 ≈ Dettes / Passif (signe négatif dans la formule).',
      cases: '• Pénalise l’endettement.',
      verdict: (v, ctx) => (v == null ? 'X5 N/A.' : `X5 = ${fmtVal(v, ctx)}.`),
    },
  },
}

function marginVerdict(name, v, ctx, lang = 'ar') {
  if (v == null) return lang === 'fr' ? `${name} non calculable.` : `لا يمكن حساب ${name}.`
  const s = fmtVal(v, { ...ctx, percent: true })
  if (v >= 8) return lang === 'fr' ? `${name} = ${s} (≥ 8 %).` : `${name} = ${s} (≥ 8%).`
  if (v >= 2) return lang === 'fr' ? `${name} = ${s} (2–8 %).` : `${name} = ${s} (2–8%).`
  return lang === 'fr' ? `${name} = ${s} (< 2 %).` : `${name} = ${s} (< 2%).`
}

function turnoverVerdict(name, v, ctx, lang = 'ar') {
  if (v == null) return lang === 'fr' ? `${name} non calculable.` : `لا يمكن حساب ${name}.`
  const s = fmtVal(v, ctx)
  if (v >= 1) return lang === 'fr' ? `${name} = ${s} (≥ 1).` : `${name} = ${s} (≥ 1).`
  if (v >= 0.5) return lang === 'fr' ? `${name} = ${s} (0,5–1).` : `${name} = ${s} (0.5–1).`
  return lang === 'fr' ? `${name} = ${s} (< 0,5).` : `${name} = ${s} (< 0.5).`
}

function dsoVerdict(name, v, ctx, lang = 'ar') {
  if (v == null) return lang === 'fr' ? `${name} non calculable.` : `لا يمكن حساب ${name}.`
  const s = fmtVal(v, { ...ctx, digits: 1 })
  if (v <= 45) return lang === 'fr' ? `${name} = ${s} j (≤ 45).` : `${name} = ${s} يوماً (≤ 45).`
  if (v <= 75) return lang === 'fr' ? `${name} = ${s} j (45–75).` : `${name} = ${s} يوماً (45–75).`
  return lang === 'fr' ? `${name} = ${s} j (> 75).` : `${name} = ${s} يوماً (> 75).`
}

/**
 * @param {string} metricId
 * @param {number|null} value
 * @param {{ lang?: string, money?: boolean, percent?: boolean, digits?: number }} opts
 */
export function buildMarketMetricInfo(metricId, value, opts = {}) {
  const lang = opts.lang === 'fr' ? 'fr' : 'ar'
  const sections = SECTIONS[lang]
  const def = pack(lang)[metricId]
  const emptyMsg = lang === 'fr' ? 'Aucune donnée à interpréter.' : 'لا توجد بيانات للتفسير.'
  if (!def) {
    return { sections, explanation: '', cases: '', verdict: emptyMsg }
  }
  const ctx = { lang, money: !!opts.money, percent: !!opts.percent, digits: opts.digits ?? 2 }
  const verdict = typeof def.verdict === 'function' ? def.verdict(value, ctx) : String(def.verdict || '')
  return {
    sections,
    explanation: def.explain || '',
    cases: def.cases || '',
    verdict,
  }
}
