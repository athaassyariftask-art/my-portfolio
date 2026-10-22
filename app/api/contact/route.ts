import { NextResponse } from 'next/server'
import { handle } from '@/lib/server'
import { clientIp } from '@/lib/server/session'

// Form kontak publik (dibatasi 5 pesan/jam per IP di dispatcher)
export async function POST(req: Request) {
  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ detail: 'Data tidak valid.' }, { status: 400 })
  const res = await handle({ method: 'POST', path: 'contact', body, staff: false, ip: clientIp(req) })
  return NextResponse.json(res.body, { status: res.status })
}
