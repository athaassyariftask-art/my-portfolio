'use client'

import { useEffect, useRef, useState } from 'react'

export type Panel = { id: string; title: string; node: React.ReactNode }

/**
 * Navigasi tab di bawah hero: hero tetap di atas, hanya isi di bawahnya yang berganti.
 * Bilah tab menempel di atas layar saat scroll. Tab yang aktif ikut ke alamat (#id), jadi bisa dibagikan.
 * Semua panel tetap ada di HTML (yang tidak aktif hanya disembunyikan).
 */
export default function HomeTabs({ panels }: { panels: Panel[] }) {
  const [active, setActive] = useState(panels[0]?.id ?? '')
  const wrap = useRef<HTMLDivElement>(null)

  // Buka tab sesuai #hash (link dari tombol/navbar, atau alamat yang dibagikan)
  useEffect(() => {
    const fromHash = () => {
      const id = decodeURIComponent(window.location.hash.slice(1))
      if (!panels.some((p) => p.id === id)) return false
      setActive(id)
      return true
    }
    if (fromHash()) requestAnimationFrame(() => wrap.current?.scrollIntoView({ block: 'start' }))
    const onHash = () => {
      if (fromHash()) wrap.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [panels])

  function pick(id: string) {
    setActive(id)
    try {
      history.replaceState(null, '', `#${id}`)
    } catch {
      /* abaikan */
    }
    // Kalau sudah scroll melewati hero, kembalikan ke awal konten tab baru
    const top = wrap.current?.getBoundingClientRect().top ?? 0
    if (top < 0) window.scrollTo({ top: window.scrollY + top, behavior: 'smooth' })
  }

  if (panels.length === 0) return null

  return (
    <div ref={wrap} className="relative z-10">
      <div className="sticky top-0 z-30 border-y-[1.5px] border-[#141414] bg-[#ffffff]">
        <div role="tablist" aria-label="Bagian halaman" className="mx-auto flex max-w-6xl gap-7 overflow-x-auto px-6">
          {panels.map((p) => {
            const on = p.id === active
            return (
              <button
                key={p.id}
                role="tab"
                id={`tab-${p.id}`}
                aria-selected={on}
                aria-controls={`panel-${p.id}`}
                onClick={() => pick(p.id)}
                className={`relative shrink-0 py-4 text-sm font-extrabold uppercase tracking-wider transition-opacity ${
                  on ? 'opacity-100' : 'opacity-50 hover:opacity-100'
                }`}
              >
                {p.title}
                {on && <span className="absolute inset-x-0 bottom-0 h-1 bg-[color:var(--accent)]" />}
              </button>
            )
          })}
        </div>
      </div>

      {panels.map((p) => (
        <div
          key={p.id}
          role="tabpanel"
          id={`panel-${p.id}`}
          aria-labelledby={`tab-${p.id}`}
          hidden={p.id !== active}
          className="mx-auto max-w-6xl px-6 pb-20 pt-12"
        >
          {p.node}
        </div>
      ))}
    </div>
  )
}
