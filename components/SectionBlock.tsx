import Reveal from './Reveal'
import type { Entry, Section } from '@/lib/sections'

export function SectionTitle({ n, label }: { n: string; label: string }) {
  return (
    <div className="mb-10 flex items-center gap-4 font-mono text-xs uppercase tracking-[0.2em] text-slate-500">
      <span className="text-blue-600">{n}</span>
      <span>{label}</span>
      <span className="h-px flex-1 bg-slate-200" />
    </div>
  )
}

// Hanya http(s) yang boleh jadi link (cegah javascript: dsb.)
const safeHref = (u: string) => (/^https?:\/\//i.test(u) ? u : undefined)

type View = {
  title: string
  subtitle: string
  meta: string
  body: string[]
  tags: string[]
  links: { label: string; href: string }[]
  extras: { label: string; value: string }[]
}

/** Terjemahkan isi sebuah entri ke slot tampilan berdasarkan peran tiap field di schema. */
function view(section: Section, entry: Entry): View {
  const v: View = { title: '', subtitle: '', meta: '', body: [], tags: [], links: [], extras: [] }
  for (const f of section.schema) {
    const raw = entry.data[f.key]
    const text = Array.isArray(raw) ? '' : String(raw ?? '').trim()
    const list = Array.isArray(raw) ? raw.map(String).filter(Boolean) : []

    switch (f.role) {
      case 'title':
        v.title ||= text
        break
      case 'subtitle':
        v.subtitle ||= text
        break
      case 'meta':
        v.meta ||= text
        break
      case 'body':
        v.body.push(...text.split(/\r?\n/).map((s) => s.trim()).filter(Boolean))
        break
      case 'tags':
        v.tags.push(...list)
        break
      case 'link': {
        const href = safeHref(text)
        if (href) v.links.push({ label: f.label, href })
        break
      }
      case 'extra':
        if (text) v.extras.push({ label: f.label, value: text })
        break
    }
  }
  return v
}

function Tags({ tags }: { tags: string[] }) {
  if (!tags.length) return null
  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {tags.map((t) => (
        <span key={t} className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700">
          {t}
        </span>
      ))}
    </div>
  )
}

function Extras({ extras }: { extras: View['extras'] }) {
  if (!extras.length) return null
  return (
    <dl className="mt-4 space-y-1 text-sm">
      {extras.map((x) => (
        <div key={x.label} className="flex gap-2">
          <dt className="font-mono text-xs uppercase tracking-widest text-slate-400">{x.label}</dt>
          <dd className="text-slate-700">{x.value}</dd>
        </div>
      ))}
    </dl>
  )
}

function Links({ links }: { links: View['links'] }) {
  if (!links.length) return null
  return (
    <div className="mt-4 flex flex-wrap gap-3">
      {links.map((l) => (
        <a
          key={l.href}
          href={l.href}
          target="_blank"
          rel="noreferrer"
          className="text-sm font-semibold text-blue-600 hover:underline"
        >
          {l.label} ↗
        </a>
      ))}
    </div>
  )
}

function Cards({ section }: { section: Section }) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {section.entries.map((e, i) => {
        const v = view(section, e)
        return (
          <Reveal key={e.id} delay={(i % 3) * 0.08}>
            <div className="flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white/80 backdrop-blur">
              {e.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={e.image} alt={v.title} className="aspect-[16/9] w-full object-cover" />
              )}
              <div className="flex flex-1 flex-col p-7">
                {v.meta && <p className="mb-3 font-mono text-xs text-blue-600">{v.meta}</p>}
                <h3 className="text-xl font-bold text-slate-900">{v.title}</h3>
                {v.subtitle && <p className="mt-1 text-slate-500">{v.subtitle}</p>}
                {v.body.map((line, k) => (
                  <p key={k} className="mt-3 text-slate-600">
                    {line}
                  </p>
                ))}
                <Extras extras={v.extras} />
                <Tags tags={v.tags} />
                <Links links={v.links} />
              </div>
            </div>
          </Reveal>
        )
      })}
    </div>
  )
}

function Timeline({ section }: { section: Section }) {
  return (
    <div className="space-y-10">
      {section.entries.map((e) => {
        const v = view(section, e)
        return (
          <Reveal key={e.id} className="grid gap-4 md:grid-cols-[220px_1fr]">
            <p className="font-mono text-sm text-slate-500">{v.meta}</p>
            <div>
              <h3 className="text-2xl font-bold text-slate-900">{v.title}</h3>
              {v.subtitle && <p className="mb-4 text-slate-500">{v.subtitle}</p>}
              {v.body.length > 0 && (
                <ul className="space-y-2 text-slate-700">
                  {v.body.map((line, k) => (
                    <li key={k} className="flex gap-3">
                      <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-600" />
                      {line}
                    </li>
                  ))}
                </ul>
              )}
              <Extras extras={v.extras} />
              <Tags tags={v.tags} />
              <Links links={v.links} />
            </div>
          </Reveal>
        )
      })}
    </div>
  )
}

function Chips({ section }: { section: Section }) {
  return (
    <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
      {section.entries.map((e) => {
        const v = view(section, e)
        return (
          <Reveal key={e.id}>
            <p className="mb-3 font-mono text-xs uppercase tracking-widest text-slate-500">{v.title}</p>
            <div className="flex flex-wrap gap-2">
              {v.tags.map((t) => (
                <span key={t} className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700">
                  {t}
                </span>
              ))}
            </div>
            {v.body.map((line, k) => (
              <p key={k} className="mt-3 text-sm text-slate-500">
                {line}
              </p>
            ))}
            <Links links={v.links} />
          </Reveal>
        )
      })}
    </div>
  )
}

function List({ section }: { section: Section }) {
  return (
    <ul className="divide-y divide-slate-200 overflow-hidden rounded-3xl border border-slate-200 bg-white/80 backdrop-blur">
      {section.entries.map((e) => {
        const v = view(section, e)
        return (
          <li key={e.id} className="flex flex-wrap items-start justify-between gap-x-6 gap-y-1 p-6">
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-slate-900">{v.title}</p>
              {v.subtitle && <p className="text-slate-500">{v.subtitle}</p>}
              {v.body.map((line, k) => (
                <p key={k} className="mt-1 text-sm text-slate-600">
                  {line}
                </p>
              ))}
              <Extras extras={v.extras} />
              <Tags tags={v.tags} />
              <Links links={v.links} />
            </div>
            {v.meta && <p className="font-mono text-sm text-slate-500">{v.meta}</p>}
          </li>
        )
      })}
    </ul>
  )
}

export default function SectionBlock({ section, index }: { section: Section; index: number }) {
  if (section.entries.length === 0) return null

  return (
    <section id={section.slug} className="relative z-10 mx-auto max-w-6xl scroll-mt-8 px-6 pb-28">
      <SectionTitle n={String(index).padStart(2, '0')} label={section.title} />
      {section.layout === 'timeline' ? (
        <Timeline section={section} />
      ) : section.layout === 'chips' ? (
        <Chips section={section} />
      ) : section.layout === 'list' ? (
        <List section={section} />
      ) : (
        <Cards section={section} />
      )}
    </section>
  )
}
