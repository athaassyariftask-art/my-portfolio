'use client'

import { useEffect, useRef } from 'react'

/** Thin accent line at the top of the screen that grows with how far the page has been read. */
export default function ReadingProgress() {
  const bar = useRef<HTMLDivElement>(null)
  useEffect(() => {
    let raf = 0
    const update = () => {
      raf = 0
      const el = document.documentElement
      const max = el.scrollHeight - el.clientHeight
      const p = max > 0 ? Math.min(Math.max(el.scrollTop / max, 0), 1) : 0
      if (bar.current) bar.current.style.transform = `scaleX(${p})`
    }
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update) }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])
  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-50 h-1.5">
      <div ref={bar} className="h-full origin-left bg-[color:var(--accent)]" style={{ transform: 'scaleX(0)' }} />
    </div>
  )
}
