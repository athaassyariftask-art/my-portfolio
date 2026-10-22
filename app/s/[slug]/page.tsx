import '@/app/fun.css'
import '@/app/pop.css'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import AdminButton from '@/components/AdminButton'
import SectionBody from '@/components/SectionBody'
import SectionPage from '@/components/section/SectionPage'
import { getDetailContext, makeDetailHref } from '@/lib/details'
import { display } from '@/lib/fonts'
import { getProjects } from '@/lib/projects'
import { getSectionBySlug } from '@/lib/sections'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const s = await getSectionBySlug((await params).slug)
  return { title: s?.title ?? 'Section' }
}

/**
 * Halaman satu section. Pengunjung melihat isinya; admin yang login langsung bisa
 * mengubah judul, layout, isian, dan item di tempat (tersimpan otomatis).
 */
export default async function SectionRoute({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const detail = await getDetailContext()
  const section = await getSectionBySlug(slug, { auth: detail.admin }) // admin juga bisa membuka yang disembunyikan
  if (!section || (!section.is_visible && !detail.admin)) notFound()

  const projects = section.kind === 'projects' ? await getProjects() : []
  const back = section.page === 'about' ? { href: '/about', text: 'Tentang saya' } : { href: `/#${section.slug}`, text: 'Beranda' }

  return (
    <main className={`pop-page ${display.variable} relative min-h-screen overflow-x-hidden`}>
      <div className="relative z-10 mx-auto max-w-6xl px-6 pb-24 pt-10">
        <Link href={back.href} className="pop-pill pop-paper mb-8 inline-flex items-center gap-2">
          <ArrowLeft className="h-3.5 w-3.5" /> {back.text}
        </Link>

        {detail.admin ? (
          <SectionPage initial={section} projects={projects} detailKeys={detail.keys} />
        ) : (
          <>
            <h1 className="pop-display mb-10 text-4xl uppercase md:text-5xl">{section.title}</h1>
            <SectionBody section={section} projects={projects} detailHref={makeDetailHref(detail, section.options)} />
          </>
        )}
      </div>
      <AdminButton />
    </main>
  )
}
