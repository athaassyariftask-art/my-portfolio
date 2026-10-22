import { handle } from '@/lib/server'

// Foto profil disajikan dari alamat website sendiri (same-origin), supaya tekstur 3D di lanyard tidak terblokir CORS.
export async function GET() {
  const res = await handle({ method: 'GET', path: 'profile', staff: false })
  const url = (res.body as { photo?: string } | null)?.photo
  let host = ''
  try {
    host = url ? new URL(url).hostname : ''
  } catch {}
  if (!url || !host.endsWith('.blob.vercel-storage.com')) return new Response('Not found', { status: 404 })

  const upstream = await fetch(url)
  if (!upstream.ok || !upstream.body) return new Response('Not found', { status: 404 })
  return new Response(upstream.body, {
    headers: {
      'Content-Type': upstream.headers.get('content-type') ?? 'image/jpeg',
      // alamat berubah (?v=...) tiap ganti foto, jadi aman di-cache lama
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  })
}
