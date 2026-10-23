import ProjectsShowcase, { type ShowcaseProject } from '@/components/ProjectsShowcase'
import type { ProjectsProps } from './types'

const plain = (s: string) => s.replace(/[#*_`>\[\]]/g, '').replace(/\s+/g, ' ').trim().slice(0, 160)

/**
 * Projects as an interactive showcase (see components/ProjectsShowcase.tsx). This wrapper stays a server
 * component and only passes plain data (no functions) to the client component.
 */
export default function ProjectsView({ projects }: ProjectsProps) {
  if (projects.length === 0) {
    return <p className="pop-card p-10 font-medium">No projects to show yet.</p>
  }
  const list: ShowcaseProject[] = projects.map((p) => ({
    id: p.id,
    title: p.title,
    summary: p.summary || plain(p.description) || 'No summary yet.',
    tags: p.tags,
    cover: p.cover ?? null,
    date: p.date,
  }))
  return <ProjectsShowcase projects={list} />
}
