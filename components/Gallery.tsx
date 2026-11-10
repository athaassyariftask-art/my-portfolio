'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'

/**
 * Photo gallery shown as a stack of cards. Click the stack to open a full-screen viewer with
 * next / previous (buttons, arrow keys or swipe), a counter and thumbnails. Esc or a click outside closes it.
 */
export default function Gallery({ urls }: { urls: string[] }) {
  const [open, setOpen] = useState<number | null>(null)
  const [mounted, setMounted] = useState(false)
  const touch = useRef<number | null>(null)
  const n = urls.length

  useEffect(() => setMounted(true), [])

  const go = useCallback((d: number) => setOpen((i) => (i === null ? i : (i + d + n) % n)), [n])

  useEffect(() => {
    if (open === null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(null)
      else if (e.key === 'ArrowRight') go(1)
      else if (e.key === 'ArrowLeft') go(-1)
    }
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, go])

  if (n === 0) return null
  const shown = urls.slice(0, 3)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(0)}
        aria-label={`Open gallery, ${n} photo${n > 1 ? 's' : ''}`}
        className="group relative mx-auto my-8 block w-full max-w-2xl cursor-zoom-in"
      >
        <span className="relative block aspect-[16/10]">
          {shown
            .map((u, k) => ({ u, k }))
            .reverse()
            .map(({ u, k }) => (
              <span
                key={u + k}
                className="absolute inset-0 block overflow-hidden bg-[color:var(--paper)] shadow-[0_18px_30px_-18px_rgba(0,0,0,0.55)] ring-1 ring-black/10 transition-transform duration-300 ease-out"
                style={{
                  transform: `translate(${k * 4}%, ${k * -3}%) rotate(${k * 2.5}deg)`,
                  zIndex: 10 - k,
                  transformOrigin: 'bottom left',
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={u} alt="" loading="lazy" className="h-full w-full object-cover object-top transition-transform duration-300 group-hover:scale-[1.02]" />
              </span>
            ))}
          <span className="absolute bottom-3 right-3 z-20 rounded-full bg-black/70 px-3 py-1 font-mono text-xs font-semibold text-white">
            {n} photos · click to view
          </span>
        </span>
      </button>

      {mounted &&
        open !== null &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Photo viewer"
            className="fixed inset-0 z-[200] flex flex-col bg-black/90 backdrop-blur-sm"
            onClick={() => setOpen(null)}
            onTouchStart={(e) => (touch.current = e.touches[0].clientX)}
            onTouchEnd={(e) => {
              if (touch.current === null) return
              const dx = e.changedTouches[0].clientX - touch.current
              touch.current = null
              if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1)
            }}
          >
            <div className="flex items-center justify-between px-4 py-3 text-white" onClick={(e) => e.stopPropagation()}>
              <span className="font-mono text-sm">
                {open + 1} / {n}
              </span>
              <button type="button" onClick={() => setOpen(null)} aria-label="Close" className="rounded-full p-2 hover:bg-white/15">
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="relative flex min-h-0 flex-1 items-center justify-center px-4 md:px-16">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                key={open}
                src={urls[open]}
                alt=""
                onClick={(e) => e.stopPropagation()}
                className="max-h-full max-w-full object-contain"
              />
              {n > 1 && (
                <>
                  <button
                    type="button"
                    aria-label="Previous photo"
                    onClick={(e) => { e.stopPropagation(); go(-1) }}
                    className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/15 p-3 text-white hover:bg-white/30 md:left-5"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                  <button
                    type="button"
                    aria-label="Next photo"
                    onClick={(e) => { e.stopPropagation(); go(1) }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/15 p-3 text-white hover:bg-white/30 md:right-5"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>
                </>
              )}
            </div>

            {n > 1 && (
              <div className="flex justify-center gap-2 overflow-x-auto px-4 py-3" onClick={(e) => e.stopPropagation()}>
                {urls.map((u, i) => (
                  <button
                    key={u + i}
                    type="button"
                    onClick={() => setOpen(i)}
                    aria-label={`Photo ${i + 1}`}
                    className={`h-14 w-20 shrink-0 overflow-hidden ring-2 transition-opacity ${i === open ? 'opacity-100 ring-white' : 'opacity-50 ring-transparent hover:opacity-90'}`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={u} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>,
          document.body,
        )}
    </>
  )
}
