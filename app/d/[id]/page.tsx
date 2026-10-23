import Link from 'next/link'
import { notFound } from 'next/navigation'
import EditableBlocks from '@/components/EditableBlocks'
import PageShell, { AsideCard, ContentCard, ReadingGrid, titleClass } from '@/components/PageShell'
import { getDetail, isAdmin } from '@/lib/details'
import { getSections } from '@/lib/sections'
import { readSlots } from '@/layouts/slots'

async function find(id: string) {
  for (const s of await getSections()) {
    const item = s.items.find((it) => it._id === id)
    if (item) return { s, item, slots: readSlots(item, s.schema) }
  }
  return null
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const f = await find((await params).id)
  return { title: f?.slots.title || 'Detail' }
}

/** Detail page for one item (achievement, experience, focus, ...); the content is edited Notion-style. */
export default async function ItemDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const found = await find(id)
  if (!found) notFound()
  const { s, slots } = found
  const key = `item-${id}`
  const [blocks, admin] = await Promise.all([getDetail(key), isAdmin()])
  if (blocks.length === 0 && !admin) notFound() // visitors never see an empty page
  const back = s.page === 'about' ? '/about' : `/#${s.slug}`

  return (
    <PageShell back={{ href: back, text: s.title }}>
      <span className="pop-label mb-4 block">{s.title}</span>
      <h1 className={`${titleClass} mb-5 max-w-5xl`}>{slots.title}</h1>
      {slots.body && <p className="mb-10 max-w-3xl whitespace-pre-line text-lg text-[color:var(--muted)] md:text-xl">{slots.body}</p>}

      <ReadingGrid
        aside={
          <AsideCard title="Details">
            {(slots.meta || slots.subtitle) && (
              <dl className="mb-5 space-y-4 text-sm">
                {slots.meta && (
                  <div>
                    <dt className="pop-label mb-1">When</dt>
                    <dd className="font-medium">{slots.meta}</dd>
                  </div>
                )}
                {slots.subtitle && (
                  <div>
                    <dt className="pop-label mb-1">Where</dt>
                    <dd className="font-medium">{slots.subtitle}</dd>
                  </div>
                )}
              </dl>
            )}
            <Link href={back} className="pop-link text-sm">← Back to {s.title}</Link>
          </AsideCard>
        }
      >
        <ContentCard>
          <EditableBlocks detailKey={key} initial={blocks} canEdit={admin} />
        </ContentCard>
      </ReadingGrid>
    </PageShell>
  )
}
