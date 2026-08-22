import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { siteSettings } from "@/db/schema";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const [row] = await db
    .select()
    .from(siteSettings)
    .where(eq(siteSettings.id, 1))
    .limit(1);
  return NextResponse.json({ ok: true, settings: row ?? null });
}

export async function PUT(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const [updated] = await db
    .insert(siteSettings)
    .values({
      id: 1,
      instagramUrl: body.instagramUrl ?? null,
      telegramUrl: body.telegramUrl ?? null,
      phone: body.phone ?? null,
      email: body.email ?? null,
      address: body.address ?? null,
      workingHours: body.workingHours ?? null,
      heroEyebrow: body.heroEyebrow ?? null,
      heroStatement: body.heroStatement ?? null,
      aboutTitle: body.aboutTitle ?? null,
      aboutText: body.aboutText ?? null,
      mapsQuery: body.mapsQuery ?? null,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: siteSettings.id,
      set: {
        instagramUrl: body.instagramUrl ?? null,
        telegramUrl: body.telegramUrl ?? null,
        phone: body.phone ?? null,
        email: body.email ?? null,
        address: body.address ?? null,
        workingHours: body.workingHours ?? null,
        heroEyebrow: body.heroEyebrow ?? null,
        heroStatement: body.heroStatement ?? null,
        aboutTitle: body.aboutTitle ?? null,
        aboutText: body.aboutText ?? null,
        mapsQuery: body.mapsQuery ?? null,
        updatedAt: new Date(),
      },
    })
    .returning();
  return NextResponse.json({ ok: true, settings: updated });
}
