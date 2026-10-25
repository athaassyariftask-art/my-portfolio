// Helpers for reading free-text periods such as "November 2024 - Now" or "2023 - 2027 (expected)".
// Everything here is best-effort: when a period can't be understood the helpers return ''/null and the UI simply
// leaves the extra detail out.

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']

/** "Now", "Present" or "Current" means the period is still going on. */
export const isLive = (meta: string) => /\b(present|now|current)\b/i.test(meta)

/** A bare year means January when it starts a period and December when it ends one. */
export function parseDate(s: string, asEnd = false): Date | null {
  const m = s.match(/([A-Za-z]{3,9})\.?\s+((?:19|20)\d{2})/)
  if (m) {
    const i = MONTHS.indexOf(m[1].slice(0, 3).toLowerCase())
    if (i >= 0) return new Date(Number(m[2]), i, 1)
  }
  const y = s.match(/\b(?:19|20)\d{2}\b/)
  return y ? new Date(Number(y[0]), asEnd ? 11 : 0, 1) : null
}

export type Range = { start: Date; end: Date | null }

/** Start and end of a period. `end` is null while it is still going on ("Now" / "Present"). */
export function periodRange(meta: string): Range | null {
  const parts = meta.split(/\s*[-–—]\s*|\s+to\s+/i)
  if (parts.length < 2) return null
  const start = parseDate(parts[0])
  if (!start) return null
  if (isLive(parts[1])) return { start, end: null }
  const end = parseDate(parts[1], true)
  return end ? { start, end } : null
}

/** "November 2024 - Now" -> "2 yrs". Returns '' when the period text can't be understood. */
export function duration(meta: string, now: Date): string {
  const r = periodRange(meta)
  if (!r) return ''
  const end = r.end ?? now
  const months = (end.getFullYear() - r.start.getFullYear()) * 12 + end.getMonth() - r.start.getMonth() + 1
  if (months < 1) return ''
  const y = Math.floor(months / 12)
  const mo = months % 12
  return [y ? `${y} yr${y > 1 ? 's' : ''}` : '', mo ? `${mo} mo` : ''].filter(Boolean).join(' ')
}

/** How far through a period with a known end we are, from 0 to 1. */
export function progress(r: Range & { end: Date }, now: Date): number {
  const total = r.end.getTime() - r.start.getTime()
  if (total <= 0) return 1
  return Math.min(1, Math.max(0, (now.getTime() - r.start.getTime()) / total))
}
