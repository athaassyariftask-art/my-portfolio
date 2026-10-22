import { notFound } from 'next/navigation'
import PageEditor from '@/components/admin/PageEditor'
import { getPage } from '@/lib/pages'

export default async function EditPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const page = await getPage(slug, true)
  if (!page) notFound()
  return (
    <>
      <h1 className="mb-8 text-3xl font-extrabold tracking-tight text-slate-900">Edit halaman</h1>
      <PageEditor page={page} />
    </>
  )
}
