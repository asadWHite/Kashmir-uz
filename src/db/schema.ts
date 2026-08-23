import {
  pgTable,
  serial,
  text,
  varchar,
  boolean,
  integer,
  timestamp,
  jsonb,
} from "drizzle-orm/pg-core";

/**
 * KASHMIR DECOR — Database schema (PostgreSQL via Drizzle ORM)
 *
 * Tables mirror the Supabase-oriented brief (curtains, interiors, categories,
 * statistics, site_settings, contact_messages) but run on the project's local
 * Postgres instance. An `admin_users` table backs the secure server-side auth.
 *
 * Apply changes with:  npx drizzle-kit push
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
