import JourneyMap, { type Stop } from '@/components/JourneyMap'
import { readSlots } from './slots'
import type { LayoutProps } from './types'

/**
 * Animated "journey map" (see components/JourneyMap.tsx). This wrapper stays a server component on purpose:
 * `detailHref` is a function, and functions cannot be passed from a server component to a client one.
 * So the links are resolved here and only plain data goes to the map.
 */
export default function Journey({ items, fields, detailHref }: LayoutProps) {
  const stops: Stop[] = items.map((item) => ({ ...readSlots(item, fields), detail: detailHref(item) }))
  return <JourneyMap stops={stops} />
}
