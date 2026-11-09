import '@/app/fun.css'
import '@/app/pop.css'
import AdminButton from '@/components/AdminButton'
import Link from 'next/link'
import { ArrowUpRight, Mail, Plus } from 'lucide-react'
import { getProfile } from '@/lib/profile'
import { getProjects } from '@/lib/projects'
import { getDetailContext } from '@/lib/details'
import { getSections } from '@/lib/sections'
import { hero } from '@/hero.config'
import ContactForm from '@/components/ContactForm'
import TypewriterName from '@/components/TypewriterName'
import LanyardLayer from '@/components/LanyardLayer'
import Reveal from '@/components/Reveal'
import SectionHeading from '@/components/SectionHeading'
import SiteNav from '@/components/SiteNav'
import { pickSections, sectionPanels, type Panel } from '@/components/Sections'
import AboutBand from '@/components/AboutBand'
import Expertise from '@/components/Expertise'
import type { Stat } from '@/components/StatsStrip'
import { expertiseFromConfig, resolveHome, statValue, statsFromConfig } from '@/lib/home'
import GithubActivity from '@/components/GithubActivity'
import { getGithubActivity, githubUser } from '@/lib/github'

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
  const ghUser = githubUser(site.links, hero.githubUser)
  const github = await getGithubActivity(ghUser) // null when unreachable: the section is simply left out
  // Tagline, achievement cards and Expertise: saved in Admin → Profile → Home content, else the defaults in hero.config.ts
  const home = resolveHome(site.home, {
    tagline: hero.tagline,
    stats: statsFromConfig(hero.stats),
    expertise: expertiseFromConfig(hero.expertise),
  })
  const now = new Date()
  const stats: Stat[] = home.stats
    .map((s) => ({ label: s.label, suffix: s.suffix, value: statValue(s, projects.length, now), mode: s.mode }))
    .filter((s) => s.label && (s.mode !== 'projects' || s.value > 0))
    .map(({ label, suffix, value }) => ({ label, suffix, value }))
  // The first name is the one from Admin → Profile; the rest come from hero.config.ts
  const names = [{ greeting: hero.greeting, text: site.name }, ...hero.names]

  const contact = (
    <Reveal>
      <div className="grid gap-10 rounded-3xl bg-[color:var(--block)] p-8 text-white shadow-[var(--shadow-md)] md:grid-cols-2 md:p-14">
        <div>
          <span className="pop-label mb-5 block !text-[color:var(--hi)]">/ Contact</span>
          <h2 className="pop-display t-h1 mb-8">
            Let's discuss something exciting!!!
          </h2>
          <div className="flex flex-wrap items-center gap-3">
            <a
              href={`mailto:${site.email}`}
              className="inline-flex items-center gap-3 rounded-lg border border-white/40 px-5 py-2.5 font-mono text-xs font-semibold uppercase tracking-wider text-white transition-colors hover:border-[color:var(--hi)] hover:bg-[color:var(--hi)] hover:text-[#101010]"
            >
              <Mail className="h-5 w-5" /> {site.email}
            </a>
            {site.links.map((l) => (
              <a
                key={l.label}
                href={l.href}
                target="_blank"
                rel="noreferrer"
                className="rounded-lg border border-white/40 px-5 py-2.5 font-mono text-xs font-semibold uppercase tracking-wider text-white transition-colors hover:border-[color:var(--hi)] hover:bg-[color:var(--hi)] hover:text-[#101010]"
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
      <SiteNav name={site.name} email={site.email} links={site.links} cv={site.cv} items={[{ id: 'about', title: 'About' }, ...(home.expertise.length ? [{ id: 'expertise', title: 'Expertise' }] : []), ...panels.map((p) => ({ id: p.id, title: p.title })), ...(github ? [{ id: 'github', title: 'GitHub' }] : [])]} />

      {/* Hero + About share one wrapper so the lanyard can follow the scroll down to the end of About */}
      <div className="relative">
      <LanyardLayer name={site.name} role={site.role} affiliation={site.affiliation} photo={site.photo} />

      {/* Hero: greeting + name, a short mono line and two buttons */}
      <section className="relative lg:flex lg:min-h-[calc(100svh-4.5rem)] lg:items-center">
        <div aria-hidden className="pop-grid absolute inset-x-0 top-0 h-[34rem]" />
        <div className="pop-wrap relative z-10 w-full pb-16 pt-12 lg:py-16">
          <div className="lg:max-w-[58%]">
            <h1 className="pop-display t-hero">
              <TypewriterName
                variants={names}
                hold={hero.hold}
                greetingClassName="mb-4 font-mono !text-sm !font-medium not-italic tracking-[0.2em] text-[color:var(--accent)] sm:!text-base"
                nameClassName="pop-mark"
              />
            </h1>

            <Reveal delay={0.1}>
              <p className="mt-8 max-w-md font-mono text-[13px] uppercase leading-[1.9] tracking-[0.05em] md:text-sm">
                {home.tagline}
              </p>
            </Reveal>

            <Reveal delay={0.2}>
              <div className="mt-10 flex flex-wrap items-stretch gap-0">
                <a href="#projects" className="pop-btn pop-btn-ink min-w-[15rem] justify-between !py-4">
                  View my work <ArrowUpRight className="h-5 w-5" />
                </a>
                <a href="#contact" className="pop-btn pop-btn-ghost min-w-[12rem] justify-between !py-4">
                  Let&rsquo;s build together <Plus className="h-5 w-5" />
                </a>
              </div>
              {site.cv && (
                <a href={site.cv} target="_blank" rel="noreferrer" className="pop-link mt-5 text-sm">
                  Download CV
                </a>
              )}
            </Reveal>
          </div>
        </div>
      </section>

      <AboutBand n="01" name={site.name} photo={site.aboutPhoto} text={site.intro} stats={stats} />
      </div>
      <Expertise n="02" items={home.expertise} />
      <div className="pb-[89px]" />

      {/* Every section is visible on the page. Order, titles and visibility are managed in Admin → Sections. */}
      {panels.map((p, i) => (
        <section key={p.id} id={p.id} className="pop-wrap relative z-10 scroll-mt-24 pb-[89px]">
          <SectionHeading n={String(i + 3).padStart(2, '0')} label={p.title} editHref={p.editHref} />
          {p.node}
        </section>
      ))}

      {github && (
        <section id="github" className="pop-wrap relative z-10 scroll-mt-24 pb-[89px]">
          <SectionHeading n={String(panels.length + 3).padStart(2, '0')} label="GitHub activity" />
          <Reveal>
            <GithubActivity data={github} />
          </Reveal>
        </section>
      )}

      <section id="contact" className="pop-wrap relative z-10 scroll-mt-24 pb-[89px]">
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
