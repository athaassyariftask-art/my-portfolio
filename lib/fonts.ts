import { Plus_Jakarta_Sans } from 'next/font/google'

// Soft, friendly sans for headings only (body text keeps the site font).
// To change it: pick another font from next/font/google and edit it here; the .pop-display class follows.
export const display = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-display',
  display: 'swap',
})
