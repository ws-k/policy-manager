import { generateHTML } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableHeader } from '@tiptap/extension-table-header'
import { TableCell } from '@tiptap/extension-table-cell'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import TextAlign from '@tiptap/extension-text-align'
import Highlight from '@tiptap/extension-highlight'
import { TextStyle } from '@tiptap/extension-text-style'
import Color from '@tiptap/extension-color'

const EXTENSIONS = [
  StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
  Table.configure({ resizable: false }),
  TableRow,
  TableHeader,
  TableCell,
  Underline,
  Link.configure({ openOnClick: false }),
  TextAlign.configure({ types: ['heading', 'paragraph'] }),
  Highlight.configure({ multicolor: true }),
  TextStyle,
  Color,
]

export function tiptapToHtmlLines(content: Record<string, unknown>): string[] {
  try {
    const html = generateHTML(content as Parameters<typeof generateHTML>[0], EXTENSIONS)
    // Split at closing block-level tags, keeping each block as one line
    return html
      .split(/(?<=<\/(?:p|h[1-6]|li|blockquote|pre|tr|thead|tbody|table|hr|div)>)/i)
      .map((s) => s.trim())
      .filter(Boolean)
  } catch {
    return []
  }
}
