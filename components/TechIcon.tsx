'use client'

import { useState } from 'react'
import { techIcon } from '@/lib/tech'

/**
 * Small technology logo. Renders nothing when the name has no known logo or the image fails to load
 * (offline, blocked CDN), so a chip around it still looks fine with just the text.
 */
export default function TechIcon({ name, size = 16, className = '' }: { name: string; size?: number; className?: string }) {
  const src = techIcon(name)
  const [failed, setFailed] = useState(false)
  if (!src || failed) return null
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      aria-hidden
      width={size}
      height={size}
      loading="lazy"
      onError={() => setFailed(true)}
      className={`shrink-0 ${className}`}
      style={{ width: size, height: size }}
    />
  )
}
