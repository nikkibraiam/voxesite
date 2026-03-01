export interface ImageInput {
  /** Raw base64-encoded image data (no data URI prefix). */
  data: string
  /** MIME type, e.g. 'image/png', 'image/jpeg', 'image/webp'. */
  mimeType: string
}

const SUPPORTED_MIME_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'] as const

/**
 * Validates and normalises a base64 image input.
 *
 * Accepts either:
 * - A raw base64 string with a separately provided mimeType
 * - A data URI string like `data:image/png;base64,...`
 *
 * Throws if the mimeType is not a supported image format.
 */
export function prepareScreenshot(rawInput: string, mimeType?: string): ImageInput {
  let data = rawInput
  let resolvedMime = (mimeType ?? 'image/jpeg').toLowerCase()

  // Strip data URI prefix if present and extract mimeType from it
  if (rawInput.startsWith('data:')) {
    const match = rawInput.match(/^data:([^;]+);base64,(.+)$/)
    if (!match) {
      throw new Error('Invalid data URI format. Expected: data:<mimeType>;base64,<data>')
    }
    resolvedMime = match[1].toLowerCase()
    data = match[2]
  }

  // Normalise jpg -> jpeg
  if (resolvedMime === 'image/jpg') resolvedMime = 'image/jpeg'

  if (!SUPPORTED_MIME_TYPES.includes(resolvedMime as any)) {
    throw new Error(
      `Unsupported image type "${resolvedMime}". Supported types: ${SUPPORTED_MIME_TYPES.join(', ')}`
    )
  }

  // Verify it looks like valid base64
  if (!/^[A-Za-z0-9+/]+=*$/.test(data.replace(/\s/g, ''))) {
    throw new Error('Invalid base64 data in image input')
  }

  return { data, mimeType: resolvedMime }
}
