import '@/app/fun.css'
import '@/app/pop.css'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import AdminButton from '@/components/AdminButton'
import SectionBody from '@/components/SectionBody'
import SectionPage from '@/components/section/SectionPage'
import { getDetailContext, makeDetailHref } from '@/lib/details'
import { getProjects } from '@/lib/projects'
import { getSectionBySlug } from '@/lib/sections'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const s = await getSectionBySlug((await params).slug)
  return { title: s?.title ?? 'Section' }
}

/**
 * Page for a single section. Visitors see its content; a signed-in admin can edit the title,
 * layout, fields and items in place (saved automatically).
 */
export default async function SectionRoute({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const detail = await getDetailContext()
  const section = await getSectionBySlug(slug, { auth: detail.admin }) // admins can also open hidden ones
  if (!section || (!section.is_visible && !detail.admin)) notFound()

  const projects = section.kind === 'projects' ? await getProjects() : []
  const back = section.page === 'about' ? { href: '/about', text: 'About me' } : { href: `/#${section.slug}`, text: 'Home' }

  return (
    <main className="pop-page relative min-h-screen overflow-x-hidden">
      <div className="relative z-10 mx-auto max-w-6xl px-6 pb-24 pt-10">
        <Link href={back.href} className="pop-link mb-8 text-sm">
          <ArrowLeft className="h-3.5 w-3.5" /> {back.text}
        </Link>

        {detail.admin ? (
          <SectionPage initial={section} projects={projects} detailKeys={detail.keys} />
        ) : (
          <>
            <h1 className="pop-display mb-10 text-4xl md:text-5xl">{section.title}</h1>
            <SectionBody section={section} projects={projects} detailHref={makeDetailHref(detail, section.options)} />
          </>
        )}
      </div>
      <AdminButton />
    </main>
  )
}
