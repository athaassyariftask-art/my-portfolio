import { Fraunces } from 'next/font/google'

// Serif display face for headings only (body text keeps the site font).
// To change it: pick another font from next/font/google and edit it here; the .pop-display class follows.
export const display = Fraunces({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  variable: '--font-display',
  display: 'swap',
})
