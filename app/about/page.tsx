import Link from 'next/link'
import EditableBlocks from '@/components/EditableBlocks'
import PageShell, { AsideCard, ContentCard, ReadingGrid, titleClass } from '@/components/PageShell'
import Sections, { pickSections } from '@/components/Sections'
import { getDetail, getDetailContext } from '@/lib/details'
import { getProfile } from '@/lib/profile'
import { getProjects } from '@/lib/projects'
import { getSections } from '@/lib/sections'

export const metadata = { title: 'About me' }

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
    <PageShell back={{ href: '/', text: 'Home' }}>
      <h1 className={`${titleClass} mb-10`}>
        About <span className="pop-mark">{site.name}</span>
      </h1>

      <ReadingGrid
        aside={
          <>
            <div className="pop-card overflow-hidden">
              {site.photo && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={site.photo} alt={site.name} className="aspect-[4/5] w-full object-cover" />
              )}
              <div className="p-5">
                <p className="pop-display text-xl">{site.name}</p>
                <p className="mt-1 text-sm text-[color:var(--muted)]">
                  {site.role} · {site.affiliation}
                </p>
              </div>
            </div>

            <AsideCard title="Find me">
              <div className="flex flex-wrap gap-2">
                <a href={`mailto:${site.email}`} className="pop-pill">{site.email}</a>
                {site.links.map((l) => (
                  <a key={l.label} href={l.href} target="_blank" rel="noreferrer" className="pop-pill">
                    {l.label}
                  </a>
                ))}
                {site.cv && (
                  <a href={site.cv} target="_blank" rel="noreferrer" className="pop-pill pop-yellow">
                    Download CV
                  </a>
                )}
              </div>
            </AsideCard>
          </>
        }
      >
        <div className="mb-14">
          <ContentCard>
            <EditableBlocks detailKey="about" initial={aboutBlocks} canEdit={detail.admin} />
          </ContentCard>
        </div>

        <Sections items={items} projects={projects} narrow detail={detail} />

        <Link href="/#contact" className="pop-btn pop-btn-ink">Get in touch</Link>
      </ReadingGrid>
    </PageShell>
  )
}
