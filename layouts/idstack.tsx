import IdCardStack, { type IdEntry } from '@/components/IdCardStack'
import { readSlots } from './slots'
import type { LayoutProps } from './types'

/**
 * Education as a stack of student-ID cards (see components/IdCardStack.tsx). This wrapper stays a server
 * component on purpose: `detailHref` is a function, which cannot be passed to a client component,
 * so the links are resolved here and only plain data goes on.
 */
export default function IdStack({ items, fields, detailHref }: LayoutProps) {
  const entries: IdEntry[] = items.map((item, i) => {
    const s = readSlots(item, fields)
    return {
      id: String(item._id ?? i),
      meta: s.meta,
      title: s.title,
      subtitle: s.subtitle,
      body: s.body,
      list: s.list,
      tags: s.tags,
      link: s.link,
      image: s.image,
      detail: detailHref(item),
    }
  })
  return <IdCardStack entries={entries} />
}
