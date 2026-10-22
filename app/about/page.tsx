import Link from 'next/link'
import EditableBlocks from '@/components/EditableBlocks'
import PageShell, { ContentCard, titleClass } from '@/components/PageShell'
import Sections, { pickSections } from '@/components/Sections'
import { getDetail, getDetailContext } from '@/lib/details'
import { getProfile } from '@/lib/profile'
import { getProjects } from '@/lib/projects'
import { getSections } from '@/lib/sections'

export const metadata = { title: 'Tentang saya' }

export default async function About() {
  const [site, projects, sections, aboutBlocks, detail] = await Promise.all([
    getProfile(),
    getProjects(),
    getSections(),
    getDetail('about'),
    getDetailContext(),
  ])
  const items = pickSections(sections, 'about')

  return (
    <PageShell back={{ href: '/', text: 'Beranda' }}>
      <div className="mb-4 flex flex-wrap gap-2">
        <span className="pop-pill pop-teal">{site.role}</span>
        <span className="pop-pill pop-yellow">{site.affiliation}</span>
      </div>
      <h1 className={`${titleClass} mb-10`}>
        Tentang <span className="pop-outline text-[color:var(--accent)]">{site.name}</span>
      </h1>

      <div className="mb-16">
        <ContentCard>
          <EditableBlocks detailKey="about" initial={aboutBlocks} canEdit={detail.admin} />
        </ContentCard>
      </div>

      <Sections items={items} projects={projects} narrow detail={detail} />

      <Link href="/#contact" className="pop-btn pop-yellow">Hubungi saya</Link>
    </PageShell>
  )
}
