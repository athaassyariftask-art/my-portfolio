import { upload } from '@vercel/blob/client'

// Upload langsung dari browser ke Vercel Blob (tidak lewat fungsi server), jadi tidak ada batas 4,5 MB.
export const MAX_IMAGE_MB = 8
export const MAX_CV_MB = 10
export const MAX_VIDEO_MB = 100

export type UploadKind = 'image' | 'video' | 'pdf'

const safeName = (name: string) => name.replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/^-+/, '').slice(-80) || 'file'

async function put(file: File, kind: UploadKind, maxMb: number, tooBig: string): Promise<string> {
  if (file.size > maxMb * 1024 * 1024) throw new Error(tooBig)
  try {
    const blob = await upload(`${kind}/${safeName(file.name)}`, file, {
      access: 'public',
      handleUploadUrl: '/api/upload',
      clientPayload: kind,
      multipart: file.size > 8 * 1024 * 1024,
    })
    return blob.url
  } catch (e) {
    throw new Error(e instanceof Error && e.message ? e.message : 'Upload gagal.')
  }
}

/** Upload gambar. Mengembalikan alamat https publik. */
export const uploadImage = (file: File) => put(file, 'image', MAX_IMAGE_MB, `Ukuran maksimal ${MAX_IMAGE_MB} MB.`)

/** Upload video (mp4/webm/mov). */
export const uploadVideo = (file: File) =>
  put(file, 'video', MAX_VIDEO_MB, `Ukuran video maksimal ${MAX_VIDEO_MB} MB. Untuk video besar, pakai blok Embed (link YouTube).`)

/** Upload CV (PDF). */
export const uploadPdf = (file: File) => put(file, 'pdf', MAX_CV_MB, `Ukuran maksimal ${MAX_CV_MB} MB.`)
