import * as THREE from 'three'
import { useEffect, useState } from 'react'

export type LoadedImage = { tex: THREE.Texture; aspect: number }

/**
 * Muat gambar (opsional). Kosong / gagal dimuat -> null, jadi kartu tetap tampil.
 * coverAspect: kalau diisi, gambar dipotong ala "object-fit: cover" ke bingkai beraspek itu.
 */
export function useImage(url?: string, coverAspect?: number): LoadedImage | null {
  const [img, setImg] = useState<LoadedImage | null>(null)

  useEffect(() => {
    setImg(null)
    if (!url) return
    let alive = true
    let loaded: THREE.Texture | null = null
    new THREE.TextureLoader().load(
      url,
      (t) => {
        if (!alive) {
          t.dispose()
          return
        }
        t.colorSpace = THREE.SRGBColorSpace
        t.anisotropy = 8
        const im = t.image as { width: number; height: number }
        const aspect = im.width / im.height
        if (coverAspect) {
          if (aspect > coverAspect) {
            t.repeat.set(coverAspect / aspect, 1)
            t.offset.set((1 - coverAspect / aspect) / 2, 0)
          } else {
            t.repeat.set(1, aspect / coverAspect)
            t.offset.set(0, (1 - aspect / coverAspect) / 2)
          }
        }
        loaded = t
        setImg({ tex: t, aspect })
      },
      undefined,
      () => console.warn(`[lanyard] failed to load image: ${url} (check the path and the file in public/)`)
    )
    return () => {
      alive = false
      loaded?.dispose()
    }
  }, [url, coverAspect])

  return img
}

/** Muat gambar utuh ke dalam kotak w x h (tanpa terpotong). */
export function fit(aspect: number, w: number, h: number): [number, number] {
  return aspect > w / h ? [w, w / aspect] : [h * aspect, h]
}
