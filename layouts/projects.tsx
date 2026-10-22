'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import type { ProjectsProps } from './types'

// Warna pastel bergantian untuk baris daftar dan map folder (nilainya ada di :root pada app/pop.css)
const TONES = ['var(--blue)', 'var(--yellow)', 'var(--teal)', 'var(--pink)', 'var(--orange)']
const tone = (i: number) => TONES[i % TONES.length]
const num = (i: number) => String(i + 1).padStart(2, '0')
const plain = (s: string) => s.replace(/[#*_`>\[\]]/g, '').slice(0, 140)

/**
 * Project = daftar bernomor di kiri + kotak arsip di kanan.
 * Memilih satu project membuat map folder-nya naik keluar dari kotak.
 */
export default function ProjectsView({ projects }: ProjectsProps) {
  const [active, setActive] = useState(0)

  if (projects.length === 0) {
    return <p className="pop-card p-10 font-bold">Belum ada project yang ditampilkan.</p>
  }

  const n = projects.length
  const cur = Math.min(active, n - 1)
  // Map yang sedang dipilih naik ke TOP_ACTIVE; map lain menyembul di belakangnya, tersusun ke atas
  const TOP_ACTIVE = 24
  const FOLDER_H = 70
  const gap = n > 1 ? Math.min(3.5, 22 / (n - 1)) : 0
  const tops = projects.map((_, i) => {
    if (i === cur) return TOP_ACTIVE
    const rank = i < cur ? i : i - 1 // urutan di antara map yang diam
    return TOP_ACTIVE - gap * (rank + 1)
  })

  return (
    <div className="grid items-center gap-10 lg:grid-cols-[1fr_minmax(0,460px)]">
      {/* Daftar project */}
      <ol className="space-y-3">
        {projects.map((p, i) => {
          const on = i === cur
          return (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => setActive(i)}
                aria-pressed={on}
                className="pop-card pop-hover block w-full p-4 text-left md:p-5"
                style={{ backgroundColor: on ? tone(i) : undefined }}
              >
                <span className="flex items-center gap-4">
                  <span className="pop-display text-xl opacity-70">{num(i)}</span>
                  <span className="pop-display flex-1 text-xl uppercase leading-tight md:text-2xl">{p.title}</span>
                  <ArrowUpRight
                    className={`h-5 w-5 shrink-0 transition-transform ${on ? 'rotate-45' : ''}`}
                    aria-hidden
                  />
                </span>
                {on && (
                  <span className="mt-3 block pl-11 text-sm font-medium leading-relaxed opacity-80">
                    {p.summary || plain(p.description) || 'Belum ada ringkasan.'}
                  </span>
                )}
              </button>
              {on && (
                <div className="flex flex-wrap items-center gap-2 pl-4 pt-3">
                  {p.tags.map((t) => (
                    <span key={t} className="pop-pill">{t}</span>
                  ))}
                  <Link href={`/projects/${p.id}`} className="pop-btn pop-btn-ink !px-4 !py-1.5 text-sm">
                    Buka project <ArrowUpRight className="h-4 w-4" />
                  </Link>
                </div>
              )}
            </li>
          )
        })}
      </ol>

      {/* Kotak arsip */}
      <div className="pf-stage" aria-hidden={false}>
        <div className="pf-back" />
        {projects.map((p, i) => {
          const on = i === cur
          return (
            <div
              key={p.id}
              className="pf-folder"
              style={{
                top: `${tops[i]}%`,
                height: `${FOLDER_H}%`,
                zIndex: on ? n + 5 : n - i,
                backgroundColor: tone(i),
              }}
            >
              <span className="pf-tab" style={{ left: `${(i % 4) * 24}%`, backgroundColor: tone(i) }}>
                {num(i)}
              </span>
              <div className="pf-face" style={{ opacity: on ? 1 : 0 }}>
                <div>
                  <p className="pop-display text-sm opacity-60">PROJECT / {num(i)}</p>
                  <h3 className="pop-display mt-1 text-2xl uppercase leading-tight sm:text-3xl">{p.title}</h3>
                </div>
                {p.cover && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.cover} alt="" className="pf-cover" />
                )}
                <Link
                  href={`/projects/${p.id}`}
                  tabIndex={on ? 0 : -1}
                  className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-widest"
                >
                  Buka file <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          )
        })}
        <div className="pf-front">
          <span className="pf-handle" />
          <span className="pf-label">My works</span>
        </div>
      </div>
    </div>
  )
}
