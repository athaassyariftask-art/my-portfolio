import '@/app/fun.css'
import '@/app/pop.css'
import AdminButton from '@/components/AdminButton'
import Link from 'next/link'
import { ArrowRight, Mail } from 'lucide-react'
import { getProfile } from '@/lib/profile'
import { getProjects } from '@/lib/projects'
import { getDetailContext } from '@/lib/details'
import { getSections } from '@/lib/sections'
import { hero } from '@/hero.config'
import ContactForm from '@/components/ContactForm'
import RotatingName from '@/components/RotatingName'
import LanyardLayer from '@/components/LanyardLayer'
import Reveal from '@/components/Reveal'
import SectionHeading from '@/components/SectionHeading'
import SiteNav from '@/components/SiteNav'
import { pickSections, sectionPanels, type Panel } from '@/components/Sections'

export async function generateMetadata() {
  const site = await getProfile()
  const title = `${site.name} | ${site.role}`
  const description = site.intro
  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
    title: { absolute: title },
    description,
    openGraph: { title, description, type: 'website', locale: 'en_US', siteName: site.name },
    twitter: { card: 'summary_large_image', title, description },
  }
}

export default async function Home() {
  // Data comes from the database (edited at /admin). If the backend is down, defaults are used.
  const [site, projects, sections, detail] = await Promise.all([
    getProfile(),
    getProjects(),
    getSections(),
    getDetailContext(),
  ])
  const visible = pickSections(sections, 'home')
  // The first name is the one from Admin → Profile; the rest come from hero.config.ts
  const names = [{ greeting: hero.greeting, text: site.name }, ...hero.names]

  const contact = (
    <Reveal>
      <div className="grid gap-10 rounded-3xl bg-[color:var(--ink)] p-8 text-white shadow-[var(--shadow-md)] md:grid-cols-2 md:p-14">
        <div>
          <span className="pop-label mb-5 block !text-[color:var(--hi)]">Contact</span>
          <h2 className="pop-display mb-8 text-3xl leading-tight md:text-4xl">
            Have a problem you&rsquo;d like to turn into a system?
          </h2>
          <div className="flex flex-wrap items-center gap-3">
            <a
              href={`mailto:${site.email}`}
              className="inline-flex items-center gap-3 rounded-full border border-white/40 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:border-[color:var(--hi)] hover:bg-[color:var(--hi)] hover:text-[color:var(--ink)]"
            >
              <Mail className="h-5 w-5" /> {site.email}
            </a>
            {site.links.map((l) => (
              <a
                key={l.label}
                href={l.href}
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-white/40 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:border-[color:var(--hi)] hover:bg-[color:var(--hi)] hover:text-[color:var(--ink)]"
              >
                {l.label}
              </a>
            ))}
          </div>
        </div>
        <ContactForm />
      </div>
    </Reveal>
  )

  const panels: Panel[] = [
    ...sectionPanels(visible, projects, detail),
    ...(visible.length === 0 && detail.admin
      ? [
          {
            id: 'get-started',
            title: 'Get started',
            node: (
              <div className="pop-card p-8 text-center font-semibold">
                No sections are visible yet.{' '}
                <Link href="/admin/sections" className="pop-link">Create one in Admin → Sections</Link>
              </div>
            ),
          },
        ]
      : []),
  ]

  return (
    <main className="pop-page relative min-h-screen overflow-x-clip">
      <LanyardLayer name={site.name} role={site.role} affiliation={site.affiliation} photo={site.photo} />

      <SiteNav name={site.name} items={panels.map((p) => ({ id: p.id, title: p.title }))} />

      {/* Hero: greeting + name */}
      <section className="relative">
        <div aria-hidden className="pop-grid absolute inset-x-0 top-0 h-[34rem]" />
        <div className="pop-wrap relative z-10 pb-20 pt-12 lg:pb-28 lg:pt-20">
          <div className="lg:max-w-[58%]">
            {site.photo && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={site.photo}
                alt=""
                className="mb-6 h-20 w-20 rounded-full border border-[color:var(--line)] object-cover shadow-[var(--shadow-sm)] md:hidden"
              />
            )}
            <div className="mb-7 flex flex-wrap gap-2">
              <span className="pop-pill pop-blue">{site.role}</span>
              <span className="pop-pill">{site.affiliation}</span>
            </div>

            <h1 className="pop-display text-5xl sm:text-6xl lg:text-7xl xl:text-8xl">
              <RotatingName
                variants={names}
                hold={hero.hold}
                greetingClassName="mb-3 text-2xl italic text-[color:var(--muted)] sm:text-3xl"
                nameClassName="pop-mark"
              />
            </h1>

            <Reveal delay={0.1}>
              <p className="mt-8 max-w-xl text-lg leading-relaxed text-[color:var(--muted)]">{site.intro}</p>
            </Reveal>

            <Reveal delay={0.2}>
              <div className="mt-9 flex flex-wrap items-center gap-3">
                <a href="#contact" className="pop-btn pop-btn-ink">
                  Get in touch <ArrowRight className="h-4 w-4" />
                </a>
                <Link href="/about" className="pop-btn pop-btn-ghost">
                  About me
                </Link>
                {site.cv && (
                  <a href={site.cv} target="_blank" rel="noreferrer" className="pop-link ml-2">
                    Download CV
                  </a>
                )}
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Every section is visible on the page. Order, titles and visibility are managed in Admin → Sections. */}
      {panels.map((p, i) => (
        <section key={p.id} id={p.id} className="pop-wrap relative z-10 scroll-mt-24 pb-24">
          <SectionHeading n={String(i + 1).padStart(2, '0')} label={p.title} editHref={p.editHref} />
          {p.node}
        </section>
      ))}

      <section id="contact" className="pop-wrap relative z-10 scroll-mt-24 pb-24">
        {contact}
      </section>

      <footer className="pop-wrap relative z-10 flex items-center justify-between pb-10">
        <span className="pop-label">
          © {new Date().getFullYear()} {site.name}
        </span>
        <a href="#" className="pop-link text-sm">
          Back to top ↑
        </a>
      </footer>
      <AdminButton />
    </main>
  )
}
