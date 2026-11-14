import {
  pgTable,
  serial,
  text,
  varchar,
  boolean,
  integer,
  timestamp,
  jsonb,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

/**
 * KASHMIR DECOR — Database schema (PostgreSQL via Drizzle ORM)
 *
 * Tables mirror the Supabase-oriented brief (curtains, interiors, categories,
 * statistics, site_settings, contact_messages) but run on the project's local
 * Postgres instance. An `admin_users` table backs the secure server-side auth.
 *
 * Production schema changes require the reviewed procedure in docs/database/PRODUCTION.md.
 */

/* ----------------------------- Categories ----------------------------- */
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  slug: varchar("slug", { length: 160 }).notNull().unique(),
  description: text("description"),
  sortOrder: integer("sort_order").default(0).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;

/* ------------------------------ Curtains ------------------------------ */
export const curtains = pgTable("curtains", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 180 }).notNull(),
  slug: varchar("slug", { length: 220 }).notNull().unique(),
  description: text("description"),
  categoryId: integer("category_id").references(() => categories.id, {
    onDelete: "set null",
  }),
  // Denormalized label for quick public display without a join.
  category: varchar("category", { length: 120 }),
  imageUrl: text("image_url"),
  gallery: jsonb("gallery").$type<string[]>(),
  material: varchar("material", { length: 160 }),
  color: varchar("color", { length: 120 }),
  style: varchar("style", { length: 120 }),
  room: varchar("room", { length: 160 }),
  isFeatured: boolean("is_featured").default(false).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  likes: integer("likes").default(0).notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type Curtain = typeof curtains.$inferSelect;
export type NewCurtain = typeof curtains.$inferInsert;

/* ------------------------------ Interiors ----------------------------- */
export const interiors = pgTable("interiors", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 180 }).notNull(),
  slug: varchar("slug", { length: 220 }).notNull().unique(),
  description: text("description"),
  imageUrl: text("image_url"),
  gallery: jsonb("gallery").$type<string[]>(),
  location: varchar("location", { length: 200 }),
  style: varchar("style", { length: 120 }),
  room: varchar("room", { length: 160 }),
  isFeatured: boolean("is_featured").default(false).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type Interior = typeof interiors.$inferSelect;
export type NewInterior = typeof interiors.$inferInsert;

/* ----------------------------- Statistics ----------------------------- */
export const statistics = pgTable("statistics", {
  id: serial("id").primaryKey(),
  label: varchar("label", { length: 120 }).notNull(),
  value: varchar("value", { length: 40 }).notNull(),
  suffix: varchar("suffix", { length: 8 }),
  sortOrder: integer("sort_order").default(0).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type Statistic = typeof statistics.$inferSelect;
export type NewStatistic = typeof statistics.$inferInsert;

/* ---------------------------- Site settings --------------------------- */
export const siteSettings = pgTable("site_settings", {
  id: integer("id").primaryKey().default(1),
  instagramUrl: text("instagram_url"),
  telegramUrl: text("telegram_url"),
  phone: varchar("phone", { length: 60 }),
  email: varchar("email", { length: 160 }),
  address: text("address"),
  workingHours: text("working_hours"),
  heroEyebrow: varchar("hero_eyebrow", { length: 200 }),
  heroStatement: text("hero_statement"),
  aboutTitle: varchar("about_title", { length: 200 }),
  aboutText: text("about_text"),
  mapsQuery: text("maps_query"),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type SiteSettings = typeof siteSettings.$inferSelect;

/* -------------------------- Contact messages -------------------------- */
export const contactMessages = pgTable("contact_messages", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 160 }).notNull(),
  phone: varchar("phone", { length: 60 }),
  email: varchar("email", { length: 160 }),
  message: text("message").notNull(),
  status: varchar("status", { length: 20 }).default("new").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type ContactMessage = typeof contactMessages.$inferSelect;

/* ----------------------------- Admin users ---------------------------- */
export const adminUsers = pgTable("admin_users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 200 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type AdminUser = typeof adminUsers.$inferSelect;

/* -------------------------------- Leads ------------------------------- */
export const leads = pgTable("leads", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 160 }).notNull(),
  phone: varchar("phone", { length: 60 }),
  telegram: varchar("telegram", { length: 160 }),
  interest: varchar("interest", { length: 120 }),
  room: varchar("room", { length: 120 }),
  message: text("message"),
  source: varchar("source", { length: 120 }),
  status: varchar("status", { length: 20 }).default("new").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type Lead = typeof leads.$inferSelect;

/* -------------------------------- FAQ --------------------------------- */
export const faq = pgTable("faq", {
  id: serial("id").primaryKey(),
  questionEn: text("question_en").notNull(),
  questionRu: text("question_ru"),
  questionUz: text("question_uz"),
  answerEn: text("answer_en").notNull(),
  answerRu: text("answer_ru"),
  answerUz: text("answer_uz"),
  sortOrder: integer("sort_order").default(0).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type Faq = typeof faq.$inferSelect;

/* ------------------------------- Gallery ------------------------------ */
export const gallery = pgTable("gallery", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 180 }),
  imageUrl: text("image_url").notNull(),
  category: varchar("category", { length: 40 }).default("interior").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type Gallery = typeof gallery.$inferSelect;

/* ------------------------- Image upload staging ------------------------ */
/**
 * Large admin uploads arrive in sub-4 MB chunks so they also work on Vercel,
 * whose function request limit is 4.5 MB. Rows are short-lived and deleted
 * after optimization (or by the stale-session cleanup in the upload route).
 */
export const imageUploadSessions = pgTable("image_upload_sessions", {
  id: varchar("id", { length: 36 }).primaryKey(),
  filename: varchar("filename", { length: 100 }).notNull(),
  expectedSize: integer("expected_size").notNull(),
  totalParts: integer("total_parts").notNull(),
  nextPart: integer("next_part").notNull(),
  chunks: text("chunks").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type ImageUploadSession = typeof imageUploadSessions.$inferSelect;


/* ------------------------ Admin login history ------------------------- */
export const adminSessions = pgTable("admin_sessions", {
  id: varchar("id", { length: 36 }).primaryKey(),
  adminUserId: integer("admin_user_id").notNull().references(() => adminUsers.id, { onDelete: "cascade" }),
  adminEmail: varchar("admin_email", { length: 200 }).notNull(),
  ipAddress: varchar("ip_address", { length: 100 }),
  userAgent: text("user_agent"),
  loginAt: timestamp("login_at", { withTimezone: true }).defaultNow().notNull(),
  lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).defaultNow().notNull(),
  logoutAt: timestamp("logout_at", { withTimezone: true }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  logoutReason: varchar("logout_reason", { length: 40 }),
});
export type AdminSession = typeof adminSessions.$inferSelect;


/* ===================================================================== */
/*                       MULTILINGUAL CONTENT LAYER                      */
/* ===================================================================== */

/**
 * One row per (record, locale) holding *only* the translatable fields.
 *
 * Design notes — why this shape and not `name_uz/name_ru/name_en` columns:
 *  - One product keeps one identity (`curtains.id`); shared, non-translatable
 *    data (image, gallery, price, likes, featured, ordering, publication
 *    status) stays on the parent row and is never duplicated.
 *  - Adding a language, or a new translatable field, is a data change rather
 *    than a wide-table migration.
 *  - `(entity, entity_id, locale)` is unique, so a save for one locale can
 *    never touch another locale's row (independent updates), and a partial
 *    update can never be silently applied to the wrong language.
 *  - `reviewStatus` records whether machine-generated copy still needs a
 *    human check, so the admin can see translation completeness honestly.
 *
 * The legacy columns on the parent tables (`curtains.name`,
 * `curtains.description`, `interiors.title`, `categories.name`,
 * `site_settings.hero_*` …) are PRESERVED and used as the source of truth for
 * the original language plus as a last-resort fallback. Nothing is deleted.
 */
export const contentTranslations = pgTable(
  "content_translations",
  {
    id: serial("id").primaryKey(),
    /** 'curtain' | 'interior' | 'category' | 'statistic' | 'faq' | 'settings' | 'gallery' */
    entity: varchar("entity", { length: 32 }).notNull(),
    entityId: integer("entity_id").notNull(),
    /** 'uz' | 'ru' | 'en' — validated in the application layer. */
    locale: varchar("locale", { length: 5 }).notNull(),
    /** Translatable fields for the entity. Null/absent means "not provided". */
    title: text("title"),
    subtitle: text("subtitle"),
    description: text("description"),
    seoTitle: text("seo_title"),
    seoDescription: text("seo_description"),
    /**
     * Entity-specific additional localized strings (for example the homepage
     * copy on `site_settings`: heroEyebrow / heroStatement / aboutTitle /
     * aboutText). Named keys keep this typed at the accessor level rather than
     * adding a new column for every future field.
     */
    extra: jsonb("extra").$type<Record<string, string> | null>(),
    /** 'complete' | 'needs_review' | 'machine' (see TranslationState). */
    reviewStatus: varchar("review_status", { length: 16 })
      .default("complete")
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("content_translations_entity_locale_idx").on(
      table.entity,
      table.entityId,
      table.locale,
    ),
    index("content_translations_entity_idx").on(table.entity, table.entityId),
  ],
);

export type ContentTranslation = typeof contentTranslations.$inferSelect;
export type NewContentTranslation = typeof contentTranslations.$inferInsert;

/**
 * Short-lived audit log of admin writes to the public site. Used to invalidate
 * the public content cache cluster-wide (see src/lib/cache.ts) so an edit is
 * visible immediately on production, not after a TTL.
 */
export const contentRevisions = pgTable("content_revisions", {
  id: serial("id").primaryKey(),
  entity: varchar("entity", { length: 32 }).notNull(),
  entityId: integer("entity_id").notNull(),
  action: varchar("action", { length: 16 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});
