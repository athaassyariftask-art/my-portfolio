import '@/app/fun.css'
import '@/app/pop.css'
import AdminButton from '@/components/AdminButton'
import Link from 'next/link'
import { ArrowRight, Mail } from 'lucide-react'
import { getProfile } from '@/lib/profile'
import { getProjects } from '@/lib/projects'
import { getDetailContext } from '@/lib/details'
import { getSections } from '@/lib/sections'
import { display } from '@/lib/fonts'
import { hero } from '@/hero.config'
import ContactForm from '@/components/ContactForm'
import GlitchName from '@/components/GlitchName'
import LanyardLayer from '@/components/LanyardLayer'
import Reveal from '@/components/Reveal'
import Sections, { pickSections } from '@/components/Sections'
import { Flower } from '@/components/pop/Badges'

export async function generateMetadata() {
  const site = await getProfile()
  const title = `${site.name} | ${site.role}`
  const description = site.intro
  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
    title: { absolute: title },
    description,
    openGraph: { title, description, type: 'website', locale: 'id_ID', siteName: site.name },
    twitter: { card: 'summary_large_image', title, description },
  }
}

export default async function Home() {
  // Data dari database Django (diedit lewat /admin). Kalau backend mati, pakai nilai bawaan.
  const [site, projects, sections, detail] = await Promise.all([
    getProfile(),
    getProjects(),
    getSections(),
    getDetailContext(),
  ])
  const visible = pickSections(sections, 'home')
  // Nama pertama = nama dari Admin → Profil; sisanya dari hero.config.ts
  const names = [{ greeting: hero.greeting, text: site.name }, ...hero.names]

  return (
    <main className={`pop-page ${display.variable} relative min-h-screen overflow-x-hidden`}>
      <LanyardLayer name={site.name} role={site.role} affiliation={site.affiliation} photo={site.photo} />

      {/* Navbar */}
      <header className="relative z-10 mx-auto max-w-6xl px-6 pt-6">
        <div className="pop-card !rounded-full flex items-center justify-between !px-6 py-3 !shadow-none">
          <a href="#" className="text-sm font-extrabold tracking-tight">
            {site.name}
            <span style={{ color: 'var(--orange)' }}>_</span>
          </a>
          <nav className="flex items-center gap-5 text-xs font-extrabold uppercase tracking-widest sm:gap-7">
            {visible.find((v) => v.s.kind === 'projects') && (
              <a href={`#${visible.find((v) => v.s.kind === 'projects')!.anchor}`} className="hidden transition-opacity hover:opacity-60 sm:block">Projects</a>
            )}
            <Link href="/about" className="transition-opacity hover:opacity-60">About</Link>
            <a href="#contact" className="pop-pill pop-orange">Contact</a>
          </nav>
        </div>
      </header>

      {/* Hero: sapaan + nama yang berganti aksara */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 pb-24 pt-14 lg:pt-20">
        <div className="lg:max-w-[58%]">
          <div className="relative">
            <h1 className="pop-display text-[2.6rem] uppercase leading-[1] sm:text-6xl lg:text-7xl">
              <GlitchName
                variants={names}
                hold={hero.hold}
                nameClassName="pop-outline text-[color:var(--orange)]"
              />
            </h1>
          </div>

          <div className="pop-card relative mt-10 max-w-xl p-6">
            <Flower className="absolute -right-6 -top-8 h-16 w-16 -rotate-12" />
            <div className="mb-4 flex flex-wrap gap-2">
              <span className="pop-pill pop-teal">{site.role}</span>
              <span className="pop-pill pop-yellow">{site.affiliation}</span>
            </div>
            <Reveal delay={0.1}>
              <p className="text-lg font-medium leading-relaxed">{site.intro}</p>
            </Reveal>
          </div>

          <Reveal delay={0.2}>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link href="/about" className="pop-btn pop-btn-ink">
                Tentang saya <ArrowRight className="h-5 w-5" />
              </Link>
              <a href="#contact" className="pop-btn pop-yellow">
                Hubungi saya
              </a>
              {site.cv && (
                <a href={site.cv} target="_blank" rel="noreferrer" className="pop-btn pop-pink">
                  Unduh CV
                </a>
              )}
            </div>
          </Reveal>
        </div>
      </section>

      <Sections items={visible} projects={projects} detail={detail} />


      <section id="contact" className="relative z-10 mx-auto max-w-6xl scroll-mt-8 px-6 pb-16">
        <Reveal>
          <div className="pop-card grid gap-10 !bg-[#141414] p-8 text-white md:grid-cols-2 md:p-14" style={{ borderRadius: 40 }}>
            <div>
              <span className="pop-pill pop-pink mb-5">Contact</span>
              <h2 className="pop-display mb-8 text-3xl uppercase leading-tight md:text-4xl">
                Punya masalah yang ingin dijadikan sistem?
              </h2>
              <div className="flex flex-wrap items-center gap-3">
                <a
                  href={`mailto:${site.email}`}
                  className="inline-flex items-center gap-3 rounded-full border-2 border-[#fff6e4] px-6 py-3 font-bold text-[#fff6e4] transition-colors hover:bg-[#ffc82e] hover:text-[#141414]"
                >
                  <Mail className="h-5 w-5" /> {site.email}
                </a>
                {site.links.map((l) => (
                  <a
                    key={l.label}
                    href={l.href}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full border-2 border-[#fff6e4] px-6 py-3 font-bold text-[#fff6e4] transition-colors hover:bg-[#ffc82e] hover:text-[#141414]"
                  >
                    {l.label}
                  </a>
                ))}
              </div>
            </div>
            <ContactForm />
          </div>
        </Reveal>

        <footer className="mt-10 text-xs font-bold uppercase tracking-widest">
          © {new Date().getFullYear()} {site.name}
        </footer>
      </section>
      <AdminButton />
    </main>
  )
}
