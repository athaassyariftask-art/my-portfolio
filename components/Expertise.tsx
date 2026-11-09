import {
  Briefcase, Code, Database, Globe, Layers, Lightbulb, Palette, Rocket, Smartphone, Target, Users, Workflow, Wrench, type LucideIcon,
} from 'lucide-react'
import Reveal from '@/components/Reveal'
import type { HomeExpertise, IconKey } from '@/lib/home'

const ICONS: Record<IconKey, LucideIcon> = {
  workflow: Workflow, code: Code, target: Target, palette: Palette, database: Database, users: Users, lightbulb: Lightbulb,
  layers: Layers, briefcase: Briefcase, rocket: Rocket, wrench: Wrench, globe: Globe, smartphone: Smartphone,
}

/** Columns separated by hairlines: a coloured rounded icon, a number, a title and a short line. Edited in Admin → Profile. */
export default function Expertise({ n, items }: { n: string; items: HomeExpertise[] }) {
  if (items.length === 0) return null
  return (
    <section id="expertise" aria-label="Expertise" className="relative z-10 scroll-mt-24 border-b border-[color:var(--ink)]">
      <div className="pop-wrap py-[55px] md:py-[89px]">
        <p className="pop-label mb-[34px] !text-[color:var(--accent)]">/ {n} Expertise</p>
        <ul className="grid gap-y-[34px] md:grid-cols-2 lg:grid-cols-4">
          {items.map((it, i) => {
            const Icon = ICONS[it.icon] ?? Code
            return (
              <li key={`${it.title}-${i}`} className="lg:border-l lg:border-[color:var(--ink)]/25 lg:px-[34px] lg:first:border-l-0 lg:first:pl-0">
                <Reveal delay={i * 0.06}>
                  <div className="flex gap-[21px]">
                    <span
                      className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl"
                      style={{ background: i % 2 === 0 ? 'var(--hi)' : 'var(--accent)', color: i % 2 === 0 ? '#101010' : '#fff' }}
                    >
                      <Icon className="h-6 w-6" strokeWidth={1.6} aria-hidden />
                    </span>
                    <div>
                      <p className="pop-label">{String(i + 1).padStart(2, '0')}</p>
                      <h3 className="mt-1 text-base font-semibold leading-snug">{it.title}</h3>
                      <p className="mt-[13px] text-[13.5px] leading-[1.618] text-[color:var(--muted)]">{it.text}</p>
                    </div>
                  </div>
                </Reveal>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
