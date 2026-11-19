CREATE TABLE "blind_categories" (
	"id" serial PRIMARY KEY NOT NULL
);

CREATE TABLE "blind_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"blind_id" integer,
	"position" integer,
	"data_url" text NOT NULL,
	"width" integer NOT NULL,
	"height" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "blinds" (
	"id" serial PRIMARY KEY NOT NULL,
	"category_id" integer,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_published" boolean DEFAULT false NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL
);

ALTER TABLE "blind_images" ADD CONSTRAINT "blind_images_blind_id_blinds_id_fk" FOREIGN KEY ("blind_id") REFERENCES "public"."blinds"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "blinds" ADD CONSTRAINT "blinds_category_id_blind_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."blind_categories"("id") ON DELETE no action ON UPDATE no action;
CREATE UNIQUE INDEX "blind_images_product_position_idx" ON "blind_images" USING btree ("blind_id","position");
CREATE INDEX "blind_images_staging_idx" ON "blind_images" USING btree ("created_at") WHERE "blind_images"."blind_id" is null;
