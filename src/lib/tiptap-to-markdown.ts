type TiptapMark = { type: string; attrs?: Record<string, unknown> }
type TiptapNode = {
  type: string
  text?: string
  marks?: TiptapMark[]
  attrs?: Record<string, unknown>
  content?: TiptapNode[]
}

function inlineText(nodes: TiptapNode[] = []): string {
  return nodes.map((node) => {
    if (node.type === 'hardBreak') return '  \n'
    if (node.type !== 'text') return inlineText(node.content)
    let text = node.text ?? ''
    const marks = node.marks ?? []
    for (const mark of marks) {
      if (mark.type === 'bold') text = `**${text}**`
      else if (mark.type === 'italic') text = `*${text}*`
      else if (mark.type === 'strike') text = `~~${text}~~`
      else if (mark.type === 'code') text = `\`${text}\``
      else if (mark.type === 'underline') text = `<u>${text}</u>`
      else if (mark.type === 'link') {
        const href = (mark.attrs?.href as string) ?? '#'
        text = `[${text}](${href})`
      }
    }
    return text
  }).join('')
}

function nodeToMarkdown(node: TiptapNode, listDepth = 0): string {
  const indent = '  '.repeat(listDepth)

  switch (node.type) {
    case 'doc':
      return (node.content ?? []).map((n) => nodeToMarkdown(n)).filter(Boolean).join('\n\n')

    case 'heading': {
      const level = (node.attrs?.level as number) ?? 1
      const prefix = '#'.repeat(level)
      return `${prefix} ${inlineText(node.content)}`
    }

    case 'paragraph': {
      const text = inlineText(node.content)
      return text || ''
    }

    case 'blockquote': {
      const inner = (node.content ?? []).map((n) => nodeToMarkdown(n)).join('\n\n')
      return inner.split('\n').map((l) => `> ${l}`).join('\n')
    }

    case 'codeBlock': {
      const lang = (node.attrs?.language as string) ?? ''
      const code = (node.content ?? []).map((n) => n.text ?? '').join('')
      return `\`\`\`${lang}\n${code}\n\`\`\``
    }

    case 'bulletList': {
      return (node.content ?? [])
        .map((item) => {
          const lines = (item.content ?? [])
            .map((child) => {
              if (child.type === 'bulletList' || child.type === 'orderedList') {
                return nodeToMarkdown(child, listDepth + 1)
              }
              return nodeToMarkdown(child, listDepth)
            })
            .join('\n')
          const [first, ...rest] = lines.split('\n')
          return [`${indent}- ${first}`, ...rest].join('\n')
        })
        .join('\n')
    }

    case 'orderedList': {
      return (node.content ?? [])
        .map((item, i) => {
          const lines = (item.content ?? [])
            .map((child) => {
              if (child.type === 'bulletList' || child.type === 'orderedList') {
                return nodeToMarkdown(child, listDepth + 1)
              }
              return nodeToMarkdown(child, listDepth)
            })
            .join('\n')
          const [first, ...rest] = lines.split('\n')
          return [`${indent}${i + 1}. ${first}`, ...rest].join('\n')
        })
        .join('\n')
    }

    case 'horizontalRule':
      return '---'

    case 'table': {
      const rows = node.content ?? []
      if (rows.length === 0) return ''
      const cells = (row: TiptapNode) =>
        (row.content ?? []).map((cell) =>
          inlineText(cell.content ?? []).replace(/\|/g, '\\|')
        )
      const header = cells(rows[0])
      const separator = header.map(() => '---')
      const body = rows.slice(1).map(cells)
      const toRow = (cols: string[]) => `| ${cols.join(' | ')} |`
      return [toRow(header), toRow(separator), ...body.map(toRow)].join('\n')
    }

    case 'image': {
      const src = (node.attrs?.src as string) ?? ''
      const alt = (node.attrs?.alt as string) ?? ''
      return `![${alt}](${src})`
    }

    default:
      return inlineText(node.content)
  }
}

export function tiptapToMarkdown(content: Record<string, unknown>): string {
  return nodeToMarkdown(content as unknown as TiptapNode)
}
