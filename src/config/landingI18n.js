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
      { label: 'الولوج', value: 'بطاقة الطالب' },
      { label: 'التحليل', value: 'نسب ومؤشرات' },
      { label: 'Nidham', value: 'Anafin' },
    ],
    heroBadge: 'منصة جامعية للتحليل المالي',
    heroTitle: 'حلّل البيانات المالية',
    heroTitleAccent: 'بثقة أكاديمية',
    heroDesc:
      'Nidham Anafin موجّه للطلبة والباحثين داخل المؤسسة الجامعية. إنشاء الحساب يتم عبر بطاقة الطالب لتأمين الولوج.',
    heroLogin: 'تسجيل الدخول',
    heroRegister: 'إنشاء حساب ببطاقة الطالب',
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
        desc: 'التسجيل مرتبط ببطاقة الطالب لتقليل الحسابات من خارج الجامعة.',
      },
    ],
    aboutTitle: 'عن المنصة',
    aboutLead: `${SITE_BRAND.name} مشروع ضمن عائلة Nidham، مخصص للبيئة الجامعية: تحليل مالي تعليمي، آمن، وباللغتين العربية والفرنسية.`,
    aboutHighlights: [
      {
        value: 'بطاقة',
        label: 'التحقق الجامعي',
        detail: 'رفع صورة بطاقة الطالب عند التسجيل كشرط أولي للولوج.',
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
    ctaDesc: 'أنشئ حسابك الآن باستخدام بطاقة الطالب الخاصة بمؤسستك الجامعية.',
    ctaButton: 'إنشاء حساب ببطاقة الطالب',
    footerTagline: SITE_BRAND.taglineAr,
    footerRights: 'جميع الحقوق محفوظة.',
    register: {
      title: 'إنشاء حساب طالب',
      intro: 'أدخل بياناتك وارفع صورة واضحة لبطاقة الطالب. سيتم مراجعة الطلب لاحقاً.',
      fullName: 'الاسم الكامل',
      email: 'البريد الإلكتروني الجامعي',
      university: 'المؤسسة الجامعية',
      studentId: 'رقم التسجيل / البطاقة',
      password: 'كلمة المرور',
      cardLabel: 'صورة بطاقة الطالب',
      cardHint: 'JPG أو PNG — يجب أن تظهر الهوية ورقم التسجيل بوضوح.',
      chooseFile: 'اختيار ملف',
      fileSelected: 'تم اختيار الملف',
      submit: 'إرسال طلب الحساب',
      submitting: 'جاري الإرسال…',
      success:
        'تم استلام طلبك. بعد التحقق من بطاقة الطالب ستتمكن من الولوج (المرحلة القادمة من التطوير).',
      close: 'إغلاق',
      errors: {
        required: 'جميع الحقول مطلوبة بما فيها صورة البطاقة.',
        email: 'أدخل بريداً إلكترونياً صالحاً.',
        fileType: 'الملف يجب أن يكون صورة (JPG/PNG/WEBP).',
      },
    },
    loginSoon: 'صفحة الدخول قيد التهيئة — ابدأ بإنشاء حساب ببطاقة الطالب.',
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
      { label: 'Accès', value: 'Carte étudiant' },
      { label: 'Analyse', value: 'Ratios & indicateurs' },
      { label: 'Nidham', value: 'Anafin' },
    ],
    heroBadge: "Plateforme universitaire d'analyse financière",
    heroTitle: 'Analysez les données financières',
    heroTitleAccent: 'avec exigence académique',
    heroDesc:
      'Nidham Anafin s’adresse aux étudiants et chercheurs de l’établissement universitaire. La création de compte passe par la carte étudiant pour sécuriser l’accès.',
    heroLogin: 'Connexion',
    heroRegister: 'Créer un compte (carte étudiant)',
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
        desc: 'L’inscription est liée à la carte étudiant pour limiter les comptes hors campus.',
      },
    ],
    aboutTitle: 'À propos',
    aboutLead: `${SITE_BRAND.name} fait partie de l’écosystème Nidham, dédié au contexte universitaire : analyse financière pédagogique, sécurisée, en arabe et en français.`,
    aboutHighlights: [
      {
        value: 'Carte',
        label: 'Vérification universitaire',
        detail: 'Dépôt d’une photo de la carte étudiant lors de l’inscription.',
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
    ctaDesc: 'Créez votre compte avec la carte étudiant de votre établissement.',
    ctaButton: 'Créer un compte (carte étudiant)',
    footerTagline: SITE_BRAND.taglineFr,
    footerRights: 'Tous droits réservés.',
    register: {
      title: 'Créer un compte étudiant',
      intro:
        'Renseignez vos informations et déposez une photo lisible de votre carte étudiant. La validation sera finalisée ensuite.',
      fullName: 'Nom complet',
      email: 'E-mail universitaire',
      university: 'Établissement universitaire',
      studentId: 'N° d’inscription / carte',
      password: 'Mot de passe',
      cardLabel: 'Photo de la carte étudiant',
      cardHint: 'JPG ou PNG — identité et numéro d’inscription visibles.',
      chooseFile: 'Choisir un fichier',
      fileSelected: 'Fichier sélectionné',
      submit: 'Envoyer la demande',
      submitting: 'Envoi…',
      success:
        'Demande reçue. Après vérification de la carte étudiant, l’accès sera ouvert (prochaine étape de développement).',
      close: 'Fermer',
      errors: {
        required: 'Tous les champs sont requis, y compris la photo de la carte.',
        email: 'Saisissez un e-mail valide.',
        fileType: 'Le fichier doit être une image (JPG/PNG/WEBP).',
      },
    },
    loginSoon: 'La page de connexion arrive bientôt — commencez par créer un compte carte étudiant.',
  },
}

export function getLandingContent(lang) {
  return content[lang] || content[DEFAULT_LANDING_LANG]
}
