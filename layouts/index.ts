import Cards from './cards'
import Chips from './chips'
import Journey from './journey'
import List from './list'
import Text from './text'
import Timeline from './timeline'
import type { FieldType, Layout, LayoutKey, Slot } from './types'

/**
 * Layout registry. To add a layout: create layouts/<name>.tsx (copy a similar one),
 * add one entry below, and one key in LAYOUTS (lib/server/presets.ts).
 */
export const layouts: Record<LayoutKey, Layout> = {
  cards: {
    key: 'cards',
    label: 'Cards',
    description: 'Grid of cards. Can include an image.',
    uses: ['image', 'meta', 'title', 'subtitle', 'body', 'list', 'tags', 'link'],
    columns: true,
    View: Cards,
  },
  timeline: {
    key: 'timeline',
    label: 'Timeline',
    description: 'Vertical timeline. Good for experience.',
    uses: ['meta', 'title', 'subtitle', 'body', 'list', 'tags', 'link'],
    View: Timeline,
  },
  list: {
    key: 'list',
    label: 'List',
    description: 'Compact rows, one per item. Good for achievements.',
    uses: ['meta', 'title', 'subtitle', 'body', 'tags', 'link'],
    View: List,
  },
  chips: {
    key: 'chips',
    label: 'Chips / tags',
    description: 'Titled groups of chips. Good for a toolbox.',
    uses: ['title', 'body', 'tags'],
    columns: true,
    View: Chips,
  },
  journey: {
    key: 'journey',
    label: 'Journey map',
    description: 'Animated map with a pin per item and next / previous buttons. Good for education.',
    uses: ['image', 'meta', 'title', 'subtitle', 'body', 'list', 'tags', 'link'],
    View: Journey,
  },
  text: {
    key: 'text',
    label: 'Long text',
    description: 'Heading + paragraphs (Markdown). Good for a story.',
    uses: ['title', 'subtitle', 'body'],
    View: Text,
  },
}

export const layoutList = Object.values(layouts)
export const getLayout = (key: string): Layout => layouts[key as LayoutKey] ?? layouts.cards

export const FIELD_TYPES: { key: FieldType; label: string }[] = [
  { key: 'text', label: 'Short text' },
  { key: 'textarea', label: 'Long text' },
  { key: 'url', label: 'Link' },
  { key: 'tags', label: 'Tags (comma-separated)' },
  { key: 'lines', label: 'Points (one per line)' },
  { key: 'image', label: 'Image' },
]

export const SLOTS: { key: Slot; label: string }[] = [
  { key: 'title', label: 'Title' },
  { key: 'meta', label: 'Small label (period, year)' },
  { key: 'subtitle', label: 'Subtitle (organization, issuer)' },
  { key: 'body', label: 'Description' },
  { key: 'list', label: 'Bullet list' },
  { key: 'tags', label: 'Tags' },
  { key: 'link', label: 'Link button' },
  { key: 'image', label: 'Image' },
]
