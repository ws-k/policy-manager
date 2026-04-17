'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { Table, TableRow, TableHeader, TableCell } from '@tiptap/extension-table'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import TextAlign from '@tiptap/extension-text-align'
import Highlight from '@tiptap/extension-highlight'
import { TextStyle } from '@tiptap/extension-text-style'
import Color from '@tiptap/extension-color'
import { useEffect, useRef, useState } from 'react'
import { SlashCommandMenu } from './SlashCommandMenu'
import { useSlashCommand } from './useSlashCommand'

const FONT_COLORS = [
  '#000000', '#374151', '#6b7280', '#9ca3af', '#ffffff',
  '#dc2626', '#ea580c', '#d97706', '#16a34a', '#2563eb',
  '#7c3aed', '#db2777', '#0891b2', '#65a30d', '#b45309',
]

const HIGHLIGHT_COLORS = [
  '#fef08a', '#bbf7d0', '#bfdbfe', '#fecaca', '#fed7aa',
  '#e9d5ff', '#fbcfe8', '#a7f3d0', '#fde68a', '#ddd6fe',
]

function getContrastColor(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.5 ? '#374151' : '#ffffff'
}

function ColorPalette({
  colors,
  onSelect,
  onCustom,
  currentColor,
}: {
  colors: string[]
  onSelect: (color: string) => void
  onCustom?: (color: string) => void
  currentColor?: string
}) {
  return (
    <div className="w-52 rounded-lg border border-line-primary bg-surface-primary p-3 shadow-xl">
      <div className="grid grid-cols-5 gap-2">
        {colors.map((color) => (
          <button
            key={color}
            type="button"
            title={color}
            onClick={() => onSelect(color)}
            className="cursor-pointer relative h-8 w-8 rounded-md border border-line-secondary transition-transform hover:scale-110 hover:shadow-md"
            style={{ backgroundColor: color }}
          >
            {currentColor === color && (
              <span
                className="absolute inset-0 flex items-center justify-center text-sm font-bold"
                style={{ color: getContrastColor(color) }}
              >
                ✓
              </span>
            )}
          </button>
        ))}
      </div>
      {onCustom && (
        <div className="mt-3 flex items-center gap-2 border-t border-line-primary pt-3">
          <span className="text-xs text-content-secondary">직접 선택</span>
          <input
            type="color"
            defaultValue={currentColor ?? '#000000'}
            onChange={(e) => onCustom(e.target.value)}
            className="h-8 w-8 cursor-pointer rounded border border-line-primary p-0.5"
          />
        </div>
      )}
    </div>
  )
}

interface PolicyEditorProps {
  content?: Record<string, unknown>
  onChange: (json: Record<string, unknown>) => void
}

function ToolbarButton({
  onClick,
  isActive,
  children,
  title,
  disabled,
}: {
  onClick: () => void
  isActive?: boolean
  children: React.ReactNode
  title: string
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      disabled={disabled}
      className={`cursor-pointer rounded px-2 py-1 text-xs font-medium transition-colors disabled:opacity-40 ${
        isActive
          ? 'bg-accent text-accent-text'
          : 'text-content-secondary hover:bg-surface-tertiary hover:text-content-primary'
      }`}
    >
      {children}
    </button>
  )
}

function ToolbarDivider() {
  return <div className="mx-1 h-5 w-px bg-line-primary" />
}

export function PolicyEditor({ content, onChange }: PolicyEditorProps) {
  const [, setTick] = useState(0)
  const [colorPaletteOpen, setColorPaletteOpen] = useState(false)
  const [highlightPaletteOpen, setHighlightPaletteOpen] = useState(false)
  const [shortcutPanelOpen, setShortcutPanelOpen] = useState(false)
  const colorRef = useRef<HTMLDivElement>(null)
  const highlightRef = useRef<HTMLDivElement>(null)
  const lastExternalContent = useRef<string | undefined>(undefined)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (colorRef.current && !colorRef.current.contains(e.target as Node)) {
        setColorPaletteOpen(false)
      }
      if (highlightRef.current && !highlightRef.current.contains(e.target as Node)) {
        setHighlightPaletteOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        // Strike, Blockquote, HorizontalRule are included in StarterKit by default
      }),
      Placeholder.configure({
        placeholder: '정책 내용을 입력하세요...',
      }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      Underline,
      Link.configure({ openOnClick: false }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Highlight.configure({ multicolor: true }),
      TextStyle,
      Color,
    ],
    immediatelyRender: false,
    content: content ?? {
      type: 'doc',
      content: [{ type: 'paragraph' }],
    },
    onUpdate: ({ editor: ed }) => {
      onChange(ed.getJSON() as Record<string, unknown>)
    },
    onSelectionUpdate: () => {
      setTick((t) => t + 1)
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none min-h-[400px] px-4 py-3 outline-none focus:outline-none',
      },
    },
  })

  const slash = useSlashCommand(editor)

  useEffect(() => {
    return () => {
      editor?.destroy()
    }
  }, [editor])

  // Track editor changes for slash command detection
  useEffect(() => {
    if (!editor) return
    const handler = () => slash.handleEditorUpdate(editor)
    editor.on('update', handler)
    return () => { editor.off('update', handler) }
  }, [editor, slash.handleEditorUpdate])

  // Keyboard navigation for slash menu
  useEffect(() => {
    if (!editor) return
    const handleKey = (e: KeyboardEvent) => slash.handleKeyDown(e)
    document.addEventListener('keydown', handleKey, true)
    return () => document.removeEventListener('keydown', handleKey, true)
  }, [editor, slash.handleKeyDown])

  // Sync editor content when the content prop changes externally (e.g., draft restore)
  useEffect(() => {
    if (!editor || content === undefined) return
    const incoming = JSON.stringify(content)
    if (incoming === lastExternalContent.current) return
    lastExternalContent.current = incoming
    // Only update if the editor's current content actually differs
    if (JSON.stringify(editor.getJSON()) !== incoming) {
      editor.commands.setContent(content)
    }
  }, [editor, content])

  const handleSetLink = () => {
    const previousUrl = editor?.getAttributes('link').href as string | undefined
    const url = window.prompt('링크 URL을 입력하세요', previousUrl ?? '')
    if (url === null) return
    if (url === '') {
      editor?.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }
    editor?.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }

  const isInTable = editor?.isActive('table') ?? false

  if (!editor) {
    return (
      <div className="rounded-lg border border-line-primary bg-surface-primary">
        <div className="flex min-h-[400px] items-center justify-center text-sm text-content-tertiary">
          에디터 로딩 중...
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-line-primary bg-surface-primary">
      {/* Toolbar */}
      <div className="sticky -top-6 z-20 rounded-t-lg border-b border-line-primary bg-surface-secondary">
        {/* Main toolbar */}
        <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5">
          {/* Headings */}
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            isActive={editor.isActive('heading', { level: 1 })}
            title="제목 1"
          >
            H1
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            isActive={editor.isActive('heading', { level: 2 })}
            title="제목 2"
          >
            H2
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            isActive={editor.isActive('heading', { level: 3 })}
            title="제목 3"
          >
            H3
          </ToolbarButton>

          <ToolbarDivider />

          {/* Text format */}
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            isActive={editor.isActive('bold')}
            title="굵게 (Ctrl+B)"
          >
            B
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            isActive={editor.isActive('italic')}
            title="기울임 (Ctrl+I)"
          >
            <em>I</em>
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            isActive={editor.isActive('underline')}
            title="밑줄 (Ctrl+U)"
          >
            <span className="underline">U</span>
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleStrike().run()}
            isActive={editor.isActive('strike')}
            title="취소선"
          >
            <span className="line-through">S</span>
          </ToolbarButton>
          {/* Font color palette */}
          {(() => {
            const currentColor = editor.getAttributes('textStyle').color as string | undefined
            const hasColor = !!currentColor
            return (
              <div ref={colorRef} className="relative">
                <button
                  type="button"
                  title="폰트 컬러"
                  onClick={() => setColorPaletteOpen((o) => !o)}
                  className={`cursor-pointer rounded px-2 py-1 text-xs font-medium transition-colors ${
                    hasColor ? 'bg-accent text-accent-text' : 'text-content-secondary hover:bg-surface-tertiary hover:text-content-primary'
                  }`}
                >
                  A
                  <span
                    className="block h-0.5 w-full mt-0.5 rounded"
                    style={{ backgroundColor: currentColor ?? 'currentColor' }}
                  />
                </button>
                {colorPaletteOpen && (
                  <div className="absolute left-0 top-full z-50 mt-1">
                    <ColorPalette
                      colors={FONT_COLORS}
                      currentColor={currentColor}
                      onSelect={(color) => editor.chain().focus().setColor(color).run()}
                      onCustom={(color) => editor.chain().focus().setColor(color).run()}
                    />
                    {hasColor && (
                      <button
                        type="button"
                        onClick={() => { editor.chain().focus().unsetColor().run(); setColorPaletteOpen(false) }}
                        className="cursor-pointer mt-1 w-full rounded border border-line-primary bg-surface-primary px-2 py-1 text-xs text-content-secondary hover:bg-surface-tertiary"
                      >
                        컬러 제거
                      </button>
                    )}
                  </div>
                )}
              </div>
            )
          })()}

          {/* Highlight color palette */}
          {(() => {
            const currentHighlight = editor.getAttributes('highlight').color as string | undefined
            const hasHighlight = editor.isActive('highlight')
            return (
              <div ref={highlightRef} className="relative">
                <button
                  type="button"
                  title="하이라이트 컬러"
                  onClick={() => setHighlightPaletteOpen((o) => !o)}
                  className={`cursor-pointer rounded px-2 py-1 text-xs font-medium transition-colors ${
                    hasHighlight ? 'bg-accent text-accent-text' : 'text-content-secondary hover:bg-surface-tertiary hover:text-content-primary'
                  }`}
                >
                  <span className="px-0.5" style={{ backgroundColor: currentHighlight ?? '#fef08a' }}>H</span>
                </button>
                {highlightPaletteOpen && (
                  <div className="absolute left-0 top-full z-50 mt-1">
                    <ColorPalette
                      colors={HIGHLIGHT_COLORS}
                      currentColor={currentHighlight}
                      onSelect={(color) => editor.chain().focus().toggleHighlight({ color }).run()}
                    />
                    {hasHighlight && (
                      <button
                        type="button"
                        onClick={() => { editor.chain().focus().unsetHighlight().run(); setHighlightPaletteOpen(false) }}
                        className="cursor-pointer mt-1 w-full rounded border border-line-primary bg-surface-primary px-2 py-1 text-xs text-content-secondary hover:bg-surface-tertiary"
                      >
                        하이라이트 제거
                      </button>
                    )}
                  </div>
                )}
              </div>
            )
          })()}

          <ToolbarDivider />

          {/* Alignment */}
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            isActive={editor.isActive({ textAlign: 'left' })}
            title="왼쪽 정렬"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="1" y="2" width="12" height="1.5" rx="0.75" fill="currentColor"/>
              <rect x="1" y="5.5" width="8" height="1.5" rx="0.75" fill="currentColor"/>
              <rect x="1" y="9" width="10" height="1.5" rx="0.75" fill="currentColor"/>
              <rect x="1" y="12.5" width="6" height="1.5" rx="0.75" fill="currentColor" opacity="0.5"/>
            </svg>
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            isActive={editor.isActive({ textAlign: 'center' })}
            title="가운데 정렬"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="1" y="2" width="12" height="1.5" rx="0.75" fill="currentColor"/>
              <rect x="3" y="5.5" width="8" height="1.5" rx="0.75" fill="currentColor"/>
              <rect x="2" y="9" width="10" height="1.5" rx="0.75" fill="currentColor"/>
              <rect x="4" y="12.5" width="6" height="1.5" rx="0.75" fill="currentColor" opacity="0.5"/>
            </svg>
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            isActive={editor.isActive({ textAlign: 'right' })}
            title="오른쪽 정렬"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="1" y="2" width="12" height="1.5" rx="0.75" fill="currentColor"/>
              <rect x="5" y="5.5" width="8" height="1.5" rx="0.75" fill="currentColor"/>
              <rect x="3" y="9" width="10" height="1.5" rx="0.75" fill="currentColor"/>
              <rect x="7" y="12.5" width="6" height="1.5" rx="0.75" fill="currentColor" opacity="0.5"/>
            </svg>
          </ToolbarButton>

          <ToolbarDivider />

          {/* Lists */}
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            isActive={editor.isActive('bulletList')}
            title="글머리 기호"
          >
            &bull; 목록
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            isActive={editor.isActive('orderedList')}
            title="번호 매기기"
          >
            1. 목록
          </ToolbarButton>

          <ToolbarDivider />

          {/* Block elements */}
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            isActive={editor.isActive('blockquote')}
            title="인용구"
          >
            &ldquo; 인용
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            title="구분선"
          >
            ─ 구분선
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            isActive={editor.isActive('codeBlock')}
            title="코드 블록"
          >
            {'</>'}
          </ToolbarButton>

          <ToolbarDivider />

          {/* Link */}
          <ToolbarButton
            onClick={handleSetLink}
            isActive={editor.isActive('link')}
            title="링크 설정"
          >
            🔗 링크
          </ToolbarButton>
          {editor.isActive('link') && (
            <ToolbarButton
              onClick={() => editor.chain().focus().unsetLink().run()}
              title="링크 해제"
            >
              ✕ 링크해제
            </ToolbarButton>
          )}

          <ToolbarDivider />

          {/* Table insert */}
          <ToolbarButton
            onClick={() =>
              editor
                .chain()
                .focus()
                .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
                .run()
            }
            title="표 삽입"
          >
            표 삽입
          </ToolbarButton>

          <ToolbarDivider />

          {/* Keyboard shortcut help */}
          <button
            type="button"
            title="키보드 단축키"
            onClick={() => setShortcutPanelOpen((o) => !o)}
            className={`cursor-pointer rounded px-2 py-1 text-xs font-medium transition-colors ${
              shortcutPanelOpen
                ? 'bg-accent text-accent-text'
                : 'text-content-secondary hover:bg-surface-tertiary hover:text-content-primary'
            }`}
          >
            ?
          </button>
        </div>

        {/* Table controls — visible only when cursor is inside a table */}
        {isInTable && (
          <div className="flex flex-wrap items-center gap-0.5 border-t border-line-primary px-2 py-1.5">
            <span className="mr-1 text-xs text-content-tertiary">표 편집:</span>

            {/* Row controls */}
            <ToolbarButton
              onClick={() => editor.chain().focus().addRowBefore().run()}
              title="위에 행 추가"
            >
              ↑ 행 추가
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().addRowAfter().run()}
              title="아래에 행 추가"
            >
              ↓ 행 추가
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().deleteRow().run()}
              title="행 삭제"
            >
              ✕ 행
            </ToolbarButton>

            <ToolbarDivider />

            {/* Column controls */}
            <ToolbarButton
              onClick={() => editor.chain().focus().addColumnBefore().run()}
              title="왼쪽에 열 추가"
            >
              ← 열 추가
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().addColumnAfter().run()}
              title="오른쪽에 열 추가"
            >
              → 열 추가
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().deleteColumn().run()}
              title="열 삭제"
            >
              ✕ 열
            </ToolbarButton>

            <ToolbarDivider />

            {/* Merge / split */}
            <ToolbarButton
              onClick={() => editor.chain().focus().mergeCells().run()}
              disabled={!editor.can().mergeCells()}
              title="셀 병합 (여러 셀 선택 후)"
            >
              셀 병합
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().splitCell().run()}
              disabled={!editor.can().splitCell()}
              title="셀 분할"
            >
              셀 분할
            </ToolbarButton>

            <ToolbarDivider />

            {/* Delete table */}
            <ToolbarButton
              onClick={() => editor.chain().focus().deleteTable().run()}
              title="표 삭제"
            >
              <span className="text-red-500">표 삭제</span>
            </ToolbarButton>
          </div>
        )}
      </div>

      {/* Keyboard shortcut panel */}
      {shortcutPanelOpen && (
        <div className="border-b border-line-primary bg-surface-secondary px-4 py-3">
          <p className="mb-2 text-xs font-medium text-content-primary">키보드 단축키</p>
          <div className="grid grid-cols-2 gap-x-8 gap-y-1 sm:grid-cols-3">
            {[
              ['Ctrl+B', '굵게'],
              ['Ctrl+I', '기울임'],
              ['Ctrl+U', '밑줄'],
              ['Ctrl+Shift+X', '취소선'],
              ['Ctrl+Z', '실행 취소'],
              ['Ctrl+Y', '다시 실행'],
              ['Ctrl+A', '전체 선택'],
              ['Tab', '들여쓰기 (목록)'],
              ['Shift+Tab', '내어쓰기 (목록)'],
              ['Enter', '새 단락'],
              ['Shift+Enter', '줄 바꿈'],
              ['Ctrl+Alt+1', '제목 1'],
              ['Ctrl+Alt+2', '제목 2'],
              ['Ctrl+Alt+3', '제목 3'],
              ['Ctrl+Shift+8', '글머리 기호 목록'],
              ['Ctrl+Shift+7', '번호 매기기 목록'],
              ['Ctrl+Shift+B', '인용구'],
              ['Ctrl+E', '코드 블록'],
              ['Ctrl+K', '링크'],
            ].map(([key, label]) => (
              <div key={key} className="flex items-center justify-between gap-2">
                <span className="text-xs text-content-secondary">{label}</span>
                <kbd className="rounded border border-line-primary bg-surface-primary px-1.5 py-0.5 font-mono text-[10px] text-content-tertiary whitespace-nowrap">
                  {key}
                </kbd>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Slash command menu */}
      {slash.open && (
        <div className="border-b border-line-primary">
          <SlashCommandMenu
            ref={slash.menuRef}
            commands={slash.filteredCommands}
            selectedIndex={slash.selectedIndex}
            onSelect={slash.executeCommand}
          />
        </div>
      )}

      {/* Editor */}
      <EditorContent editor={editor} />
    </div>
  )
}
