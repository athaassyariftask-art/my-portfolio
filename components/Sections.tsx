import Link from 'next/link'
import { makeDetailHref, type DetailContext } from '@/lib/details'
import Reveal from '@/components/Reveal'
import SectionBody from '@/components/SectionBody'
import type { Project } from '@/lib/projects'
import type { Section } from '@/lib/sections'

export type Picked = { s: Section; anchor: string }

/**
 * Pilih section yang tampil di halaman tertentu: `page`-nya cocok, tidak disembunyikan,
 * dan punya isi (project selalu tampil). Anchor = slug section (#pengalaman).
 */
export function pickSections(sections: Section[], page: 'home' | 'about'): Picked[] {
  return sections
    .filter((s) => s.page === page && s.is_visible && (s.kind === 'projects' || s.items.length > 0))
    .map((s) => ({ s, anchor: s.slug }))
}

function SectionTitle({ n, label, calm, editHref }: { n: string; label: string; calm?: boolean; editHref?: string }) {
  const edit = editHref && (
    <Link href={editHref} className={calm ? 'font-mono text-xs text-blue-600 hover:underline' : 'pop-pill pop-yellow'}>
      Edit ✎
    </Link>
  )
  if (!calm) {
    // Tema pop (halaman depan): lencana bernomor + judul tebal + garis tinta
    return (
      <Reveal>
        <div className="mb-10 flex items-center gap-4">
          <span className="pop-badge pop-orange">{n}</span>
          <h2 className="pop-display text-3xl uppercase md:text-4xl">{label}</h2>
          <span className="h-[1.5px] flex-1 bg-[#141414]" />
          {edit}
        </div>
      </Reveal>
    )
  }
  return (
    <Reveal>
      <div className="mb-10 flex items-center gap-4 font-mono text-xs uppercase tracking-[0.2em] text-slate-500">
        <span className="text-blue-600">{n}</span>
        <span>{label}</span>
        <span className="h-px flex-1 bg-slate-200" />
        {edit}
      </div>
    </Reveal>
  )
}

export default function Sections({
  items,
  projects,
  narrow,
  detail = { keys: [], admin: false },
}: {
  items: Picked[]
  projects: Project[]
  narrow?: boolean
  detail?: DetailContext
}) {
  if (items.length === 0 && detail.admin) {
    return (
      <section className="relative z-10 mx-auto max-w-3xl px-6 pb-28">
        <div className="pop-card p-8 text-center font-bold">
          Belum ada section yang tampil.{' '}
          <Link href="/admin/sections" className="underline">Buat di Admin → Section</Link>
        </div>
      </section>
    )
  }
  return (
    <>
      {items.map(({ s, anchor }, i) => (
        <section
          key={s.id}
          id={anchor}
          className={narrow ? 'relative z-10 scroll-mt-8 pb-16' : 'relative z-10 mx-auto max-w-6xl scroll-mt-8 px-6 pb-28'}
        >
          <SectionTitle
            n={String(i + 1).padStart(2, '0')}
            label={s.title}
            editHref={detail.admin && s.kind !== 'projects' ? `/s/${s.slug}` : undefined}
          />
          <SectionBody section={s} projects={projects} detailHref={makeDetailHref(detail, s.options)} />
        </section>
      ))}
    </>
  )
}

/** Isi tiap section sebagai panel tab (dipakai HomeTabs). Admin mendapat tombol Edit ke halaman section-nya. */
export function sectionPanels(items: Picked[], projects: Project[], detail: DetailContext) {
  return items.map(({ s, anchor }) => ({
    id: anchor,
    title: s.title,
    node: (
      <>
        {detail.admin && (
          <div className="mb-6 flex justify-end">
            <Link href={`/s/${s.slug}`} className="pop-pill pop-yellow">Edit ✎</Link>
          </div>
        )}
        <SectionBody section={s} projects={projects} detailHref={makeDetailHref(detail, s.options)} />
      </>
    ),
  }))
}
