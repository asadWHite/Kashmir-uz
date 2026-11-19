/** Shared references only: image bytes never travel with a blind product. */
export const MAX_BLIND_GALLERY_IMAGES = 12;
export const BLIND_IMAGE_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export function adminBlindImageUrl(id: string) {
  return `/api/admin/blinds/images/${id}`;
}

export function publicBlindImageUrl(id: string) {
  return `/api/media/blinds/${id}`;
}
