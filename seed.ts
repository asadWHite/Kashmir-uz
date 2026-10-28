/**
 * KASHMIR DECOR — database seed.
 *
 * Run with:  npx tsx src/db/seed.ts
 *
 * Seeds demo content (clearly demo, easy to remove from /admin) plus a single
 * admin account derived from the ADMIN_EMAIL / ADMIN_PASSWORD env vars.
 */
import "dotenv/config";
import { db } from "./index";
import {
  adminUsers,
  categories,
  contactMessages,
  curtains,
  interiors,
  siteSettings,
  statistics,
} from "./schema";
import { hashPassword } from "@/lib/auth";
import { ASSETS } from "@/lib/constants";
import { eq, sql } from "drizzle-orm";

async function main() {
  console.log("→ Seeding KASHMIR DECOR database…");

  /* ----------------------------- Admin user ---------------------------- */
  const adminEmail = (
    process.env.ADMIN_EMAIL || "admin@kashmirdecor.com"
  ).toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD || "kashmir-admin";
  const [existingAdmin] = await db
    .select()
    .from(adminUsers)
    .where(sql`lower(${adminUsers.email}) = ${adminEmail}`)
    .limit(1);
  if (existingAdmin) {
    await db
      .update(adminUsers)
      .set({ passwordHash: hashPassword(adminPassword) })
      .where(sql`lower(${adminUsers.email}) = ${adminEmail}`);
    console.log(`  • admin password refreshed for ${adminEmail}`);
  } else {
    await db.insert(adminUsers).values({
      email: adminEmail,
      passwordHash: hashPassword(adminPassword),
    });
    console.log(`  • admin created: ${adminEmail}`);
  }

  /* ----------------------------- Categories ---------------------------- */
  const catSeed = [
    { name: "Classic", slug: "classic", sortOrder: 1 },
    { name: "Modern", slug: "modern", sortOrder: 2 },
    { name: "Minimal", slug: "minimal", sortOrder: 3 },
    { name: "Luxury", slug: "luxury", sortOrder: 4 },
    { name: "Texture", slug: "texture", sortOrder: 5 },
  ];
  for (const c of catSeed) {
    const [row] = await db
      .select()
      .from(categories)
      .where(sql`lower(${categories.slug}) = ${c.slug}`)
      .limit(1);
    if (!row) await db.insert(categories).values(c);
  }
  console.log(`  • ${catSeed.length} categories ensured`);

  /* ------------------------------ Curtains ----------------------------- */
  const allCats = await db.select().from(categories);
  const catId = (slug: string) =>
    allCats.find((c) => c.slug === slug)?.id ?? null;

  const curtainSeed = [
    {
      name: "Atelier Taupe Drape",
      slug: "atelier-taupe-drape",
      category: "Classic",
      catSlug: "classic",
      image: ASSETS.curtains[0],
      material: "Wool-blend, pinch pleat",
      color: "Warm taupe",
      desc: "A timeless hand-tailored pleated drape with a soft, structured fall — designed for generous full-height windows.",
      featured: true,
      sort: 1,
    },
    {
      name: "Linen Sheer Veil",
      slug: "linen-sheer-veil",
      category: "Modern",
      catSlug: "modern",
      image: ASSETS.curtains[1],
      material: "Pure linen sheer",
      color: "Soft white",
      desc: "Translucent linen that diffuses daylight into a quiet glow while preserving the architecture of the room.",
      featured: true,
      sort: 2,
    },
    {
      name: "Graphite Velvet",
      slug: "graphite-velvet",
      category: "Luxury",
      catSlug: "luxury",
      image: ASSETS.curtains[2],
      material: "Cotton velvet",
      color: "Charcoal graphite",
      desc: "Heavy, light-absorbing velvet with a refined sheen — deep, cinematic and deeply luxurious.",
      featured: true,
      sort: 3,
    },
    {
      name: "Organic Linen Weave",
      slug: "organic-linen-weave",
      category: "Texture",
      catSlug: "texture",
      image: ASSETS.curtains[3],
      material: "Natural slub linen",
      color: "Oatmeal sand",
      desc: "A tactile, organic weave that brings warmth and a sense of craft to minimal interiors.",
      featured: false,
      sort: 4,
    },
  ];

  for (const c of curtainSeed) {
    const [row] = await db
      .select()
      .from(curtains)
      .where(sql`lower(${curtains.slug}) = ${c.slug}`)
      .limit(1);
    if (row) {
      await db
        .update(curtains)
        .set({
          name: c.name,
          category: c.category,
          categoryId: catId(c.catSlug),
          imageUrl: c.image,
          material: c.material,
          color: c.color,
          description: c.desc,
          isFeatured: c.featured,
          sortOrder: c.sort,
          updatedAt: new Date(),
        })
        .where(sql`lower(${curtains.slug}) = ${c.slug}`);
    } else {
      await db.insert(curtains).values({
        name: c.name,
        slug: c.slug,
        category: c.category,
        categoryId: catId(c.catSlug),
        imageUrl: c.image,
        material: c.material,
        color: c.color,
        description: c.desc,
        isFeatured: c.featured,
        sortOrder: c.sort,
      });
    }
  }
  console.log(`  • ${curtainSeed.length} curtains ensured`);

  /* ------------------------------ Interiors ---------------------------- */
  const interiorSeed = [
    {
      title: "Calm Living Volume",
      slug: "calm-living-volume",
      image: ASSETS.interiors[0],
      location: "Private Residence",
      desc: "Floor-to-ceiling linen drapery framing a serene living volume in soft morning light.",
      sort: 1,
    },
    {
      title: "Open Plan, Soft Light",
      slug: "open-plan-soft-light",
      image: ASSETS.interiors[1],
      location: "City Apartment",
      desc: "An architectural open plan where curtains modulate light across charcoal and warm neutral tones.",
      sort: 2,
    },
    {
      title: "The Travertine Dining",
      slug: "travertine-dining",
      image: ASSETS.interiors[2],
      location: "Penthouse",
      desc: "A dining interior composed around a single pendant, stone surfaces and tall drapery.",
      sort: 3,
    },
  ];
  for (const i of interiorSeed) {
    const [row] = await db
      .select()
      .from(interiors)
      .where(sql`lower(${interiors.slug}) = ${i.slug}`)
      .limit(1);
    if (row) {
      await db
        .update(interiors)
        .set({
          title: i.title,
          imageUrl: i.image,
          location: i.location,
          description: i.desc,
          sortOrder: i.sort,
          updatedAt: new Date(),
        })
        .where(sql`lower(${interiors.slug}) = ${i.slug}`);
    } else {
      await db.insert(interiors).values({
        title: i.title,
        slug: i.slug,
        imageUrl: i.image,
        location: i.location,
        description: i.desc,
        sortOrder: i.sort,
      });
    }
  }
  console.log(`  • ${interiorSeed.length} interiors ensured`);

  /* ----------------------------- Statistics ---------------------------- */
  const statSeed = [
    { label: "Clients", value: "3000", suffix: "+", sort: 1 },
    { label: "Experience", value: "17", suffix: "", sort: 2 },
    { label: "Attention to detail", value: "100", suffix: "%", sort: 3 },
  ];
  for (const s of statSeed) {
    const [row] = await db
      .select()
      .from(statistics)
      .where(sql`lower(${statistics.label}) = ${s.label.toLowerCase()}`)
      .limit(1);
    if (row) {
      await db
        .update(statistics)
        .set({ value: s.value, suffix: s.suffix, sortOrder: s.sort })
        .where(sql`lower(${statistics.label}) = ${s.label.toLowerCase()}`);
    } else {
      await db.insert(statistics).values(s);
    }
  }
  console.log(`  • ${statSeed.length} statistics ensured`);

  /* ---------------------------- Site settings -------------------------- */
  const settingsValues = {
    id: 1,
    instagramUrl: "https://instagram.com/kashmir",
    telegramUrl: "https://t.me/kashmir_decor",
    phone: "+1 (000) 000-0000",
    email: "studio@kashmirdecor.com",
    address: "KASHMIR DECOR Showroom — Address to be confirmed",
    workingHours: "Mon – Sat · 10:00 – 19:00",
    heroEyebrow: "Curtain Studio · Interior Architecture",
    heroStatement:
      "Curtains and interiors composed with the restraint of architecture and the warmth of fine textiles.",
    aboutTitle: "A studio of quiet, considered interiors",
    aboutText:
      "KASHMIR DECOR is a curtain and interior design studio devoted to material, light and proportion. We design, tailor and install window dressings and full interiors that feel calm, architectural and quietly luxurious — built to last for years.",
    mapsQuery: "KASHMIR DECOR",
  };
  await db
    .insert(siteSettings)
    .values(settingsValues)
    .onConflictDoUpdate({
      target: siteSettings.id,
      set: { ...settingsValues, updatedAt: new Date() },
    });
  console.log("  • site settings ensured");

  /* ------------------------- Demo contact note ------------------------- */
  const [demoMsg] = await db
    .select()
    .from(contactMessages)
    .where(eq_(contactMessages.phone, "[demo]"))
    .limit(1);
  if (!demoMsg) {
    await db.insert(contactMessages).values({
      name: "Demo Client",
      phone: "[demo]",
      email: "demo@example.com",
      message:
        "This is a demo message — safe to delete from the admin Messages panel.",
      status: "new",
    });
  }
  console.log("  • demo contact message ensured");

  /* -------------------------------- FAQ -------------------------------- */
  const faqSeed = [
    {
      qEn: "Do you offer measuring and installation?",
      qRu: "Вы делаете замеры и установку?",
      qUz: "O'lchash va o'rnatishni amalga oshirasizmi?",
      aEn: "Yes. Our team handles precise measurements, tailoring and professional installation.",
      aRu: "Да. Наша команда выполняет точные замеры, пошив и профессиональный монтаж.",
      aUz: "Ha. Bizning jamoamiz aniq o'lchash, tikish va professional o'rnatishni amalga oshiradi.",
    },
    {
      qEn: "Which rooms do you design curtains for?",
      qRu: "Для каких помещений вы шьёте шторы?",
      qUz: "Qaysi xonalar uchun pardalar tikasiz?",
      aEn: "Living rooms, bedrooms, offices and more — any space that benefits from thoughtful window dressing.",
      aRu: "Гостиные, спальни, кабинеты и другие — любое пространство, которому нужно продуманное оформление окон.",
      aUz: "Mehmonxona, yotoqxona, kabinet va boshqalar — har qanday joy uchun.",
    },
    {
      qEn: "How do I place an order?",
      qRu: "Как сделать заказ?",
      qUz: "Buyurtma qanday beriladi?",
      aEn: "Browse the collection, choose a style you love, and contact us. Our specialist will guide you through the rest.",
      aRu: "Изучите коллекцию, выберите понравившийся стиль и свяжитесь с нами. Специалист всё объяснит.",
      aUz: "Kolleksiyani ko'rib chiqing, yoqqan uslubni tanlang va biz bilan bog'laning.",
    },
  ];
  const { faq: faqTable } = await import("./schema");
  for (const f of faqSeed) {
    const [row] = await db
      .select()
      .from(faqTable)
      .where(sql`lower(${faqTable.questionEn}) = ${f.qEn.toLowerCase()}`)
      .limit(1);
    if (row) {
      await db
        .update(faqTable)
        .set({ questionRu: f.qRu, questionUz: f.qUz, answerEn: f.aEn, answerRu: f.aRu, answerUz: f.aUz })
        .where(eq(faqTable.id, row.id));
    } else {
      await db.insert(faqTable).values({
        questionEn: f.qEn, questionRu: f.qRu, questionUz: f.qUz,
        answerEn: f.aEn, answerRu: f.aRu, answerUz: f.aUz,
        sortOrder: faqSeed.indexOf(f), isActive: true,
      });
    }
  }
  console.log(`  • ${faqSeed.length} FAQ ensured`);

  console.log("✓ Seed complete.");
  console.log(`  Admin login → ${adminEmail} / (ADMIN_PASSWORD)`);
  process.exit(0);
}

// tiny inline eq helper to avoid an extra import alias clash
function eq_(col: typeof contactMessages.phone, val: string) {
  return sql`${col} = ${val}`;
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
