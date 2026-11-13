import "server-only";
import { unstable_cache, revalidateTag } from "next/cache";
import { desc } from "drizzle-orm";
import { db } from "@/db";
import { contentRevisions } from "@/db/schema";
import type { Locale } from "@/lib/i18n";

/**
 * Public content caching.
 *
 * Why a database-backed revision stamp instead of a plain TTL:
 *
 *  - Public pages are read-only, shared, and identical for every visitor, so
 *    caching them is safe only if an administrator's edit is visible
 *    *immediately*. A TTL alone would show stale copy (and stale translations)
 *    for an unpredictable window.
 *  - Vercel runs several serverless instances, so an in-process invalidation
 *    signal only reaches one of them. The latest `content_revisions.id` is
 *    shared by every instance and is part of the cache key, so a write anywhere
 *    invalidates the entry everywhere within one revision read.
 *
 * `unstable_cache` is used rather than the `"use cache"` directive because the
 * directive requires the experimental `cacheComponents` flag; this project runs
 * stable Next 16 and should not need a feature flag for content caching.
 */

export const CONTENT_CACHE_TAG = "public-content";
const REVISION_SECONDS = 1;

/** The current cluster-wide content revision (cached for one second). */
export async function contentRevision(): Promise<number> {
  const read = unstable_cache(
    async () => {
      try {
        const [row] = await db
          .select({ id: contentRevisions.id })
          .from(contentRevisions)
          .orderBy(desc(contentRevisions.id))
          .limit(1);
        return row?.id ?? 0;
      } catch {
        // A missing table (un-migrated database) must not break the public site.
        return 0;
      }
    },
    ["content-revision"],
    { revalidate: REVISION_SECONDS, tags: [CONTENT_CACHE_TAG] },
  );
  return read();
}

/**
 * Cache one localized dataset.
 *
 * The locale and the revision are part of the cache key and tag, so:
 *  - one language can never be served from another language's cache entry;
 *  - an administrator write produces a new revision, which is a new key — the
 *    updated copy is served on the next request, not after a TTL.
 */
export function cachedContent<T>(
  key: string,
  locale: Locale,
  revision: number,
  loader: () => Promise<T>,
): Promise<T> {
  const cacheKey = `${key}:${locale}:${revision}`;
  const read = unstable_cache(loader, [cacheKey], {
    revalidate: 3600,
    tags: [
      CONTENT_CACHE_TAG,
      `${CONTENT_CACHE_TAG}:${locale}`,
      `${CONTENT_CACHE_TAG}:${key}`,
    ],
  });
  return read();
}

/**
 * Call after an admin write. Bumps the shared revision (every instance sees new
 * content on its next revision read) and invalidates this instance immediately.
 */
export async function invalidatePublicContent(
  entity: string,
  entityId: number,
  action = "update",
) {
  try {
    await db.insert(contentRevisions).values({ entity, entityId, action });
  } catch (error) {
    console.error("Could not record content revision:", error);
  }
  try {
    // Next 16 requires a cache-life profile as the second argument.
    revalidateTag(CONTENT_CACHE_TAG, "max");
  } catch {
    // Outside a request scope (scripts, tests) this is a no-op.
  }
}
