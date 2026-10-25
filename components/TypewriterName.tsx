'use client'

import { useEffect, useState } from 'react'
import { useReducedMotion } from 'framer-motion'

export type NameVariant = { greeting: string; text: string }

const TYPE_MS = 85 // delay between typed letters
const DELETE_MS = 42 // delay between deleted letters (backspace is quicker than typing)
const PAUSE_MS = 380 // empty pause before the next name starts typing

// Split into what a reader sees as one character (so scripts like Javanese never show half a letter)
const segmenter =
  typeof Intl !== 'undefined' && 'Segmenter' in Intl ? new Intl.Segmenter(undefined, { granularity: 'grapheme' }) : null
const chars = (s: string): string[] => (segmenter ? Array.from(segmenter.segment(s), (x) => x.segment) : Array.from(s))

/** The first `n` characters of "greeting + name", split back into the two lines. */
export function typedParts(v: NameVariant, n: number) {
  const g = chars(v.greeting)
  const t = chars(v.text)
  return {
    greeting: g.slice(0, Math.min(n, g.length)).join(''),
    name: t.slice(0, Math.max(0, n - g.length)).join(''),
    onName: n > g.length,
    total: g.length + t.length,
  }
}

/**
 * Greeting + name that is typed out letter by letter, held for a moment, then erased with a backspace effect
 * before the next language/script is typed. The caret blinks while the text rests. Invisible copies of every
 * variant reserve the space, so the page never jumps. With a single variant, or when the OS asks for
 * "reduce motion", the first name is simply shown.
 */
export default function TypewriterName({
  variants,
  hold = 3200,
  nameClassName = '',
  greetingClassName = '',
}: {
  variants: NameVariant[]
  hold?: number
  nameClassName?: string
  greetingClassName?: string
}) {
  const reduce = useReducedMotion()
  const count = variants.length
  const first: NameVariant = variants[0] ?? { greeting: '', text: '' }
  // Starts fully typed, so the server-rendered page already contains the complete name
  const [vi, setVi] = useState(0)
  const [n, setN] = useState(() => typedParts(first, Infinity).total)
  const [busy, setBusy] = useState(false) // true while letters are being typed or erased (caret stays solid)
  const key = variants.map((v) => v.greeting + '\u0000' + v.text).join('|')

  useEffect(() => {
    setVi(0)
    setN(typedParts(first, Infinity).total)
    setBusy(false)
    if (count < 2 || reduce) return

    let alive = true
    let timer = 0
    let idx = 0
    let len = typedParts(variants[0], Infinity).total

    const step = (phase: 'hold' | 'delete' | 'type') => {
      if (!alive) return
      if (phase === 'hold') {
        setBusy(false)
        timer = window.setTimeout(() => step('delete'), hold)
      } else if (phase === 'delete') {
        setBusy(true)
        if (len > 0) {
          len--
          setN(len)
          timer = window.setTimeout(() => step('delete'), DELETE_MS)
        } else {
          idx = (idx + 1) % count
          setVi(idx)
          timer = window.setTimeout(() => step('type'), PAUSE_MS)
        }
      } else {
        const total = typedParts(variants[idx], Infinity).total
        if (len < total) {
          len++
          setN(len)
          timer = window.setTimeout(() => step('type'), TYPE_MS)
        } else {
          step('hold')
        }
      }
    }

    step('hold')
    return () => {
      alive = false
      window.clearTimeout(timer)
    }
    // `variants` is covered by `key`; re-running on every new array identity would restart the animation
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, hold, reduce])

  const cur = variants[vi % Math.max(count, 1)] ?? first
  const shown = typedParts(cur, n)
  const caret = <span aria-hidden className={`pop-caret ${busy ? 'pop-caret-solid' : ''}`} />

  return (
    <>
      <span className="sr-only">
        {first.greeting} {first.text}
      </span>
      <span aria-hidden className="grid">
        {/* Invisible copies reserve the space of the longest variant */}
        {variants.map((v, i) => (
          <span key={i} className="invisible block break-words" style={{ gridArea: '1 / 1' }}>
            <span className={`block min-h-[1.1em] ${greetingClassName}`}>{v.greeting}</span>
            <span className="block min-h-[1.1em]">
              <span className={nameClassName}>{v.text}</span>
            </span>
          </span>
        ))}

        <span className="block break-words" style={{ gridArea: '1 / 1' }}>
          <span className={`block min-h-[1.1em] ${greetingClassName}`}>
            {shown.greeting}
            {!shown.onName && caret}
          </span>
          <span className="block min-h-[1.1em]">
            {shown.name && <span className={nameClassName}>{shown.name}</span>}
            {shown.onName && caret}
          </span>
        </span>
      </span>
    </>
  )
}
