'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Table, TableRow, TableHeader, TableCell } from '@tiptap/extension-table'

export function PolicyContent({ content }: { content: Record<string, unknown> }) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Table,
      TableRow,
      TableHeader,
      TableCell,
    ],
    immediatelyRender: false,
    content,
    editable: false,
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none',
      },
    },
  })

  if (!editor) return null
  return <EditorContent editor={editor} />
}
