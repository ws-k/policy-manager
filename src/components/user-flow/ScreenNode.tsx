'use client'

import { useEffect, useRef, useState } from 'react'
import {
  Handle,
  Position,
  useReactFlow,
  type Node,
  type NodeProps,
} from '@xyflow/react'

export type ScreenNodeData = {
  label: string
  imageUrl: string
  url: string
}

export type ScreenNodeType = Node<ScreenNodeData, 'screen'>

const handleStyle: React.CSSProperties = {
  width: 14,
  height: 14,
  background: '#ffffff',
  border: '2px solid #3182F6',
  borderRadius: '9999px',
}

const handleClass = (selected: boolean) =>
  [
    'transition-opacity',
    selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
  ].join(' ')

const PlaceholderIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
    <circle cx="8.5" cy="8.5" r="1.5"/>
    <polyline points="21 15 16 10 5 21"/>
  </svg>
)

export function ScreenNode({ id, data, selected }: NodeProps<ScreenNodeType>) {
  const { updateNodeData } = useReactFlow<ScreenNodeType>()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(data.label)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!editing) setDraft(data.label)
  }, [data.label, editing])

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [editing])

  const commit = () => {
    const next = draft.trim()
    if (next !== data.label) updateNodeData(id, { label: next })
    setEditing(false)
  }

  const hasLabel = (data.label?.trim().length ?? 0) > 0

  return (
    <div className="relative flex w-fit flex-col items-center">
      {/* Title (editable) */}
      {editing ? (
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              commit()
            } else if (e.key === 'Escape') {
              e.preventDefault()
              setDraft(data.label)
              setEditing(false)
            }
          }}
          className="nodrag mb-1 rounded bg-transparent text-center text-[14px] font-medium text-[#191F28] outline-none ring-1 ring-[#3182F6]"
          style={{ padding: '2px 6px', minWidth: 120 }}
        />
      ) : (
        <button
          type="button"
          onDoubleClick={() => setEditing(true)}
          className={[
            'nodrag mb-1 bg-transparent px-1 text-center text-[14px] font-medium',
            hasLabel ? 'text-[#191F28]' : 'text-[#B0B8C1]',
          ].join(' ')}
          title={hasLabel ? data.label : '더블클릭하여 제목 입력'}
        >
          {hasLabel ? data.label : '제목'}
        </button>
      )}

      {/* Image with hover-visible handles on all four edges */}
      <div
        className={[
          'group relative rounded-md',
          selected ? 'ring-2 ring-[#3182F6]' : '',
        ].join(' ')}
      >
        <Handle id="top" type="source" position={Position.Top} style={{ ...handleStyle, top: -7 }} className={handleClass(selected)} />
        <Handle id="right" type="source" position={Position.Right} style={{ ...handleStyle, right: -7 }} className={handleClass(selected)} />
        <Handle id="bottom" type="source" position={Position.Bottom} style={{ ...handleStyle, bottom: -7 }} className={handleClass(selected)} />
        <Handle id="left" type="source" position={Position.Left} style={{ ...handleStyle, left: -7 }} className={handleClass(selected)} />

        {data.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={data.imageUrl}
            alt={data.label}
            style={{ height: 300, width: 'auto', display: 'block' }}
            draggable={false}
          />
        ) : (
          <div className="flex items-center justify-center text-[#B0B8C1]" style={{ width: 138, height: 300 }}>
            <PlaceholderIcon />
          </div>
        )}
      </div>
    </div>
  )
}
