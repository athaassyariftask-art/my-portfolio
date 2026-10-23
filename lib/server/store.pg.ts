import { neon } from '@neondatabase/serverless'
import type { DetailRow, Message, Profile, Project, SectionRow, Store } from './types'

let _sql: ReturnType<typeof neon> | null = null
function sql() {
  if (!_sql) {
    const url = process.env.DATABASE_URL
    if (!url) throw new Error('DATABASE_URL is not set (see DEPLOY.md).')
    _sql = neon(url)
  }
  return _sql
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>
async function q(text: string, params: unknown[] = []): Promise<Row[]> {
  return (await (sql() as unknown as { query: (t: string, p: unknown[]) => Promise<Row[]> }).query(text, params)) as Row[]
}

let ready: Promise<void> | null = null
/** Membuat tabel bila belum ada (aman dipanggil berkali-kali). */
export function ensureSchema(): Promise<void> {
  if (!ready) {
    ready = (async () => {
      const stmts = [
        `CREATE TABLE IF NOT EXISTS projects (
          id SERIAL PRIMARY KEY, title TEXT NOT NULL, summary TEXT NOT NULL DEFAULT '', description TEXT NOT NULL DEFAULT '',
          tech_stack JSONB NOT NULL DEFAULT '[]', github_url TEXT, demo_url TEXT, image TEXT,
          featured BOOLEAN NOT NULL DEFAULT FALSE, is_published BOOLEAN NOT NULL DEFAULT TRUE,
          "order" INTEGER NOT NULL DEFAULT 0, created_at TIMESTAMPTZ NOT NULL DEFAULT now())`,
        `CREATE TABLE IF NOT EXISTS site_profile (
          id INTEGER PRIMARY KEY, name TEXT NOT NULL DEFAULT '', role TEXT NOT NULL DEFAULT '', affiliation TEXT NOT NULL DEFAULT '',
          email TEXT NOT NULL DEFAULT '', intro TEXT NOT NULL DEFAULT '', photo TEXT NOT NULL DEFAULT '', cv TEXT NOT NULL DEFAULT '',
          links JSONB NOT NULL DEFAULT '[]')`,
        `CREATE TABLE IF NOT EXISTS sections (
          id SERIAL PRIMARY KEY, kind TEXT NOT NULL DEFAULT 'items', slug TEXT NOT NULL UNIQUE, title TEXT NOT NULL,
          layout TEXT NOT NULL DEFAULT 'cards', schema JSONB NOT NULL DEFAULT '[]', options JSONB NOT NULL DEFAULT '{}',
          page TEXT NOT NULL DEFAULT 'home', items JSONB NOT NULL DEFAULT '[]',
          is_visible BOOLEAN NOT NULL DEFAULT TRUE, "order" INTEGER NOT NULL DEFAULT 0)`,
        `CREATE TABLE IF NOT EXISTS details (
          key TEXT PRIMARY KEY, blocks JSONB NOT NULL DEFAULT '[]', title TEXT NOT NULL DEFAULT '', parent TEXT NOT NULL DEFAULT '')`,
        `CREATE TABLE IF NOT EXISTS contact_messages (
          id SERIAL PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL, message TEXT NOT NULL,
          ip TEXT NOT NULL DEFAULT '', created_at TIMESTAMPTZ NOT NULL DEFAULT now())`,
        `INSERT INTO site_profile (id) VALUES (1) ON CONFLICT DO NOTHING`,
      ]
      for (const s of stmts) await q(s)
    })().catch((e) => {
      ready = null // coba lagi di permintaan berikutnya
      throw e
    })
  }
  return ready
}

const iso = (v: unknown) => (v instanceof Date ? v.toISOString() : String(v))
const toProject = (r: Row): Project => ({
  id: r.id, title: r.title, summary: r.summary, description: r.description, tech_stack: r.tech_stack ?? [],
  github_url: r.github_url, demo_url: r.demo_url, image: r.image, featured: r.featured, is_published: r.is_published,
  order: r.order, created_at: iso(r.created_at),
})
const toSection = (r: Row): SectionRow => ({
  id: r.id, kind: r.kind, slug: r.slug, title: r.title, layout: r.layout, schema: r.schema ?? [], options: r.options ?? {},
  page: r.page, items: r.items ?? [], is_visible: r.is_visible, order: r.order,
})
const toMessage = (r: Row): Message => ({ id: r.id, name: r.name, email: r.email, message: r.message, created_at: iso(r.created_at) })

/** Susun "SET kolom=$n, ..." dari objek perubahan. Nama kolom berasal dari daftar putih, bukan dari input pengguna. */
function setClause(patch: Record<string, unknown>, allowed: string[], jsonCols: string[], start = 1) {
  const cols: string[] = []
  const vals: unknown[] = []
  for (const k of allowed) {
    if (!(k in patch) || patch[k] === undefined) continue
    vals.push(jsonCols.includes(k) ? JSON.stringify(patch[k]) : patch[k])
    cols.push(`"${k}" = $${start + vals.length - 1}${jsonCols.includes(k) ? '::jsonb' : ''}`)
  }
  return { sql: cols.join(', '), vals }
}

const PROJECT_COLS = ['title', 'summary', 'description', 'tech_stack', 'github_url', 'demo_url', 'image', 'featured', 'is_published', 'order']
const SECTION_COLS = ['kind', 'slug', 'title', 'layout', 'schema', 'options', 'page', 'items', 'is_visible', 'order']

export const pgStore: Store = {
  async listProjects({ publishedOnly }) {
    await ensureSchema()
    const rows = await q(`SELECT * FROM projects ${publishedOnly ? 'WHERE is_published' : ''} ORDER BY "order", id DESC`)
    return rows.map(toProject)
  },
  async getProject(id) {
    await ensureSchema()
    const r = await q('SELECT * FROM projects WHERE id = $1', [id])
    return r[0] ? toProject(r[0]) : null
  },
  async insertProject(p) {
    await ensureSchema()
    const r = await q(
      `INSERT INTO projects (title, summary, description, tech_stack, github_url, demo_url, image, featured, is_published, "order")
       VALUES ($1,$2,$3,$4::jsonb,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [p.title, p.summary, p.description, JSON.stringify(p.tech_stack), p.github_url, p.demo_url, p.image, p.featured, p.is_published, p.order],
    )
    return toProject(r[0])
  },
  async updateProject(id, patch) {
    await ensureSchema()
    const s = setClause(patch, PROJECT_COLS, ['tech_stack'])
    if (!s.sql) return this.getProject(id)
    const r = await q(`UPDATE projects SET ${s.sql} WHERE id = $${s.vals.length + 1} RETURNING *`, [...s.vals, id])
    return r[0] ? toProject(r[0]) : null
  },
  async deleteProject(id) {
    await ensureSchema()
    return (await q('DELETE FROM projects WHERE id = $1 RETURNING id', [id])).length > 0
  },

  async getProfile() {
    await ensureSchema()
    const r = (await q('SELECT * FROM site_profile WHERE id = 1'))[0]
    return { name: r.name, role: r.role, affiliation: r.affiliation, email: r.email, intro: r.intro, photo: r.photo, cv: r.cv, links: r.links ?? [] }
  },
  async saveProfile(patch) {
    await ensureSchema()
    const s = setClause(patch, ['name', 'role', 'affiliation', 'email', 'intro', 'photo', 'cv', 'links'], ['links'])
    if (s.sql) await q(`UPDATE site_profile SET ${s.sql} WHERE id = 1`, s.vals)
    return this.getProfile()
  },

  async listSections({ visibleOnly, slug }) {
    await ensureSchema()
    const where: string[] = []
    const params: unknown[] = []
    if (visibleOnly) where.push('is_visible')
    if (slug) {
      params.push(slug)
      where.push(`slug = $${params.length}`)
    }
    const rows = await q(`SELECT * FROM sections ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY "order", id`, params)
    return rows.map(toSection)
  },
  async getSection(id) {
    await ensureSchema()
    const r = await q('SELECT * FROM sections WHERE id = $1', [id])
    return r[0] ? toSection(r[0]) : null
  },
  async slugTaken(slug, exceptId) {
    await ensureSchema()
    const r = await q('SELECT id FROM sections WHERE slug = $1 AND id <> $2', [slug, exceptId ?? -1])
    return r.length > 0
  },
  async insertSection(s) {
    await ensureSchema()
    const r = await q(
      `INSERT INTO sections (kind, slug, title, layout, schema, options, page, items, is_visible, "order")
       VALUES ($1,$2,$3,$4,$5::jsonb,$6::jsonb,$7,$8::jsonb,$9,$10) RETURNING *`,
      [s.kind, s.slug, s.title, s.layout, JSON.stringify(s.schema), JSON.stringify(s.options), s.page, JSON.stringify(s.items), s.is_visible, s.order],
    )
    return toSection(r[0])
  },
  async updateSection(id, patch) {
    await ensureSchema()
    const s = setClause(patch, SECTION_COLS, ['schema', 'options', 'items'])
    if (!s.sql) return this.getSection(id)
    const r = await q(`UPDATE sections SET ${s.sql} WHERE id = $${s.vals.length + 1} RETURNING *`, [...s.vals, id])
    return r[0] ? toSection(r[0]) : null
  },
  async deleteSection(id) {
    await ensureSchema()
    return (await q('DELETE FROM sections WHERE id = $1 RETURNING id', [id])).length > 0
  },

  async listDetailKeys() {
    await ensureSchema()
    return (await q('SELECT key FROM details ORDER BY key')).map((r) => r.key as string)
  },
  async getDetail(key) {
    await ensureSchema()
    const r = (await q('SELECT * FROM details WHERE key = $1', [key]))[0]
    return r ? ({ key: r.key, blocks: r.blocks ?? [], title: r.title, parent: r.parent } as DetailRow) : null
  },
  async upsertDetail(key, patch) {
    await ensureSchema()
    await q('INSERT INTO details (key) VALUES ($1) ON CONFLICT DO NOTHING', [key])
    const s = setClause(patch, ['blocks', 'title', 'parent'], ['blocks'])
    if (s.sql) await q(`UPDATE details SET ${s.sql} WHERE key = $${s.vals.length + 1}`, [...s.vals, key])
    return (await this.getDetail(key))!
  },

  async listMessages() {
    await ensureSchema()
    return (await q('SELECT * FROM contact_messages ORDER BY created_at DESC, id DESC')).map(toMessage)
  },
  async getMessage(id) {
    await ensureSchema()
    const r = await q('SELECT * FROM contact_messages WHERE id = $1', [id])
    return r[0] ? toMessage(r[0]) : null
  },
  async insertMessage(m) {
    await ensureSchema()
    const r = await q('INSERT INTO contact_messages (name, email, message, ip) VALUES ($1,$2,$3,$4) RETURNING *', [m.name, m.email, m.message, m.ip])
    return toMessage(r[0])
  },
  async countRecentMessages(ip) {
    await ensureSchema()
    const r = await q(`SELECT count(*)::int AS n FROM contact_messages WHERE ip = $1 AND created_at > now() - interval '1 hour'`, [ip])
    return r[0]?.n ?? 0
  },
  async deleteMessage(id) {
    await ensureSchema()
    return (await q('DELETE FROM contact_messages WHERE id = $1 RETURNING id', [id])).length > 0
  },
}
