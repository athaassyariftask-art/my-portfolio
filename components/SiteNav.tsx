'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

export type NavItem = { id: string; title: string }

/**
 * Sticky top bar for the home page: wordmark, links to each section on the page (the one in view is
 * underlined), the About page, and a call-to-action. All sections are always visible on the page;
 * this bar only helps you jump between them.
 */
export default function SiteNav({ name, items }: { name: string; items: NavItem[] }) {
  const [active, setActive] = useState('')

  useEffect(() => {
    const els = items.map((i) => document.getElementById(i.id)).filter((el): el is HTMLElement => !!el)
    if (els.length === 0 || typeof IntersectionObserver === 'undefined') return
    // A section counts as "current" while it crosses the band just under the sticky bar.
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(e.target.id)
      },
      { rootMargin: '-96px 0px -60% 0px', threshold: 0 },
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [items])

  return (
    <header
      className="sticky top-0 z-50 border-b border-[color:var(--line)]"
      style={{ backgroundColor: 'color-mix(in srgb, var(--cream) 94%, transparent)' }}
    >
      <div className="pop-wrap flex flex-wrap items-center justify-between gap-x-6 gap-y-1 py-3">
        <a href="#" className="pop-display text-lg">
          {name}
          <span style={{ color: 'var(--accent)' }}>.</span>
        </a>

        <nav
          aria-label="Page sections"
          className="order-3 flex w-full items-center gap-6 overflow-x-auto text-sm font-medium md:order-none md:w-auto"
        >
          {items.map((i) => (
            <a
              key={i.id}
              href={`#${i.id}`}
              aria-current={active === i.id ? 'true' : undefined}
              className={`shrink-0 border-b-2 py-1.5 transition-colors ${
                active === i.id
                  ? 'border-[color:var(--accent)] text-[color:var(--ink)]'
                  : 'border-transparent text-[color:var(--muted)] hover:text-[color:var(--ink)]'
              }`}
            >
              {i.title}
            </a>
          ))}
          <Link
            href="/about"
            className="shrink-0 border-b-2 border-transparent py-1.5 text-[color:var(--muted)] transition-colors hover:text-[color:var(--ink)]"
          >
            About
          </Link>
        </nav>

        <a href="#contact" className="pop-btn pop-btn-ink !px-4 !py-1.5 text-sm">
          Get in touch
        </a>
      </div>
    </header>
  )
}
