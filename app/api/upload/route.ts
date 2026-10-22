import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client'
import { TOKEN_COOKIE, verifyToken } from '@/lib/server/session'

const RULES: Record<string, { types: string[]; maxMb: number }> = {
  image: { types: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'], maxMb: 8 },
  video: { types: ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-m4v'], maxMb: 100 },
  pdf: { types: ['application/pdf'], maxMb: 10 },
}

// Server hanya menerbitkan "tiket upload" (khusus admin, dengan batas jenis & ukuran); file-nya dikirim browser langsung ke Blob.
export async function POST(req: Request) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json({ error: 'BLOB_READ_WRITE_TOKEN belum diisi (hubungkan Vercel Blob, lihat DEPLOY.md).' }, { status: 500 })
  }
  const body = (await req.json().catch(() => null)) as HandleUploadBody | null
  if (!body) return NextResponse.json({ error: 'Data tidak valid.' }, { status: 400 })

  try {
    const json = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async (_pathname, clientPayload) => {
        if (!verifyToken((await cookies()).get(TOKEN_COOKIE)?.value)) throw new Error('Sesi habis, silakan login lagi.')
        const rule = RULES[clientPayload ?? '']
        if (!rule) throw new Error('Jenis upload tidak dikenal.')
        return { allowedContentTypes: rule.types, maximumSizeInBytes: rule.maxMb * 1024 * 1024, addRandomSuffix: true }
      },
      onUploadCompleted: async () => {},
    })
    return NextResponse.json(json)
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Upload ditolak.' }, { status: 400 })
  }
}
