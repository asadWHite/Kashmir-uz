CREATE TABLE "admin_sessions" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"admin_user_id" integer NOT NULL,
	"admin_email" varchar(200) NOT NULL,
	"ip_address" varchar(100),
	"user_agent" text,
	"login_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"logout_at" timestamp with time zone,
	"expires_at" timestamp with time zone NOT NULL,
	"logout_reason" varchar(40)
);
--> statement-breakpoint
CREATE TABLE "admin_users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(200) NOT NULL,
	"password_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "admin_users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(120) NOT NULL,
	"slug" varchar(160) NOT NULL,
	"description" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "contact_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(160) NOT NULL,
	"phone" varchar(60),
	"email" varchar(160),
	"message" text NOT NULL,
	"status" varchar(20) DEFAULT 'new' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "content_revisions" (
	"id" serial PRIMARY KEY NOT NULL,
	"entity" varchar(32) NOT NULL,
	"entity_id" integer NOT NULL,
	"action" varchar(16) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "content_translations" (
	"id" serial PRIMARY KEY NOT NULL,
	"entity" varchar(32) NOT NULL,
	"entity_id" integer NOT NULL,
	"locale" varchar(5) NOT NULL,
	"title" text,
	"subtitle" text,
	"description" text,
	"seo_title" text,
	"seo_description" text,
	"extra" jsonb,
	"review_status" varchar(16) DEFAULT 'complete' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "content_translations_locale_check" CHECK ("content_translations"."locale" IN ('uz', 'ru', 'en'))
);
--> statement-breakpoint
CREATE TABLE "curtains" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(180) NOT NULL,
	"slug" varchar(220) NOT NULL,
	"description" text,
	"category_id" integer,
	"category" varchar(120),
	"image_url" text,
	"gallery" jsonb,
	"material" varchar(160),
	"color" varchar(120),
	"style" varchar(120),
	"room" varchar(160),
	"is_featured" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"likes" integer DEFAULT 0 NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "curtains_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "faq" (
	"id" serial PRIMARY KEY NOT NULL,
	"question_en" text NOT NULL,
	"question_ru" text,
	"question_uz" text,
	"answer_en" text NOT NULL,
	"answer_ru" text,
	"answer_uz" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "gallery" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(180),
	"image_url" text NOT NULL,
	"category" varchar(40) DEFAULT 'interior' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "image_upload_sessions" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"filename" varchar(100) NOT NULL,
	"expected_size" integer NOT NULL,
	"total_parts" integer NOT NULL,
	"next_part" integer NOT NULL,
	"chunks" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "interiors" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(180) NOT NULL,
	"slug" varchar(220) NOT NULL,
	"description" text,
	"image_url" text,
	"gallery" jsonb,
	"location" varchar(200),
	"style" varchar(120),
	"room" varchar(160),
	"is_featured" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "interiors_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "leads" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(160) NOT NULL,
	"phone" varchar(60),
	"telegram" varchar(160),
	"interest" varchar(120),
	"room" varchar(120),
	"message" text,
	"source" varchar(120),
	"status" varchar(20) DEFAULT 'new' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "site_settings" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"instagram_url" text,
	"telegram_url" text,
	"phone" varchar(60),
	"email" varchar(160),
	"address" text,
	"working_hours" text,
	"hero_eyebrow" varchar(200),
	"hero_statement" text,
	"about_title" varchar(200),
	"about_text" text,
	"maps_query" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "statistics" (
	"id" serial PRIMARY KEY NOT NULL,
	"label" varchar(120) NOT NULL,
	"value" varchar(40) NOT NULL,
	"suffix" varchar(8),
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "admin_sessions" ADD CONSTRAINT "admin_sessions_admin_user_id_admin_users_id_fk" FOREIGN KEY ("admin_user_id") REFERENCES "public"."admin_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "curtains" ADD CONSTRAINT "curtains_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "admin_sessions_login_at_idx" ON "admin_sessions" USING btree ("login_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "admin_sessions_admin_user_id_idx" ON "admin_sessions" USING btree ("admin_user_id");--> statement-breakpoint
CREATE INDEX "content_revisions_created_at_idx" ON "content_revisions" USING btree ("created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE UNIQUE INDEX "content_translations_entity_locale_idx" ON "content_translations" USING btree ("entity","entity_id","locale");--> statement-breakpoint
CREATE INDEX "content_translations_entity_idx" ON "content_translations" USING btree ("entity","entity_id");