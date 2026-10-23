import Link from 'next/link'
import { makeDetailHref, type DetailContext } from '@/lib/details'
import SectionBody from '@/components/SectionBody'
import SectionHeading from '@/components/SectionHeading'
import type { Project } from '@/lib/projects'
import type { Section } from '@/lib/sections'

export type Picked = { s: Section; anchor: string }

/** One block of the home page: its anchor id, title, body, and (admin only) where to edit it. */
export type Panel = { id: string; title: string; editHref?: string; node: React.ReactNode }

/**
 * Pick the sections shown on a given page: `page` matches, not hidden, and has content
 * (projects always show). The anchor is the section slug (#experience).
 */
export function pickSections(sections: Section[], page: 'home' | 'about'): Picked[] {
  return sections
    .filter((s) => s.page === page && s.is_visible && (s.kind === 'projects' || s.items.length > 0))
    .map((s) => ({ s, anchor: s.slug }))
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
      <section className="pop-wrap relative z-10 pb-28">
        <div className="pop-card p-8 text-center font-semibold">
          No sections are visible yet.{' '}
          <Link href="/admin/sections" className="pop-link">Create one in Admin → Sections</Link>
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
          className={narrow ? 'relative z-10 scroll-mt-24 pb-16' : 'pop-wrap relative z-10 scroll-mt-24 pb-28'}
        >
          <SectionHeading
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

/** Body of each section as a home-page block. Admins get an Edit link to the section's own page. */
export function sectionPanels(items: Picked[], projects: Project[], detail: DetailContext): Panel[] {
  return items.map(({ s, anchor }) => ({
    id: anchor,
    title: s.title,
    editHref: detail.admin && s.kind !== 'projects' ? `/s/${s.slug}` : undefined,
    node: <SectionBody section={s} projects={projects} detailHref={makeDetailHref(detail, s.options)} />,
  }))
}
