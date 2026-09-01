/**
 * KASHMIR DECOR — internationalization.
 * Locales: Russian (default), English, Uzbek.
 * Brand is positioned as a curtain SALON (Салон штор), not a studio.
 */

export const LOCALES = ["ru", "en", "uz"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "ru";

export const LOCALE_LABELS: Record<Locale, string> = {
  ru: "Русский",
  en: "English",
  uz: "O‘zbekcha",
};
export const LOCALE_SHORT: Record<Locale, string> = { ru: "RU", en: "EN", uz: "UZ" };

type V = string | string[];

const STR: Record<Locale, Record<string, V>> = {
  /* ----------------------------- RUSSIAN ----------------------------- */
  ru: {
    "nav.collection": "Коллекция",
    "nav.interiors": "Интерьеры",
    "nav.gallery": "Галерея",
    "nav.studio": "Салон",
    "nav.location": "Локация",
    "nav.contact": "Контакты",
    "hero.eyebrow": "Салон штор · Дизайн интерьеров",
    "hero.seoTitle": "Шторы на заказ в Ташкенте",
    "hero.statement":
      "Шторы и интерьеры, созданные со сдержанностью архитектуры и теплом тонких тканей.",
    "hero.scroll": "Листайте",
    "loader.sub": "Роскошные шторы и интерьеры",
    "manifesto.label": "Салон",
    "collection.eyebrow": "Коллекция",
    "collection.title": "Шторы на заказ",
    "collection.all": "Все",
    "trending.eyebrow": "ТОП",
    "trending.title": "Самые популярные",
    "collection.subtitle":
      "Тщательный подбор драпировки, плотности и материала — от полупрозрачных тюлей до светопоглощающего бархата.",
    "collection.featured": "Избранное",
    "collection.empty": "Коллекция скоро появится.",
    "interiors.eyebrow": "Интерьеры",
    "interiors.title": "Композиции из света",
    "interiors.subtitle":
      "Избранные интерьерные проекты, где шторы, поверхности и пропорции задуманы как единое целое.",
    "interiors.location": "Интерьер",
    "interiors.empty": "Интерьеры скоро появятся.",
    "stats.title": "В цифрах",
    "about.eyebrow": "Салон",
    "about.title": "Салон спокойных, продуманных интерьеров",
    "about.text":
      "KASHMIR DECOR — салон штор и дизайна интерьеров, преданный материалу, свету и пропорции. Мы создаём, шьём и устанавливаем оформление окон и целые интерьеры — спокойные, архитектурные и ненавязчиво роскошные, созданные на годы.",
    "about.services": [
      "Дизайн штор и драпировок",
      "Пошив и монтаж",
      "Дизайн интерьеров",
      "Стилизация и отделка",
    ],
    "location.eyebrow": "Локация",
    "location.title": "Посетите салон",
    "location.address": "Адрес",
    "location.hours": "Часы работы",
    "location.phone": "Телефон",
    "location.directions": "Построить маршрут",
    "contact.eyebrow": "Контакты",
    "contact.title": "Начать проект",
    "contact.text":
      "Расскажите о вашем пространстве. Мы ответим, чтобы обсудить шторы, интерьеры и детали, которые делают комнату завершённой.",
    "contact.with": "Свяжитесь с нами",
    "form.name": "Имя",
    "form.phone": "Телефон",
    "form.email": "Эл. почта",
    "form.message": "Сообщение",
    "form.namePh": "Ваше имя",
    "form.phonePh": "+7 …",
    "form.emailPh": "you@email.com",
    "form.messagePh": "Расскажите о вашем пространстве…",
    "form.send": "Отправить",
    "form.sending": "Отправка…",
    "form.successTitle": "Спасибо. Ваше сообщение получено.",
    "form.successText": "Мы скоро свяжемся с вами.",
    "form.another": "Отправить ещё",
    "form.error": "Не удалось отправить сообщение.",
    "footer.tagline": "Роскошные шторы и дизайн интерьеров. Салон и ателье.",
    "footer.explore": "Разделы",
    "footer.connect": "Связь",
    "footer.rights": "Все права защищены.",
    "footer.login": "Вход для салона",
    "footer.spelled": "Пишется KASHMIR",
    "detail.style": "Стиль",
    "detail.room": "Помещение",
    "detail.material": "Материал",
    "detail.color": "Цвет",
    "detail.category": "Категория",
    "detail.related": "Вам также понравится",
    "detail.contact": "Связаться с нами",
    "detail.share": "Поделиться",
    "detail.copied": "Ссылка скопирована",
    "detail.back": "Все шторы",
    "detail.fav": "Избранное",
    "detail.favAdd": "В избранное",
    "detail.favRemove": "Из избранного",
    "recent.title": "Недавно просмотренные",
    "process.eyebrow": "Процесс",
    "process.title": "Как мы работаем",
    "process.1t": "Знакомство",
    "process.1d": "Обсуждаем стиль, пространство и задачи.",
    "process.2t": "Замеры",
    "process.2d": "Точные замеры окон и помещения.",
    "process.3t": "Подбор",
    "process.3d": "Выбираем ткани и фактуры под интерьер.",
    "process.4t": "Пошив",
    "process.4d": "Шьём шторы с вниманием к деталям.",
    "process.5t": "Монтаж",
    "process.5d": "Устанавливаем и наводим финальный лоск.",
    "faq.eyebrow": "Вопросы",
    "faq.title": "Частые вопросы",
    "gallery.eyebrow": "Галерея",
    "gallery.title": "Избранное из наших проектов",
    "gallery.all": "Все",
    "gallery.interiors": "Интерьеры",
    "gallery.curtains": "Шторы",
    "gallery.projects": "Проекты",
    "gallery.empty": "Галерея скоро появится.",
    "lead.title": "Подберём стиль для вас",
    "lead.interest": "Какой стиль вам близок?",
    "lead.room": "Какое пространство?",
    "lead.contact": "Как связаться?",
    "lead.name": "Ваше имя",
    "lead.phone": "Телефон",
    "lead.send": "Отправить заявку",
    "lead.success": "Спасибо! Мы свяжемся с вами.",
    "lead.start": "Подобрать шторы",
    "fav.title": "Избранное",
    "fav.empty": "Пока пусто. Сохраняйте понравившиеся модели.",
    "collections.title": "Коллекции штор",
    "collections.eyebrow": "Каталог",
    "collections.count": "моделей",
    "rooms.title": "Для любого пространства",
  },

  /* ----------------------------- ENGLISH ----------------------------- */
  en: {
    "nav.collection": "Collection",
    "nav.interiors": "Interiors",
    "nav.gallery": "Gallery",
    "nav.studio": "Salon",
    "nav.location": "Location",
    "nav.contact": "Contact",
    "hero.eyebrow": "Curtain Salon · Interior Architecture",
    "hero.seoTitle": "Custom Curtains in Tashkent",
    "hero.statement":
      "Curtains and interiors composed with the restraint of architecture and the warmth of fine textiles.",
    "hero.scroll": "Scroll",
    "loader.sub": "Luxury Curtains & Interiors",
    "manifesto.label": "The Salon",
    "collection.eyebrow": "Collection",
    "collection.title": "Curtains, tailored",
    "collection.all": "All",
    "trending.eyebrow": "TOP",
    "trending.title": "Most loved",
    "collection.subtitle":
      "A curated study in drape, weight and material — from translucent sheers to light-absorbing velvet.",
    "collection.featured": "Featured",
    "collection.empty": "Our collection is being curated.",
    "interiors.eyebrow": "Interiors",
    "interiors.title": "Rooms composed in light",
    "interiors.subtitle":
      "Selected interior projects where curtain, surface and proportion are designed as one.",
    "interiors.location": "Interior",
    "interiors.empty": "No interiors published yet.",
    "stats.title": "By the numbers",
    "about.eyebrow": "Salon",
    "about.title": "A salon of quiet, considered interiors",
    "about.text":
      "KASHMIR DECOR is a curtain and interior design salon devoted to material, light and proportion. We design, tailor and install window dressings and full interiors that feel calm, architectural and quietly luxurious — built to last for years.",
    "about.services": [
      "Curtain & drapery design",
      "Tailoring & installation",
      "Interior architecture",
      "Styling & finishing",
    ],
    "location.eyebrow": "Location",
    "location.title": "Visit the salon",
    "location.address": "Address",
    "location.hours": "Working hours",
    "location.phone": "Phone",
    "location.directions": "Get directions",
    "contact.eyebrow": "Contact",
    "contact.title": "Begin a project",
    "contact.text":
      "Tell us about your space. We will respond to discuss curtains, interiors and the details that make a room feel complete.",
    "contact.with": "Contact with us",
    "form.name": "Name",
    "form.phone": "Phone",
    "form.email": "Email",
    "form.message": "Message",
    "form.namePh": "Your name",
    "form.phonePh": "+1 …",
    "form.emailPh": "you@email.com",
    "form.messagePh": "Tell us about your space…",
    "form.send": "Send message",
    "form.sending": "Sending…",
    "form.successTitle": "Thank you. Your message has been received.",
    "form.successText": "We will be in touch shortly.",
    "form.another": "Send another",
    "form.error": "Unable to send your message.",
    "footer.tagline": "Luxury Curtains & Interior Design. A curtain salon and design atelier.",
    "footer.explore": "Explore",
    "footer.connect": "Connect",
    "footer.rights": "All rights reserved.",
    "footer.login": "Salon Login",
    "footer.spelled": "Spelled KASHMIR",
    "detail.style": "Style",
    "detail.room": "Recommended room",
    "detail.material": "Material",
    "detail.color": "Color",
    "detail.category": "Category",
    "detail.related": "You may also like",
    "detail.contact": "Contact with us",
    "detail.share": "Share",
    "detail.copied": "Link copied",
    "detail.back": "All curtains",
    "detail.fav": "Favorites",
    "detail.favAdd": "Add to favorites",
    "detail.favRemove": "Remove from favorites",
    "recent.title": "Recently viewed",
    "process.eyebrow": "Process",
    "process.title": "How we work",
    "process.1t": "Discovery",
    "process.1d": "We discuss style, space and goals.",
    "process.2t": "Measurement",
    "process.2d": "Precise measurements of windows and rooms.",
    "process.3t": "Selection",
    "process.3d": "We choose fabrics and textures for the interior.",
    "process.4t": "Tailoring",
    "process.4d": "We craft curtains with attention to detail.",
    "process.5t": "Installation",
    "process.5d": "We install and add the final polish.",
    "faq.eyebrow": "Questions",
    "faq.title": "Frequently asked",
    "gallery.eyebrow": "Gallery",
    "gallery.title": "Selected work from our projects",
    "gallery.all": "All",
    "gallery.interiors": "Interiors",
    "gallery.curtains": "Curtains",
    "gallery.projects": "Projects",
    "gallery.empty": "Gallery coming soon.",
    "lead.title": "Let's find your style",
    "lead.interest": "Which style fits you?",
    "lead.room": "Which space?",
    "lead.contact": "How should we reach you?",
    "lead.name": "Your name",
    "lead.phone": "Phone",
    "lead.send": "Send request",
    "lead.success": "Thank you! We'll be in touch.",
    "lead.start": "Find my curtains",
    "fav.title": "Favorites",
    "fav.empty": "Nothing yet. Save the styles you love.",
    "collections.title": "Curtain collections",
    "collections.eyebrow": "Catalog",
    "collections.count": "styles",
    "rooms.title": "For any space",
  },

  /* ------------------------------ UZBEK ------------------------------ */
  uz: {
    "nav.collection": "Kolleksiya",
    "nav.interiors": "Interyerlar",
    "nav.gallery": "Galereya",
    "nav.studio": "Salon",
    "nav.location": "Manzil",
    "nav.contact": "Aloqa",
    "hero.eyebrow": "Pardalar saloni · Interyer dizayni",
    "hero.seoTitle": "Toshkentda pardalar buyurtma qilish",
    "hero.statement":
      "Me'moriy nafosat va nozik matolar issiqligi bilan yaratilgan parda va interyerlar.",
    "hero.scroll": "Pastga",
    "loader.sub": "Hashamatli pardalar va interyerlar",
    "manifesto.label": "Salon",
    "collection.eyebrow": "Kolleksiya",
    "collection.title": "Pardalar, mahsus",
    "collection.all": "Barchasi",
    "trending.eyebrow": "TOP",
    "trending.title": "Eng mashhurlari",
    "collection.subtitle":
      "Drapirovka, zichlik va materialni tanlash — yarim shaffof tyullardan yorug'likni yutuvchi baxmaldan.",
    "collection.featured": "Tavsiya",
    "collection.empty": "Kolleksiyamiz tayyorlanmoqda.",
    "interiors.eyebrow": "Interyerlar",
    "interiors.title": "Yorug'likdan tuzilgan xonalar",
    "interiors.subtitle":
      "Parda, yuza va nisbatlar yaxlitlikda loyihalangan interyerlar.",
    "interiors.location": "Interyer",
    "interiors.empty": "Interyerlar tez orada.",
    "stats.title": "Raqamlarda",
    "about.eyebrow": "Salon",
    "about.title": "Tinch, o'ylangan interyerlar saloni",
    "about.text":
      "KASHMIR DECOR — material, yorug'lik va nisbatga bag'ishlangan parda va interyer dizayni salonidir. Biz oyna bezaklari va butun interyerlarni loyihalaymiz, tikamiz va o'rnatamiz — tinch, me'moriy va nozik hashamatli, yillar davomida xizmat qiladigan.",
    "about.services": [
      "Parda va drapirovka dizayni",
      "Tikish va o'rnatish",
      "Interyer arxitekturasi",
      "Stillashtirish va bezak",
    ],
    "location.eyebrow": "Manzil",
    "location.title": "Salonga tashrif buyuring",
    "location.address": "Manzil",
    "location.hours": "Ish vaqti",
    "location.phone": "Telefon",
    "location.directions": "Yo'nalishni ko'rish",
    "contact.eyebrow": "Aloqa",
    "contact.title": "Loyihani boshlash",
    "contact.text":
      "O'zingizning joyingiz haqida so'zlab bering. Pardalar, interyerlar va xonani mukammal qiladigan tafsilotlarni muhokama qilamiz.",
    "contact.with": "Biz bilan bog'laning",
    "form.name": "Ism",
    "form.phone": "Telefon",
    "form.email": "Email",
    "form.message": "Xabar",
    "form.namePh": "Ismingiz",
    "form.phonePh": "+998 …",
    "form.emailPh": "you@email.com",
    "form.messagePh": "Joyingiz haqida so'zlab bering…",
    "form.send": "Yuborish",
    "form.sending": "Yuborilmoqda…",
    "form.successTitle": "Rahmat. Xabaringiz qabul qilindi.",
    "form.successText": "Tez orada bog'lanamiz.",
    "form.another": "Yana yuborish",
    "form.error": "Xabarni yuborib bo'lmadi.",
    "footer.tagline": "Hashamatli pardalar va interyer dizayni. Salon va atelye.",
    "footer.explore": "Bo'limlar",
    "footer.connect": "Bog'lanish",
    "footer.rights": "Barcha huquqlar himoyalangan.",
    "footer.login": "Salon kirishi",
    "footer.spelled": "KASHMIR deb yoziladi",
    "detail.style": "Uslub",
    "detail.room": "Tavsiya etilgan xona",
    "detail.material": "Material",
    "detail.color": "Rang",
    "detail.category": "Kategoriya",
    "detail.related": "Sizga yoqishi mumkin",
    "detail.contact": "Biz bilan bog'laning",
    "detail.share": "Ulashish",
    "detail.copied": "Havola nusxalandi",
    "detail.back": "Barcha pardalar",
    "detail.fav": "Tanlanganlar",
    "detail.favAdd": "Tanlanganlarga qo'shish",
    "detail.favRemove": "Tanlanganlardan olib tashlash",
    "recent.title": "Yaqinda ko'rilgan",
    "process.eyebrow": "Jarayon",
    "process.title": "Biz qanday ishlaymiz",
    "process.1t": "Tanishuv",
    "process.1d": "Uslub, joy va maqsadlarni muhokama qilamiz.",
    "process.2t": "O'lchash",
    "process.2d": "Oyna va xonalarni aniq o'lchaymiz.",
    "process.3t": "Tanlov",
    "process.3d": "Interyerga mos matolar va fakturalarni tanlaymiz.",
    "process.4t": "Tikish",
    "process.4d": "Pardalarni e'tibor bilan tikamiz.",
    "process.5t": "O'rnatish",
    "process.5d": "O'rnatamiz va yakuniy jozibani qo'shamiz.",
    "faq.eyebrow": "Savollar",
    "faq.title": "Tez-tez beriladigan savollar",
    "gallery.eyebrow": "Galereya",
    "gallery.title": "Loyihalarimizdan tanlov",
    "gallery.all": "Barchasi",
    "gallery.interiors": "Interyerlar",
    "gallery.curtains": "Pardalar",
    "gallery.projects": "Loyihalar",
    "gallery.empty": "Galereya tez orada.",
    "lead.title": "Sizga mos uslubni topamiz",
    "lead.interest": "Qaysi uslub sizga mos?",
    "lead.room": "Qaysi joy?",
    "lead.contact": "Qanday bog'lanamiz?",
    "lead.name": "Ismingiz",
    "lead.phone": "Telefon",
    "lead.send": "So'rov yuborish",
    "lead.success": "Rahmat! Siz bilan bog'lanamiz.",
    "lead.start": "Pardamni topish",
    "fav.title": "Tanlanganlar",
    "fav.empty": "Hozircha bo'sh. Yoqqan modellarni saqlang.",
    "collections.title": "Pardalar kolleksiyasi",
    "collections.eyebrow": "Katalog",
    "collections.count": "model",
    "rooms.title": "Har qanday joy uchun",
  },
};

/* --------------------- DB content translations ---------------------- */
type CurtainTr = { name: string; desc: string };
type InteriorTr = { title: string; desc: string; location: string };

const CURTAINS: Record<string, Partial<Record<Locale, CurtainTr>>> = {
  "atelier-taupe-drape": {
    ru: {
      name: "Портьеры «Ателье»",
      desc: "Классические, сшитые вручную плиссированные портьеры с мягким, структурным падением — для окон во всю высоту.",
    },
    uz: {
      name: "Pardalar «Atelye»",
      desc: "Qo'lda tikilgan, yumshoq va tuzilgan tushishli klassik plisse pardalar — to'liq balandlikdagi oynalar uchun.",
    },
  },
  "linen-sheer-veil": {
    ru: {
      name: "Льняной полупрозрачный тюль",
      desc: "Полупрозрачный лён, рассеивающий дневной свет в тихое свечение и сохраняющий архитектуру комнаты.",
    },
    uz: {
      name: "Linen shaffof tyul",
      desc: "Kun yorug'ligini tinch nurga aylantirib, xona arxitekturasini saqlovchi shaffof linen.",
    },
  },
  "graphite-velvet": {
    ru: {
      name: "Графитовый бархат",
      desc: "Плотный, светопоглощающий бархат с изысканным блеском — глубокий, кинематографичный и роскошный.",
    },
    uz: {
      name: "Grafit baxmal",
      desc: "Zich, yorug'likni yutuvchi, nafis porloq baxmal — chuqur, kinematografik va hashamatli.",
    },
  },
  "organic-linen-weave": {
    ru: {
      name: "Органичное льняное плетение",
      desc: "Фактурное, органичное плетение, приносящее тепло и ощущение ремесла в минималистичные интерьеры.",
    },
    uz: {
      name: "Organik linen to'qima",
      desc: "Minimal interyerlarga issiqlik va hunarmandlik tuyg'usini olib keladigan fakturali, organik to'qima.",
    },
  },
};

const INTERIORS: Record<string, Partial<Record<Locale, InteriorTr>>> = {
  "calm-living-volume": {
    ru: {
      title: "Спокойный объём гостиной",
      desc: "Льняные портьеры во всю высоту, обрамляющие безмятежную гостиную в мягком утреннем свете.",
      location: "Частная резиденция",
    },
    uz: {
      title: "Tinch yashash maydoni",
      desc: "Yumshoq tong yorug'ligida tinch yashash xonasini o'rab turgan to'liq balandlikdagi linen pardalar.",
      location: "Shaxsiy rezidensiya",
    },
  },
  "open-plan-soft-light": {
    ru: {
      title: "Открытая планировка, мягкий свет",
      desc: "Архитектурное открытое пространство, где шторы мягко распределяют свет по графитовым и тёплым нейтральным тонам.",
      location: "Городская квартира",
    },
    uz: {
      title: "Ochiq reja, yumshoq yorug'lik",
      desc: "Pardalar grafit va iliq neytral tonlarga yorug'likni yumshoq taqsimlaydigan me'moriy ochiq maydon.",
      location: "Shahar kvartirasi",
    },
  },
  "travertine-dining": {
    ru: {
      title: "Столовая из травертина",
      desc: "Интерьер столовой, выстроенный вокруг единственного светильника, скульптурной мебели и высоких портьер.",
      location: "Пентхаус",
    },
    uz: {
      title: "Travertin ovqatxonasi",
      desc: "Yagona chiroq, haykaltarosh mebel va balq pardalar atrofida qurilgan ovqatxona interyeri.",
      location: "Penthauz",
    },
  },
};

/* Statistics: label + suffix translations (keyed by lowercased DB label). */
const STATS: Record<string, Partial<Record<Locale, string>>> = {
  clients: { ru: "Клиенты", uz: "Mijozlar" },
  experience: { ru: "Опыт работы", en: "Experience", uz: "Tajriba" },
  "attention to detail": { ru: "Внимание к деталям", uz: "Tafsilotlarga e'tibor" },
};

const STAT_SUFFIX: Record<string, Partial<Record<Locale, string>>> = {
  clients: { ru: "+", en: "+", uz: "+" },
  experience: { ru: " лет", en: " yrs", uz: " yil" },
  "attention to detail": { ru: "%", en: "%", uz: "%" },
};

/* ------------------------------ helpers ----------------------------- */
export function translate(locale: Locale, key: string): string {
  const v = STR[locale][key] ?? STR.en[key];
  return typeof v === "string" ? v : key;
}

export function translateArr(locale: Locale, key: string): string[] {
  const v = STR[locale][key] ?? STR.en[key];
  return Array.isArray(v) ? v : [];
}

export function curtainTr(
  locale: Locale,
  slug: string,
  field: "name" | "desc",
  fallback: string,
): string {
  const loc = CURTAINS[slug]?.[locale];
  if (loc) return field === "name" ? loc.name : loc.desc;
  return fallback;
}

export function interiorTr(
  locale: Locale,
  slug: string,
  field: "title" | "desc" | "location",
  fallback: string,
): string {
  const loc = INTERIORS[slug]?.[locale];
  if (loc) return loc[field];
  return fallback;
}

export function statTr(locale: Locale, label: string, fallback: string): string {
  return STATS[label.trim().toLowerCase()]?.[locale] ?? fallback;
}

export function statSuffixTr(
  locale: Locale,
  label: string,
  fallback: string,
): string {
  return STAT_SUFFIX[label.trim().toLowerCase()]?.[locale] ?? fallback;
}

/* -------------------------- Admin translations -------------------------
 * Single source of truth: every admin string is declared once as a
 * [ru, en, uz] triple, so no key can silently fall back to English.
 * ---------------------------------------------------------------------- */
type Triple = readonly [ru: string, en: string, uz: string];

const ADMIN_DICT: Record<string, Triple> = {
  /* shell / navigation */
  "a.title": ["KASHMIR · Админ", "KASHMIR · Admin", "KASHMIR · Admin"],
  "a.dashboard": ["Панель", "Dashboard", "Boshqaruv paneli"],
  "a.curtains": ["Шторы", "Curtains", "Pardalar"],
  "a.interiors": ["Интерьеры", "Interiors", "Interyerlar"],
  "a.gallery": ["Галерея", "Gallery", "Galereya"],
  "a.categories": ["Категории", "Categories", "Kategoriyalar"],
  "a.statistics": ["Статистика", "Statistics", "Statistika"],
  "a.leads": ["Заявки", "Leads", "So‘rovlar"],
  "a.messages": ["Сообщения", "Messages", "Xabarlar"],
  "a.faq": ["Вопросы", "FAQ", "Savollar"],
  "a.settings": ["Настройки", "Settings", "Sozlamalar"],
  "a.signout": ["Выйти", "Sign out", "Chiqish"],
  "a.viewSite": ["Открыть сайт", "View public site", "Saytni ochish"],
  "a.menu": ["Меню", "Menu", "Menyu"],

  /* login */
  "a.loginTitle": ["Вход", "Sign in", "Kirish"],
  "a.loginSub": [
    "Закрытая зона. Только для сотрудников.",
    "Restricted area. Authorized members only.",
    "Cheklangan hudud. Faqat xodimlar uchun.",
  ],
  "a.email": ["Email", "Email", "Email"],
  "a.password": ["Пароль", "Password", "Parol"],
  "a.signin": ["Войти", "Sign in", "Kirish"],
  "a.signing": ["Вход…", "Signing in…", "Kirilmoqda…"],
  "a.invalid": [
    "Неверный email или пароль.",
    "Invalid email or password.",
    "Email yoki parol noto‘g‘ri.",
  ],
  "a.networkErr": [
    "Ошибка сети. Попробуйте ещё раз.",
    "Network error. Please try again.",
    "Tarmoq xatosi. Qayta urinib ko‘ring.",
  ],
  "a.selectLanguage": ["Выбрать язык", "Select language", "Tilni tanlash"],

  /* generic actions */
  "a.add": ["Добавить", "Add", "Qo‘shish"],
  "a.edit": ["Изменить", "Edit", "Tahrirlash"],
  "a.delete": ["Удалить", "Delete", "O‘chirish"],
  "a.save": ["Сохранить", "Save", "Saqlash"],
  "a.cancel": ["Отмена", "Cancel", "Bekor qilish"],
  "a.saving": ["Сохранение…", "Saving…", "Saqlanmoqda…"],
  "a.loading": ["Загрузка…", "Loading…", "Yuklanmoqda…"],
  "a.visible": ["Виден", "Visible", "Ko‘rinadi"],
  "a.hidden": ["Скрыт", "Hidden", "Yashirin"],
  "a.visibleOnSite": ["Показывать на сайте", "Visible on site", "Saytda ko‘rinsin"],
  "a.featured": ["Избранное", "Featured", "Tanlangan"],
  "a.feature": ["В избранное", "Feature", "Tanlanganga qo‘shish"],
  "a.active": ["Активен", "Active", "Faol"],
  "a.untitled": ["Без названия", "Untitled", "Nomsiz"],
  "a.order": ["порядок", "order", "tartib"],

  /* generic fields */
  "a.name": ["Название", "Name", "Nomi"],
  "a.description": ["Описание", "Description", "Tavsif"],
  "a.image": ["Изображение", "Image", "Rasm"],
  "a.sort": ["Порядок", "Sort order", "Tartib raqami"],
  "a.upload": ["Загрузить фото", "Upload image", "Rasm yuklash"],
  "a.uploading": ["Загрузка…", "Uploading…", "Yuklanmoqda…"],
  "a.noImage": ["Нет фото", "No image", "Rasm yo‘q"],
  "a.imagePh": [
    "https://… или загрузите ниже",
    "https://… or upload below",
    "https://… yoki quyidan yuklang",
  ],
  "a.material": ["Материал", "Material", "Material"],
  "a.color": ["Цвет", "Color", "Rang"],
  "a.category": ["Категория", "Category", "Kategoriya"],
  "a.style": ["Стиль", "Style", "Uslub"],
  "a.room": ["Помещение", "Room", "Xona"],
  "a.title_field": ["Заголовок", "Title", "Sarlavha"],
  "a.location": ["Локация", "Location", "Joylashuv"],
  "a.none": ["— Нет —", "— None —", "— Yo‘q —"],
  "a.value": ["Значение", "Value", "Qiymat"],
  "a.suffix": ["Суффикс", "Suffix", "Qo‘shimcha"],
  "a.label": ["Метка", "Label", "Yorliq"],
  "a.slug": ["Slug", "Slug", "Slug"],
  "a.phone": ["Телефон", "Phone", "Telefon"],
  "a.status": ["Статус", "Status", "Holat"],
  "a.all": ["Все", "All", "Barchasi"],

  /* errors / confirmations */
  "a.confirmDel": ["Удалить навсегда?", "Delete permanently?", "Butunlay o‘chirilsinmi?"],
  "a.confirmDelCurtain": [
    "Удалить эту штору навсегда?",
    "Delete this curtain permanently?",
    "Bu parda butunlay o‘chirilsinmi?",
  ],
  "a.confirmDelInterior": [
    "Удалить этот интерьер?",
    "Delete this interior?",
    "Bu interyer o‘chirilsinmi?",
  ],
  "a.confirmDelImage": ["Удалить это фото?", "Delete this image?", "Bu rasm o‘chirilsinmi?"],
  "a.confirmDelCategory": [
    "Удалить эту категорию?",
    "Delete this category?",
    "Bu kategoriya o‘chirilsinmi?",
  ],
  "a.confirmDelStat": [
    "Удалить эту статистику?",
    "Delete this statistic?",
    "Bu statistika o‘chirilsinmi?",
  ],
  "a.confirmDelFaq": ["Удалить этот вопрос?", "Delete this FAQ?", "Bu savol o‘chirilsinmi?"],
  "a.confirmDelLead": ["Удалить эту заявку?", "Delete this lead?", "Bu so‘rov o‘chirilsinmi?"],
  "a.confirmDelMessage": [
    "Удалить это сообщение?",
    "Delete this message?",
    "Bu xabar o‘chirilsinmi?",
  ],
  "a.errLoad": ["Не удалось загрузить", "Load failed", "Yuklab bo‘lmadi"],
  "a.errSave": ["Не удалось сохранить", "Save failed", "Saqlab bo‘lmadi"],
  "a.errDelete": ["Не удалось удалить", "Delete failed", "O‘chirib bo‘lmadi"],
  "a.errUpdate": ["Не удалось обновить", "Update failed", "Yangilab bo‘lmadi"],
  "a.errUpload": ["Не удалось загрузить файл.", "Upload failed.", "Faylni yuklab bo‘lmadi."],
  "a.reqName": ["Укажите название.", "Name is required.", "Nomi kiritilishi shart."],
  "a.reqTitle": ["Укажите заголовок.", "Title is required.", "Sarlavha kiritilishi shart."],
  "a.reqLabel": ["Укажите метку.", "Label is required.", "Yorliq kiritilishi shart."],
  "a.reqImage": ["Добавьте изображение.", "Image is required.", "Rasm kiritilishi shart."],
  "a.reqQuestionEn": [
    "Укажите вопрос (EN).",
    "Question (EN) is required.",
    "Savol (EN) kiritilishi shart.",
  ],

  /* faq */
  "a.questionEN": ["Вопрос (EN)", "Question (EN)", "Savol (EN)"],
  "a.answerEN": ["Ответ (EN)", "Answer (EN)", "Javob (EN)"],
  "a.questionRU": ["Вопрос (RU)", "Question (RU)", "Savol (RU)"],
  "a.answerRU": ["Ответ (RU)", "Answer (RU)", "Javob (RU)"],
  "a.questionUZ": ["Вопрос (UZ)", "Question (UZ)", "Savol (UZ)"],
  "a.answerUZ": ["Ответ (UZ)", "Answer (UZ)", "Javob (UZ)"],
  "a.english": ["Английский", "English", "Inglizcha"],
  "a.russian": ["Русский", "Russian", "Ruscha"],
  "a.uzbek": ["Узбекский", "Uzbek", "O‘zbekcha"],

  /* statuses */
  "a.new": ["Новые", "New", "Yangi"],
  "a.contacted": ["Связались", "Contacted", "Bog‘lanilgan"],
  "a.inProgress": ["В работе", "In progress", "Jarayonda"],
  "a.converted": ["Успешно", "Converted", "Muvaffaqiyatli"],
  "a.closed": ["Закрыто", "Closed", "Yopilgan"],

  /* dashboard */
  "a.dashSub": ["Обзор салона KASHMIR.", "Overview of your KASHMIR salon.", "KASHMIR saloni sharhi."],
  "a.newMessages": ["Новые сообщения", "New messages", "Yangi xabarlar"],
  "a.recentMsgs": ["Последние сообщения", "Recent messages", "So‘nggi xabarlar"],
  "a.viewAll": ["Смотреть все", "View all", "Barchasini ko‘rish"],

  /* empty states */
  "a.noMsgs": ["Сообщений пока нет.", "No messages yet.", "Hozircha xabarlar yo‘q."],
  "a.noLeads": ["Заявок пока нет.", "No leads yet.", "Hozircha so‘rovlar yo‘q."],
  "a.noCurtains": [
    "Штор пока нет. Добавьте первую.",
    "No curtains yet. Add your first.",
    "Hozircha pardalar yo‘q. Birinchisini qo‘shing.",
  ],
  "a.noInteriors": [
    "Интерьеров пока нет. Добавьте первый.",
    "No interiors yet. Add your first.",
    "Hozircha interyerlar yo‘q. Birinchisini qo‘shing.",
  ],
  "a.noFaq": ["Вопросов пока нет.", "No questions yet.", "Hozircha savollar yo‘q."],
  "a.noGallery": ["Изображений пока нет.", "No gallery images yet.", "Hozircha rasmlar yo‘q."],
  "a.noCats": ["Категорий пока нет.", "No categories yet.", "Hozircha kategoriyalar yo‘q."],
  "a.noStats": ["Статистики пока нет.", "No statistics yet.", "Hozircha statistika yo‘q."],

  /* settings */
  "a.settingsSub": [
    "Контакты, соцсети и тексты сайта.",
    "Contact details, social links and on-site copy.",
    "Aloqa ma’lumotlari, ijtimoiy havolalar va sayt matnlari.",
  ],
  "a.homepageNote": [
    "Тексты главной автоматически переводятся на русский (по умолчанию), английский и узбекский.",
    "Homepage text is translated automatically into Russian (default), English and Uzbek.",
    "Bosh sahifa matnlari avtomatik ravishda rus (asosiy), ingliz va o‘zbek tillariga tarjima qilinadi.",
  ],
  "a.contactSocial": ["Контакты и соцсети", "Contact & social", "Aloqa va ijtimoiy tarmoqlar"],
  "a.homepageCopy": ["Тексты главной", "Homepage copy", "Bosh sahifa matnlari"],
  "a.instagram": ["Ссылка Instagram", "Instagram URL", "Instagram havolasi"],
  "a.telegram": ["Ссылка Telegram", "Telegram URL", "Telegram havolasi"],
  "a.workingHours": ["Часы работы", "Working hours", "Ish vaqti"],
  "a.address": ["Адрес", "Address", "Manzil"],
  "a.mapQuery": ["Запрос для карты", "Map search query", "Xarita qidiruv so‘rovi"],
  "a.emailField": ["Email", "Email", "Email"],
  "a.saveSettings": ["Сохранить настройки", "Save settings", "Sozlamalarni saqlash"],
  "a.saved": ["Сохранено. Сайт обновлён.", "Saved. The public site is updated.", "Saqlandi. Sayt yangilandi."],

  /* page subtitles */
  "a.curtainsSub": [
    "Добавляйте, изменяйте и скрывайте шторы коллекции.",
    "Add, edit, hide and curate your curtain collection.",
    "Pardalar to‘plamini qo‘shing, tahrirlang va yashiring.",
  ],
  "a.interiorsSub": [
    "Управляйте интерьерными проектами галереи.",
    "Manage interior projects shown in the editorial gallery.",
    "Galereyadagi interyer loyihalarini boshqaring.",
  ],
  "a.gallerySub": [
    "Управляйте изображениями страницы галереи.",
    "Manage the dedicated gallery page images.",
    "Galereya sahifasi rasmlarini boshqaring.",
  ],
  "a.categoriesSub": [
    "Объединяйте шторы в коллекции.",
    "Organize curtains into collections.",
    "Pardalarni to‘plamlarga ajrating.",
  ],
  "a.statisticsSub": [
    "Цифры, отображаемые в блоке статистики.",
    "Figures shown in the editorial numbers band.",
    "Raqamlar blokida ko‘rsatiladigan ma’lumotlar.",
  ],
  "a.faqSub": [
    "Управляйте вопросами и ответами на 3 языках.",
    "Manage frequently asked questions in 3 languages.",
    "Savol-javoblarni 3 tilda boshqaring.",
  ],
  "a.leadsSub": [
    "Заявки, полученные через форму подбора.",
    "Sales enquiries from the lead flow.",
    "So‘rov shakli orqali kelgan murojaatlar.",
  ],
  "a.messagesSub": [
    "Обращения через контактную форму.",
    "Enquiries submitted through the contact form.",
    "Aloqa shakli orqali yuborilgan murojaatlar.",
  ],

  /* add / new titles */
  "a.addCurtain": ["Добавить штору", "Add curtain", "Parda qo‘shish"],
  "a.addInterior": ["Добавить интерьер", "Add interior", "Interyer qo‘shish"],
  "a.addImage": ["Добавить фото", "Add image", "Rasm qo‘shish"],
  "a.addQuestion": ["Добавить вопрос", "Add question", "Savol qo‘shish"],
  "a.addCategory": ["Добавить категорию", "Add category", "Kategoriya qo‘shish"],
  "a.addStat": ["Добавить статистику", "Add statistic", "Statistika qo‘shish"],
  "a.editCurtain": ["Редактировать штору", "Edit curtain", "Pardani tahrirlash"],
  "a.editInterior": ["Редактировать интерьер", "Edit interior", "Interyerni tahrirlash"],
  "a.editImage": ["Редактировать фото", "Edit image", "Rasmni tahrirlash"],
  "a.editQuestion": ["Редактировать вопрос", "Edit question", "Savolni tahrirlash"],
  "a.editCategory": ["Редактировать категорию", "Edit category", "Kategoriyani tahrirlash"],
  "a.editStat": ["Редактировать статистику", "Edit statistic", "Statistikani tahrirlash"],
  "a.newCurtain": ["Новая штора", "New curtain", "Yangi parda"],
  "a.newInterior": ["Новый интерьер", "New interior", "Yangi interyer"],
  "a.newImage": ["Новое фото", "New image", "Yangi rasm"],
  "a.newQuestion": ["Новый вопрос", "New question", "Yangi savol"],
  "a.newCategory": ["Новая категория", "New category", "Yangi kategoriya"],
  "a.newStat": ["Новая статистика", "New statistic", "Yangi statistika"],
  "a.saveCurtain": ["Сохранить штору", "Save curtain", "Pardani saqlash"],
  "a.saveInterior": ["Сохранить интерьер", "Save interior", "Interyerni saqlash"],

  /* gallery categories */
  "a.catInterior": ["Интерьер", "Interior", "Interyer"],
  "a.catCurtain": ["Шторы", "Curtain", "Parda"],
  "a.catProject": ["Проект", "Project", "Loyiha"],
};

const LOCALE_INDEX: Record<Locale, 0 | 1 | 2> = { ru: 0, en: 1, uz: 2 };

export const ADMIN_STR: Record<Locale, Record<string, string>> = LOCALES.reduce(
  (acc, loc) => {
    const idx = LOCALE_INDEX[loc];
    const table: Record<string, string> = {};
    for (const [key, triple] of Object.entries(ADMIN_DICT)) table[key] = triple[idx];
    acc[loc] = table;
    return acc;
  },
  {} as Record<Locale, Record<string, string>>,
);

export function adminTr(locale: Locale, key: string): string {
  return ADMIN_STR[locale]?.[key] ?? ADMIN_STR[DEFAULT_LOCALE][key] ?? key;
}
