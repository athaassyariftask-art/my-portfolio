'use client'

import { useEffect, useState } from 'react'
import { Command as CommandIcon } from 'lucide-react'
import CommandPalette, { type Command } from '@/components/CommandPalette'
import ThemeToggle from '@/components/ThemeToggle'

export type NavItem = { id: string; title: string }

/**
 * Sticky top bar for the home page: wordmark, links to each section on the page (the one in view is
 * underlined), the About page, and a call-to-action. All sections are always visible on the page;
 * this bar only helps you jump between them.
 */
export default function SiteNav({
  name,
  items,
  email = '',
  links = [],
  cv = '',
}: {
  name: string
  items: NavItem[]
  email?: string
  links?: { label: string; href: string }[]
  cv?: string
}) {
  const [active, setActive] = useState('')
  const commands: Command[] = [
    ...items.map((i): Command => ({ id: `go-${i.id}`, label: i.title, group: 'Go to', href: `/#${i.id}`, hint: `#${i.id}` })),
    { id: 'go-contact', label: 'Contact', group: 'Go to', href: '/#contact', hint: '#contact' },
    ...links.map((l, i): Command => ({ id: `link-${i}`, label: l.label, group: 'Links', href: l.href, hint: l.href.replace(/^https?:\/\/(www\.)?/, '') })),
    ...(cv ? [{ id: 'cv', label: 'Download CV', group: 'Links' as const, href: cv, hint: 'PDF' }] : []),
    ...(email ? [{ id: 'copy-email', label: 'Copy email address', group: 'Actions' as const, action: 'copy-email' as const, value: email, hint: email }] : []),
    { id: 'theme', label: 'Toggle light / dark theme', group: 'Actions', action: 'theme', hint: 'theme' },
  ]

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
      className="sticky top-0 z-50 border-b border-[color:var(--ink)]"
      style={{ backgroundColor: 'color-mix(in srgb, var(--cream) 94%, transparent)' }}
    >
      <div className="pop-wrap flex flex-wrap items-center justify-between gap-x-6 gap-y-1 py-3">
        <a href="#" className="pop-display text-xl">
          {name}
          <span style={{ color: 'var(--accent)' }}>.</span>
        </a>

        <nav
          aria-label="Page sections"
          className="order-3 flex w-full items-center gap-6 overflow-x-auto font-mono text-xs uppercase tracking-wider md:order-none md:w-auto"
        >
          {items.map((i, idx) => (
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
              <span className="mr-1.5 opacity-50">{String(idx + 1).padStart(2, '0')}</span>
              {i.title}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => window.dispatchEvent(new Event('open-palette'))}
            aria-label="Open command palette"
            className="pop-btn pop-btn-ghost hidden !gap-2 !px-3 !py-1.5 font-mono text-xs sm:inline-flex"
          >
            <CommandIcon className="h-3.5 w-3.5" aria-hidden /> K
          </button>
          <ThemeToggle />
          <a href="#contact" className="pop-btn pop-btn-ink !px-4 !py-1.5 text-sm">
            Get in touch
          </a>
        </div>
        <CommandPalette commands={commands} />
      </div>
    </header>
  )
}
