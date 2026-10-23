'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'

export type NameVariant = { greeting: string; text: string }

/**
 * Greeting + name that gently cycle through languages/scripts: the old pair fades up and blurs out
 * while the new pair fades in from below. Both pairs share one grid cell, so the page never jumps.
 * With a single variant nothing animates. No cycling when the OS asks for "reduce motion".
 */
export default function RotatingName({
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
  const [index, setIndex] = useState(0)
  const reduce = useReducedMotion()
  const count = variants.length

  useEffect(() => {
    if (count < 2 || reduce) return
    const timer = window.setInterval(() => setIndex((i) => (i + 1) % count), hold)
    return () => window.clearInterval(timer)
  }, [count, hold, reduce])

  // The list can shrink (e.g. after an edit in Admin), so never index past the end
  const current = variants[index % Math.max(count, 1)] ?? { greeting: '', text: '' }

  return (
    <>
      <span className="sr-only">
        {variants[0]?.greeting} {variants[0]?.text}
      </span>
      <span aria-hidden className="grid">
        <AnimatePresence initial={false}>
          <motion.span
            key={index % Math.max(count, 1)}
            className="block break-words"
            style={{ gridArea: '1 / 1' }}
            initial={{ opacity: 0, y: 16, filter: 'blur(6px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -16, filter: 'blur(6px)' }}
            transition={{ duration: reduce ? 0 : 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className={`block min-h-[1.1em] ${greetingClassName}`}>{current.greeting}</span>
            <span className="block min-h-[1.1em]">
              <span className={nameClassName}>{current.text}</span>
            </span>
          </motion.span>
        </AnimatePresence>
      </span>
    </>
  )
}
