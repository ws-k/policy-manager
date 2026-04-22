'use client'

import { Handle, Position, type NodeProps, type Node } from '@xyflow/react'

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

const PlaceholderIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
    <circle cx="8.5" cy="8.5" r="1.5"/>
    <polyline points="21 15 16 10 5 21"/>
  </svg>
)

export function ScreenNode({ data, selected }: NodeProps<ScreenNodeType>) {
  return (
    <div
      className={[
        'rounded-xl bg-surface-primary shadow-sm transition-shadow',
        selected ? 'ring-2 ring-[#3182F6]' : 'ring-1 ring-[#E5E8EB]',
      ].join(' ')}
      style={{ width: 240 }}
    >
      {/* Handles: Top / Right / Bottom / Left. Each serves as both source and target. */}
      <Handle id="top" type="source" position={Position.Top} style={{ ...handleStyle, top: -7 }} />
      <Handle id="right" type="source" position={Position.Right} style={{ ...handleStyle, right: -7 }} />
      <Handle id="bottom" type="source" position={Position.Bottom} style={{ ...handleStyle, bottom: -7 }} />
      <Handle id="left" type="source" position={Position.Left} style={{ ...handleStyle, left: -7 }} />

      {/* Image */}
      <div
        className="flex items-center justify-center overflow-hidden rounded-t-xl bg-[#F2F4F6] text-[#B0B8C1]"
        style={{ width: 240, height: 150 }}
      >
        {data.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={data.imageUrl}
            alt={data.label}
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            draggable={false}
          />
        ) : (
          <PlaceholderIcon />
        )}
      </div>

      {/* Label */}
      <div className="truncate px-3 py-2 text-[14px] font-medium text-[#191F28]" title={data.label}>
        {data.label || '이름 없음'}
      </div>
    </div>
  )
}
