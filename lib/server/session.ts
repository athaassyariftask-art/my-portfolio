// Login admin tunggal: password di environment variable, sesi = cookie bertanda tangan HMAC (tanpa tabel user / JWT).
import { createHmac, timingSafeEqual } from 'node:crypto'

export const TOKEN_COOKIE = 'porto_admin'
export const SESSION_SECONDS = 60 * 60 * 12

const secret = () => {
  const pw = process.env.ADMIN_PASSWORD
  if (!pw) throw new Error('ADMIN_PASSWORD belum diisi (lihat DEPLOY.md).')
  // password ikut jadi kunci: ganti password = semua sesi lama otomatis tidak berlaku
  return `${process.env.SESSION_SECRET ?? ''}|${pw}`
}
const sign = (payload: string) => createHmac('sha256', secret()).update(payload).digest('base64url')

function safeEqual(a: string, b: string): boolean {
  const x = Buffer.from(a)
  const y = Buffer.from(b)
  return x.length === y.length && timingSafeEqual(x, y)
}

export function createToken(now = Date.now()): string {
  const exp = String(Math.floor(now / 1000) + SESSION_SECONDS)
  return `${exp}.${sign(exp)}`
}

export function verifyToken(token: string | undefined | null, now = Date.now()): boolean {
  if (!token || !process.env.ADMIN_PASSWORD) return false
  const [exp, sig] = token.split('.')
  if (!exp || !sig || !/^\d+$/.test(exp)) return false
  if (Number(exp) * 1000 < now) return false
  return safeEqual(sig, sign(exp))
}

export function checkCredentials(username: unknown, password: unknown): boolean {
  const pw = process.env.ADMIN_PASSWORD
  if (!pw || typeof password !== 'string') return false
  const user = process.env.ADMIN_USERNAME || 'admin'
  // dibandingkan lewat hash supaya panjangnya sama dan waktunya konstan
  const h = (s: string) => createHmac('sha256', 'cmp').update(s).digest()
  const okUser = timingSafeEqual(h(String(username ?? '')), h(user))
  const okPass = timingSafeEqual(h(password), h(pw))
  return okUser && okPass
}

// Pembatas percobaan login (di memori; cukup untuk menahan tebak-tebakan sederhana)
const attempts = new Map<string, { n: number; reset: number }>()
const MAX_ATTEMPTS = 8
const WINDOW_MS = 15 * 60 * 1000

export function loginBlocked(ip: string, now = Date.now()): boolean {
  const a = attempts.get(ip)
  return !!a && a.reset > now && a.n >= MAX_ATTEMPTS
}
export function loginFailed(ip: string, now = Date.now()) {
  const a = attempts.get(ip)
  if (!a || a.reset <= now) attempts.set(ip, { n: 1, reset: now + WINDOW_MS })
  else a.n++
}
export function loginSucceeded(ip: string) {
  attempts.delete(ip)
}

export function clientIp(req: Request): string {
  const h = req.headers
  return (h.get('x-real-ip') || h.get('x-forwarded-for')?.split(',')[0] || 'unknown').trim()
}
