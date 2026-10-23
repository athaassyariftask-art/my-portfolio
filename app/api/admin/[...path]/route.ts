import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { handle } from '@/lib/server'
import { TOKEN_COOKIE, verifyToken } from '@/lib/server/session'

// Gateway for all writes from the admin pages. The cookie is checked here; the same dispatcher handles reads.
const ALLOWED = new Set(['projects', 'profile', 'contact', 'sections', 'details'])

async function forward(req: Request, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params
  if (!ALLOWED.has(path[0])) return NextResponse.json({ detail: 'Not found.' }, { status: 404 })

  const staff = verifyToken((await cookies()).get(TOKEN_COOKIE)?.value)
  if (!staff) return NextResponse.json({ detail: 'Session expired, please log in again.' }, { status: 401 })

  let body: unknown
  if (req.method !== 'GET' && req.method !== 'DELETE') {
    body = await req.json().catch(() => undefined)
    if (body === undefined) return NextResponse.json({ detail: 'Body must be JSON.' }, { status: 400 })
  }
  const url = new URL(req.url)
  const res = await handle({
    method: req.method,
    path: path.join('/'),
    query: Object.fromEntries(url.searchParams),
    body,
    staff: true,
  })
  if (res.status === 204) return new NextResponse(null, { status: 204 })
  return NextResponse.json(res.body, { status: res.status })
}

export { forward as GET, forward as POST, forward as PUT, forward as PATCH, forward as DELETE }
