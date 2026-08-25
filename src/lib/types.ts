/**
 * Plain, serializable view shapes passed from server components (page.tsx)
 * into client components. Server rows contain Date objects which cannot cross
 * the RSC boundary, so the page maps rows to these shapes first.
 */
export type SettingsView = import("@/lib/data").ResolvedSettings;

export interface CategoryView {
  id: number;
  name: string;
  slug: string;
  sortOrder: number;
}

export interface CurtainView {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  category: string | null;
  imageUrl: string | null;
  material: string | null;
  color: string | null;
  isFeatured: boolean;
  likes: number;
  sortOrder: number;
}

export interface InteriorView {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  location: string | null;
  isFeatured: boolean;
  sortOrder: number;
}

export interface StatView {
  id: number;
  label: string;
  value: string;
  suffix: string | null;
  sortOrder: number;
}
