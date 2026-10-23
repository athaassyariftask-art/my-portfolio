import { NextResponse } from 'next/server'
import { handle } from '@/lib/server'
import { clientIp } from '@/lib/server/session'

// Public contact form (limited to 5 messages/hour per IP in the dispatcher)
export async function POST(req: Request) {
  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ detail: 'Invalid data.' }, { status: 400 })
  const res = await handle({ method: 'POST', path: 'contact', body, staff: false, ip: clientIp(req) })
  return NextResponse.json(res.body, { status: res.status })
}
