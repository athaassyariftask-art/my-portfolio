'use client'

import { useEffect, useRef, useState } from 'react'

/** Angka yang naik dari 0 saat muncul di layar. "12+" -> 12 lalu "+". Teks non-angka ditampilkan apa adanya. */
export default function CountUp({ value, className }: { value: string; className?: string }) {
  const m = value.match(/^(\d+)(.*)$/)
  const target = m ? parseInt(m[1], 10) : 0
  const suffix = m ? m[2] : ''
  const [n, setN] = useState(target) // awal = nilai akhir, supaya tanpa JavaScript tetap benar
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (!m || target === 0) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    setN(0)
    const el = ref.current
    if (!el) return
    let raf = 0
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return
        io.disconnect()
        const t0 = performance.now()
        const dur = 1200
        const tick = (t: number) => {
          const p = Math.min((t - t0) / dur, 1)
          setN(Math.round(target * (1 - Math.pow(1 - p, 3)))) // easeOutCubic
          if (p < 1) raf = requestAnimationFrame(tick)
        }
        raf = requestAnimationFrame(tick)
      },
      { threshold: 0.4 },
    )
    io.observe(el)
    return () => {
      io.disconnect()
      cancelAnimationFrame(raf)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  return <span ref={ref} className={className}>{m ? `${n}${suffix}` : value}</span>
}
