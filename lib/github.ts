// GitHub activity for the home page. Everything here is best-effort: any failure (rate limit, offline,
// unknown user) returns null and the section simply doesn't render.

export type Day = { date: string; count: number; level: 0 | 1 | 2 | 3 | 4 }
export type GithubActivity = { user: string; total: number; days: Day[]; repos: number | null; followers: number | null }

/** "https://github.com/someone" -> "someone". Returns '' when nothing matches. */
export function githubUser(links: { label: string; href: string }[], override = ''): string {
  if (override.trim()) return override.trim().replace(/^@/, '')
  for (const l of links) {
    const m = l.href.match(/^https?:\/\/(?:www\.)?github\.com\/([A-Za-z0-9-]+)\/?$/i)
    if (m) return m[1]
  }
  return ''
}

async function getJson(url: string): Promise<unknown | null> {
  try {
    const res = await fetch(url, { next: { revalidate: 3600 }, signal: AbortSignal.timeout(5000) })
    return res.ok ? await res.json() : null
  } catch {
    return null
  }
}

const num = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null)

export async function getGithubActivity(user: string): Promise<GithubActivity | null> {
  if (!user) return null
  const name = encodeURIComponent(user)
  const [c, u] = await Promise.all([
    getJson(`https://github-contributions-api.jogruber.de/v4/${name}?y=last`),
    getJson(`https://api.github.com/users/${name}`),
  ])
  const list = (c as { contributions?: unknown } | null)?.contributions
  if (!Array.isArray(list) || list.length === 0) return null

  const days: Day[] = []
  for (const d of list as Record<string, unknown>[]) {
    if (typeof d.date !== 'string') continue
    const level = Math.min(4, Math.max(0, Math.round(num(d.level) ?? 0))) as Day['level']
    days.push({ date: d.date, count: num(d.count) ?? 0, level })
  }
  if (days.length === 0) return null
  days.sort((a, b) => a.date.localeCompare(b.date))

  const total = num((c as { total?: Record<string, unknown> }).total?.lastYear) ?? days.reduce((s, d) => s + d.count, 0)
  const profile = u as Record<string, unknown> | null
  return { user, total, days, repos: num(profile?.public_repos), followers: num(profile?.followers) }
}

/** Lay days out like GitHub: columns are weeks (Sunday first), rows are weekdays. */
export function toWeeks(days: Day[]): (Day | null)[][] {
  if (days.length === 0) return []
  const first = new Date(days[0].date + 'T00:00:00Z').getUTCDay() // 0 = Sunday
  const cells: (Day | null)[] = [...Array<null>(first).fill(null), ...days]
  const weeks: (Day | null)[][] = []
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7))
  return weeks
}
