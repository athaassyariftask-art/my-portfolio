'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import ItemsEditor from '@/components/admin/ItemsEditor'
import { readError, input, label } from '@/components/admin/ui'
import SectionBody from '@/components/SectionBody'
import { getLayout, layoutList } from '@/layouts'
import { itemTitle } from '@/layouts/slots'
import type { Field, Item, Options } from '@/layouts/types'
import type { Project } from '@/lib/projects'
import type { Section } from '@/lib/sections'
import FieldsBuilder from './FieldsBuilder'

type Status = 'saved' | 'dirty' | 'saving' | 'error'
type Patch = Partial<Pick<Section, 'title' | 'layout' | 'schema' | 'options' | 'page' | 'items' | 'is_visible'>>

const STATUS_TEXT: Record<Status, string> = {
  saved: 'Saved',
  dirty: 'Not saved yet…',
  saving: 'Saving…',
  error: 'Save failed',
}

/**
 * Section page for admins: the section's real appearance + an in-place edit panel.
 * All changes (title, layout, fields, items) save automatically ~1 second after typing stops.
 */
export default function SectionPage({
  initial,
  projects,
  detailKeys,
}: {
  initial: Section
  projects: Project[]
  detailKeys: string[]
}) {
  const [title, setTitle] = useState(initial.title)
  const [layout, setLayout] = useState(initial.layout)
  const [schema, setSchema] = useState<Field[]>(initial.schema)
  const [options, setOptions] = useState<Options>(initial.options)
  const [page, setPage] = useState(initial.page)
  const [visible, setVisible] = useState(initial.is_visible)
  const [items, setItems] = useState<Item[]>(initial.items)
  const [editing, setEditing] = useState(true)
  const [status, setStatus] = useState<Status>('saved')
  const [error, setError] = useState('')

  const isProjects = initial.kind === 'projects'
  const lay = getLayout(layout)

  // ---- autosave ----
  const pending = useRef<Patch>({})
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const busy = useRef(false)

  async function flush() {
    if (busy.current) {
      timer.current = setTimeout(flush, 400) // wait for the save in progress
      return
    }
    const body = pending.current
    if (Object.keys(body).length === 0) return
    pending.current = {}
    busy.current = true
    setStatus('saving')
    setError('')
    let ok = false
    try {
      const res = await fetch(`/api/admin/sections/${initial.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      ok = res.ok
      if (!ok) setError(await readError(res))
    } catch {
      setError('Could not reach the server.')
    }
    busy.current = false
    if (ok) setStatus(Object.keys(pending.current).length ? 'dirty' : 'saved')
    else {
      pending.current = { ...body, ...pending.current } // retry on the next change
      setStatus('error')
    }
  }

  function touch(patch: Patch) {
    pending.current = { ...pending.current, ...patch }
    setStatus('dirty')
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(flush, 900)
  }

  useEffect(() => {
    // Warn if the page is closed while there are unsaved changes
    const warn = (e: BeforeUnloadEvent) => {
      if (Object.keys(pending.current).length || busy.current) e.preventDefault()
    }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [])

  const detailOn = options.detail !== false
  const detailHref = (item: Item): string | null => {
    const id = typeof item._id === 'string' ? item._id : ''
    return detailOn && id ? `/d/${id}` : null
  }
  const known = new Set(detailKeys)
  const publicDetailHref = (item: Item) => {
    const href = detailHref(item)
    // admins see links to every item; in this preview, just show the ones that exist
    return href && (known.has(`item-${item._id}`) || editing) ? href : null
  }

  const setOpt = (patch: Options) => {
    const next = { ...options, ...patch }
    setOptions(next)
    touch({ options: next })
  }

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center gap-4">
        <h1 className="pop-display text-4xl md:text-5xl">{title || 'Untitled'}</h1>
        {!visible && <span className="pop-pill pop-yellow">Hidden</span>}
      </div>

      <div className="sticky top-3 z-30 mb-8 flex flex-wrap items-center gap-3 rounded-2xl border border-[color:var(--line)] bg-white px-4 py-3 text-sm text-slate-800 shadow-[var(--shadow-md)]">
        <button
          type="button"
          onClick={() => setEditing((v) => !v)}
          className="rounded-full bg-slate-900 px-4 py-1.5 font-semibold text-white hover:bg-blue-600"
        >
          {editing ? 'Close editor' : 'Edit section'}
        </button>
        <span
          className={`font-mono text-xs ${status === 'error' ? 'text-rose-600' : status === 'saved' ? 'text-emerald-600' : 'text-slate-500'}`}
          aria-live="polite"
        >
          {STATUS_TEXT[status]}
        </span>
        {status === 'error' && (
          <button type="button" onClick={flush} className="text-xs font-semibold text-blue-600 hover:underline">
            Try again
          </button>
        )}
        <span className="flex-1" />
        <Link href="/admin/sections" className="text-xs font-semibold text-slate-500 hover:text-slate-900">
          All sections
        </Link>
      </div>

      {error && <p className="mb-6 whitespace-pre-line rounded-xl bg-rose-50 p-4 text-sm text-rose-700">{error}</p>}

      {editing && (
        <div className="mb-12 space-y-6 rounded-3xl border border-[color:var(--line)] bg-white p-6 text-slate-800 shadow-[var(--shadow-sm)]">
          <details className="group">
            <summary className="cursor-pointer select-none text-sm font-semibold text-slate-900">
              Section settings <span className="font-normal text-slate-500">(title, layout, fields)</span>
            </summary>

            <div className="mt-5 space-y-7">
              <div className="grid gap-5 md:grid-cols-[1fr_auto_auto] md:items-end">
                <div>
                  <label className={label} htmlFor="sec-title">Section title</label>
                  <input
                    id="sec-title"
                    value={title}
                    onChange={(e) => {
                      setTitle(e.target.value)
                      if (e.target.value.trim()) touch({ title: e.target.value.trim() })
                    }}
                    className={input}
                  />
                </div>
                <div>
                  <label className={label} htmlFor="sec-page">Show on</label>
                  <select
                    id="sec-page"
                    value={page}
                    onChange={(e) => {
                      const v = e.target.value as 'home' | 'about'
                      setPage(v)
                      touch({ page: v })
                    }}
                    className={input}
                  >
                    <option value="home">Home</option>
                    <option value="about">About me page</option>
                  </select>
                </div>
                <label className="flex items-center gap-2 pb-3 text-sm">
                  <input
                    type="checkbox"
                    checked={visible}
                    onChange={(e) => {
                      setVisible(e.target.checked)
                      touch({ is_visible: e.target.checked })
                    }}
                  />
                  Show on website
                </label>
              </div>

              {isProjects ? (
                <p className="rounded-2xl border border-dashed border-slate-300 p-5 text-sm text-slate-600">
                  This section's content is project cards. Add or edit projects in{' '}
                  <Link href="/admin/projects" className="font-semibold text-blue-600 hover:underline">Admin → Project</Link>.
                </p>
              ) : (
                <>
                  <div>
                    <p className={label}>Layout</p>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                      {layoutList.map((l) => (
                        <button
                          key={l.key}
                          type="button"
                          onClick={() => {
                            setLayout(l.key)
                            touch({ layout: l.key })
                          }}
                          className={`rounded-2xl border-2 p-3 text-left transition-colors ${
                            layout === l.key ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 hover:border-slate-400'
                          }`}
                        >
                          <span className="block text-sm font-semibold">{l.label}</span>
                          <span className={`block text-xs ${layout === l.key ? 'text-slate-300' : 'text-slate-500'}`}>{l.description}</span>
                        </button>
                      ))}
                    </div>
                    <div className="mt-4 flex flex-wrap items-center gap-6 text-sm">
                      {lay.columns && (
                        <label className="flex items-center gap-2">
                          Number of columns
                          <select
                            value={options.columns ?? 3}
                            onChange={(e) => setOpt({ columns: Number(e.target.value) })}
                            className="rounded-lg border border-slate-300 bg-white px-2 py-1"
                          >
                            {[1, 2, 3, 4].map((n) => (
                              <option key={n} value={n}>{n}</option>
                            ))}
                          </select>
                        </label>
                      )}
                      <label className="flex items-center gap-2">
                        <input type="checkbox" checked={detailOn} onChange={(e) => setOpt({ detail: e.target.checked })} />
                        Each item has a detail page (Notion-style)
                      </label>
                    </div>
                  </div>

                  <div>
                    <p className={label}>Item fields</p>
                    <FieldsBuilder
                      fields={schema}
                      uses={lay.uses}
                      onChange={(f) => {
                        setSchema(f)
                        touch({ schema: f })
                      }}
                    />
                  </div>
                </>
              )}
            </div>
          </details>

          {!isProjects && (
            <div>
              <p className={`${label} mb-3`}>Section content</p>
              <ItemsEditor
                // remount when field types/count change so the form drafts adjust
                key={schema.map((f) => `${f.name}:${f.type}`).join('|')}
                fields={schema}
                initial={items}
                withIds
                itemLabel="Item"
                itemTitle={(i) => itemTitle(i, schema)}
                itemHref={detailOn ? (i) => detailHref(i) : undefined}
                onChange={(v) => {
                  setItems(v)
                  touch({ items: v })
                }}
              />
            </div>
          )}
        </div>
      )}

      {/* The section's real appearance (updates live as you edit) */}
      <p className="mb-4 font-mono text-xs uppercase tracking-widest opacity-60">Preview</p>
      {!isProjects && items.length === 0 ? (
        <p className="pop-card p-8 font-bold">No items yet. Add some using the panel above.</p>
      ) : (
        <SectionBody
          section={{ kind: initial.kind, layout, schema, options, items }}
          projects={projects}
          detailHref={publicDetailHref}
        />
      )}

    </div>
  )
}
