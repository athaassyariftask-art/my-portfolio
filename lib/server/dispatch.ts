// API router inside the Next.js process. URL and JSON shapes match the previous Django API.
import { PRESETS, LAYOUTS, FIELD_TYPES, SLOTS } from './presets'
import { ApiError, DETAIL_KEY, validateDetail, validateMessage, validateProfile, validateProject, validateSection } from './validate'
import type { Store } from './types'

export type Req = {
  method: string
  /** path without the /api prefix, e.g. "sections/3" */
  path: string
  query?: Record<string, string>
  body?: unknown
  staff: boolean
  ip?: string
}
export type Res = { status: number; body: unknown }

const ok = (body: unknown, status = 200): Res => ({ status, body })
const NOT_FOUND: Res = { status: 404, body: { detail: 'Not found.' } }
const DENIED: Res = { status: 403, body: { detail: 'Admin login required.' } }
const MAX_PER_HOUR = 5

function numId(s: string | undefined): number | null {
  return s && /^\d{1,9}$/.test(s) ? Number(s) : null
}

export async function dispatch(store: Store, req: Req): Promise<Res> {
  try {
    return await route(store, req)
  } catch (e) {
    if (e instanceof ApiError) return { status: e.status, body: e.body }
    console.error(e)
    return { status: 500, body: { detail: 'Something went wrong on the server.' } }
  }
}

async function route(store: Store, req: Req): Promise<Res> {
  const parts = req.path.split('/').filter(Boolean)
  const [res, a] = parts
  const m = req.method.toUpperCase()
  const write = m !== 'GET' && m !== 'HEAD'

  // all writes require admin, except sending a contact message
  if (write && !(res === 'contact' && m === 'POST' && parts.length === 1) && !req.staff) return DENIED

  switch (res) {
    case 'projects': {
      if (parts.length === 1) {
        if (m === 'GET') return ok(await store.listProjects({ publishedOnly: !req.staff }))
        if (m === 'POST') {
          const v = validateProject(req.body, true)
          return ok(
            await store.insertProject({
              title: v.title!, summary: v.summary ?? '', description: v.description ?? '', tech_stack: v.tech_stack ?? [],
              github_url: v.github_url ?? null, demo_url: v.demo_url ?? null, image: v.image ?? null,
              featured: v.featured ?? false, is_published: v.is_published ?? true, order: v.order ?? 0,
            }),
            201,
          )
        }
      } else if (parts.length === 2) {
        const id = numId(a)
        if (id === null) return NOT_FOUND
        const p = await store.getProject(id)
        if (!p || (!p.is_published && !req.staff)) return NOT_FOUND
        if (m === 'GET') return ok(p)
        if (m === 'PATCH' || m === 'PUT') return ok(await store.updateProject(id, validateProject(req.body, false)))
        if (m === 'DELETE') {
          await store.deleteProject(id)
          return { status: 204, body: null }
        }
      }
      break
    }

    case 'profile': {
      if (parts.length === 1) {
        if (m === 'GET') return ok(await store.getProfile())
        if (m === 'PATCH' || m === 'PUT') return ok(await store.saveProfile(validateProfile(req.body)))
      }
      break
    }

    case 'sections': {
      if (parts.length === 1) {
        if (m === 'GET') return ok(await store.listSections({ visibleOnly: !req.staff, slug: req.query?.slug || undefined }))
        if (m === 'POST') {
          const v = await validateSection(req.body, null, (s) => store.slugTaken(s))
          return ok(
            await store.insertSection({
              kind: v.kind ?? 'items', slug: v.slug!, title: v.title!, layout: v.layout ?? 'cards', schema: v.schema ?? [],
              options: v.options ?? {}, page: v.page ?? 'home', items: v.items ?? [], is_visible: v.is_visible ?? true,
              order: v.order ?? (await store.listSections({ visibleOnly: false })).length,
            }),
            201,
          )
        }
      } else if (parts.length === 2) {
        const id = numId(a)
        if (id === null) return NOT_FOUND
        const s = await store.getSection(id)
        if (!s || (!s.is_visible && !req.staff)) return NOT_FOUND
        if (m === 'GET') return ok(s)
        if (m === 'PATCH' || m === 'PUT') {
          const v = await validateSection(req.body, s, (slug) => store.slugTaken(slug, id))
          return ok(await store.updateSection(id, v))
        }
        if (m === 'DELETE') {
          await store.deleteSection(id)
          return { status: 204, body: null }
        }
      }
      break
    }

    case 'section-presets':
      if (m === 'GET') return ok({ presets: PRESETS, layouts: LAYOUTS, field_types: FIELD_TYPES, slots: SLOTS })
      break

    case 'details': {
      if (parts.length === 1 && m === 'GET') return ok({ keys: await store.listDetailKeys() })
      if (parts.length === 2) {
        if (!DETAIL_KEY.test(a)) return NOT_FOUND
        if (m === 'GET') {
          const d = await store.getDetail(a)
          return ok({ key: a, exists: !!d, blocks: d?.blocks ?? [], title: d?.title ?? '', parent: d?.parent ?? '' })
        }
        if (m === 'PUT' || m === 'PATCH') {
          const d = await store.upsertDetail(a, validateDetail(req.body))
          return ok({ key: a, exists: true, blocks: d.blocks, title: d.title, parent: d.parent })
        }
      }
      break
    }

    case 'contact': {
      if (parts.length === 1) {
        if (m === 'POST') {
          const v = validateMessage(req.body)
          const ip = (req.ip || 'unknown').slice(0, 64)
          if ((await store.countRecentMessages(ip)) >= MAX_PER_HOUR) {
            return { status: 429, body: { detail: 'Too many messages. Please try again in an hour.' } }
          }
          await store.insertMessage({ ...v, ip })
          return ok({ ok: true }, 201)
        }
        if (m === 'GET') return req.staff ? ok(await store.listMessages()) : DENIED
      } else if (parts.length === 2 && m === 'DELETE') {
        const id = numId(a)
        if (id === null || !(await store.deleteMessage(id))) return NOT_FOUND
        return { status: 204, body: null }
      }
      break
    }
  }
  return NOT_FOUND
}
