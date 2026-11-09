'use client'

import { useEffect, useRef, useState } from 'react'
import { animate, useInView, useReducedMotion } from 'framer-motion'

export type Stat = { label: string; value: number; suffix?: string }

function Counter({ value, suffix = '' }: { value: number; suffix?: string }) {
  const reduce = useReducedMotion()
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })
  // Starts at the final number so the server-rendered HTML is already correct; counts up when scrolled into view
  const [shown, setShown] = useState(value)
  useEffect(() => {
    if (!inView || reduce) return
    const controls = animate(0, value, { duration: 1.2, ease: 'easeOut', onUpdate: (v) => setShown(Math.round(v)) })
    return () => controls.stop()
  }, [inView, reduce, value])
  return (
    <span ref={ref}>
      {shown}
      {suffix}
    </span>
  )
}

/**
 * Achievement cards: one card per number, with a green marker behind the figure. Numbers count up once in view.
 * The cards are edited in hero.config.ts (`stats`).
 */
export default function StatsStrip({ stats }: { stats: Stat[] }) {
  if (stats.length === 0) return null
  return (
    <ul className="grid grid-cols-2 gap-[13px] xl:grid-cols-3">
      {stats.map((s) => (
        <li key={s.label} className="pop-card p-5 md:p-6">
          <p className="pop-display t-h1">
            <span className="pop-mark">
              <Counter value={s.value} suffix={s.suffix} />
            </span>
          </p>
          <p className="pop-label mt-4 !text-[color:var(--ink)]">{s.label}</p>
        </li>
      ))}
    </ul>
  )
}
