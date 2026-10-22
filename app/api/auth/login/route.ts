import { NextResponse } from 'next/server'
import {
  SESSION_SECONDS, TOKEN_COOKIE, checkCredentials, clientIp, createToken, loginBlocked, loginFailed, loginSucceeded,
} from '@/lib/server/session'

export async function POST(req: Request) {
  if (!process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'ADMIN_PASSWORD belum diisi di environment variable.' }, { status: 500 })
  }
  const ip = clientIp(req)
  if (loginBlocked(ip)) return NextResponse.json({ error: 'Terlalu banyak percobaan. Coba lagi sebentar.' }, { status: 429 })

  const { username, password } = await req.json().catch(() => ({}))
  if (!checkCredentials(username, password)) {
    loginFailed(ip)
    return NextResponse.json({ error: 'Username atau password salah.' }, { status: 401 })
  }
  loginSucceeded(ip)

  const out = NextResponse.json({ ok: true })
  // httpOnly: tidak bisa dibaca JavaScript di browser (aman dari XSS)
  out.cookies.set(TOKEN_COOKIE, createToken(), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_SECONDS,
  })
  return out
}
