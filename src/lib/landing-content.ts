/**
 * Real, useful copy for the SEO landing pages.
 * No keyword stuffing, no fake claims — content matches Kashmir Decor's
 * actual offering (premium curtain salon: design, measurement, tailoring,
 * installation).
 */

import type { Locale } from "@/lib/i18n";

type PageCopy = {
  eyebrow: string;
  h1: string;
  intro: string;
  image: string;
  imageAlt: string;
  sections: { heading: string; body: string }[];
  highlights: string[];
  ctaLabel: string;
  ctaHref: string;
  related: { href: string; label: string }[];
};

const LANDING: Record<string, Record<Locale, PageCopy>> = {
  "toshkentda-pardalar": {
    uz: {
      eyebrow: "Kashmir Decor · Premium parda saloni",
      h1: "Toshkentda pardalar",
      intro:
        "Kashmir Decor — Toshkentdagi premium parda saloni. Uy, mehmonxona, yotoqxona va ofis interyeri uchun sifatli parda tanlash, o'lchash, professional tikish va o'rnatish xizmatlarini bir joyda taqdim etamiz.",
      image: "/assets/hero.jpg",
      imageAlt: "Toshkentda zamonaviy va klassik pardalar — Kashmir Decor",
      sections: [
        {
          heading: "Parda tanlash — interyerning yakuniy bo'g'ini",
          body:
            "Parda — xonaning kayfiyati, yorug'lik balansi va me'moriy nisbatini belgilaydigan asosiy element. Toshkentdagi uy va ofislarning aksarida derazalarning balandligi, yorug'lik tushish burchagi va interyer uslubi individual yondashuvni talab qiladi. Kashmir Decor salonida har bir loyiha xonaning o'lchami, rangi va yorug'lik harakatidan kelib chiqib tanlanadi.",
        },
        {
          heading: "Zamonaviy va klassik uslublar",
          body:
            "Salonda zamonaviy minimalistik pardalardan tortib, Rim parda modellarigacha, klassik portyerlar va blackout turlargacha mavjud. Matolar — tabiiy va aralash tolalardan: baxmal, linen, jacquard, tyul va boshqa sifatli turlar. Zamonaviy interyer uchun — tekis, lakonik shakllar; klassik uslub uchun — og'ir, olijanob drapirovkalar.",
        },
        {
          heading: "O'lcham, material va buyurtma jarayoni",
          body:
            "Mutaxassis xonaga chiqib, deraza va devor o'lchamlarini aniq oladi, matolar namunalarini ko'rsatadi va interyerga mos rang hamda zichlikni tanlashga yordam beradi. Tanlovdan so'ng ustaxonamizda individual o'lcham asosida tikish amalga oshiriladi, so'ngra professional montaj qilinadi. Butun jarayon bir necha kun ichida, xonaning tozaligi va detallarga e'tibor bilan yakunlanadi.",
        },
        {
          heading: "Har bir xona uchun",
          body:
            "Mehmonxona uchun — yorug'likni mayin taqsimlovchi, obro'li portyerlar; yotoqxona uchun — blackout va yumshoq tyul kombinatsiyasi; ofis uchun — ofis kayfiyatiga mos, chidamli matolar; bolalar xonasi va oshxonalar uchun — oson parvarishlanadigan, yengil materiallar tanlanadi. Rim pardalari oshxona va kabinetlarda qulay, zamonaviy yechim sifatida tez-tez tanlanadi.",
        },
        {
          heading: "Aloqa va buyurtma",
          body:
            "Parda buyurtma berish, o'lchov chaqirish yoki matolar bilan tanishish uchun quyidagi aloqa shaklidan foydalaning yoki salonga tashrif buyuring. Toshkent bo'ylab chiqib o'lchash va montaj qilish xizmati mavjud.",
        },
      ],
      highlights: [
        "Chiqib o'lchash va maslahat",
        "Individual tikish",
        "Professional montaj",
        "Keng sifatli mato tanlovi",
        "Premium va klassik uslublar",
        "Zamonaviy Rim parda modellari",
      ],
      ctaLabel: "Buyurtma berish",
      ctaHref: "/#contact",
      related: [
        { href: "/zamonaviy-pardalar", label: "Zamonaviy pardalar" },
        { href: "/klassik-pardalar", label: "Klassik pardalar" },
        { href: "/rim-pardalar", label: "Rim pardalari" },
        { href: "/premium-pardalar", label: "Premium pardalar" },
        { href: "/collections", label: "To'liq kolleksiya" },
        { href: "/kontakt", label: "Aloqa" },
      ],
    },
    ru: {
      eyebrow: "Kashmir Decor · Премиум салон штор",
      h1: "Шторы в Ташкенте",
      intro:
        "Kashmir Decor — премиум салон штор в Ташкенте. Подбор, замер, профессиональный пошив и установка штор для дома, гостиной, спальни и офиса в одном месте.",
      image: "/assets/hero.jpg",
      imageAlt: "Современные и классические шторы в Ташкенте — Kashmir Decor",
      sections: [
        {
          heading: "Подбор штор — финальный акцент интерьера",
          body: "Шторы формируют настроение комнаты, баланс света и архитектурные пропорции. В домах и офисах Ташкента высота окон, угол падения света и стиль интерьера требуют индивидуального подхода. В Kashmir Decor каждый проект подбирается от размеров, цвета и движения света.",
        },
        {
          heading: "Современные и классические стили",
          body: "От минималистичных современных моделей до римских штор, классических портьер и блэкаутов. Ткани из натуральных и смесовых волокон: бархат, лён, жаккард, тюль.",
        },
        {
          heading: "Замер, ткань и заказ",
          body: "Специалист выезжает, снимает точные размеры, показывает образцы и помогает подобрать плотность и оттенок. Пошив по индивидуальным размерам и профессиональный монтаж выполняются в течение нескольких дней.",
        },
        {
          heading: "Для каждого помещения",
          body: "Гостиная, спальня с блэкаутом и тюлем, офис, кухня и детская — мы подбираем шторы под каждое пространство. Римские шторы — популярное решение для кухонь и кабинетов.",
        },
        {
          heading: "Контакт и заказ",
          body: "Чтобы заказать шторы, вызвать замерщика или ознакомиться с тканями — используйте форму ниже или посетите салон. Выезд по Ташкенту и монтаж включены.",
        },
      ],
      highlights: [
        "Выезд на замер",
        "Индивидуальный пошив",
        "Профессиональный монтаж",
        "Большой выбор тканей",
        "Премиум и классика",
        "Римские шторы",
      ],
      ctaLabel: "Заказать",
      ctaHref: "/#contact",
      related: [
        { href: "/zamonaviy-pardalar", label: "Современные шторы" },
        { href: "/klassik-pardalar", label: "Классические шторы" },
        { href: "/rim-pardalar", label: "Римские шторы" },
        { href: "/premium-pardalar", label: "Премиум шторы" },
        { href: "/collections", label: "Вся коллекция" },
        { href: "/kontakt", label: "Контакты" },
      ],
    },
    en: {
      eyebrow: "Kashmir Decor · Premium Curtain Salon",
      h1: "Curtains in Tashkent",
      intro:
        "Kashmir Decor is a premium curtain salon in Tashkent. Curtain selection, measurement, professional tailoring and installation for home, living room, bedroom and office — all in one place.",
      image: "/assets/hero.jpg",
      imageAlt: "Modern and classic curtains in Tashkent — Kashmir Decor",
      sections: [
        {
          heading: "Curtains define the room",
          body: "Curtains set the mood, light balance and architectural proportions of a room. Homes and offices in Tashkent often demand an individual approach. At Kashmir Decor each project is shaped by the space, color and movement of light.",
        },
        {
          heading: "Modern and classic styles",
          body: "From minimalist modern curtains to Roman shades, classic drapes and blackout options. Fabrics include natural and blended fibres — velvet, linen, jacquard and tulle.",
        },
        {
          heading: "Measurement, fabric and process",
          body: "A specialist visits your space for precise measurement, shows fabric samples and helps pick the right density and tone. Custom tailoring and professional installation are completed within days.",
        },
        {
          heading: "For every room",
          body: "Living rooms, bedrooms with blackout and sheer, offices, kitchens and children's rooms — curtains tailored to each space. Roman curtains are a popular modern choice for kitchens and studies.",
        },
        {
          heading: "Get in touch",
          body: "To order curtains, book a measurement or browse fabrics — use the contact form below or visit the salon. Tashkent-wide measurement and installation are included.",
        },
      ],
      highlights: [
        "On-site measurement",
        "Custom tailoring",
        "Professional installation",
        "Wide fabric selection",
        "Premium and classic styles",
        "Roman curtains",
      ],
      ctaLabel: "Order curtains",
      ctaHref: "/#contact",
      related: [
        { href: "/zamonaviy-pardalar", label: "Modern curtains" },
        { href: "/klassik-pardalar", label: "Classic curtains" },
        { href: "/rim-pardalar", label: "Roman curtains" },
        { href: "/premium-pardalar", label: "Premium curtains" },
        { href: "/collections", label: "Full collection" },
        { href: "/kontakt", label: "Contact" },
      ],
    },
  },
  "zamonaviy-pardalar": {
    uz: {
      eyebrow: "Zamonaviy uslub · Kashmir Decor",
      h1: "Zamonaviy pardalar",
      intro:
        "Toshkentdagi zamonaviy interyerlar uchun minimalist va lakonik parda yechimlari. Kashmir Decor zamonaviy uylar, studiyalar va ofislar uchun mos to'g'ri chiziqli, sodda va nafis pardalarni taklif etadi.",
      image: "/assets/curtain-01.jpg",
      imageAlt: "Toshkentda zamonaviy parda — Kashmir Decor",
      sections: [
        {
          heading: "Zamonaviylik — chiziq va yorug'lik muvozanati",
          body:
            "Zamonaviy parda — bu ortiqcha detal yo'q, sof chiziq va matoning o'ziga xos tuzilishi. U interyerning me'moriy qarorini qo'llab-quvvatlaydi, derazaga e'tiborni kuchaytiradi, lekin umumiy kompozitsiyani buzmaydi. Biz tekis matolar, monoxrom palitrallar va ko'zga tashlanmaydigan karnizlar bilan ishlaymiz.",
        },
        {
          heading: "Qaysi xonalarga mos",
          body:
            "Zamonaviy uslub loft, minimalizm, skandinaviya va neytral interyerlarga mos keladi. Yashash xonasi, kabinet, ofis va studio kvartiralar uchun eng yaxshi tanlov. Linen va paxta aralash matolar tabiiy, nafas oladigan tuyg'u beradi.",
        },
        {
          heading: "Toshkent iqlimi uchun",
          body:
            "Toshkentning yorqin quyoshi va yoz jaziramasini hisobga olib, zichligi mos, lekin og'ir bo'lmagan matolarni tavsiya qilamiz. Liner tizimlar va Rim parda variantlari kichik xonalarda ham qo'llaniladi.",
        },
      ],
      highlights: [
        "Minimalistik dizayn",
        "Tabiiy matolar",
        "Sof chiziqlar",
        "Zamonaviy karnizlar",
        "Ofis va uy uchun",
        "Quyosh nurini yumshatish",
      ],
      ctaLabel: "Zamonaviy pardalar tanlash",
      ctaHref: "/#contact",
      related: [
        { href: "/rim-pardalar", label: "Rim pardalari" },
        { href: "/klassik-pardalar", label: "Klassik pardalar" },
        { href: "/premium-pardalar", label: "Premium pardalar" },
        { href: "/toshkentda-pardalar", label: "Toshkentda pardalar" },
        { href: "/collections", label: "Kolleksiya" },
      ],
    },
    ru: {
      eyebrow: "Современный стиль · Kashmir Decor",
      h1: "Современные шторы",
      intro: "Минималистичные и лаконичные шторы для современных интерьеров Ташкента.",
      image: "/assets/curtain-01.jpg",
      imageAlt: "Современные шторы в Ташкенте — Kashmir Decor",
      sections: [
        { heading: "Минимализм и баланс света", body: "Современные шторы — чистые линии и фактура ткани без лишних деталей." },
        { heading: "Для каких помещений", body: "Подходят лофтам, минимализму и скандинавскому стилю — гостиные, кабинеты, офисы, студии." },
        { heading: "Для климата Ташкента", body: "Плотные, но не тяжёлые ткани; линейные системы и римские шторы для небольших пространств." },
      ],
      highlights: ["Минимализм", "Натуральные ткани", "Чистые линии", "Для дома и офиса"],
      ctaLabel: "Подобрать",
      ctaHref: "/#contact",
      related: [
        { href: "/rim-pardalar", label: "Римские шторы" },
        { href: "/klassik-pardalar", label: "Классические шторы" },
        { href: "/premium-pardalar", label: "Премиум шторы" },
        { href: "/toshkentda-pardalar", label: "Шторы в Ташкенте" },
      ],
    },
    en: {
      eyebrow: "Modern style · Kashmir Decor",
      h1: "Modern curtains",
      intro: "Minimalist, laconic curtain solutions for modern interiors in Tashkent.",
      image: "/assets/curtain-01.jpg",
      imageAlt: "Modern curtains in Tashkent — Kashmir Decor",
      sections: [
        { heading: "Minimalism and balance", body: "Modern curtains mean clean lines and textured fabric without excess detail." },
        { heading: "Suitable spaces", body: "Lofts, minimalist and Scandinavian interiors — living rooms, studies, offices, studios." },
        { heading: "For Tashkent climate", body: "Dense but lightweight fabrics; linear and Roman systems for compact spaces." },
      ],
      highlights: ["Minimalist design", "Natural fabrics", "Clean lines", "Home & office"],
      ctaLabel: "Explore modern curtains",
      ctaHref: "/#contact",
      related: [
        { href: "/rim-pardalar", label: "Roman curtains" },
        { href: "/klassik-pardalar", label: "Classic curtains" },
        { href: "/premium-pardalar", label: "Premium curtains" },
        { href: "/toshkentda-pardalar", label: "Curtains in Tashkent" },
      ],
    },
  },
  "klassik-pardalar": {
    uz: {
      eyebrow: "Klassik uslub · Kashmir Decor",
      h1: "Klassik pardalar",
      intro:
        "Kashmir Decor salonida Toshkent klassik interyerlari uchun an'naviy nafislik bilan zamonaviy sifatni birlashtirgan pardalar. Baxmal, jacquard va og'ir drapirovkali portyerlar.",
      image: "/assets/curtain-03.jpg",
      imageAlt: "Klassik pardalar Toshkent — Kashmir Decor",
      sections: [
        {
          heading: "An'ana va hashamat",
          body:
            "Klassik pardalar — bu og'ir, olijanob matolar, chuqur drapirovkalar va o'ziga xos tantanavorlik. Ular katta derazali yashash xonalari, mehmonxonalar va klassik me'morchilikdagi xonadonlar uchun ayni muddao.",
        },
        {
          heading: "Mato tanlovi",
          body:
            "Baxmal, jacquard, satin va zich ipak aralashmalari — klassikaning asosiy matolari. Ular yorug'likni to'sadi, akustikani yaxshilaydi va xonaga obro'li ko'rinish beradi.",
        },
        {
          heading: "Lambriken va dekoratsiya",
          body:
            "Agar kerak bo'lsa, klassik chiziqdagi lambriken, bog'ichlar va dekorativ elementlar bilan ishlaymiz. Lekin zamonaviy didga mos yengil versiyalarni ham taklif etamiz — ortiqcha hashamat qo'shmasdan.",
        },
      ],
      highlights: [
        "Baxmal va jacquard",
        "Chuqur drapirovkalar",
        "Chiroyli portyerlar",
        "Klassik interyerga mos",
        "Yashash xonasi uchun",
        "Professional montaj",
      ],
      ctaLabel: "Klassik pardalarni ko'rish",
      ctaHref: "/#contact",
      related: [
        { href: "/premium-pardalar", label: "Premium pardalar" },
        { href: "/rim-pardalar", label: "Rim pardalari" },
        { href: "/zamonaviy-pardalar", label: "Zamonaviy pardalar" },
        { href: "/toshkentda-pardalar", label: "Toshkentda pardalar" },
        { href: "/collections", label: "Kolleksiya" },
      ],
    },
    ru: {
      eyebrow: "Классический стиль · Kashmir Decor",
      h1: "Классические шторы",
      intro: "Классические шторы с традиционным изяществом и современным качеством для ташкентских интерьеров.",
      image: "/assets/curtain-03.jpg",
      imageAlt: "Классические шторы Ташкент — Kashmir Decor",
      sections: [
        { heading: "Традиция и роскошь", body: "Тяжёлые благородные ткани, глубокие драпировки и ощущение торжественности." },
        { heading: "Выбор ткани", body: "Бархат, жаккард, сатин и плотные шелковые смеси." },
        { heading: "Ламбрекены и декор", body: "Работаем с классическими ламбрекенами и подхватами, а также с облегчёнными версиями без излишней пышности." },
      ],
      highlights: ["Бархат и жаккард", "Глубокие драпировки", "Портьеры", "Для гостиной"],
      ctaLabel: "Подобрать",
      ctaHref: "/#contact",
      related: [
        { href: "/premium-pardalar", label: "Премиум шторы" },
        { href: "/rim-pardalar", label: "Римские шторы" },
        { href: "/zamonaviy-pardalar", label: "Современные шторы" },
      ],
    },
    en: {
      eyebrow: "Classic style · Kashmir Decor",
      h1: "Classic curtains",
      intro: "Classic curtains combining traditional elegance with modern quality for Tashkent interiors.",
      image: "/assets/curtain-03.jpg",
      imageAlt: "Classic curtains Tashkent — Kashmir Decor",
      sections: [
        { heading: "Tradition and luxury", body: "Heavy noble fabrics, deep drapery and a sense of occasion." },
        { heading: "Fabrics", body: "Velvet, jacquard, satin and dense silk blends." },
        { heading: "Pelmet and trim", body: "We offer classic pelmets and tie-backs as well as lighter, contemporary versions." },
      ],
      highlights: ["Velvet and jacquard", "Deep drapery", "Portieres", "For living rooms"],
      ctaLabel: "Explore classic curtains",
      ctaHref: "/#contact",
      related: [
        { href: "/premium-pardalar", label: "Premium curtains" },
        { href: "/rim-pardalar", label: "Roman curtains" },
        { href: "/zamonaviy-pardalar", label: "Modern curtains" },
      ],
    },
  },
  "rim-pardalar": {
    uz: {
      eyebrow: "Rim uslubi · Kashmir Decor",
      h1: "Rim pardalari",
      intro:
        "Toshkentdagi oshxona, kabinet va kichik xonalar uchun qulay va nafis Rim parda modellari. Kashmir Decor tomonidan sifatli matolardan tikilgan zamonaviy Rim pardalari.",
      image: "/assets/curtain-02.jpg",
      imageAlt: "Rim pardalari Toshkent — Kashmir Decor",
      sections: [
        {
          heading: "Rim pardalarining afzalliklari",
          body:
            "Rim pardalari derazani to'g'ri va to'liq qoplaydi, ko'tarilganda yuqorida yig'ilib, joyni egallamaydi. Ular kichik xonalar, oshxona, bolalar xonasi, kabinet va ofis uchun ideal. Katta oynali klassik xonalarda ham zamonaviy yengillik sifatida qo'llaniladi.",
        },
        {
          heading: "Mato va dizayn",
          body:
            "Zich zig'ir, paxta aralash, blackout va yarim shaffof matolardan tayyorlanadi. Rangi va uslubi interyerga mos ravishda tanlanadi. Mexanizmlari sifatli — uzoq xizmat qiladi.",
        },
        {
          heading: "Qayerda ishlatish mumkin",
          body:
            "Oshxona va ovqat xonasi, bolalar xonasi, uy kabineti, ofislar va kichik kvartiralar uchun ayniqsa qulay. Yotoqxonada blackout Rim parda va tyul kombinatsiyasi chiroyli yechim bo'ladi.",
        },
      ],
      highlights: [
        "Kichik xonalarga mos",
        "Oshxona uchun qulay",
        "Yengil mexanizm",
        "Ko'p mato tanlovi",
        "Blackout varianti",
        "Professional o'rnatish",
      ],
      ctaLabel: "Rim pardalarga buyurtma berish",
      ctaHref: "/#contact",
      related: [
        { href: "/zamonaviy-pardalar", label: "Zamonaviy pardalar" },
        { href: "/klassik-pardalar", label: "Klassik pardalar" },
        { href: "/premium-pardalar", label: "Premium pardalar" },
        { href: "/toshkentda-pardalar", label: "Toshkentda pardalar" },
      ],
    },
    ru: {
      eyebrow: "Римский стиль · Kashmir Decor",
      h1: "Римские шторы",
      intro: "Удобные и элегантные римские шторы для кухонь, кабинетов и небольших помещений в Ташкенте.",
      image: "/assets/curtain-02.jpg",
      imageAlt: "Римские шторы Ташкент — Kashmir Decor",
      sections: [
        { heading: "Преимущества", body: "Аккуратно поднимаются вверх, не занимая места, идеально закрывают окно." },
        { heading: "Ткани и дизайн", body: "Плотный лён, хлопок, блэкаут и полупрозрачные ткани. Надёжные механизмы." },
        { heading: "Применение", body: "Кухня, детская, кабинет, офис, спальня в сочетании с тюлем." },
      ],
      highlights: ["Компактно", "Для кухни", "Надёжный механизм", "Блэкаут вариант"],
      ctaLabel: "Заказать римские шторы",
      ctaHref: "/#contact",
      related: [
        { href: "/zamonaviy-pardalar", label: "Современные шторы" },
        { href: "/klassik-pardalar", label: "Классические шторы" },
      ],
    },
    en: {
      eyebrow: "Roman style · Kashmir Decor",
      h1: "Roman curtains",
      intro: "Elegant and practical Roman curtains for kitchens, studies and compact spaces in Tashkent.",
      image: "/assets/curtain-02.jpg",
      imageAlt: "Roman curtains Tashkent — Kashmir Decor",
      sections: [
        { heading: "Advantages", body: "Fold up neatly, save space and cover windows precisely." },
        { heading: "Fabrics and design", body: "Dense linen, cotton, blackout and semi-sheer options. Durable mechanisms." },
        { heading: "Use", body: "Kitchen, nursery, home office, workspaces, and bedrooms combined with sheers." },
      ],
      highlights: ["Compact", "Kitchen-friendly", "Reliable mechanism", "Blackout option"],
      ctaLabel: "Order Roman curtains",
      ctaHref: "/#contact",
      related: [
        { href: "/zamonaviy-pardalar", label: "Modern curtains" },
        { href: "/klassik-pardalar", label: "Classic curtains" },
      ],
    },
  },
  "premium-pardalar": {
    uz: {
      eyebrow: "Premium daraja · Kashmir Decor",
      h1: "Premium pardalar",
      intro:
        "Toshkentdagi eng talabgor interyerlar uchun premium toifadagi pardalar — nodir matolar, eksklyuziv dizayn va a'lo sifatli tikish.",
      image: "/assets/curtain-04.jpg",
      imageAlt: "Premium pardalar Toshkent — Kashmir Decor",
      sections: [
        {
          heading: "Premium nima degani",
          body:
            "Premium pardalar — bu matoning o'ziga xos sifati, detallarga e'tibor va individual loyihalash. Tabiiy matolar, qo'lda ishlov berish, choklar va karnizlarning aniq moslashuvi, oxirgi teginishgacha o'ylangan yondashuv.",
        },
        {
          heading: "Qanday interyerlar uchun",
          body:
            "Premium pardalar penthaus, shaxsiy rezidensiyalar, katta yashash xonalari, hashamatli ofislar va mehmonxonalar uchun tanlanadi. Interyer dizayni allaqachon yuqori darajada bo'lganda, tafsilotlar yanada muhimroq bo'ladi.",
        },
        {
          heading: "Buyurtma jarayoni",
          body:
            "Interyer tahlilidan so'ng matolar taqdim etiladi, o'lchov va vizualizatsiya qilinadi. Tikish ustaxonamizda amalga oshiriladi, montaj jamoasi pardalarni aniq va xavfsiz o'rnatadi.",
        },
      ],
      highlights: [
        "Yuqori sifatli tabiiy matolar",
        "Individual dizayn",
        "Eksklyuziv karnizlar",
        "Aniq montaj",
        "Qo'lda ishlov detallari",
        "Rezidensiya va penthauslar uchun",
      ],
      ctaLabel: "Premium buyurtma",
      ctaHref: "/#contact",
      related: [
        { href: "/klassik-pardalar", label: "Klassik pardalar" },
        { href: "/zamonaviy-pardalar", label: "Zamonaviy pardalar" },
        { href: "/rim-pardalar", label: "Rim pardalari" },
        { href: "/toshkentda-pardalar", label: "Toshkentda pardalar" },
      ],
    },
    ru: {
      eyebrow: "Премиум уровень · Kashmir Decor",
      h1: "Премиум шторы",
      intro: "Премиум шторы для самых требовательных интерьеров Ташкента: редкие ткани, эксклюзивный дизайн и безупречное качество пошива.",
      image: "/assets/curtain-04.jpg",
      imageAlt: "Премиум шторы Ташкент — Kashmir Decor",
      sections: [
        { heading: "Что такое премиум", body: "Качество ткани, внимание к деталям, индивидуальный проект и филигранная установка." },
        { heading: "Для каких интерьеров", body: "Пентхаусы, резиденции, просторные гостиные, статусные офисы и отели." },
        { heading: "Процесс заказа", body: "Анализ интерьера, подбор тканей, визуализация, пошив и точный монтаж." },
      ],
      highlights: ["Натуральные ткани", "Индивидуальный дизайн", "Эксклюзивные карнизы", "Для резиденций"],
      ctaLabel: "Премиум заказ",
      ctaHref: "/#contact",
      related: [
        { href: "/klassik-pardalar", label: "Классические шторы" },
        { href: "/zamonaviy-pardalar", label: "Современные шторы" },
      ],
    },
    en: {
      eyebrow: "Premium tier · Kashmir Decor",
      h1: "Premium curtains",
      intro: "Premium curtains for Tashkent's most discerning interiors — rare fabrics, exclusive design and impeccable tailoring.",
      image: "/assets/curtain-04.jpg",
      imageAlt: "Premium curtains Tashkent — Kashmir Decor",
      sections: [
        { heading: "What premium means", body: "Exceptional fabric quality, attention to detail, bespoke design and precise installation." },
        { heading: "Suitable interiors", body: "Penthouses, private residences, spacious living rooms, high-status offices and hotels." },
        { heading: "The process", body: "Interior analysis, fabric selection, visualization, tailoring and precision installation." },
      ],
      highlights: ["Natural luxury fabrics", "Bespoke design", "Exclusive hardware", "For residences"],
      ctaLabel: "Premium order",
      ctaHref: "/#contact",
      related: [
        { href: "/klassik-pardalar", label: "Classic curtains" },
        { href: "/zamonaviy-pardalar", label: "Modern curtains" },
      ],
    },
  },
  about: {
    uz: {
      eyebrow: "Kashmir Decor · Salon",
      h1: "Salon haqida",
      intro:
        "Kashmir Decor — Toshkentdagi premium parda va interyer saloni. Biz material, yorug'lik va nisbatga bag'ishlangan holda ishlaymiz.",
      image: "/assets/about.jpg",
      imageAlt: "Kashmir Decor Toshkent parda saloni — ichki ko'rinish",
      sections: [
        {
          heading: "Bizning yondashuv",
          body:
            "Biz har bir loyihaga arxitekturaviy vazifa sifatida qaraymiz. Parda tanlashdan to o'rnatishgacha bo'lgan butun jarayonni o'z jamoamiz bilan olib boramiz: maslahat, o'lchov, matoni tanlash, tikish, montaj. Har bir detal — xonaning munosib yakunlanishi uchun.",
        },
        {
          heading: "Xizmatlar",
          body:
            "Parda va drapirovka dizayni, individual tikish, professional montaj, interyerni stillashtirish va oynalarni bezash. Toshkent bo'ylab chiqib o'lchash va yetkazib berish xizmati mavjud.",
        },
        {
          heading: "Sifat",
          body:
            "Biz faqat tasdiqlangan sifatli matolar bilan ishlaymiz. Har bir mahsulot tikishdan oldin va keyin tekshiriladi. Montaj jamoasi tajribali va ehtiyotkor.",
        },
      ],
      highlights: [
        "Parda dizayni",
        "Individual tikish",
        "Professional montaj",
        "Matolarni tanlash bo'yicha maslahat",
        "Toshkent bo'ylab xizmat",
        "Kafolatli yondashuv",
      ],
      ctaLabel: "Salon bilan bog'lanish",
      ctaHref: "/#contact",
      related: [
        { href: "/toshkentda-pardalar", label: "Toshkentda pardalar" },
        { href: "/collections", label: "Kolleksiya" },
        { href: "/kontakt", label: "Aloqa" },
      ],
    },
    ru: {
      eyebrow: "Kashmir Decor · Салон",
      h1: "О салоне",
      intro: "Kashmir Decor — премиум салон штор и интерьеров в Ташкенте, преданный материалу, свету и пропорции.",
      image: "/assets/about.jpg",
      imageAlt: "Салон Kashmir Decor в Ташкенте",
      sections: [
        { heading: "Подход", body: "Мы подходим к каждому проекту как к архитектурной задаче. Консультация, замер, подбор ткани, пошив, монтаж — всё силами нашей команды." },
        { heading: "Услуги", body: "Дизайн штор и драпировок, индивидуальный пошив, профессиональный монтаж, стилизация." },
        { heading: "Качество", body: "Работаем с проверенными тканями, каждое изделие проходит контроль до и после пошива." },
      ],
      highlights: ["Дизайн штор", "Индивидуальный пошив", "Монтаж", "Выезд по Ташкенту"],
      ctaLabel: "Связаться",
      ctaHref: "/#contact",
      related: [
        { href: "/toshkentda-pardalar", label: "Шторы в Ташкенте" },
        { href: "/collections", label: "Коллекция" },
      ],
    },
    en: {
      eyebrow: "Kashmir Decor · Salon",
      h1: "About the salon",
      intro: "Kashmir Decor is a premium curtain and interior salon in Tashkent, devoted to material, light and proportion.",
      image: "/assets/about.jpg",
      imageAlt: "Kashmir Decor curtain salon in Tashkent",
      sections: [
        { heading: "Approach", body: "We treat every project as an architectural task: consultation, measurement, fabric selection, tailoring and installation, all in-house." },
        { heading: "Services", body: "Curtain and drapery design, custom tailoring, professional installation, interior styling." },
        { heading: "Quality", body: "We work with proven fabrics; every piece is inspected before and after tailoring." },
      ],
      highlights: ["Curtain design", "Custom tailoring", "Installation", "Tashkent-wide service"],
      ctaLabel: "Get in touch",
      ctaHref: "/#contact",
      related: [
        { href: "/toshkentda-pardalar", label: "Curtains in Tashkent" },
        { href: "/collections", label: "Collection" },
      ],
    },
  },
  contact: {
    uz: {
      eyebrow: "Kashmir Decor · Aloqa",
      h1: "Bog'lanish",
      intro:
        "Kashmir Decor parda saloniga murojaat qiling. O'lchov, maslahat va buyurtma bo'yicha bog'lanish uchun quyidagi ma'lumotlardan foydalaning.",
      image: "/assets/interior-01.jpg",
      imageAlt: "Kashmir Decor saloniga bog'laning — Toshkent",
      sections: [
        { heading: "Buyurtma qanday beriladi", body: "Aloqa shaklini to'ldiring yoki qo'ng'iroq qiling. Mutaxassis qulay vaqtni kelishib, xonaga chiqib o'lchashni amalga oshiradi. Matolar tanlangach, buyurtma ustaxonamizda tikiladi va o'rnatiladi." },
        { heading: "O'lchov va maslahat", body: "Toshkent bo'ylab chiqib o'lchash — bepul maslahat va aniq o'lchov. Matolar namunasi joyiga olib boriladi." },
        { heading: "Ish vaqti", body: "Salon Dushanbadan Shanbagacha soat 10:00 dan 19:00 gacha ishlaydi. Yakshanba — kelishuv asosida." },
      ],
      highlights: ["Toshkent bo'ylab o'lchov", "Matolar namunasi bilan tanishish", "Tezkor javob", "Individual yondashuv"],
      ctaLabel: "Xabar yuborish",
      ctaHref: "/#contact",
      related: [
        { href: "/toshkentda-pardalar", label: "Toshkentda pardalar" },
        { href: "/haqimizda", label: "Salon haqida" },
        { href: "/collections", label: "Kolleksiya" },
      ],
    },
    ru: {
      eyebrow: "Kashmir Decor · Контакты",
      h1: "Связаться с нами",
      intro: "Свяжитесь с салоном Kashmir Decor для замера, консультации и заказа штор в Ташкенте.",
      image: "/assets/interior-01.jpg",
      imageAlt: "Связаться с Kashmir Decor Ташкент",
      sections: [
        { heading: "Как заказать", body: "Заполните форму или позвоните. Специалист приезжает на замер, подбирает ткани, затем изделие шьётся и устанавливается." },
        { heading: "Замер и консультация", body: "Выезд по Ташкенту, образцы тканей с собой." },
        { heading: "Время работы", body: "Пн–Сб 10:00–19:00, Вс — по договорённости." },
      ],
      highlights: ["Замер по Ташкенту", "Образцы тканей", "Быстрый ответ"],
      ctaLabel: "Отправить сообщение",
      ctaHref: "/#contact",
      related: [
        { href: "/toshkentda-pardalar", label: "Шторы в Ташкенте" },
        { href: "/haqimizda", label: "О салоне" },
      ],
    },
    en: {
      eyebrow: "Kashmir Decor · Contact",
      h1: "Get in touch",
      intro: "Contact Kashmir Decor salon for measurement, consultation and curtain orders in Tashkent.",
      image: "/assets/interior-01.jpg",
      imageAlt: "Contact Kashmir Decor Tashkent",
      sections: [
        { heading: "How to order", body: "Use the form or call. A specialist visits for measurement and fabric selection, then your order is tailored and installed." },
        { heading: "Measurement & consultation", body: "Tashkent-wide on-site visit with fabric samples." },
        { heading: "Working hours", body: "Mon–Sat 10:00–19:00, Sunday by appointment." },
      ],
      highlights: ["On-site measurement", "Fabric samples", "Quick response"],
      ctaLabel: "Send a message",
      ctaHref: "/#contact",
      related: [
        { href: "/toshkentda-pardalar", label: "Curtains in Tashkent" },
        { href: "/haqimizda", label: "About" },
      ],
    },
  },
};

export function getLanding(slug: string, locale: Locale): PageCopy {
  return LANDING[slug]?.[locale] ?? LANDING[slug]?.uz ?? LANDING["toshkentda-pardalar"].uz;
}

export const LANDING_SLUGS = Object.keys(LANDING);
