'use client'

import { useEffect, useRef, useState } from 'react'

export type NameVariant = { greeting: string; text: string }

const NOISE = '▓▒░█<>/\\|{}[]=+*#%&@$?!'
const SCRAMBLE_MS = 750 // length of the scramble -> new text transition
const FRAME_MS = 50 // how often the scrambled letters change (larger = choppier)

/** One scramble step: letters on the left lock first as p (0..1) rises. */
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
 * Greeting + name that can cycle through languages/scripts with a scramble effect: letters are shuffled
 * and then "lock in" from left to right, with a brief, subtle color split. The greeting uses greetingClassName,
 * the name uses nameClassName. With a single variant nothing animates. No animation when the OS asks for
 * "reduce motion".
 */
export default function GlitchName({
  variants,
  hold = 2800,
  nameClassName = '',
  greetingClassName = '',
}: {
  variants: NameVariant[]
  hold?: number
  nameClassName?: string
  greetingClassName?: string
}) {
  const [greeting, setGreeting] = useState(variants[0]?.greeting ?? '')
  const [text, setText] = useState(variants[0]?.text ?? '')
  const [fx, setFx] = useState(0) // glitch strength (px); 0 = off
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
      const toG = Array.from(to.greeting) // per Unicode character, not per byte
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
        textShadow: `${fx}px 0 rgba(31,63,160,0.35), ${-fx}px 0 rgba(246,198,80,0.7)`,
        transform: `translateX(${fx * 0.4}px)`,
      }
    : undefined

  return (
    <>
      <span className="sr-only">
        {variants[0]?.greeting} {variants[0]?.text}
      </span>
      <span aria-hidden className={`block min-h-[1.1em] break-words ${greetingClassName}`} style={glitch}>
        {greeting}
      </span>
      <span aria-hidden className="block min-h-[1.1em] break-words" style={glitch}>
        <span className={nameClassName}>{text}</span>
      </span>
    </>
  )
}
