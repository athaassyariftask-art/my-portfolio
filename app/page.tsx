import '@/app/fun.css'
import '@/app/pop.css'
import AdminButton from '@/components/AdminButton'
import HomeTabs from '@/components/HomeTabs'
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
import { pickSections, sectionPanels } from '@/components/Sections'

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


  const contact = (
    <Reveal>
      <div className="pop-card grid gap-10 !bg-[#141414] p-8 text-white md:grid-cols-2 md:p-14" style={{ borderRadius: 24 }}>
            <div>
              <span className="pop-pill pop-pink mb-5">Contact</span>
              <h2 className="pop-display mb-8 text-3xl uppercase leading-tight md:text-4xl">
                Punya masalah yang ingin dijadikan sistem?
              </h2>
              <div className="flex flex-wrap items-center gap-3">
                <a
                  href={`mailto:${site.email}`}
                  className="inline-flex items-center gap-3 rounded-lg border border-white px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#fbe48c] hover:text-[#141414]"
                >
                  <Mail className="h-5 w-5" /> {site.email}
                </a>
                {site.links.map((l) => (
                  <a
                    key={l.label}
                    href={l.href}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-lg border border-white px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#fbe48c] hover:text-[#141414]"
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
  const panels = [
    ...sectionPanels(visible, projects, detail),
    ...(visible.length === 0 && detail.admin
      ? [
          {
            id: 'mulai',
            title: 'Mulai',
            node: (
              <div className="pop-card p-8 text-center font-bold">
                Belum ada section yang tampil. <Link href="/admin/sections" className="underline">Buat di Admin → Section</Link>
              </div>
            ),
          },
        ]
      : []),
    { id: 'contact', title: 'Kontak', node: contact },
  ]

  return (
    <main className={`pop-page ${display.variable} relative min-h-screen overflow-x-clip`}>
      <LanyardLayer name={site.name} role={site.role} affiliation={site.affiliation} photo={site.photo} />

      {/* Navbar */}
      <header className="relative z-10 mx-auto max-w-6xl px-6 pt-6">
        <div className="pop-card !rounded-xl flex items-center justify-between !px-6 py-3 ">
          <a href="#" className="text-sm font-extrabold tracking-tight">
            {site.name}
            <span style={{ color: 'var(--accent)' }}>_</span>
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
      <section className="relative z-10 mx-auto max-w-6xl px-6 pb-16 pt-10 lg:pt-16">
        <div className="lg:max-w-[58%]">
          <div className="relative">
            <h1 className="pop-display text-5xl uppercase leading-[1] sm:text-7xl lg:text-8xl">
              <GlitchName
                variants={names}
                hold={hero.hold}
                nameClassName="pop-outline text-[color:var(--accent)]"
              />
            </h1>
          </div>

          <div className="pop-card relative mt-10 max-w-xl p-6">
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

      {/* Navigasi tab di bawah hero. Urutan, judul, dan tampil/sembunyi section diatur di Admin → Section */}
      <HomeTabs panels={panels} />

      <footer className="relative z-10 mx-auto max-w-6xl px-6 pb-10 text-xs font-bold uppercase tracking-widest">
        © {new Date().getFullYear()} {site.name}
      </footer>
      <AdminButton />
    </main>
  )
}
