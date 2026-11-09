// Card colors (kept in step with the site theme in app/pop.css: navy ink, white, soft tints, indigo accent)
const LIGHT = {
  ink: '#101010', // text printed on the card
  frame: '#101010', // ink
  frameHover: '#2b2b2b',
  paper: '#ffffff', // card body
  band: '#e0e5fb', // top band: soft blue
  bandSoft: '#d8f6e2', // role label: soft mint
  dot: '#4f68d8', // small dots on the band: accent
  strap: '#8cf5b0', // strap: soft neon green
  metal: '#6b6b6b',
  slot: '#0a0a0a',
  photoBg: '#e8edf8',
  photoText: '#2a3550',
  subtle: '#5b667a',
  line: '#bfbbae',
}

// Dark page: the black holder would vanish into the background, so it turns a soft light grey and the metal brightens.
const DARK: typeof LIGHT = { ...LIGHT, frame: '#c9c9d4', frameHover: '#dcdce6', slot: '#7b7b88', metal: '#b8b8c4' }

/** The colours in use. Mutated by setLanyardTheme(), which InteractiveLanyard calls before it (re)builds the scene. */
export const COLOR = { ...LIGHT }
export function setLanyardTheme(theme: 'light' | 'dark') {
  Object.assign(COLOR, theme === 'dark' ? DARK : LIGHT)
}
