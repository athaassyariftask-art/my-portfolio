// Sanitizer rules for the small bit of raw HTML the block editor's formatting toolbar can produce
// (underline, highlight — see MARKS in lib/blocks.ts). Markdown itself (bold, italic,
// links, images, …) needs no raw HTML and is unaffected by this; this schema only widens what react-markdown
// allows through on top of that, from nothing to exactly: <u>, <mark>.
// Nothing else (no style attribute, no span) gets through, so nothing here can carry CSS/JS injection. Used by rehype-raw + rehype-sanitize in components/Markdown.tsx and components/Blocks.tsx.
import { defaultSchema } from 'rehype-sanitize'

export const markdownSchema = {
  ...defaultSchema,
  tagNames: [...(defaultSchema.tagNames ?? []), 'u', 'mark'],
}
