import PageHeader from '@/components/admin/PageHeader'
import SectionList from '@/components/admin/SectionList'
import { getAdminSections, getPresets } from '@/lib/sections'

export default async function AdminSections() {
  const [sections, presets] = await Promise.all([getAdminSections(), getPresets()])

  return (
    <>
      <PageHeader
        title="Section"
        hint="Blocks on the home page. Here you create, reorder, and hide them. Each section's content and appearance are edited on its own page."
      />
      <SectionList
        presets={presets}
        sections={sections.map((s) => ({
          id: s.id,
          slug: s.slug,
          kind: s.kind,
          title: s.title,
          layout: s.layout,
          page: s.page,
          is_visible: s.is_visible,
          order: s.order,
          count: s.items.length,
        }))}
      />
    </>
  )
}
