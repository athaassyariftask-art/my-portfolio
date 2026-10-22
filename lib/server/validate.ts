// Validasi input (porting dari serializers.py Django). Galat berbentuk {field: [pesan]} agar readError() di admin tetap bisa membacanya.
import { FIELD_TYPES, LAYOUTS, SLOTS } from './presets'
import type { ProjectInput, Profile, SectionInput, SectionRow } from './types'

export class ApiError extends Error {
  constructor(
    public status: number,
    public body: unknown,
  ) {
    super(typeof body === 'string' ? body : 'ApiError')
  }
}

const fail = (field: string, msg: string): never => {
  throw new ApiError(400, { [field]: [msg] })
}

type Obj = Record<string, unknown>
export const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v)
const has = (o: Obj, k: string) => Object.prototype.hasOwnProperty.call(o, k)

function str(o: Obj, k: string, max: number, opts: { required?: boolean; blank?: boolean } = {}): string | undefined {
  if (!has(o, k)) {
    if (opts.required) fail(k, 'Wajib diisi.')
    return undefined
  }
  const v = o[k]
  if (typeof v !== 'string') return fail(k, 'Harus berupa teks.')
  const t = v.trim()
  if (!t && !opts.blank) return fail(k, 'Tidak boleh kosong.')
  if (t.length > max) return fail(k, `Maksimal ${max} karakter.`)
  return t
}

function bool(o: Obj, k: string): boolean | undefined {
  if (!has(o, k)) return undefined
  if (typeof o[k] !== 'boolean') return fail(k, 'Harus true atau false.')
  return o[k] as boolean
}

function int(o: Obj, k: string, min: number, max = 1_000_000): number | undefined {
  if (!has(o, k)) return undefined
  const raw = o[k]
  const n = typeof raw === 'string' && raw.trim() !== '' ? Number(raw) : raw
  if (typeof n !== 'number' || !Number.isInteger(n)) return fail(k, 'Harus berupa angka bulat.')
  if (n < min || n > max) return fail(k, `Harus antara ${min} dan ${max}.`)
  return n
}

const HTTP_URL = /^https?:\/\/[^\s/$.?#][^\s]*$/i
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// ---------- blok ala Notion ----------
const BLOCK_TYPES = new Set([
  'text', 'h1', 'h2', 'h3', 'bullet', 'number', 'todo', 'toggle', 'quote', 'callout', 'code',
  'divider', 'image', 'gallery', 'embed', 'video', 'columns',
  'heading', // format lama
])
const MAX_BLOCKS = 600
const MAX_DEPTH = 4
const MAX_BLOCK_CHARS = 20000

/** Periksa pohon blok: jenis dikenal, tidak terlalu dalam/banyak/besar. */
export function cleanBlocks(value: unknown): unknown[] {
  let count = 0
  const walk = (list: unknown, depth: number) => {
    if (!Array.isArray(list) || depth > MAX_DEPTH) throw new ApiError(400, { blocks: ['Struktur blok tidak valid atau terlalu dalam.'] })
    for (const b of list) {
      if (!isObj(b) || typeof b.type !== 'string' || !BLOCK_TYPES.has(b.type)) {
        throw new ApiError(400, { blocks: ['Ada blok dengan jenis tidak dikenal.'] })
      }
      if (++count > MAX_BLOCKS) throw new ApiError(400, { blocks: [`Maksimal ${MAX_BLOCKS} blok.`] })
      const own: Obj = {}
      for (const [k, v] of Object.entries(b)) if (k !== 'children' && k !== 'cols') own[k] = v
      if (JSON.stringify(own).length > MAX_BLOCK_CHARS) throw new ApiError(400, { blocks: ['Ada blok yang terlalu besar.'] })
      if (has(b, 'children')) walk(b.children, depth + 1)
      if (has(b, 'cols')) {
        const cols = b.cols
        if (!Array.isArray(cols) || cols.length > 5) throw new ApiError(400, { blocks: ['Kolom tidak valid (maksimal 5).'] })
        for (const c of cols) walk(c, depth + 1)
      }
    }
  }
  walk(value, 0)
  return value as unknown[]
}

// ---------- section ----------
const MAX_FIELDS = 12
const MAX_ITEMS = 200
const MAX_ITEM_CHARS = 5000
const NAME_RE = /^[a-z][a-z0-9_]{0,29}$/
const SLUG_RE = /^[-a-zA-Z0-9_]+$/

export function cleanSchema(value: unknown): Obj[] {
  if (!Array.isArray(value) || !value.every(isObj)) return fail('schema', 'schema harus berupa list objek.')
  if (value.length > MAX_FIELDS) return fail('schema', `Maksimal ${MAX_FIELDS} field.`)
  const seen = new Set<string>()
  return value.map((v) => {
    const name = String(v.name ?? '')
    if (!NAME_RE.test(name)) return fail('schema', `Nama field "${name}" tidak valid (huruf kecil/angka/_ , mulai huruf).`)
    if (seen.has(name)) return fail('schema', `Nama field "${name}" dobel.`)
    seen.add(name)
    if (typeof v.type !== 'string' || !has(FIELD_TYPES, v.type)) return fail('schema', `Jenis field "${name}" tidak dikenal.`)
    if (typeof v.slot !== 'string' || !has(SLOTS, v.slot)) return fail('schema', `Slot field "${name}" tidak dikenal.`)
    return {
      name,
      label: String(v.label || name).slice(0, 60),
      type: v.type,
      slot: v.slot,
      required: Boolean(v.required),
    }
  })
}

function cleanOptions(value: unknown): Obj {
  if (!isObj(value)) return fail('options', 'options harus berupa objek.')
  const out: Obj = {}
  if (has(value, 'columns')) {
    const c = value.columns
    if (typeof c !== 'number' || !Number.isInteger(c) || c < 1 || c > 4) return fail('options', 'columns harus angka 1 sampai 4.')
    out.columns = c
  }
  if (has(value, 'detail')) out.detail = Boolean(value.detail)
  return out
}

const newItemId = () => crypto.randomUUID().replace(/-/g, '').slice(0, 10)

function cleanItems(value: unknown): Obj[] {
  if (!Array.isArray(value) || !value.every(isObj)) return fail('items', 'items harus berupa list objek.')
  if (value.length > MAX_ITEMS) return fail('items', `Maksimal ${MAX_ITEMS} item per section.`)
  return value.map((v) => {
    if (JSON.stringify(v).length > MAX_ITEM_CHARS) return fail('items', 'Ada item yang terlalu besar.')
    // id tetap tiap item: dipakai sebagai kunci halaman detail (/d/<id>)
    const item = { ...v }
    if (typeof item._id !== 'string' || !item._id) item._id = newItemId()
    return item
  })
}

export function slugify(s: string): string {
  return s
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s_-]/g, '')
    .trim()
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * Bentuk perubahan section yang sudah tervalidasi. `existing` = null saat membuat baru.
 * `slugTaken` memeriksa keunikan slug (menolak kalau diminta eksplisit, menambah akhiran -2, -3 kalau otomatis).
 */
export async function validateSection(
  input: unknown,
  existing: SectionRow | null,
  slugTaken: (slug: string) => Promise<boolean>,
): Promise<Partial<SectionInput>> {
  if (!isObj(input)) throw new ApiError(400, { detail: 'Body harus berupa objek JSON.' })
  const out: Partial<SectionInput> = {}

  const title = str(input, 'title', 120, { required: !existing })
  if (title !== undefined) out.title = title

  if (has(input, 'kind')) {
    if (input.kind !== 'items' && input.kind !== 'projects') fail('kind', 'kind harus "items" atau "projects".')
    out.kind = input.kind as string
  }
  if (has(input, 'layout')) {
    if (typeof input.layout !== 'string' || !has(LAYOUTS, input.layout)) {
      fail('layout', `Layout tidak dikenal. Pilihan: ${Object.keys(LAYOUTS).join(', ')}.`)
    }
    out.layout = input.layout as string
  }
  if (has(input, 'page')) {
    if (input.page !== 'home' && input.page !== 'about') fail('page', 'page harus "home" atau "about".')
    out.page = input.page as string
  }
  if (has(input, 'schema')) out.schema = cleanSchema(input.schema)
  if (has(input, 'options')) out.options = cleanOptions(input.options)
  if (has(input, 'items')) out.items = cleanItems(input.items)
  const vis = bool(input, 'is_visible')
  if (vis !== undefined) out.is_visible = vis
  const order = int(input, 'order', 0)
  if (order !== undefined) out.order = order

  // aturan lintas-field: section "items" wajib punya satu field berslot Judul
  const kind = out.kind ?? existing?.kind ?? 'items'
  const schema = (out.schema ?? existing?.schema ?? []) as Obj[]
  if (kind === 'items' && (has(input, 'schema') || !existing) && !schema.some((s) => s.slot === 'title')) {
    fail('schema', 'Harus ada satu field dengan slot Judul.')
  }

  // slug
  let slug: string | undefined
  if (has(input, 'slug')) {
    const raw = input.slug
    if (typeof raw !== 'string') return fail('slug', 'Harus berupa teks.')
    if (raw.trim() && (!SLUG_RE.test(raw.trim()) || raw.trim().length > 60)) return fail('slug', 'Slug hanya boleh huruf, angka, - dan _ (maks 60).')
    slug = raw.trim() || undefined
  }
  if (slug) {
    if (await slugTaken(slug)) fail('slug', 'Alamat ini sudah dipakai section lain.')
    out.slug = slug
  } else if (!existing || (has(input, 'slug') && !slug)) {
    const base = (slugify(out.title ?? existing?.title ?? '') || 'section').slice(0, 55)
    let candidate = base
    for (let n = 2; await slugTaken(candidate); n++) candidate = `${base}-${n}`
    out.slug = candidate
  }
  return out
}

// ---------- project ----------
function url(o: Obj, k: string, max: number, protocolOnly: 'http' | 'https'): string | null | undefined {
  if (!has(o, k)) return undefined
  const v = o[k]
  if (v === null || v === '') return null
  if (typeof v !== 'string') return fail(k, 'Harus berupa teks.')
  const t = v.trim()
  const ok = protocolOnly === 'https' ? /^https:\/\/\S+$/i.test(t) : HTTP_URL.test(t)
  if (!ok) return fail(k, protocolOnly === 'https' ? 'Harus alamat https.' : 'Masukkan URL yang valid (diawali http:// atau https://).')
  if (t.length > max) return fail(k, `Maksimal ${max} karakter.`)
  return t
}

export function validateProject(input: unknown, creating: boolean): Partial<ProjectInput> {
  if (!isObj(input)) throw new ApiError(400, { detail: 'Body harus berupa objek JSON.' })
  const out: Partial<ProjectInput> = {}
  const title = str(input, 'title', 200, { required: creating })
  if (title !== undefined) out.title = title
  const summary = str(input, 'summary', 300, { blank: true })
  if (summary !== undefined) out.summary = summary
  if (has(input, 'description')) {
    if (typeof input.description !== 'string') fail('description', 'Harus berupa teks.')
    out.description = input.description as string
  }
  if (has(input, 'tech_stack')) {
    const t = input.tech_stack
    if (!Array.isArray(t) || !t.every((x) => typeof x === 'string')) fail('tech_stack', 'tech_stack harus berupa list teks.')
    out.tech_stack = (t as string[]).map((x) => x.trim()).filter(Boolean)
  }
  const gh = url(input, 'github_url', 200, 'http')
  if (gh !== undefined) out.github_url = gh
  const demo = url(input, 'demo_url', 200, 'http')
  if (demo !== undefined) out.demo_url = demo
  const image = url(input, 'image', 500, 'https')
  if (image !== undefined) out.image = image
  const featured = bool(input, 'featured')
  if (featured !== undefined) out.featured = featured
  const pub = bool(input, 'is_published')
  if (pub !== undefined) out.is_published = pub
  const order = int(input, 'order', 0)
  if (order !== undefined) out.order = order
  return out
}

// ---------- profil ----------
export function validateProfile(input: unknown): Partial<Profile> {
  if (!isObj(input)) throw new ApiError(400, { detail: 'Body harus berupa objek JSON.' })
  const out: Partial<Profile> = {}
  for (const [k, max] of [['name', 100], ['role', 150], ['affiliation', 150], ['intro', 3000]] as const) {
    const v = str(input, k, max, { blank: true })
    if (v !== undefined) out[k] = v
  }
  const email = str(input, 'email', 254, { blank: true })
  if (email !== undefined) {
    if (email && !EMAIL.test(email)) fail('email', 'Masukkan alamat email yang valid.')
    out.email = email
  }
  for (const k of ['photo', 'cv'] as const) {
    const v = url(input, k, 500, 'https')
    if (v !== undefined) out[k] = v ?? ''
  }
  if (has(input, 'links')) {
    const l = input.links
    if (!Array.isArray(l) || !l.every(isObj)) fail('links', 'links harus berupa list objek.')
    if ((l as unknown[]).length > 20) fail('links', 'Maksimal 20 link.')
    out.links = (l as Obj[]).map((x) => ({
      label: String(x.label ?? '').trim().slice(0, 100),
      href: String(x.href ?? '').trim().slice(0, 300),
    }))
  }
  return out
}

// ---------- pesan kontak & detail ----------
export function validateMessage(input: unknown): { name: string; email: string; message: string } {
  if (!isObj(input)) throw new ApiError(400, { detail: 'Data tidak valid.' })
  const name = str(input, 'name', 100, { required: true })!
  const email = str(input, 'email', 254, { required: true })!
  if (!EMAIL.test(email)) fail('email', 'Masukkan alamat email yang valid.')
  const message = str(input, 'message', 5000, { required: true })!
  return { name, email, message }
}

export const DETAIL_KEY = /^[-a-zA-Z0-9_]{1,80}$/

export function validateDetail(input: unknown): { blocks?: unknown[]; title?: string; parent?: string } {
  if (!isObj(input)) throw new ApiError(400, { detail: 'Body harus berupa objek JSON.' })
  const out: { blocks?: unknown[]; title?: string; parent?: string } = {}
  if (has(input, 'blocks')) out.blocks = cleanBlocks(input.blocks)
  if (has(input, 'title')) out.title = String(input.title).slice(0, 160)
  if (has(input, 'parent')) out.parent = String(input.parent).slice(0, 80)
  return out
}
