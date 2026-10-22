import { Text } from '@react-three/drei'
import { lanyard } from '@/lanyard.config'
import { COLOR } from './theme'
import { Plate } from './shapes'
import { fit, useImage } from './useImage'

type Props = {
  src?: string
  w: number
  h: number
  /** Dipakai untuk charm di tali (bingkai putih lebih tipis). */
  slim?: boolean
  /** Bingkai putih ala stiker di belakang gambar. false = gambar PNG transparan tampil apa adanya. */
  border?: boolean
}

/**
 * Satu "wadah" gambar: stiker / charm / logo. Ada gambar -> tampil dengan tepi putih ala stiker.
 * Belum ada gambar -> kotak abu-abu bertanda "+" (hanya saat dev), atau tidak tampil sama sekali.
 */
export default function Sticker({ src, w, h, slim, border = true }: Props) {
  const img = useImage(src)
  const pad = slim ? 0.04 : 0.06

  if (src && img) {
    const [iw, ih] = fit(img.aspect, w, h)
    return (
      <group>
        {border && <Plate w={iw + pad * 2} h={ih + pad * 2} r={0.1} color="#ffffff" basic position={[0, 0, 0]} />}
        <Plate w={iw} h={ih} r={0.06} map={img.tex} basic position={[0, 0, 0.004]} />
      </group>
    )
  }
  if (src || !lanyard.showPlaceholders) return null // gambar belum selesai dimuat / production

  return (
    <group>
      <Plate w={w} h={h} r={0.1} color={COLOR.line} opacity={0.55} basic />
      <Text position={[0, 0, 0.01]} fontSize={Math.min(w, h) * 0.5} color={COLOR.subtle} anchorX="center" anchorY="middle" font={lanyard.font}>
        +
      </Text>
    </group>
  )
}
