'use client'

import { useState, useCallback, useRef } from 'react'
import type { Editor } from '@tiptap/react'
import { SLASH_COMMANDS, type SlashCommand } from './SlashCommandMenu'

export function useSlashCommand(editor: Editor | null) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const menuRef = useRef<HTMLDivElement>(null)
  // Use ref to avoid stale closure in event listeners
  const openRef = useRef(false)
  const queryRef = useRef('')
  const selectedIndexRef = useRef(0)
  const filteredRef = useRef<SlashCommand[]>(SLASH_COMMANDS)

  const filteredCommands = SLASH_COMMANDS.filter(
    (cmd) =>
      query === '' ||
      cmd.label.toLowerCase().includes(query.toLowerCase()) ||
      cmd.id.toLowerCase().includes(query.toLowerCase())
  )
  filteredRef.current = filteredCommands

  const close = useCallback(() => {
    openRef.current = false
    queryRef.current = ''
    selectedIndexRef.current = 0
    setOpen(false)
    setQuery('')
    setSelectedIndex(0)
  }, [])

  const executeCommand = useCallback(
    (cmd: SlashCommand) => {
      if (!editor) return
      const { from } = editor.state.selection
      const q = queryRef.current
      const textBefore = editor.state.doc.textBetween(
        Math.max(0, from - q.length - 1),
        from,
        '\n'
      )
      const slashPos = textBefore.lastIndexOf('/')
      if (slashPos !== -1) {
        const deleteFrom = from - (q.length + 1 - slashPos)
        editor.chain().focus().deleteRange({ from: deleteFrom, to: from }).run()
      }

      switch (cmd.id) {
        case 'h1':
          editor.chain().focus().toggleHeading({ level: 1 }).run()
          break
        case 'h2':
          editor.chain().focus().toggleHeading({ level: 2 }).run()
          break
        case 'h3':
          editor.chain().focus().toggleHeading({ level: 3 }).run()
          break
        case 'ul':
          editor.chain().focus().toggleBulletList().run()
          break
        case 'ol':
          editor.chain().focus().toggleOrderedList().run()
          break
        case 'quote':
          editor.chain().focus().toggleBlockquote().run()
          break
        case 'code':
          editor.chain().focus().toggleCodeBlock().run()
          break
        case 'table':
          editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
          break
        case 'hr':
          editor.chain().focus().setHorizontalRule().run()
          break
        case 'text':
          editor.chain().focus().setParagraph().run()
          break
        case 'block-warning':
          editor
            .chain()
            .focus()
            .insertContent([
              {
                type: 'blockquote',
                content: [
                  { type: 'paragraph', content: [{ type: 'text', marks: [{ type: 'bold' }], text: '⚠️ 주의' }] },
                  { type: 'paragraph', content: [{ type: 'text', text: '주의 사항을 입력하세요.' }] },
                ],
              },
            ])
            .run()
          break
        case 'block-definition':
          editor
            .chain()
            .focus()
            .insertContent([
              {
                type: 'blockquote',
                content: [
                  { type: 'paragraph', content: [{ type: 'text', marks: [{ type: 'bold' }], text: '📖 정의' }] },
                  { type: 'paragraph', content: [{ type: 'text', text: '"용어"란 ' }] },
                ],
              },
            ])
            .run()
          break
        case 'block-date':
          editor
            .chain()
            .focus()
            .insertContent([
              {
                type: 'paragraph',
                content: [
                  { type: 'text', marks: [{ type: 'bold' }], text: '📅 시행일: ' },
                  { type: 'text', text: '20XX년 XX월 XX일' },
                ],
              },
            ])
            .run()
          break
        case 'block-reference':
          editor
            .chain()
            .focus()
            .insertContent([
              {
                type: 'blockquote',
                content: [
                  { type: 'paragraph', content: [{ type: 'text', marks: [{ type: 'bold' }], text: '🔗 관련 법령' }] },
                  { type: 'paragraph', content: [{ type: 'text', text: '법령명 제X조 (조항명)' }] },
                ],
              },
            ])
            .run()
          break
      }
      close()
    },
    [editor, close]
  )

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!openRef.current) return false

      if (e.key === 'ArrowDown') {
        e.preventDefault()
        const next = (selectedIndexRef.current + 1) % filteredRef.current.length
        selectedIndexRef.current = next
        setSelectedIndex(next)
        return true
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        const prev = (selectedIndexRef.current - 1 + filteredRef.current.length) % filteredRef.current.length
        selectedIndexRef.current = prev
        setSelectedIndex(prev)
        return true
      }
      if (e.key === 'Enter') {
        e.preventDefault()
        const cmd = filteredRef.current[selectedIndexRef.current]
        if (cmd) {
          executeCommand(cmd)
        }
        return true
      }
      if (e.key === 'Escape') {
        close()
        return true
      }
      return false
    },
    [executeCommand, close]
  )

  const handleEditorUpdate = useCallback(
    (editorInstance: Editor) => {
      const { from } = editorInstance.state.selection
      const textBefore = editorInstance.state.doc.textBetween(
        Math.max(0, from - 50),
        from,
        '\n'
      )

      const slashIdx = textBefore.lastIndexOf('/')

      if (slashIdx === -1) {
        if (openRef.current) close()
        return
      }

      const afterSlash = textBefore.slice(slashIdx + 1)
      const beforeSlash = textBefore.slice(0, slashIdx)
      const isAtLineStart = beforeSlash === '' || beforeSlash.endsWith('\n')

      if (!isAtLineStart || afterSlash.includes(' ')) {
        if (openRef.current) close()
        return
      }

      queryRef.current = afterSlash
      selectedIndexRef.current = 0
      openRef.current = true
      setQuery(afterSlash)
      setSelectedIndex(0)
      setOpen(true)
    },
    [close]
  )

  return {
    open,
    query,
    selectedIndex,
    filteredCommands,
    menuRef,
    close,
    executeCommand,
    handleKeyDown,
    handleEditorUpdate,
  }
}
