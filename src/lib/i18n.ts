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
    "hero.statement":
      "Шторы и интерьеры, созданные со сдержанностью архитектуры и теплом тонких тканей.",
    "hero.scroll": "Листайте",
    "loader.sub": "Роскошные шторы и интерьеры",
    "manifesto.label": "Салон",
    "collection.eyebrow": "Коллекция",
    "collection.title": "Шторы на заказ",
    "collection.all": "Все",
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
    "hero.statement":
      "Curtains and interiors composed with the restraint of architecture and the warmth of fine textiles.",
    "hero.scroll": "Scroll",
    "loader.sub": "Luxury Curtains & Interiors",
    "manifesto.label": "The Salon",
    "collection.eyebrow": "Collection",
    "collection.title": "Curtains, tailored",
    "collection.all": "All",
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
    "hero.statement":
      "Me'moriy nafosat va nozik matolar issiqligi bilan yaratilgan parda va interyerlar.",
    "hero.scroll": "Pastga",
    "loader.sub": "Hashamatli pardalar va interyerlar",
    "manifesto.label": "Salon",
    "collection.eyebrow": "Kolleksiya",
    "collection.title": "Pardalar, mahsus",
    "collection.all": "Barchasi",
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
