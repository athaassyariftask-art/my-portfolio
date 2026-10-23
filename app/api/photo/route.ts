import { handle } from '@/lib/server'

// The profile photo is served from the site's own origin (same-origin) so the lanyard's 3D texture isn't blocked by CORS.
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
      // the URL changes (?v=...) whenever the photo changes, so it is safe to cache for a long time
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  })
}
