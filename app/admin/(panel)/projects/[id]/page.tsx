import { notFound } from 'next/navigation'
import PageHeader from '@/components/admin/PageHeader'
import ProjectForm from '@/components/admin/ProjectForm'
import { getProject } from '@/lib/projects'

export default async function EditProject({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const project = await getProject(id, { auth: true })
  if (!project) notFound()

  return (
    <>
      <PageHeader title="Edit project" />
      <ProjectForm project={project} />
    </>
  )
}
