import { notFound } from 'next/navigation'
import EditableBlocks from '@/components/EditableBlocks'
import PageShell, { ContentCard, titleClass } from '@/components/PageShell'
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

/** Halaman detail untuk satu item (achievement, pengalaman, fokus, ...), isinya diedit ala Notion. */
export default async function ItemDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const found = await find(id)
  if (!found) notFound()
  const { s, slots } = found
  const key = `item-${id}`
  const [blocks, admin] = await Promise.all([getDetail(key), isAdmin()])
  if (blocks.length === 0 && !admin) notFound() // pengunjung tidak melihat halaman kosong

  return (
    <PageShell back={{ href: s.page === 'about' ? '/about' : `/#${s.slug}`, text: s.title }}>
      {(slots.subtitle || slots.meta) && (
        <div className="mb-4 flex flex-wrap gap-2">
          {slots.meta && <span className="pop-pill pop-yellow">{slots.meta}</span>}
          {slots.subtitle && <span className="pop-pill pop-paper">{slots.subtitle}</span>}
        </div>
      )}
      <h1 className={`${titleClass} mb-4`}>{slots.title}</h1>
      {slots.body && <p className="mb-8 whitespace-pre-line text-lg font-medium">{slots.body}</p>}
      <ContentCard>
        <EditableBlocks detailKey={key} initial={blocks} canEdit={admin} />
      </ContentCard>
    </PageShell>
  )
}
