const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png"])

export const MAX_AVATAR_BYTES = 2 * 1024 * 1024 // 2 MB
export const MAX_BANNER_BYTES = 5 * 1024 * 1024 // 5 MB

/**
 * Validates that a file is a JPEG or PNG within `maxBytes` and resizes it if needed
 * (SRS 3.2.3.3: "The photo type and size are checked; the image is resized if needed").
 */
export async function validateAndProcessImage(
  file: File,
  maxBytes: number,
  maxDimension = 512
): Promise<{ ok: true; dataUrl: string } | { ok: false }> {
  if (!ALLOWED_MIME_TYPES.has(file.type) || file.size > maxBytes) {
    return { ok: false }
  }

  const rawDataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })

  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image()
      element.onload = () => resolve(element)
      element.onerror = (err) => reject(err)
      element.src = rawDataUrl
    })

    if (img.width <= maxDimension && img.height <= maxDimension) {
      return { ok: true, dataUrl: rawDataUrl }
    }

    const scale = Math.min(maxDimension / img.width, maxDimension / img.height)
    const width = Math.round(img.width * scale)
    const height = Math.round(img.height * scale)

    const canvas = document.createElement("canvas")
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext("2d")
    if (!ctx) return { ok: true, dataUrl: rawDataUrl }

    ctx.drawImage(img, 0, 0, width, height)
    const outputType = file.type === "image/png" ? "image/png" : "image/jpeg"
    return { ok: true, dataUrl: canvas.toDataURL(outputType, 0.9) }
  } catch {
    return { ok: true, dataUrl: rawDataUrl }
  }
}

