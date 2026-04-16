interface TiptapNode {
  type?: string
  text?: string
  content?: TiptapNode[]
}

export function tiptapJsonToPlainText(json: Record<string, unknown>): string {
  const node = json as TiptapNode
  return extractText(node).trim()
}

function extractText(node: TiptapNode): string {
  if (node.text) {
    return node.text
  }

  if (!node.content || !Array.isArray(node.content)) {
    return ''
  }

  const parts: string[] = []
  for (const child of node.content) {
    const text = extractText(child)
    if (text) {
      parts.push(text)
    }
  }

  const blockTypes = new Set([
    'paragraph',
    'heading',
    'bulletList',
    'orderedList',
    'listItem',
    'blockquote',
    'codeBlock',
    'table',
    'tableRow',
    'tableCell',
    'tableHeader',
  ])

  if (blockTypes.has(node.type ?? '')) {
    return parts.join('') + '\n'
  }

  return parts.join('')
}

export function extractH1H2Headings(content: Record<string, unknown>): string[] {
  const nodes = (content.content as unknown[]) ?? []
  const headings: string[] = []
  for (const node of nodes) {
    const n = node as { type: string; attrs?: { level: number }; content?: { type: string; text?: string }[] }
    if (n.type !== 'heading') continue
    const level = n.attrs?.level ?? 1
    if (level > 2) continue
    const text = (n.content ?? []).map((c) => c.text ?? '').join('').trim()
    if (text) headings.push(text)
  }
  return headings
}
