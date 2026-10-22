import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { API_URL, TOKEN_COOKIE } from '@/lib/api'

// Proxy ke Django yang menambahkan token dari cookie httpOnly.
// Hanya endpoint ini yang boleh diteruskan (daftar putih).
const ALLOWED = new Set(['projects', 'profile', 'contact', 'sections', 'pages', 'uploads', 'details'])

async function handler(req: Request, ctx: { params: Promise<{ path: string[] }> }) {
  const token = (await cookies()).get(TOKEN_COOKIE)?.value
  if (!token) return NextResponse.json({ detail: 'Belum login.' }, { status: 401 })

  const { path } = await ctx.params
  if (!ALLOWED.has(path[0])) return NextResponse.json({ detail: 'Not found.' }, { status: 404 })

  const target = `${API_URL}/${path.map(encodeURIComponent).join('/')}/${new URL(req.url).search}`

  const headers: Record<string, string> = { Authorization: `Bearer ${token}` }
  const contentType = req.headers.get('content-type')
  if (contentType) headers['Content-Type'] = contentType // termasuk boundary multipart (upload gambar)

  const hasBody = req.method !== 'GET' && req.method !== 'HEAD'
  let res: Response
  try {
    res = await fetch(target, {
      method: req.method,
      headers,
      body: hasBody ? await req.arrayBuffer() : undefined,
      cache: 'no-store',
    })
  } catch {
    return NextResponse.json({ detail: 'Backend tidak bisa dihubungi.' }, { status: 502 })
  }

  if (res.status === 204) return new NextResponse(null, { status: 204 })
  return new NextResponse(await res.arrayBuffer(), {
    status: res.status,
    headers: { 'Content-Type': res.headers.get('content-type') ?? 'application/json' },
  })
}

export { handler as GET, handler as POST, handler as PATCH, handler as PUT, handler as DELETE }
