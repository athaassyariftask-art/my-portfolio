import CareerTrack, { type TrackGroup } from '@/components/CareerTrack'
import { readSlots } from './slots'
import type { Item, LayoutProps, Slotted } from './types'

type Entry = { item: Item; s: Slotted }

/**
 * Items with the same subtitle (organization) are grouped together; groups follow the order in which
 * each organization first appears. Items without a subtitle stay on their own.
 */
function group(items: Item[], fields: LayoutProps['fields']): Entry[][] {
  const groups: Entry[][] = []
  const byOrg = new Map<string, Entry[]>()
  for (const item of items) {
    const s = readSlots(item, fields)
    const key = s.subtitle.trim().toLowerCase()
    const entry = { item, s }
    const existing = key ? byOrg.get(key) : undefined
    if (existing) existing.push(entry)
    else {
      const g = [entry]
      groups.push(g)
      if (key) byOrg.set(key, g)
    }
  }
  return groups
}

/**
 * Experience as an interactive "career track" (see components/CareerTrack.tsx). This wrapper stays a server
 * component on purpose: `detailHref` is a function, which cannot be passed to a client component,
 * so the links are resolved here and only plain data goes on.
 */
export default function Timeline({ items, fields, detailHref }: LayoutProps) {
  const data: TrackGroup[] = group(items, fields).map((g, gi) => ({
    org: g[0].s.subtitle.trim(),
    roles: g.map(({ item, s }, ri) => ({
      id: String(item._id ?? `${gi}-${ri}`),
      meta: s.meta,
      title: s.title,
      body: s.body,
      list: s.list,
      tags: s.tags,
      link: s.link,
      detail: detailHref(item),
    })),
  }))
  return <CareerTrack groups={data} />
}
