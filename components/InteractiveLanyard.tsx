'use client'

import * as THREE from 'three'
import { useRef, useState, useEffect, useMemo, RefObject } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Environment, Lightformer, RoundedBox, useCursor } from '@react-three/drei'
import {
  Physics,
  RigidBody,
  BallCollider,
  CuboidCollider,
  interactionGroups,
  useRopeJoint,
  useSphericalJoint,
  RapierRigidBody,
} from '@react-three/rapier'
import { lanyard } from '@/lanyard.config'
import CardFace, { type BadgeInfo } from './lanyard/CardFace'
import Charms from './lanyard/Charm'
import { COLOR } from './lanyard/theme'

export type { BadgeInfo }

const SEGMENT = 1.4 // length of each strap segment (one strap = 3 x SEGMENT)
const SPREAD = 1.3 // distance of each hanging point from the centre (left & right)
const CLIP_Y = 1.4 // position of the clip on top of the card (card-local coordinates)
const CLIP_SPREAD = 0.12 // left/right distance of where the straps meet the clip
const ANCHOR_Y = 5.4 // hanging points: a little above the top of the screen, so the straps always come out of the navbar

// The straps are fixed to the top and cannot stretch. While the card is dragged, the clip is kept within
// this distance of both hanging points (each strap is 3 x SEGMENT = 4.2 long, so this leaves a little slack).
const PULL_LIMIT = 3.95

// Flat strap ("webbing") look
const STRAP_W = 0.2 // width of the strap in world units
const STRAP_SEGS = 48 // how finely the ribbon follows the curve
const WEAVE_TILE = 0.7 // length (world units) of one repeat of the weave texture

// Adjuster (the small slider that holds the two straps together)
const ADJUSTER_T = 0.87 // where it sits along the strap (0 = hanging point, 1 = clip)
const ADJ_W = 0.86
const ADJ_H = 0.34

// ANTI-JITTER
const SEGMENT_MASS = 0.2
const ROPE_DAMPING = 2
const TIME_STEP = 1 / 120
const NO_COLLISION = interactionGroups(1, [])

// WIND: a gentle sway while the card is not touched, so it does not hang stiff.
// Lower WIND_FORCE if it sways too much, raise it if you barely notice it.
const WIND_FORCE = 0.8 // sideways push
const WIND_TWIST = 0.2 // slight card rotation (Y axis)

type Body = RefObject<RapierRigidBody>
type Curve = RefObject<THREE.CatmullRomCurve3>

const makeCurve = () =>
  new THREE.CatmullRomCurve3(
    Array.from({ length: 5 }, () => new THREE.Vector3()), // hanging point + 3 segments + clip
    false,
    'catmullrom',
    0.5
  )

/** Weave texture for the strap: lengthwise threads, fine cross threads and stitched edges. */
let webbingTexture: THREE.CanvasTexture | null = null
function getWebbing() {
  if (webbingTexture) return webbingTexture
  const c = document.createElement('canvas')
  c.width = 64
  c.height = 64
  const g = c.getContext('2d')!
  g.fillStyle = '#ffffff'
  g.fillRect(0, 0, 64, 64)
  g.fillStyle = 'rgba(0,0,0,0.07)'
  for (let x = 7; x < 57; x += 4) g.fillRect(x, 0, 2, 64) // threads along the strap
  g.fillStyle = 'rgba(0,0,0,0.06)'
  for (let y = 0; y < 64; y += 8) g.fillRect(0, y, 64, 1) // cross threads
  g.fillStyle = 'rgba(0,0,0,0.17)'
  g.fillRect(0, 0, 4, 64)
  g.fillRect(60, 0, 4, 64) // darker, stitched edges
  g.fillStyle = 'rgba(255,255,255,0.4)'
  g.fillRect(4, 0, 1, 64)
  g.fillRect(59, 0, 1, 64)
  const t = new THREE.CanvasTexture(c)
  t.wrapS = THREE.ClampToEdgeWrapping
  t.wrapT = THREE.RepeatWrapping
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 4
  webbingTexture = t
  return t
}

/** A flat band with two vertices per step; the positions are rewritten every frame. */
function makeStrapGeometry() {
  const g = new THREE.BufferGeometry()
  const n = STRAP_SEGS + 1
  const normals = new Float32Array(n * 2 * 3)
  for (let i = 0; i < n * 2; i++) normals[i * 3 + 2] = 1 // faces the camera
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 2 * 3), 3))
  g.setAttribute('normal', new THREE.BufferAttribute(normals, 3))
  g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(n * 2 * 2), 2))
  const idx: number[] = []
  for (let i = 0; i < STRAP_SEGS; i++) {
    const a = i * 2
    idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2)
  }
  g.setIndex(idx)
  return g
}

/** One side of the strap: a flat ribbon that follows the physics segments */
function Strap({
  anchorBody,
  joints,
  card,
  clipX,
  side,
  curve,
}: {
  anchorBody: Body
  joints: Body[]
  card: Body
  clipX: number
  side: 'left' | 'right'
  curve: Curve
}) {
  const geometry = useMemo(makeStrapGeometry, [])
  const weave = useMemo(getWebbing, [])
  useEffect(() => () => geometry.dispose(), [geometry])

  const tmp = useRef({
    q: new THREE.Quaternion(),
    clip: new THREE.Vector3(),
    pos: new THREE.Vector3(),
    p: new THREE.Vector3(),
    tg: new THREE.Vector3(),
    prev: new THREE.Vector3(),
  })

  useFrame(() => {
    if (!card.current || !anchorBody.current || joints.some((j) => !j.current)) return
    const pts = curve.current.points
    const { q, clip, pos, p, tg, prev } = tmp.current

    const a = anchorBody.current.translation()
    pts[0].set(a.x, a.y, a.z)
    joints.forEach((j, i) => {
      const t = j.current!.translation()
      pts[i + 1].set(t.x, t.y, t.z)
    })

    const r = card.current.rotation()
    const c = card.current.translation()
    q.set(r.x, r.y, r.z, r.w)
    clip.set(clipX, CLIP_Y, 0).applyQuaternion(q).add(pos.set(c.x, c.y, c.z))
    pts[pts.length - 1].copy(clip)

    // Lay the ribbon along the curve; its width runs sideways to the strap, in the plane of the screen
    const position = geometry.getAttribute('position') as THREE.BufferAttribute
    const uv = geometry.getAttribute('uv') as THREE.BufferAttribute
    const half = STRAP_W / 2
    let length = 0
    for (let i = 0; i <= STRAP_SEGS; i++) {
      const t = i / STRAP_SEGS
      curve.current.getPoint(t, p)
      curve.current.getTangent(t, tg)
      let wx = -tg.y
      let wy = tg.x
      const wl = Math.hypot(wx, wy) || 1
      wx = (wx / wl) * half
      wy = (wy / wl) * half
      if (i > 0) length += p.distanceTo(prev)
      prev.copy(p)
      position.setXYZ(i * 2, p.x + wx, p.y + wy, p.z)
      position.setXYZ(i * 2 + 1, p.x - wx, p.y - wy, p.z)
      uv.setXY(i * 2, 0, length / WEAVE_TILE)
      uv.setXY(i * 2 + 1, 1, length / WEAVE_TILE)
    }
    position.needsUpdate = true
    uv.needsUpdate = true
  })

  return (
    <>
      <mesh frustumCulled={false} geometry={geometry}>
        <meshStandardMaterial map={weave} color={COLOR.strap} roughness={0.8} side={THREE.DoubleSide} />
      </mesh>
      <Charms curve={curve} charms={lanyard.charms.filter((c) => c.side === side)} />
    </>
  )
}

/** The plastic slider that clamps the two straps together just above the clip. It follows both straps. */
function Adjuster({ left, right }: { left: Curve; right: Curve }) {
  const group = useRef<THREE.Group>(null!)
  const v = useRef({ a: new THREE.Vector3(), b: new THREE.Vector3() })

  useFrame(() => {
    if (!group.current) return
    const { a, b } = v.current
    left.current.getPoint(ADJUSTER_T, a)
    right.current.getPoint(ADJUSTER_T, b)
    const dx = b.x - a.x
    const dy = b.y - a.y
    group.current.position.set((a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2 + 0.02)
    group.current.rotation.z = Math.atan2(dy, dx)
    // Wider when the straps splay apart, so it always wraps both of them
    group.current.scale.x = Math.max(1, (Math.hypot(dx, dy) + 0.4) / ADJ_W)
  })

  return (
    <group ref={group} frustumCulled={false}>
      <RoundedBox args={[ADJ_W, ADJ_H, 0.14]} radius={0.07} smoothness={4}>
        <meshStandardMaterial color={COLOR.frame} roughness={0.45} metalness={0.2} />
      </RoundedBox>
      <RoundedBox args={[ADJ_W - 0.16, ADJ_H - 0.13, 0.02]} radius={0.025} smoothness={3} position={[0, 0, 0.07]}>
        <meshStandardMaterial color={COLOR.frameHover} roughness={0.35} metalness={0.3} />
      </RoundedBox>
    </group>
  )
}

function Lanyard({ anchorX, badge }: { anchorX: number; badge: BadgeInfo }) {
  const leftX = anchorX - SPREAD
  const rightX = anchorX + SPREAD

  const fixedL = useRef<RapierRigidBody>(null!)
  const fixedR = useRef<RapierRigidBody>(null!)
  const l1 = useRef<RapierRigidBody>(null!)
  const l2 = useRef<RapierRigidBody>(null!)
  const l3 = useRef<RapierRigidBody>(null!)
  const r1 = useRef<RapierRigidBody>(null!)
  const r2 = useRef<RapierRigidBody>(null!)
  const r3 = useRef<RapierRigidBody>(null!)
  const card = useRef<RapierRigidBody>(null!)
  const curveL = useRef(makeCurve())
  const curveR = useRef(makeCurve())

  const [hovered, setHovered] = useState(false)
  const [dragging, setDragging] = useState(false)
  const reduceMotion = useRef(false)
  const grabOffset = useRef(new THREE.Vector3())

  useCursor(hovered && !dragging, 'grab')
  useCursor(dragging, 'grabbing')

  useRopeJoint(fixedL, l1, [[0, 0, 0], [0, 0, 0], SEGMENT])
  useRopeJoint(l1, l2, [[0, 0, 0], [0, 0, 0], SEGMENT])
  useRopeJoint(l2, l3, [[0, 0, 0], [0, 0, 0], SEGMENT])
  useSphericalJoint(l3, card, [[0, 0, 0], [-CLIP_SPREAD, CLIP_Y, 0]])

  useRopeJoint(fixedR, r1, [[0, 0, 0], [0, 0, 0], SEGMENT])
  useRopeJoint(r1, r2, [[0, 0, 0], [0, 0, 0], SEGMENT])
  useRopeJoint(r2, r3, [[0, 0, 0], [0, 0, 0], SEGMENT])
  useSphericalJoint(r3, card, [[0, 0, 0], [CLIP_SPREAD, CLIP_Y, 0]])

  useEffect(() => {
    const stop = () => setDragging(false)
    window.addEventListener('pointerup', stop)
    window.addEventListener('pointercancel', stop)
    return () => {
      window.removeEventListener('pointerup', stop)
      window.removeEventListener('pointercancel', stop)
    }
  }, [])

  useEffect(() => {
    document.body.style.userSelect = dragging ? 'none' : ''
    return () => {
      document.body.style.userSelect = ''
    }
  }, [dragging])

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    reduceMotion.current = mq.matches
    const onChange = (e: MediaQueryListEvent) => (reduceMotion.current = e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  useEffect(() => {
    card.current?.setAngvel({ x: 0, y: 0, z: -1 }, true)
    card.current?.setLinvel({ x: -1.5, y: 0, z: 0 }, true)
  }, [])

  useFrame(({ pointer, viewport, clock }, delta) => {
    const body = card.current
    if (!body || !fixedL.current || !fixedR.current) return

    const c = body.translation()

    // 1) Drag: pull the card toward the cursor, but only as far as the straps reach.
    //    The hanging points never move, so the straps stay attached to the top of the page.
    if (dragging) {
      let px = (pointer.x * viewport.width) / 2 - grabOffset.current.x
      let py = (pointer.y * viewport.height) / 2 - grabOffset.current.y + CLIP_Y // where the clip would go
      for (let i = 0; i < 3; i++) {
        for (const ax of [leftX, rightX]) {
          const dx = px - ax
          const dy = py - ANCHOR_Y
          const d = Math.hypot(dx, dy)
          if (d > PULL_LIMIT) {
            px = ax + (dx / d) * PULL_LIMIT
            py = ANCHOR_Y + (dy / d) * PULL_LIMIT
          }
        }
      }
      const targetX = px
      const targetY = py - CLIP_Y
      ;[l1, l2, l3, r1, r2, r3, card].forEach((rb) => rb.current?.wakeUp())
      const clamp = (n: number) => Math.max(-30, Math.min(30, n))
      body.setLinvel(
        {
          x: clamp((targetX - c.x) * 8),
          y: clamp((targetY - c.y) * 8),
          z: -c.z * 10,
        },
        true
      )
    }

    // 1b) Wind: several slow waves layered on top of each other -> gusts that never repeat stiffly
    if (!dragging && !reduceMotion.current) {
      const t = clock.elapsedTime
      const dt = Math.min(delta, 0.05)
      const gust = Math.sin(t * 0.55) + 0.6 * Math.sin(t * 1.3 + 1.7) + 0.4 * Math.sin(t * 0.21 + 4.1)
      const swirl = Math.sin(t * 0.8 + 0.6) + 0.5 * Math.sin(t * 1.9)
      body.applyImpulse({ x: gust * WIND_FORCE * dt, y: 0, z: swirl * WIND_FORCE * 0.25 * dt }, true)
      body.applyTorqueImpulse({ x: 0, y: swirl * WIND_TWIST * dt, z: 0 }, true)
    }
  })

  // Starting position of the segments: straight on the path from hanging point to clip (no forced pull)
  const clipWorldY = ANCHOR_Y - 0.6
  const chain = (refs: Body[], startX: number, endX: number) =>
    refs.map((ref, i) => {
      const t = (i + 1) / refs.length
      return (
        <RigidBody
          key={i}
          ref={ref}
          position={[
            startX + (endX - startX) * t,
            ANCHOR_Y + (clipWorldY - ANCHOR_Y) * t,
            0,
          ]}
          colliders={false}
          linearDamping={ROPE_DAMPING}
          angularDamping={ROPE_DAMPING}
        >
          {/* mass on the collider (not the RigidBody) so it works across rapier versions */}
          <BallCollider args={[0.08]} mass={SEGMENT_MASS} collisionGroups={NO_COLLISION} />
        </RigidBody>
      )
    })

  return (
    <>
      {/* Hanging points: fixed, so the straps always stay attached to the top */}
      <RigidBody ref={fixedL} type="fixed" position={[leftX, ANCHOR_Y, 0]} />
      <RigidBody ref={fixedR} type="fixed" position={[rightX, ANCHOR_Y, 0]} />

      {chain([l1, l2, l3], leftX, anchorX - CLIP_SPREAD)}
      {chain([r1, r2, r3], rightX, anchorX + CLIP_SPREAD)}

      <RigidBody
        ref={card}
        position={[anchorX, clipWorldY - CLIP_Y, 0]}
        colliders={false}
        linearDamping={0.8}
        angularDamping={1.5}
      >
        {/* Explicit collider: the physics shape stays the same however the decoration (stickers, tab) changes */}
        <CuboidCollider args={[1.8, 1.3, 0.05]} />
        <group
          onPointerOver={() => setHovered(true)}
          onPointerOut={() => setHovered(false)}
          onPointerDown={(e) => {
            e.stopPropagation()
            const c = card.current.translation()
            grabOffset.current.set(e.point.x - c.x, e.point.y - c.y, 0)
            setDragging(true)
          }}
        >
          <CardFace badge={badge} hovered={hovered} />
        </group>
      </RigidBody>

      <Strap anchorBody={fixedL} joints={[l1, l2, l3]} card={card} clipX={-CLIP_SPREAD} side="left" curve={curveL} />
      <Strap anchorBody={fixedR} joints={[r1, r2, r3]} card={card} clipX={CLIP_SPREAD} side="right" curve={curveR} />
      <Adjuster left={curveL} right={curveR} />
    </>
  )
}

function Scene({ badge }: { badge: BadgeInfo }) {
  const viewport = useThree((s) => s.viewport)
  const [anchorX] = useState(() => Math.min(4.5, viewport.width / 2 - SPREAD - 2.2))

  return (
    <>
      {/* Neutral studio light (no HDR download) so the card colours look true on the light background */}
      <Environment resolution={256}>
        <Lightformer form="rect" intensity={2.2} color="#ffffff" position={[-3, 4, 6]} scale={[10, 6, 1]} />
        <Lightformer form="rect" intensity={1.2} color="#f1f3ff" position={[6, 1, 4]} scale={[6, 8, 1]} />
        <Lightformer form="rect" intensity={0.8} color="#ffffff" position={[0, -4, 3]} scale={[12, 2, 1]} />
      </Environment>
      <ambientLight intensity={0.7} color="#ffffff" />
      <directionalLight position={[-4, 5, 6]} intensity={0.9} color="#ffffff" />
      <Physics gravity={[0, -25, 0]} timeStep={TIME_STEP}>
        <Lanyard anchorX={anchorX} badge={badge} />
      </Physics>
    </>
  )
}

export default function InteractiveLanyard(props: BadgeInfo) {
  return (
    <Canvas
      camera={{ position: [0, 0, 13], fov: 35 }}
      gl={{ alpha: true }}
      // Events are read from the body: the canvas has pointer-events:none, so the website underneath stays clickable
      eventSource={typeof document !== 'undefined' ? document.body : undefined}
      eventPrefix="client"
      style={{ pointerEvents: 'none' }}
    >
      <Scene badge={props} />
    </Canvas>
  )
}
