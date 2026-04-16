import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
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
import { tiptapToMarkdown } from '@/lib/tiptap-to-markdown'

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

function toFullHtml(title: string, bodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${title}</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 800px; margin: 40px auto; padding: 0 20px; color: #111; line-height: 1.7; }
  h1 { font-size: 2rem; font-weight: 700; margin-top: 2rem; margin-bottom: 0.5rem; }
  h2 { font-size: 1.5rem; font-weight: 600; margin-top: 1.75rem; margin-bottom: 0.5rem; }
  h3 { font-size: 1.25rem; font-weight: 600; margin-top: 1.5rem; margin-bottom: 0.5rem; }
  p { margin: 0.75rem 0; }
  ul, ol { padding-left: 1.5rem; }
  li { margin: 0.25rem 0; }
  blockquote { border-left: 3px solid #ddd; margin: 1rem 0; padding: 0.5rem 1rem; color: #555; }
  code { background: #f4f4f4; padding: 0.15em 0.35em; border-radius: 3px; font-size: 0.9em; }
  pre { background: #f4f4f4; padding: 1rem; border-radius: 6px; overflow-x: auto; }
  pre code { background: none; padding: 0; }
  table { border-collapse: collapse; width: 100%; margin: 1rem 0; }
  th, td { border: 1px solid #ddd; padding: 8px 12px; text-align: left; }
  th { background: #f8f8f8; font-weight: 600; }
  mark { background: #fef9c3; }
  a { color: #2563eb; text-decoration: underline; }
  hr { border: none; border-top: 1px solid #e5e5e5; margin: 2rem 0; }
</style>
</head>
<body>
${bodyHtml}
</body>
</html>`
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
  }

  const { id } = await params
  const format = request.nextUrl.searchParams.get('format') ?? 'markdown'

  const { data: doc, error } = await supabase
    .from('policy_docs')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !doc) {
    return NextResponse.json({ error: '정책을 찾을 수 없습니다.' }, { status: 404 })
  }

  const content = doc.content as Record<string, unknown>
  const safeTitle = doc.title.replace(/[/\\?%*:|"<>]/g, '-')

  if (format === 'markdown') {
    const md = tiptapToMarkdown(content)
    return new NextResponse(md, {
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(safeTitle)}.md"`,
      },
    })
  }

  if (format === 'html') {
    const bodyHtml = generateHTML(content as Parameters<typeof generateHTML>[0], EXTENSIONS)
    const fullHtml = toFullHtml(doc.title, bodyHtml)
    return new NextResponse(fullHtml, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(safeTitle)}.html"`,
      },
    })
  }

  if (format === 'docx') {
    const bodyHtml = generateHTML(content as Parameters<typeof generateHTML>[0], EXTENSIONS)
    const fullHtml = toFullHtml(doc.title, bodyHtml)
    // Dynamic import to avoid bundling issues
    const HTMLtoDOCX = (await import('html-to-docx')).default
    const buffer = await HTMLtoDOCX(fullHtml, undefined, {
      title: doc.title,
      margins: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
      font: 'Malgun Gothic',
      fontSize: 22,
    })
    return new NextResponse(buffer as ArrayBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(safeTitle)}.docx"`,
      },
    })
  }

  return NextResponse.json({ error: '지원하지 않는 형식입니다.' }, { status: 400 })
}
