'use client'

import { useEffect, useRef, useState } from 'react'

export type NameVariant = { greeting: string; text: string }

const NOISE = '▓▒░█<>/\\|{}[]=+*#%&@$?!'
const SCRAMBLE_MS = 750 // lama transisi acak -> teks baru
const FRAME_MS = 50 // seberapa sering huruf acak berganti (lebih besar = lebih "patah-patah")

/** Satu langkah acak: huruf kiri mengunci lebih dulu seiring p (0..1) naik. */
function scrambled(from: string[], target: string[], p: number, pool: string[]) {
  const len = Math.max(from.length, target.length)
  let out = ''
  for (let k = 0; k < len; k++) {
    const settleAt = (k / len) * 0.75 + 0.25
    out += p >= settleAt ? (target[k] ?? '') : pool[Math.floor(Math.random() * pool.length)]
  }
  return out
}

/**
 * Sapaan + nama yang berganti bahasa/aksara dengan efek glitch: huruf diacak lalu "mengunci" dari kiri
 * ke kanan, disertai pecahan warna (merah/cyan) sesaat. Sapaan mengikuti warna induknya (hitam),
 * nama memakai nameClassName (biru). Tanpa animasi kalau OS memakai "reduce motion".
 */
export default function GlitchName({
  variants,
  hold = 2800,
  nameClassName = '',
}: {
  variants: NameVariant[]
  hold?: number
  nameClassName?: string
}) {
  const [greeting, setGreeting] = useState(variants[0]?.greeting ?? '')
  const [text, setText] = useState(variants[0]?.text ?? '')
  const [fx, setFx] = useState(0) // kekuatan glitch (px); 0 = mati
  const shown = useRef({ greeting: variants[0]?.greeting ?? '', text: variants[0]?.text ?? '' })
  const key = variants.map((v) => v.greeting + v.text).join('|')

  useEffect(() => {
    const first = variants[0]
    shown.current = { greeting: first?.greeting ?? '', text: first?.text ?? '' }
    setGreeting(shown.current.greeting)
    setText(shown.current.text)
    setFx(0)
    if (variants.length < 2) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let alive = true
    let raf = 0
    let timer = 0
    let idx = 0

    const scrambleTo = (to: NameVariant) => {
      const fromG = Array.from(shown.current.greeting)
      const toG = Array.from(to.greeting) // per karakter Unicode, bukan per byte
      const fromT = Array.from(shown.current.text)
      const toT = Array.from(to.text)
      const poolG = [...fromG, ...toG, ...NOISE]
      const poolT = [...fromT, ...toT, ...NOISE]
      const start = performance.now()
      let last = 0

      const tick = (now: number) => {
        if (!alive) return
        const p = Math.min(1, (now - start) / SCRAMBLE_MS)
        if (p >= 1) {
          shown.current = { greeting: to.greeting, text: to.text }
          setGreeting(to.greeting)
          setText(to.text)
          setFx(0)
          timer = window.setTimeout(next, hold)
          return
        }
        if (now - last >= FRAME_MS) {
          last = now
          setGreeting(scrambled(fromG, toG, p, poolG))
          setText(scrambled(fromT, toT, p, poolT))
          setFx((Math.random() - 0.5) * 9)
        }
        raf = requestAnimationFrame(tick)
      }
      raf = requestAnimationFrame(tick)
    }

    const next = () => {
      idx = (idx + 1) % variants.length
      scrambleTo(variants[idx])
    }

    timer = window.setTimeout(next, hold)
    return () => {
      alive = false
      cancelAnimationFrame(raf)
      clearTimeout(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, hold])

  const glitch = fx
    ? {
        textShadow: `${fx}px 0 rgba(244,63,94,0.75), ${-fx}px 0 rgba(6,182,212,0.75)`,
        transform: `translateX(${fx * 0.4}px)`,
      }
    : undefined

  return (
    <>
      <span className="sr-only">
        {variants[0]?.greeting} {variants[0]?.text}
      </span>
      <span aria-hidden className="block min-h-[1.1em] break-words" style={glitch}>
        {greeting}
      </span>
      <span aria-hidden className={`block min-h-[1.1em] break-words ${nameClassName}`} style={glitch}>
        {text}
      </span>
    </>
  )
}
