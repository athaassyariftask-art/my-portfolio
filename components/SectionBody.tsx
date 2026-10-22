import { getLayout } from '@/layouts'
import ProjectsView from '@/layouts/projects'
import type { Item } from '@/layouts/types'
import type { Project } from '@/lib/projects'
import type { Section } from '@/lib/sections'

type Props = {
  section: Pick<Section, 'kind' | 'layout' | 'schema' | 'options' | 'items'>
  projects: Project[]
  detailHref: (item: Item) => string | null
}

/** Isi sebuah section: tampilan project untuk kind "projects", selain itu layout pilihan section. */
export default function SectionBody({ section, projects, detailHref }: Props) {
  if (section.kind === 'projects') return <ProjectsView projects={projects} />
  const { View } = getLayout(section.layout)
  return <View items={section.items} fields={section.schema} options={section.options} detailHref={detailHref} />
}
