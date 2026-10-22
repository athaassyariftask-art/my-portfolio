import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import Reveal from '@/components/Reveal'
import { popColor } from '@/components/pop/colors'
import type { ProjectsProps } from './types'

/** Kartu project dari model Project (dikelola di Admin → Project). */
export default function ProjectsView({ projects }: ProjectsProps) {
  if (projects.length === 0) {
    return <p className="pop-card p-10 font-bold">Belum ada project yang ditampilkan.</p>
  }
  return (
    <div className="grid gap-7 md:grid-cols-2">
      {projects.map((p, i) => (
        <Reveal key={p.id} delay={(i % 2) * 0.08}>
          <Link href={`/projects/${p.id}`} className="pop-card pop-hover group flex h-full flex-col overflow-hidden">
            <div className={`aspect-[16/9] overflow-hidden border-b-[3px] border-[#141414] ${popColor(i)}`}>
              {p.cover ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={p.cover}
                  alt={p.title}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <div className="pop-display flex h-full items-center justify-center text-7xl text-[#141414]/80">
                  {String(i + 1).padStart(2, '0')}
                </div>
              )}
            </div>
            <div className="flex flex-1 flex-col p-6">
              <div className="mb-3 flex items-start justify-between gap-4">
                <h3 className="pop-display text-2xl uppercase leading-tight">{p.title}</h3>
                <ArrowUpRight className="h-6 w-6 shrink-0 transition-transform group-hover:-translate-y-1 group-hover:translate-x-1" />
              </div>
              <p className="mb-5 flex-1 font-medium opacity-80">
                {p.summary || p.description.replace(/[#*_`>\[\]]/g, '').slice(0, 140)}
              </p>
              <div className="flex flex-wrap gap-2">
                {p.tags.map((t) => (
                  <span key={t} className="pop-pill">{t}</span>
                ))}
              </div>
            </div>
          </Link>
        </Reveal>
      ))}
    </div>
  )
}
