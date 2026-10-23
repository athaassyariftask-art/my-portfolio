import { site as defaults } from '@/site.config'
import { apiGet } from './api'

export type Site = Omit<typeof defaults, 'headline'> & { cv: string } // cv: PDF URL from Admin → Profile (empty = button hidden)

/** Small hash for cache-busting the photo URL. */
const hash = (s: string) => {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return h.toString(36)
}
const str = (v: unknown, fallback: string) => (typeof v === 'string' && v.trim() ? v : fallback)
const arr = <T,>(v: unknown, fallback: T[]): T[] => (Array.isArray(v) && v.length ? (v as T[]) : fallback)

/**
 * Profile = content from the database (edited via /admin), with site.config.ts as a fallback.
 * Empty columns in the database automatically use the default value, so the site is never blank.
 */
export async function getProfile(): Promise<Site> {
  const d = await apiGet<Record<string, unknown>>('/profile/')
  if (!d) {
    const { headline: _unused, ...rest } = defaults
    void _unused
    return { ...rest, cv: '' }
  }

  return {
    name: str(d.name, defaults.name),
    role: str(d.role, defaults.role),
    affiliation: str(d.affiliation, defaults.affiliation),
    email: str(d.email, defaults.email),
    // Photos from Vercel Blob are served via /api/photo (same-origin for the lanyard); if none is uploaded, use site.config.ts
    photo: typeof d.photo === 'string' && d.photo ? `/api/photo?v=${hash(d.photo)}` : defaults.photo,
    cv: typeof d.cv === 'string' && d.cv.startsWith('https://') ? d.cv : '',
    links: arr(d.links, defaults.links),
    intro: str(d.intro, defaults.intro),
  }
}
