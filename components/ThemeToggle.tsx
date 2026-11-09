'use client'

import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'

type Theme = 'light' | 'dark'

/** Reads the theme set by the inline script in app/layout.tsx. */
export function currentTheme(): Theme {
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'
}

export function applyTheme(t: Theme) {
  document.documentElement.dataset.theme = t
  try {
    localStorage.setItem('theme', t)
  } catch {
    /* private mode: the choice just isn't remembered */
  }
}

export function toggleTheme() {
  applyTheme(currentTheme() === 'dark' ? 'light' : 'dark')
  window.dispatchEvent(new Event('themechange'))
}

/** Round button that switches between light and dark. */
export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme | null>(null) // unknown until mounted: avoids a hydration mismatch
  useEffect(() => {
    const sync = () => setTheme(currentTheme())
    sync()
    window.addEventListener('themechange', sync)
    return () => window.removeEventListener('themechange', sync)
  }, [])
  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
      className="pop-btn pop-btn-ghost !p-2"
    >
      {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  )
}
