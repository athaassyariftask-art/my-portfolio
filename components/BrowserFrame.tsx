'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowUpRight, Lock } from 'lucide-react'
import { useReducedMotion } from 'framer-motion'

type Props = {
  /** Screenshot. Without one, a wireframe illustration is drawn instead. */
  src?: string | null
  alt?: string
  /** Text in the address bar. */
  label: string
  /** Makes the whole window a link. */
  href?: string
  /** Tailwind aspect classes for the screen area. */
  aspect?: string
  /** Text of the pill that follows the cursor (only when `href` is set). */
  chip?: string
  className?: string
}

/** Placeholder "app" drawn with SVG, for projects that have no screenshot yet. */
function Wireframe() {
  return (
    <svg viewBox="0 0 800 500" preserveAspectRatio="xMidYMid slice" className="h-full w-full" aria-hidden>
      <rect width="800" height="500" fill="#faf8f3" />
      <rect width="150" height="500" fill="#f1ede3" />
      {[70, 110, 150, 190].map((y) => (
        <rect key={y} x="22" y={y} width={y === 70 ? 100 : 80} height="12" rx="6" fill={y === 70 ? 'var(--accent)' : '#d9d3c3'} opacity={y === 70 ? 0.8 : 1} />
      ))}
      <rect x="176" y="28" width="220" height="18" rx="9" fill="#ddd7c8" />
      {[0, 1, 2, 3].map((i) => (
        <g key={i}>
          <rect x={176 + i * 150} y="76" width="136" height="76" rx="12" fill="#fff" stroke="#e6e1d2" />
          <rect x={192 + i * 150} y="92" width="48" height="8" rx="4" fill="#d9d3c3" />
          <rect x={192 + i * 150} y="114" width="84" height="18" rx="6" fill={['var(--blue)', 'var(--teal)', 'var(--yellow)', 'var(--pink)'][i]} />
        </g>
      ))}
      <rect x="176" y="176" width="372" height="290" rx="14" fill="#fff" stroke="#e6e1d2" />
      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
        <rect key={i} x={204 + i * 48} y={420 - [90, 150, 110, 190, 140, 220, 170][i]} width="28" height={[90, 150, 110, 190, 140, 220, 170][i]} rx="6" fill="var(--accent)" opacity={0.25 + i * 0.1} />
      ))}
      <rect x="570" y="176" width="204" height="290" rx="14" fill="#fff" stroke="#e6e1d2" />
      <circle cx="672" cy="290" r="62" fill="none" stroke="var(--blue)" strokeWidth="26" />
      <circle cx="672" cy="290" r="62" fill="none" stroke="var(--accent)" strokeWidth="26" strokeDasharray="130 400" transform="rotate(-90 672 290)" />
    </svg>
  )
}

/**
 * A browser window for showing a project. On a mouse it tilts toward the pointer with a moving glare,
 * and a tall screenshot scrolls from top to bottom while you hover (like previewing the full page).
 * Touch devices and "reduce motion" get the plain, still window.
 */
export default function BrowserFrame({ src, alt = '', label, href, aspect = 'aspect-[16/10]', chip = 'Open project', className = '' }: Props) {
  const reduce = useReducedMotion()
  const frame = useRef<HTMLDivElement>(null)
  const view = useRef<HTMLDivElement>(null)
  const img = useRef<HTMLImageElement>(null)
  const [shift, setShift] = useState(0)
  const [hover, setHover] = useState(false)

  function enter(e: React.PointerEvent) {
    if (e.pointerType !== 'mouse') return
    setHover(true)
    if (reduce) return
    // How far the screenshot can scroll inside the window
    const room = (img.current?.offsetHeight ?? 0) - (view.current?.clientHeight ?? 0)
    setShift(room > 8 ? room : 0)
  }

  function leave() {
    setHover(false)
    setShift(0)
    const el = frame.current
    if (el) {
      el.style.setProperty('--rx', '0deg')
      el.style.setProperty('--ry', '0deg')
    }
  }

  function move(e: React.PointerEvent) {
    const el = frame.current
    if (!el || e.pointerType !== 'mouse') return
    const r = el.getBoundingClientRect()
    const x = (e.clientX - r.left) / r.width
    const y = (e.clientY - r.top) / r.height
    el.style.setProperty('--mx', `${x * 100}%`)
    el.style.setProperty('--my', `${y * 100}%`)
    if (!reduce) {
      el.style.setProperty('--ry', `${(x - 0.5) * 8}deg`)
      el.style.setProperty('--rx', `${-(y - 0.5) * 6}deg`)
    }
  }

  const seconds = shift ? Math.min(7, Math.max(1.4, shift / 110)) : 0.6

  const win = (
    <div
      ref={frame}
      className="relative overflow-hidden rounded-xl border border-[color:var(--line)] bg-white shadow-[var(--shadow-md)]"
      style={{
        transform: 'perspective(1400px) rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg))',
        transition: 'transform 0.25s ease-out',
      }}
    >
      <div className="flex items-center gap-3 border-b border-[color:var(--line)] bg-[#f4f1e9] px-4 py-2.5">
        <span className="flex gap-1.5" aria-hidden>
          <span className="h-2.5 w-2.5 rounded-full bg-[#f1b9b0]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#f1dc9d]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#b9dcc6]" />
        </span>
        <span className="flex min-w-0 flex-1 items-center gap-2 rounded-full bg-white px-3 py-1 text-xs text-[color:var(--muted)]">
          <Lock className="h-3 w-3 shrink-0" aria-hidden />
          <span className="truncate">{label}</span>
        </span>
      </div>

      <div ref={view} className={`relative overflow-hidden bg-[#faf8f3] ${aspect}`}>
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            ref={img}
            src={src}
            alt={alt}
            className="block h-auto w-full"
            style={{
              transform: `translateY(-${shift}px)`,
              transition: `transform ${seconds}s cubic-bezier(0.4, 0, 0.2, 1)`,
            }}
          />
        ) : (
          <Wireframe />
        )}

        {/* Glare that follows the pointer */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 transition-opacity duration-300"
          style={{
            opacity: hover && !reduce ? 1 : 0,
            background: 'radial-gradient(420px circle at var(--mx, 50%) var(--my, 50%), rgba(255,255,255,0.32), transparent 60%)',
          }}
        />

        {/* Pill that follows the cursor */}
        {href && (
          <span
            aria-hidden
            className="pointer-events-none absolute z-10 inline-flex -translate-x-1/2 -translate-y-1/2 items-center gap-1.5 whitespace-nowrap rounded-full bg-[color:var(--ink)] px-3.5 py-1.5 text-xs font-semibold text-white shadow-[var(--shadow-md)] transition-opacity duration-200"
            style={{ left: 'var(--mx, 50%)', top: 'var(--my, 50%)', opacity: hover ? 1 : 0 }}
          >
            {chip} <ArrowUpRight className="h-3.5 w-3.5" />
          </span>
        )}
      </div>
    </div>
  )

  return (
    <div className={className} onPointerEnter={enter} onPointerLeave={leave} onPointerMove={move}>
      {href ? (
        <Link href={href} aria-label={`${chip}: ${label}`} className="block">
          {win}
        </Link>
      ) : (
        win
      )}
    </div>
  )
}
