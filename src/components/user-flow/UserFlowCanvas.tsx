'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  addEdge,
  useNodesState,
  useEdgesState,
  MarkerType,
  reconnectEdge,
  ConnectionMode,
  SelectionMode,
  type Connection,
  type Edge,
  type OnNodesChange,
  type OnEdgesChange,
} from '@xyflow/react'
import { toast } from 'sonner'
import '@xyflow/react/dist/style.css'
import { ScreenNode, type ScreenNodeData, type ScreenNodeType } from './ScreenNode'

const nodeTypes = { screen: ScreenNode }

type ScreenDef = { label: string; file: string; pos: { x: number; y: number } }

const DWFM_SCREENS: readonly ScreenDef[] = [
  { label: '홈',             file: '/dwfm-screens/01_홈.png',            pos: { x: 600,  y: 40   } },
  { label: '검색',           file: '/dwfm-screens/02_검색.png',          pos: { x: 40,   y: 340  } },
  { label: '소재 탐색',      file: '/dwfm-screens/03_소재탐색.png',      pos: { x: 340,  y: 340  } },
  { label: '매장 상세',      file: '/dwfm-screens/05_매장상세.png',      pos: { x: 340,  y: 640  } },
  { label: '지도',           file: '/dwfm-screens/04_지도.png',          pos: { x: 640,  y: 340  } },
  { label: 'MY',             file: '/dwfm-screens/06_마이.png',          pos: { x: 940,  y: 340  } },
  { label: '업무 공간',      file: '/dwfm-screens/08_업무공간.png',      pos: { x: 40,   y: 640  } },
  { label: '셰어라운지',     file: '/dwfm-screens/07_셰어라운지.png',    pos: { x: -260, y: 640  } },
  { label: '무신사 스튜디오', file: '/dwfm-screens/15_무신사스튜디오.png', pos: { x: -260, y: 940  } },
  { label: '디자이너 라운지', file: '/dwfm-screens/10_디자이너라운지.png', pos: { x: -260, y: 1240 } },
  { label: '방송 스튜디오',  file: '/dwfm-screens/17_방송스튜디오.png',  pos: { x: -260, y: 1540 } },
  { label: '포토 스튜디오',  file: '/dwfm-screens/16_포토스튜디오.png',  pos: { x: 40,   y: 1540 } },
  { label: '미팅룸 4인',     file: '/dwfm-screens/13_회의실4인.png',     pos: { x: -260, y: 1840 } },
  { label: '미팅룸 6인',     file: '/dwfm-screens/14_회의실6인.png',     pos: { x: 40,   y: 1840 } },
  { label: '제작',           file: '/dwfm-screens/11_생산실.png',        pos: { x: 340,  y: 940  } },
  { label: '생산실 목록',    file: '/dwfm-screens/12_생산실목록.png',    pos: { x: 640,  y: 940  } },
  { label: '유통',           file: '/dwfm-screens/18_물류센터.png',      pos: { x: 940,  y: 640  } },
  { label: '식음료',         file: '/dwfm-screens/09_푸드코트.png',      pos: { x: 940,  y: 940  } },
  { label: '아라마크',       file: '/dwfm-screens/20_아라막.png',        pos: { x: 1240, y: 940  } },
  { label: '편의시설',       file: '/dwfm-screens/19_의료실.png',        pos: { x: 1240, y: 640  } },
] as const

const FLOW_EDGES: readonly [string, string][] = [
  ['홈', '검색'],
  ['홈', '소재 탐색'],
  ['홈', '지도'],
  ['홈', 'MY'],
  ['홈', '업무 공간'],
  ['홈', '제작'],
  ['홈', '유통'],
  ['홈', '식음료'],
  ['홈', '편의시설'],
  ['소재 탐색', '매장 상세'],
  ['MY', '셰어라운지'],
  ['MY', '무신사 스튜디오'],
  ['업무 공간', '셰어라운지'],
  ['업무 공간', '무신사 스튜디오'],
  ['업무 공간', '디자이너 라운지'],
  ['업무 공간', '방송 스튜디오'],
  ['업무 공간', '포토 스튜디오'],
  ['업무 공간', '미팅룸 4인'],
  ['업무 공간', '미팅룸 6인'],
  ['제작', '생산실 목록'],
  ['식음료', '아라마크'],
]

const STORAGE_KEY = 'poli-user-flow-v2'

const defaultEdgeOptions = {
  type: 'smoothstep' as const,
  markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16, color: '#3182F6' },
  style: { strokeWidth: 2, stroke: '#3182F6' },
  animated: false,
}

function randomPosition() {
  return {
    x: Math.round(100 + Math.random() * 400),
    y: Math.round(100 + Math.random() * 400),
  }
}

function makeId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

type StoredState = {
  nodes: ScreenNodeType[]
  edges: Edge[]
}

function loadStored(): StoredState | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as StoredState
    if (!parsed || !Array.isArray(parsed.nodes) || !Array.isArray(parsed.edges)) return null
    return parsed
  } catch {
    return null
  }
}

export default function UserFlowCanvas() {
  const [nodes, setNodes, onNodesChange] = useNodesState<ScreenNodeType>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])
  const [showPageMenu, setShowPageMenu] = useState(false)
  const [hydrated, setHydrated] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const pageMenuRef = useRef<HTMLDivElement>(null)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const edgeReconnectSuccessful = useRef(true)

  // Hydrate from localStorage once on mount
  useEffect(() => {
    const stored = loadStored()
    if (stored) {
      setNodes(stored.nodes)
      setEdges(stored.edges)
    }
    setHydrated(true)
  }, [setNodes, setEdges])

  // Debounced persist
  useEffect(() => {
    if (!hydrated) return
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      try {
        window.localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ nodes, edges } satisfies StoredState),
        )
      } catch {
        toast.error('저장 공간이 부족합니다. 일부 변경사항이 저장되지 않았습니다.')
      }
    }, 400)
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    }
  }, [nodes, edges, hydrated])

  // Close page-menu on outside click
  useEffect(() => {
    if (!showPageMenu) return
    const onDocClick = (e: MouseEvent) => {
      if (pageMenuRef.current && !pageMenuRef.current.contains(e.target as globalThis.Node)) {
        setShowPageMenu(false)
      }
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [showPageMenu])

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds) => addEdge({ ...connection, ...defaultEdgeOptions, id: makeId('e') }, eds))
    },
    [setEdges],
  )

  const onReconnectStart = useCallback(() => {
    edgeReconnectSuccessful.current = false
  }, [])

  const onReconnect = useCallback(
    (oldEdge: Edge, newConnection: Connection) => {
      edgeReconnectSuccessful.current = true
      setEdges((eds) => reconnectEdge(oldEdge, newConnection, eds))
    },
    [setEdges],
  )

  const onReconnectEnd = useCallback(
    (_: unknown, edge: Edge) => {
      if (!edgeReconnectSuccessful.current) {
        setEdges((eds) => eds.filter((e) => e.id !== edge.id))
      }
      edgeReconnectSuccessful.current = true
    },
    [setEdges],
  )

  const addScreenNode = useCallback(
    (data: ScreenNodeData) => {
      const node: ScreenNodeType = {
        id: makeId('n'),
        type: 'screen',
        position: randomPosition(),
        data,
      }
      setNodes((ns) => [...ns, node])
    },
    [setNodes],
  )

  const handleAddScreen = useCallback(
    (screen: (typeof DWFM_SCREENS)[number]) => {
      setShowPageMenu(false)
      addScreenNode({ label: screen.label, url: '', imageUrl: screen.file })
    },
    [addScreenNode],
  )

  const handleLoadAll = useCallback(() => {
    setShowPageMenu(false)
    const cols = 5
    const W = 240 + 32
    const H = 150 + 48 + 32
    DWFM_SCREENS.forEach((screen, i) => {
      const node: ScreenNodeType = {
        id: makeId('n'),
        type: 'screen',
        position: { x: 60 + (i % cols) * W, y: 60 + Math.floor(i / cols) * H },
        data: { label: screen.label, url: '', imageUrl: screen.file },
      }
      setNodes((ns) => [...ns, node])
    })
  }, [setNodes])

  const handleLoadFlow = useCallback(() => {
    setShowPageMenu(false)
    const idByLabel = new Map<string, string>()
    const nextNodes: ScreenNodeType[] = DWFM_SCREENS.map((screen) => {
      const id = makeId('n')
      idByLabel.set(screen.label, id)
      return {
        id,
        type: 'screen',
        position: { ...screen.pos },
        data: { label: screen.label, url: '', imageUrl: screen.file },
      }
    })
    const nextEdges: Edge[] = FLOW_EDGES.flatMap(([src, dst]) => {
      const source = idByLabel.get(src)
      const target = idByLabel.get(dst)
      if (!source || !target) return []
      return [{ id: makeId('e'), source, target, ...defaultEdgeOptions }]
    })
    setNodes(nextNodes)
    setEdges(nextEdges)
  }, [setNodes, setEdges])

  const handleFileUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = () => {
        const dataUrl = typeof reader.result === 'string' ? reader.result : ''
        addScreenNode({ label: file.name.replace(/\.[^.]+$/, ''), url: '', imageUrl: dataUrl })
      }
      reader.readAsDataURL(file)
      // reset so same file can be chosen again
      e.target.value = ''
    },
    [addScreenNode],
  )

  const handleDeleteSelected = useCallback(() => {
    setNodes((ns) => ns.filter((n) => !n.selected))
    setEdges((es) => es.filter((e) => !e.selected))
  }, [setNodes, setEdges])

  const handleReset = useCallback(() => {
    if (!window.confirm('모든 노드와 연결을 삭제하시겠습니까?')) return
    setNodes([])
    setEdges([])
  }, [setNodes, setEdges])

  const typedOnNodesChange = onNodesChange as OnNodesChange<ScreenNodeType>
  const typedOnEdgesChange = onEdgesChange as OnEdgesChange<Edge>

  const toolbarBtn =
    'inline-flex items-center gap-1.5 rounded-lg border border-line-primary bg-surface-primary px-3 py-1.5 text-[13px] font-medium text-content-primary transition-colors hover:border-line-secondary hover:bg-surface-secondary disabled:cursor-not-allowed disabled:opacity-50'

  const dwfmScreensList = useMemo(() => DWFM_SCREENS, [])

  return (
    <div className="flex h-full w-full flex-col">
      {/* Toolbar */}
      <div className="flex h-12 shrink-0 items-center justify-between gap-2 border-b border-line-primary bg-surface-primary px-4">
        <div className="flex items-center gap-2">
          <div ref={pageMenuRef} className="relative">
            <button
              type="button"
              className={toolbarBtn}
              onClick={() => setShowPageMenu((v) => !v)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
              화면 추가
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            {showPageMenu && (
              <div className="absolute left-0 top-full z-20 mt-1 w-44 overflow-hidden rounded-lg border border-line-primary bg-surface-primary shadow-lg">
                <ul className="py-1">
                  {dwfmScreensList.map((s) => (
                    <li key={s.file}>
                      <button
                        type="button"
                        onClick={() => handleAddScreen(s)}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-content-primary transition-colors hover:bg-surface-secondary"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={s.file} alt="" className="h-8 w-6 rounded object-cover shrink-0" />
                        <span>{s.label}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <button
            type="button"
            className={toolbarBtn}
            onClick={handleLoadAll}
          >
            전체 불러오기
          </button>

          <button
            type="button"
            className={toolbarBtn}
            onClick={handleLoadFlow}
          >
            플로우 불러오기
          </button>

          <button
            type="button"
            className={toolbarBtn}
            onClick={() => fileInputRef.current?.click()}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            이미지 업로드
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button type="button" className={toolbarBtn} onClick={handleDeleteSelected}>
            선택 삭제
          </button>
          <button type="button" className={toolbarBtn} onClick={handleReset}>
            초기화
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={typedOnNodesChange}
          onEdgesChange={typedOnEdgesChange}
          onConnect={onConnect}
          onReconnect={onReconnect}
          onReconnectStart={onReconnectStart}
          onReconnectEnd={onReconnectEnd}
          nodeTypes={nodeTypes}
          connectionLineStyle={{ stroke: '#3182F6', strokeWidth: 2, opacity: 0.5 }}
          defaultEdgeOptions={defaultEdgeOptions}
          connectionMode={ConnectionMode.Loose}
          fitView
          deleteKeyCode={['Delete', 'Backspace']}
          selectionOnDrag
          selectionMode={SelectionMode.Partial}
          panOnDrag={[1, 2]}
          panActivationKeyCode="Space"
          proOptions={{ hideAttribution: true }}
          className="user-flow-canvas"
        >
          <Background color="#E5E8EB" gap={20} />
          <Controls showInteractive={false} />
        </ReactFlow>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileUpload}
      />
    </div>
  )
}

