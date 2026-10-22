// Bentuk data backend. Nama field sengaja sama dengan API Django sebelumnya (snake_case),
// jadi lib/projects.ts, lib/sections.ts, dst. tidak perlu diubah.

export type Project = {
  id: number
  title: string
  summary: string
  description: string
  tech_stack: string[]
  github_url: string | null
  demo_url: string | null
  image: string | null
  featured: boolean
  is_published: boolean
  order: number
  created_at: string
}
export type ProjectInput = Omit<Project, 'id' | 'created_at'>

export type Profile = {
  name: string
  role: string
  affiliation: string
  email: string
  intro: string
  photo: string
  cv: string
  links: { label: string; href: string }[]
}

export type SectionRow = {
  id: number
  kind: string
  slug: string
  title: string
  layout: string
  schema: unknown[]
  options: Record<string, unknown>
  page: string
  items: Record<string, unknown>[]
  is_visible: boolean
  order: number
}
export type SectionInput = Omit<SectionRow, 'id'>

export type DetailRow = { key: string; blocks: unknown[]; title: string; parent: string }

export type Message = { id: number; name: string; email: string; message: string; created_at: string }
export type MessageInput = { name: string; email: string; message: string; ip: string }

/** Semua akses data lewat antarmuka ini: store.pg.ts (Postgres/Neon) dan store.mem.ts (memori, untuk tes & dev tanpa DB). */
export interface Store {
  listProjects(opts: { publishedOnly: boolean }): Promise<Project[]>
  getProject(id: number): Promise<Project | null>
  insertProject(p: ProjectInput): Promise<Project>
  updateProject(id: number, patch: Partial<ProjectInput>): Promise<Project | null>
  deleteProject(id: number): Promise<boolean>

  getProfile(): Promise<Profile>
  saveProfile(patch: Partial<Profile>): Promise<Profile>

  listSections(opts: { visibleOnly: boolean; slug?: string }): Promise<SectionRow[]>
  getSection(id: number): Promise<SectionRow | null>
  slugTaken(slug: string, exceptId?: number): Promise<boolean>
  insertSection(s: SectionInput): Promise<SectionRow>
  updateSection(id: number, patch: Partial<SectionInput>): Promise<SectionRow | null>
  deleteSection(id: number): Promise<boolean>

  listDetailKeys(): Promise<string[]>
  getDetail(key: string): Promise<DetailRow | null>
  upsertDetail(key: string, patch: Partial<Omit<DetailRow, 'key'>>): Promise<DetailRow>

  listMessages(): Promise<Message[]>
  getMessage(id: number): Promise<Message | null>
  insertMessage(m: MessageInput): Promise<Message>
  countRecentMessages(ip: string): Promise<number> // dalam 1 jam terakhir
  deleteMessage(id: number): Promise<boolean>
}
