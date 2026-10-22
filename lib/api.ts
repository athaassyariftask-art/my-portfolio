import { cookies } from 'next/headers'
import { handle } from './server'
import { TOKEN_COOKIE, verifyToken } from './server/session'

export { TOKEN_COOKIE }

/** Apakah permintaan saat ini dari admin yang sudah login (cookie bertanda tangan valid). */
export async function isStaff(): Promise<boolean> {
  try {
    return verifyToken((await cookies()).get(TOKEN_COOKIE)?.value)
  } catch {
    return false
  }
}

/**
 * GET data dari backend (kini di dalam Next.js sendiri, bukan Django).
 * auth: true = tampilkan juga data yang disembunyikan (khusus admin). Gagal -> null (website tetap jalan).
 */
export async function apiGet<T>(path: string, opts?: { auth?: boolean }): Promise<T | null> {
  try {
    const [pathname, search = ''] = path.split('?')
    const query = Object.fromEntries(new URLSearchParams(search))
    const staff = opts?.auth ? await isStaff() : false
    const res = await handle({ method: 'GET', path: pathname, query, staff })
    return res.status >= 200 && res.status < 300 ? (res.body as T) : null
  } catch {
    return null
  }
}

/** Tetap menerima list biasa atau {results: [...]}. */
export function unwrapList<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[]
  const results = (data as { results?: T[] } | null)?.results
  return Array.isArray(results) ? results : []
}
