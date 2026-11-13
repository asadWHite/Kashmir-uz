import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { siteSettings } from "@/db/schema";
import {
  getTranslations,
  parseTranslations,
  saveTranslations,
  touchContent,
} from "@/lib/admin-content";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const [row] = await db
    .select()
    .from(siteSettings)
    .where(eq(siteSettings.id, 1))
    .limit(1);
  const translations = await getTranslations("settings", 1).catch(() => ({}));
  return NextResponse.json({ ok: true, settings: row ?? null, translations });
}

/**
 * Contact details (phone, e-mail, social links, map query) are shared across
 * languages. Homepage copy, address and working hours are localized and are
 * saved through the translations table only for the languages sent.
 */
export async function PUT(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const parsed = parseTranslations(body.translations);
  if (!parsed.ok) return NextResponse.json({ ok: false, error: parsed.error }, { status: 422 });

  const shared = {
    instagramUrl: body.instagramUrl ?? null,
    telegramUrl: body.telegramUrl ?? null,
    phone: body.phone ?? null,
    email: body.email ?? null,
    mapsQuery: body.mapsQuery ?? null,
    updatedAt: new Date(),
  };

  // If the caller did not supply translations (older form), keep writing the
  // legacy columns exactly as before so nothing regresses.
  const legacy = {
    address: body.address ?? null,
    workingHours: body.workingHours ?? null,
    heroEyebrow: body.heroEyebrow ?? null,
    heroStatement: body.heroStatement ?? null,
    aboutTitle: body.aboutTitle ?? null,
    aboutText: body.aboutText ?? null,
  };

  const values = { id: 1, ...shared, ...legacy };

  const [updated] = await db
    .insert(siteSettings)
    .values(values)
    .onConflictDoUpdate({ target: siteSettings.id, set: values })
    .returning();

  if (Object.keys(parsed.value).length > 0) {
    await saveTranslations("settings", 1, parsed.value);
  }
  await touchContent("settings", 1, "update");

  return NextResponse.json({
    ok: true,
    settings: updated,
    translations: await getTranslations("settings", 1),
  });
}
