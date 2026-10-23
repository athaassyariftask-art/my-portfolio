import { notFound, redirect } from 'next/navigation'
import { getAdminSections } from '@/lib/sections'

// Legacy URL. Sections are now edited directly on their own page (/s/<slug>).
export default async function OldSectionEdit({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const s = (await getAdminSections()).find((x) => String(x.id) === id)
  if (!s) notFound()
  redirect(`/s/${s.slug}`)
}
