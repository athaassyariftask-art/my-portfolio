import { useMemo } from 'react'
import { Text } from '@react-three/drei'
import { lanyard } from '@/lanyard.config'
import { COLOR } from './theme'
import { Plate } from './shapes'
import Pop from './Pop'
import Sticker from './Sticker'
import { useImage } from './useImage'

export type BadgeInfo = {
  name: string
  role: string
  affiliation: string
  /** URL foto (mis. "/photo.jpg" dari folder public). Kosong / gagal dimuat -> pakai inisial. */
  photo?: string
}

// Koordinat lokal kartu: 3.6 lebar x 2.6 tinggi, titik tengah (0, 0), depan = +z.
const PHOTO = { x: -0.97, y: -0.28, w: 1.15, h: 1.45 }

/** Barcode kecil yang pola batangnya selalu sama untuk nama yang sama. */
function Barcode({ seed, x, y, width, height }: { seed: string; x: number; y: number; width: number; height: number }) {
  const bars = useMemo(() => {
    let h = 2166136261
    for (const ch of seed) h = Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0
    const out: { x: number; w: number }[] = []
    let cx = 0
    while (cx < width) {
      h = (Math.imul(h, 1664525) + 1013904223) >>> 0
      const w = 0.018 + ((h >>> 8) % 3) * 0.014
      if (cx + w > width) break
      out.push({ x: cx, w })
      cx += w + 0.016 + ((h >>> 12) % 2) * 0.014
    }
    return out
  }, [seed, width])

  return (
    <group position={[x, y, 0.072]}>
      {bars.map((b, i) => (
        <mesh key={i} position={[b.x + b.w / 2, 0, 0]}>
          <planeGeometry args={[b.w, height]} />
          <meshBasicMaterial color={COLOR.frame} toneMapped={false} />
        </mesh>
      ))}
    </group>
  )
}

export default function CardFace({ badge, hovered }: { badge: BadgeInfo; hovered: boolean }) {
  const photo = useImage(badge.photo, PHOTO.w / PHOTO.h)
  const font = lanyard.font

  const initials = badge.name
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  // Lebar "pill" role mengikuti panjang teks (perkiraan kasar, maks selebar kolom teks)
  const pillW = Math.min(1.55, badge.role.length * 0.07 + 0.28)

  return (
    <>
      {/* Holder: bodi bersudut membulat + tab atas dengan slot */}
      <Plate w={3.6} h={2.6} r={0.34} depth={0.06} color={hovered ? COLOR.frameHover : COLOR.frame} roughness={0.5} />
      <Plate w={1.3} h={0.3} r={0.14} depth={0.06} color={hovered ? COLOR.frameHover : COLOR.frame} roughness={0.5} position={[0, 1.31, 0]} />
      <Plate w={0.62} h={0.09} r={0.045} color={COLOR.slot} position={[0, 1.31, 0.052]} />

      {/* Jendela kertas */}
      <Plate w={3.2} h={2.08} r={0.2} color={COLOR.paper} roughness={0.9} position={[0, -0.13, 0.054]} />

      {/* Pita biru: titik hijau + label di kiri, slot logo di kanan */}
      <Plate w={3.04} h={0.34} r={0.14} color={COLOR.band} roughness={0.7} position={[0, 0.74, 0.058]} />
      <Plate w={0.1} h={0.1} r={0.05} color={COLOR.dot} basic position={[-1.36, 0.74, 0.064]} />
      <Text position={[-1.24, 0.74, 0.064]} fontSize={0.1} letterSpacing={0.14} color={COLOR.frame} anchorX="left" anchorY="middle" font={font}>
        {lanyard.label}
      </Text>
      <group position={[1.3, 0.74, 0.066]}>
        <Sticker src={lanyard.logo} w={0.26} h={0.26} slim border={false} />
      </group>

      {/* Foto: bingkai putih, lalu foto (atau inisial kalau belum ada foto) */}
      <Plate w={PHOTO.w + 0.09} h={PHOTO.h + 0.09} r={0.17} color="#ffffff" position={[PHOTO.x, PHOTO.y, 0.064]} />
      <Plate
        w={PHOTO.w}
        h={PHOTO.h}
        r={0.13}
        basic
        color={photo ? '#ffffff' : COLOR.photoBg}
        map={photo?.tex ?? null}
        position={[PHOTO.x, PHOTO.y, 0.068]}
      />
      {!photo && (
        <Text position={[PHOTO.x, PHOTO.y, 0.078]} fontSize={0.5} color={COLOR.photoText} anchorX="center" anchorY="middle" font={font}>
          {initials}
        </Text>
      )}

      {/* Identitas */}
      <Text position={[-0.2, 0.34, 0.07]} fontSize={0.20} lineHeight={1.05} color={COLOR.frame} anchorX="left" anchorY="middle" maxWidth={1.55} font={font}>
        {badge.name}
      </Text>
      <Text position={[-0.2, 0.13, 0.07]} fontSize={0.12} lineHeight={1.05} color={COLOR.frame} anchorX="left" anchorY="middle" maxWidth={1.55} font='/fonts/Poppins-Regular.ttf'>
        {'November 21st, 2005'}
      </Text>
      <Plate w={pillW} h={0.2} r={0.1} color={COLOR.bandSoft} basic position={[-0.2 + pillW / 2, -0.1, 0.07]} />
      <Text position={[-0.1, -0.1, 0.078]} fontSize={0.1} letterSpacing={0.04} color={COLOR.frame} anchorX="left" anchorY="middle" maxWidth={pillW - 0.18} font={font}>
        {badge.role}
      </Text>

      {/* Garis putus-putus */}
      {Array.from({ length: 7 }, (_, i) => (
        <mesh key={i} position={[-0.17 + i * 0.22, -0.36, 0.07]}>
          <planeGeometry args={[0.13, 0.025]} />
          <meshBasicMaterial color={COLOR.line} toneMapped={false} />
        </mesh>
      ))}
      <Text position={[-0.2, -0.5, 0.07]} fontSize={0.085} letterSpacing={0.1} color={COLOR.subtle} anchorX="left" anchorY="top" maxWidth={1.5} font={font}>
        {badge.affiliation.toUpperCase()}
      </Text>

      <Barcode seed={badge.name} x={-0.2} y={-0.97} width={1.4} height={0.2} />

      {/* Stiker (atur di lanyard.config.ts) */}
      {lanyard.stickers.map((s) => (
        <group key={s.id} position={[s.x, s.y, 0.09]} rotation={[0, 0, s.rot]}>
          <Pop note={(s as { note?: string }).note} h={s.h} tipBelow={s.y > 0.5}>
            <Sticker src={s.src} w={s.w} h={s.h} border={s.border} />
          </Pop>
        </group>
      ))}

      {/* Besi klip + cincin */}
      <mesh position={[0, 1.4, 0.05]}>
        <torusGeometry args={[0.15, 0.035, 12, 32]} />
        <meshStandardMaterial color={COLOR.metal} metalness={0.85} roughness={0.3} />
      </mesh>
    </>
  )
}
