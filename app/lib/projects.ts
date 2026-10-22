import { apiGet, unwrapList } from './api'

export type Project = {
  id: number
  title: string
  summary: string
  description: string // Markdown
  tags: string[]
  repo?: string | null
  demo?: string | null
  cover?: string | null
  featured: boolean
  published: boolean
  order: number
  date: string
}

type Raw = {
  id: number
  title: string
  summary?: string
  description?: string
  tech_stack?: string[]
  github_url?: string | null
  demo_url?: string | null
  image?: string | null
  featured?: boolean
  is_published?: boolean
  order?: number
  created_at?: string
}

// Link kosong / bukan http(s) dianggap tidak ada, supaya tombolnya tidak tampil
const link = (v?: string | null) => (typeof v === 'string' && /^https?:\/\/\S+/i.test(v.trim()) ? v.trim() : null)

const map = (r: Raw): Project => ({
  id: r.id,
  title: r.title,
  summary: r.summary ?? '',
  description: r.description ?? '',
  tags: Array.isArray(r.tech_stack) ? r.tech_stack : [],
  repo: link(r.github_url),
  demo: link(r.demo_url),
  cover: r.image,
  featured: Boolean(r.featured),
  published: r.is_published ?? true,
  order: r.order ?? 0,
  date: (r.created_at ?? '').slice(0, 10),
})

export async function getProjects(opts?: { auth?: boolean }): Promise<Project[]> {
  const data = await apiGet<unknown>('/projects/', opts)
  return data ? unwrapList<Raw>(data).map(map) : []
}

export async function getProject(id: string, opts?: { auth?: boolean }): Promise<Project | null> {
  const data = await apiGet<Raw>(`/projects/${encodeURIComponent(id)}/`, opts)
  return data ? map(data) : null
}
