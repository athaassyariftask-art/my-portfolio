// Technology name -> logo. Logos come from the public "devicon" set on jsDelivr (loaded by the visitor's
// browser, nothing to install). A name that isn't listed simply renders without a logo.

const CDN = 'https://cdn.jsdelivr.net/gh/devicons/devicon@v2.16.0/icons'

// [lookup key, devicon folder, file variant]. Keys are lower-case with spaces/dots/dashes removed.
const ICONS: [string[], string, string][] = [
  [['python'], 'python', 'original'],
  [['django'], 'django', 'plain'],
  [['flutter'], 'flutter', 'original'],
  [['dart'], 'dart', 'original'],
  [['figma'], 'figma', 'original'],
  [['postgresql', 'postgres'], 'postgresql', 'original'],
  [['mysql'], 'mysql', 'original'],
  [['sqlite'], 'sqlite', 'original'],
  [['git'], 'git', 'original'],
  [['github'], 'github', 'original'],
  [['javascript', 'js'], 'javascript', 'original'],
  [['typescript', 'ts'], 'typescript', 'original'],
  [['react', 'reactjs'], 'react', 'original'],
  [['nextjs', 'next'], 'nextjs', 'original'],
  [['nodejs', 'node'], 'nodejs', 'original'],
  [['tailwind', 'tailwindcss'], 'tailwindcss', 'original'],
  [['html', 'html5'], 'html5', 'original'],
  [['css', 'css3'], 'css3', 'original'],
  [['php'], 'php', 'original'],
  [['laravel'], 'laravel', 'original'],
  [['firebase'], 'firebase', 'plain'],
  [['docker'], 'docker', 'original'],
  [['linux'], 'linux', 'original'],
  [['vscode', 'visualstudiocode'], 'vscode', 'original'],
  [['java'], 'java', 'original'],
  [['cpp', 'c++'], 'cplusplus', 'original'],
  [['pandas'], 'pandas', 'original'],
  [['numpy'], 'numpy', 'original'],
  [['jupyter'], 'jupyter', 'original'],
  [['pygame'], 'python', 'original'],
  [['canva'], 'canva', 'original'],
  [['photoshop', 'adobephotoshop'], 'photoshop', 'plain'],
  [['illustrator', 'adobeillustrator'], 'illustrator', 'plain'],
  [['bootstrap'], 'bootstrap', 'original'],
  [['vercel'], 'vercel', 'original'],
  [['notion'], 'notion', 'original'],
]

const key = (s: string) => s.toLowerCase().replace(/[\s.\-_]/g, '')
const BY_KEY = new Map<string, string>()
for (const [names, dir, variant] of ICONS) for (const n of names) BY_KEY.set(key(n), `${CDN}/${dir}/${dir}-${variant}.svg`)

/** Logo URL for a technology name ("Django", "Next.js", "PostgreSQL"...), or null when it isn't known. */
export function techIcon(name: string): string | null {
  return BY_KEY.get(key(name)) ?? null
}
