import { ImageResponse } from 'next/og'
import { getProfile } from '@/lib/profile'

export const alt = 'Portfolio'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

// Same palette as app/pop.css (warm paper + navy ink)
const INK = '#0f1b33'
const MUTED = '#5b667a'
const PAPER = '#f6f4ee'
const ACCENT = '#1f3fa0'
const HIGHLIGHT = '#f6c650'

export default async function OpengraphImage() {
  const site = await getProfile()

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          width: '100%',
          height: '100%',
          padding: '72px',
          backgroundColor: PAPER,
          backgroundImage: 'radial-gradient(rgba(15,27,51,0.12) 2px, transparent 2px)',
          backgroundSize: '40px 40px',
          color: INK,
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            fontSize: '28px',
            color: MUTED,
            letterSpacing: '4px',
            textTransform: 'uppercase',
          }}
        >
          <div
            style={{
              display: 'flex',
              width: '18px',
              height: '18px',
              borderRadius: '9px',
              backgroundColor: HIGHLIGHT,
            }}
          />
          <span style={{ display: 'flex' }}>{site.role}</span>
        </div>

        {/* Main content */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', fontSize: '40px', color: MUTED, marginBottom: '12px' }}>
            Hello, I&apos;m
          </div>
          <div
            style={{
              display: 'flex',
              fontSize: '112px',
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: '-3px',
              color: INK,
            }}
          >
            {site.name}
          </div>
          <div style={{ display: 'flex', width: '160px', height: '10px', marginTop: '20px', backgroundColor: HIGHLIGHT }} />
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '30px',
            color: MUTED,
          }}
        >
          <div style={{ display: 'flex' }}>{site.affiliation}</div>
          <div style={{ display: 'flex', color: ACCENT, fontWeight: 700 }}>{site.name.split(' ')[0]}_</div>
        </div>
      </div>
    ),
    {
      width: size.width,
      height: size.height,
    },
  )
}
