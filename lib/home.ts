// Editable content of the home page's About row, achievement cards and Expertise columns.
// Defaults live in hero.config.ts; anything saved in Admin → Profile → Home content replaces them.
// Pure types and helpers only (no server code), so the admin form and the page can both import this.

export const ICON_KEYS = [
  'workflow', 'code', 'target', 'palette', 'database', 'users', 'lightbulb', 'layers', 'briefcase', 'rocket', 'wrench', 'globe', 'smartphone',
] as const
export type IconKey = (typeof ICON_KEYS)[number]

/** number = a fixed number; years = whole years since `since` (YYYY-MM); projects = how many projects you published */
export type StatMode = 'number' | 'years' | 'projects'
export type HomeStat = { label: string; mode: StatMode; value: number; since: string; suffix: string }
export type HomeExpertise = { icon: IconKey; title: string; text: string }
export type HomeContent = { tagline?: string; stats?: HomeStat[]; expertise?: HomeExpertise[] }

/** The shapes used in hero.config.ts (loose, to keep that file easy to edit by hand) */
export type ConfigStat = { label: string; since?: string; projects?: boolean; value?: number; suffix?: string }
export type ConfigExpertise = { icon: string; title: string; text: string }

export const statsFromConfig = (list: ConfigStat[]): HomeStat[] =>
  list.map((s) => ({
    label: s.label,
    mode: s.projects ? 'projects' : s.since ? 'years' : 'number',
    value: s.value ?? 0,
    since: s.since ?? '',
    suffix: s.suffix ?? '',
  }))

export const expertiseFromConfig = (list: ConfigExpertise[]): HomeExpertise[] =>
  list.map((e) => ({ icon: (ICON_KEYS as readonly string[]).includes(e.icon) ? (e.icon as IconKey) : 'code', title: e.title, text: e.text }))

/** Whole years from "YYYY-MM" until `now` (never negative; 0 when the text is not a valid month). */
export function yearsSince(ym: string, now: Date): number {
  const m = ym.match(/^(\d{4})-(\d{1,2})$/)
  if (!m) return 0
  const months = (now.getFullYear() - Number(m[1])) * 12 + (now.getMonth() + 1 - Number(m[2]))
  return Math.max(0, Math.floor(months / 12))
}

/** The number a card shows. */
export function statValue(s: HomeStat, projectCount: number, now: Date): number {
  return s.mode === 'projects' ? projectCount : s.mode === 'years' ? yearsSince(s.since, now) : s.value
}

/** Saved content wins; a missing key falls back to the default (an explicit empty list means "show none"). */
export function resolveHome(saved: HomeContent | null | undefined, defaults: { tagline: string; stats: HomeStat[]; expertise: HomeExpertise[] }) {
  return {
    tagline: saved?.tagline?.trim() ? saved.tagline : defaults.tagline,
    stats: Array.isArray(saved?.stats) ? saved.stats : defaults.stats,
    expertise: Array.isArray(saved?.expertise) ? saved.expertise : defaults.expertise,
  }
}
