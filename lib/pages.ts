import { apiGet, unwrapList } from './api'
import type { Block } from './blocks'

export type { Block, BlockType } from './blocks'

export type Page = {
  id: number
  slug: string
  title: string
  blocks: Block[]
  is_published: boolean
  order: number
}

const map = (r: Partial<Page>): Page => ({
  id: r.id ?? 0,
  slug: r.slug ?? '',
  title: r.title ?? '',
  blocks: Array.isArray(r.blocks) ? r.blocks : [],
  is_published: r.is_published ?? false,
  order: r.order ?? 0,
})

export async function getPage(slug: string, auth = false): Promise<Page | null> {
  const d = await apiGet<Partial<Page>>(`/pages/${encodeURIComponent(slug)}/`, { auth })
  return d ? map(d) : null
}

export async function getAdminPages(): Promise<Page[]> {
  const d = await apiGet<unknown>('/pages/', { auth: true })
  return d ? unwrapList<Partial<Page>>(d).map(map) : []
}
