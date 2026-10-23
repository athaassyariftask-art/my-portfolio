'use client'

import { useEffect, useRef, useState } from 'react'
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
  // `shown` = kotak sedang terlihat di layar. Dipakai untuk memutar animasi map naik setiap kali bagian ini muncul.
  const [shown, setShown] = useState(false)
  const stage = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = stage.current
    if (!el || typeof IntersectionObserver === 'undefined') {
      setShown(true)
      return
    }
    const io = new IntersectionObserver(([e]) => {
      // jeda singkat supaya posisi awal (map di dalam kotak) sempat tergambar sebelum naik
      if (e.isIntersecting) setTimeout(() => setShown(true), 120)
      else setShown(false)
    }, { threshold: 0.35 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  // Kotak miring mengikuti mouse (lewat variabel CSS, tanpa render ulang)
  function tilt(e: React.PointerEvent<HTMLDivElement>) {
    if (e.pointerType !== 'mouse') return
    const r = e.currentTarget.getBoundingClientRect()
    const x = (e.clientX - r.left) / r.width - 0.5
    const y = (e.clientY - r.top) / r.height - 0.5
    e.currentTarget.style.setProperty('--ry', `${-28 + x * 16}deg`)
    e.currentTarget.style.setProperty('--rx', `${12 - y * 10}deg`)
  }
  function untilt(e: React.PointerEvent<HTMLDivElement>) {
    e.currentTarget.style.removeProperty('--ry')
    e.currentTarget.style.removeProperty('--rx')
  }

  if (projects.length === 0) {
    return <p className="pop-card p-10 font-bold">Belum ada project yang ditampilkan.</p>
  }

  const n = projects.length
  const cur = Math.min(active, n - 1)
  // Map yang dipilih naik ke TOP_ACTIVE; map lain menyembul di belakangnya, tersusun ke atas dan ke belakang
  const TOP_ACTIVE = 24
  const FOLDER_H = 70
  const REST_TOP = 58 // posisi awal: semua map masih di dalam kotak
  const gap = n > 1 ? Math.min(3.5, 22 / (n - 1)) : 0
  const dz = Math.min(16, 170 / Math.max(n, 1))
  const place = (i: number) => {
    if (!shown) return { top: REST_TOP, z: -90 }
    if (i === cur) return { top: TOP_ACTIVE, z: 80 }
    const rank = i < cur ? i : i - 1
    return { top: TOP_ACTIVE - gap * (rank + 1), z: 66 - dz * (rank + 1) }
  }

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

      {/* Kotak arsip (3D) */}
      <div className="pf-stage" ref={stage} onPointerMove={tilt} onPointerLeave={untilt}>
        <div className="pf-scene">
          <div className="pf-back" />
          <div className="pf-side pf-side-l" />
          <div className="pf-side pf-side-r" />
          {projects.map((p, i) => {
            const on = i === cur
            const { top, z } = place(i)
            // potong bagian map yang melewati dasar kotak (tab di atas boleh keluar)
            const cut = (Math.max(0, top + FOLDER_H - 96) / FOLDER_H) * 100
            return (
              <div
                key={p.id}
                className={`pf-folder ${on ? 'is-on' : ''}`}
                style={{
                  top: `${top}%`,
                  height: `${FOLDER_H}%`,
                  backgroundColor: tone(i),
                  clipPath: `inset(-3rem -2px ${cut}% -2px)`,
                  ['--z' as string]: `${z}px`,
                }}
              >
                <span className="pf-tab" style={{ left: `${(i % 3) * 33}%`, backgroundColor: tone(i) }}>
                  {num(i)} / {p.title}
                </span>
                <div className="pf-face" style={{ opacity: on && shown ? 1 : 0 }}>
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
    </div>
  )
}
