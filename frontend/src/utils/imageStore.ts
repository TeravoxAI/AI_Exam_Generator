// Shared image attachment store — images + per-image display options
export interface ImageAttachment {
  dataUrl: string
  widthMm: number   // display width in mm for PDF (default 55)
  heightMm: number  // display height in mm for PDF (default 42)
  alignment: 'left' | 'center' | 'right'
}

export type ImageStore = Record<string, ImageAttachment>

export const DEFAULT_IMAGE: Omit<ImageAttachment, 'dataUrl'> = {
  widthMm: 55,
  heightMm: 42,
  alignment: 'center',
}

export function imageStoreToLegacy(store: ImageStore): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [k, v] of Object.entries(store)) {
    out[k] = v.dataUrl
  }
  return out
}
