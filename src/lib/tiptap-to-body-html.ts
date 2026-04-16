/**
 * Pure TypeScript Tiptap JSON → HTML converter.
 * No Tiptap/browser dependencies — safe to use in server-side API routes.
 */

type TiptapMark = { type: string; attrs?: Record<string, unknown> }
type TiptapNode = {
  type: string
  text?: string
  marks?: TiptapMark[]
  attrs?: Record<string, unknown>
  content?: TiptapNode[]
}

function esc(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function inlineHtml(nodes: TiptapNode[] = []): string {
  return nodes
    .map((node) => {
      if (node.type === 'hardBreak') return '<br>'
      if (node.type !== 'text') return inlineHtml(node.content)
      let html = esc(node.text ?? '')
      for (const mark of node.marks ?? []) {
        if (mark.type === 'bold') html = `<strong>${html}</strong>`
        else if (mark.type === 'italic') html = `<em>${html}</em>`
        else if (mark.type === 'strike') html = `<s>${html}</s>`
        else if (mark.type === 'code') html = `<code>${html}</code>`
        else if (mark.type === 'underline') html = `<u>${html}</u>`
        else if (mark.type === 'link') {
          const href = esc((mark.attrs?.href as string) ?? '#')
          html = `<a href="${href}">${html}</a>`
        } else if (mark.type === 'highlight') {
          const color = mark.attrs?.color as string
          html = color
            ? `<mark style="background:${color}">${html}</mark>`
            : `<mark>${html}</mark>`
        } else if (mark.type === 'textStyle') {
          const color = mark.attrs?.color as string
          if (color) html = `<span style="color:${color}">${html}</span>`
        }
      }
      return html
    })
    .join('')
}

function nodeToHtml(node: TiptapNode): string {
  switch (node.type) {
    case 'doc':
      return (node.content ?? []).map(nodeToHtml).join('\n')

    case 'heading': {
      const level = (node.attrs?.level as number) ?? 1
      const align = node.attrs?.textAlign as string
      const style = align ? ` style="text-align:${align}"` : ''
      return `<h${level}${style}>${inlineHtml(node.content)}</h${level}>`
    }

    case 'paragraph': {
      const align = node.attrs?.textAlign as string
      const style = align ? ` style="text-align:${align}"` : ''
      return `<p${style}>${inlineHtml(node.content)}</p>`
    }

    case 'blockquote': {
      const inner = (node.content ?? []).map(nodeToHtml).join('\n')
      return `<blockquote>${inner}</blockquote>`
    }

    case 'codeBlock': {
      const lang = (node.attrs?.language as string) ?? ''
      const code = (node.content ?? []).map((n) => n.text ?? '').join('')
      return `<pre><code${lang ? ` class="language-${esc(lang)}"` : ''}>${esc(code)}</code></pre>`
    }

    case 'bulletList': {
      const items = (node.content ?? [])
        .map((item) => `<li>${(item.content ?? []).map(nodeToHtml).join('')}</li>`)
        .join('')
      return `<ul>${items}</ul>`
    }

    case 'orderedList': {
      const start = (node.attrs?.start as number) ?? 1
      const items = (node.content ?? [])
        .map((item) => `<li>${(item.content ?? []).map(nodeToHtml).join('')}</li>`)
        .join('')
      return `<ol start="${start}">${items}</ol>`
    }

    case 'horizontalRule':
      return '<hr>'

    case 'table': {
      const rows = (node.content ?? [])
        .map((row) => {
          const cells = (row.content ?? [])
            .map((cell) => {
              const tag = cell.type === 'tableHeader' ? 'th' : 'td'
              return `<${tag}>${inlineHtml(cell.content ?? [])}</${tag}>`
            })
            .join('')
          return `<tr>${cells}</tr>`
        })
        .join('')
      return `<table>${rows}</table>`
    }

    case 'image': {
      const src = esc((node.attrs?.src as string) ?? '')
      const alt = esc((node.attrs?.alt as string) ?? '')
      return `<img src="${src}" alt="${alt}">`
    }

    default:
      return inlineHtml(node.content)
  }
}

export function tiptapToBodyHtml(content: Record<string, unknown>): string {
  return nodeToHtml(content as unknown as TiptapNode)
}
