const MEGABYTE = 1024 * 1024;

/** The only image formats the backend accepts for every upload. */
export const IMAGE_MIME_TYPES = ["image/jpeg", "image/png"] as const;

export type ImageMimeType = (typeof IMAGE_MIME_TYPES)[number];

export const IMAGE_LIMITS = {
  avatar: { maxBytes: 2 * MEGABYTE, maxDimension: 512 },
  cover: { maxBytes: 5 * MEGABYTE, maxDimension: 1600 },
  banner: { maxBytes: 5 * MEGABYTE, maxDimension: 1600 },
} as const;

export type ImageKind = keyof typeof IMAGE_LIMITS;

export function isImageMimeType(type: string): type is ImageMimeType {
  return IMAGE_MIME_TYPES.some((allowed) => allowed === type);
}
