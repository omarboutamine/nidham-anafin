import { SITE_BRAND } from './siteBrand'

export const LANDING_LANG_KEY = 'nidham-anafin-lang'
export const DEFAULT_LANDING_LANG = 'ar'

const content = {
  ar: {
    langSwitchLabel: 'اختيار اللغة',
    menuAria: 'القائمة',
    nav: {
      services: 'الخدمات',
      about: 'من نحن',
      register: 'إنشاء حساب',
      login: 'تسجيل الدخول',
      contact: 'ابدأ الآن',
    },
    tickerAria: 'نقاط بارزة',
    ticker: [
      { label: 'الجمهور', value: 'طلبة وباحثون' },
      { label: 'الولوج', value: 'البريد الجامعي' },
      { label: 'التحليل', value: 'نسب ومؤشرات' },
      { label: 'Nidham', value: 'Anafin' },
    ],
    heroBadge: 'منصة جامعية للتحليل المالي',
    heroTitle: 'حلّل البيانات المالية',
    heroTitleAccent: 'بثقة أكاديمية',
    heroDesc:
      'Nidham موجّه للطلبة والباحثين داخل المؤسسة الجامعية. إنشاء الحساب يتم عبر البريد الجامعي لتأمين الولوج.',
    heroLogin: 'تسجيل الدخول',
    heroRegister: 'إنشاء حساب بالبريد الجامعي',
    servicesTitle: 'ماذا نقدّم؟',
    servicesDesc: `${SITE_BRAND.name} يساعد على فهم القوائم المالية وبناء تحليل منهجي لمذكرات التخرج والبحوث.`,
    services: [
      {
        title: 'تحليل القوائم المالية',
        desc: 'قراءة الميزانية وجدول النتائج وجدول تدفقات الخزينة بمؤشرات واضحة.',
      },
      {
        title: 'النسب المالية',
        desc: 'سيولة، ملاءة، مردودية ونشاط — مع تفسير مبسّط لكل نسبة.',
      },
      {
        title: 'دراسات حالة جامعية',
        desc: 'تمارين وأمثلة مناسبة للتكوين المحاسبي والمالي في الجزائر.',
      },
      {
        title: 'ولوج محصور بالطلبة',
        desc: 'التسجيل مسموح فقط ببريد إلكتروني جامعي جزائري (.dz مؤسسي).',
      },
    ],
    aboutTitle: 'عن المنصة',
    aboutLead: `${SITE_BRAND.name} مشروع ضمن عائلة Nidham، مخصص للبيئة الجامعية: تحليل مالي تعليمي، آمن، وباللغتين العربية والفرنسية.`,
    aboutHighlights: [
      {
        value: 'بريد',
        label: 'التحقق الجامعي',
        detail: 'يشترط بريد المؤسسة الجامعية الجزائرية عند إنشاء الحساب.',
      },
      {
        value: 'SCF',
        label: 'سياق جزائري',
        detail: 'مفاهيم ومؤشرات متوافقة مع التكوين المحاسبي المالي المحلي.',
      },
      {
        value: 'بحث',
        label: 'للطلبة والباحثين',
        detail: 'واجهة بسيطة تساعد على بناء تحليل منظم وليس مجرد جداول.',
      },
    ],
    ctaTitle: 'جاهز للانضمام؟',
    ctaDesc: 'أنشئ حسابك الآن باستخدام بريدك الجامعي الجزائري.',
    ctaButton: 'إنشاء حساب بالبريد الجامعي',
    footerTagline: SITE_BRAND.taglineAr,
    footerRights: 'جميع الحقوق محفوظة.',
    register: {
      title: 'إنشاء حساب طالب / باحث',
      intro:
        'أدخل بياناتك وبريدك الجامعي الجزائري فقط (مثال: prenom.nom@etu.univ-….dz). Gmail وYahoo غير مقبولين.',
      fullName: 'الاسم الكامل',
      email: 'البريد الإلكتروني الجامعي',
      emailPlaceholder: 'ex: 2525….@etu.univ-usto.dz',
      university: 'المؤسسة الجامعية',
      password: 'كلمة المرور',
      submit: 'إرسال طلب الحساب',
      submitting: 'جاري الإرسال…',
      success:
        'تم استلام طلبك. بعد التحقق من البريد الجامعي ستتمكن من الولوج (المرحلة القادمة من التطوير).',
      close: 'إغلاق',
      errors: {
        required: 'جميع الحقول مطلوبة.',
        email: 'أدخل بريداً إلكترونياً صالحاً.',
        universityEmail:
          'يجب استعمال بريد جامعي جزائري (مثل @etu.univ-….dz أو @univ-….dz). البريد الشخصي غير مقبول.',
      },
    },
    loginSoon: 'صفحة الدخول قيد التهيئة — ابدأ بإنشاء حساب بالبريد الجامعي.',
  },
  fr: {
    langSwitchLabel: 'Choisir la langue',
    menuAria: 'Menu',
    nav: {
      services: 'Services',
      about: 'À propos',
      register: 'Créer un compte',
      login: 'Connexion',
      contact: 'Commencer',
    },
    tickerAria: 'Points clés',
    ticker: [
      { label: 'Public', value: 'Étudiants & chercheurs' },
      { label: 'Accès', value: 'E-mail universitaire' },
      { label: 'Analyse', value: 'Ratios & indicateurs' },
      { label: 'Nidham', value: 'Anafin' },
    ],
    heroBadge: "Plateforme universitaire d'analyse financière",
    heroTitle: 'Analysez les données financières',
    heroTitleAccent: 'avec exigence académique',
    heroDesc:
      'Nidham s’adresse aux étudiants et chercheurs de l’établissement universitaire. La création de compte se fait via l’e-mail universitaire pour sécuriser l’accès.',
    heroLogin: 'Connexion',
    heroRegister: 'Créer un compte (e-mail universitaire)',
    servicesTitle: 'Que propose Anafin ?',
    servicesDesc: `${SITE_BRAND.name} aide à comprendre les états financiers et à construire une analyse structurée pour mémoires et recherches.`,
    services: [
      {
        title: 'Analyse des états financiers',
        desc: 'Lecture du bilan, du compte de résultat et des flux de trésorerie avec indicateurs clairs.',
      },
      {
        title: 'Ratios financiers',
        desc: 'Liquidité, solvabilité, rentabilité et activité — avec une lecture pédagogique.',
      },
      {
        title: 'Cas universitaires',
        desc: 'Exercices et exemples adaptés à la formation comptable et financière en Algérie.',
      },
      {
        title: 'Accès réservé aux étudiants',
        desc: 'Inscription limitée aux e-mails universitaires algériens (.dz institutionnels).',
      },
    ],
    aboutTitle: 'À propos',
    aboutLead: `${SITE_BRAND.name} fait partie de l’écosystème Nidham, dédié au contexte universitaire : analyse financière pédagogique, sécurisée, en arabe et en français.`,
    aboutHighlights: [
      {
        value: 'E-mail',
        label: 'Vérification universitaire',
        detail: 'Un e-mail d’établissement algérien est requis pour créer un compte.',
      },
      {
        value: 'SCF',
        label: 'Contexte algérien',
        detail: 'Concepts et indicateurs alignés sur la formation comptable locale.',
      },
      {
        value: 'Recherche',
        label: 'Étudiants & chercheurs',
        detail: 'Une interface simple pour bâtir une analyse ordonnée, pas seulement des tableaux.',
      },
    ],
    ctaTitle: 'Prêt à rejoindre Anafin ?',
    ctaDesc: 'Créez votre compte avec votre e-mail universitaire algérien.',
    ctaButton: 'Créer un compte (e-mail universitaire)',
    footerTagline: SITE_BRAND.taglineFr,
    footerRights: 'Tous droits réservés.',
    register: {
      title: 'Créer un compte étudiant / chercheur',
      intro:
        'Utilisez uniquement votre e-mail universitaire algérien (ex. prenom.nom@etu.univ-….dz). Gmail et Yahoo sont refusés.',
      fullName: 'Nom complet',
      email: 'E-mail universitaire',
      emailPlaceholder: 'ex. 2525….@etu.univ-usto.dz',
      university: 'Établissement universitaire',
      password: 'Mot de passe',
      submit: 'Envoyer la demande',
      submitting: 'Envoi…',
      success:
        'Demande reçue. Après vérification de l’e-mail universitaire, l’accès sera ouvert (prochaine étape).',
      close: 'Fermer',
      errors: {
        required: 'Tous les champs sont requis.',
        email: 'Saisissez un e-mail valide.',
        universityEmail:
          'Utilisez un e-mail universitaire algérien (ex. @etu.univ-….dz ou @univ-….dz). Les e-mails personnels sont refusés.',
      },
    },
    loginSoon: 'La page de connexion arrive bientôt — commencez par un compte e-mail universitaire.',
  },
}

export function getLandingContent(lang) {
  return content[lang] || content[DEFAULT_LANDING_LANG]
}
