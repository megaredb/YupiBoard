import {
  IMAGE_LIMITS,
  isImageMimeType,
  type ImageKind,
} from "@/shared/lib/image/image-constraints";

const RESIZE_QUALITY = 0.9;

export type PrepareImageResult =
  { status: "ok"; file: File } | { status: "invalid-type" } | { status: "too-large" };

function loadImage(file: File): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(file);
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Image could not be decoded"));
    image.src = url;
  }).finally(() => URL.revokeObjectURL(url));
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, RESIZE_QUALITY));
}

async function downscale(file: File, maxDimension: number): Promise<File> {
  const image = await loadImage(file);
  if (image.width <= maxDimension && image.height <= maxDimension) return file;

  const scale = Math.min(maxDimension / image.width, maxDimension / image.height);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(image.width * scale);
  canvas.height = Math.round(image.height * scale);
  const context = canvas.getContext("2d");
  if (!context) return file;

  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  const blob = await canvasToBlob(canvas, file.type);
  return blob ? new File([blob], file.name, { type: file.type }) : file;
}

/** The single upload pipeline: checks type and size, then downscales to the kind's limit. */
export async function prepareImage(file: File, kind: ImageKind): Promise<PrepareImageResult> {
  const limits = IMAGE_LIMITS[kind];
  if (!isImageMimeType(file.type)) return { status: "invalid-type" };
  if (file.size > limits.maxBytes) return { status: "too-large" };
  try {
    return { status: "ok", file: await downscale(file, limits.maxDimension) };
  } catch {
    // Undecodable files are still valid uploads; the backend re-checks them.
    return { status: "ok", file };
  }
}
