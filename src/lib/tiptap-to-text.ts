type TiptapNode = {
  type?: string
  text?: string
  content?: TiptapNode[]
  attrs?: Record<string, unknown>
}

function extractText(nodes: TiptapNode[]): string {
  return nodes
    .map((n) => n.text ?? extractText(n.content ?? []))
    .join('')
}

function processNode(node: TiptapNode, orderedIndex?: number): string[] {
  const lines: string[] = []

  switch (node.type) {
    case 'heading':
    case 'paragraph': {
      const text = extractText(node.content ?? [])
      lines.push(text)
      break
    }

    case 'bulletList': {
      for (const item of node.content ?? []) {
        // listItem → paragraph inside
        const itemText = extractText(item.content ?? [])
        lines.push(`• ${itemText}`)
      }
      break
    }

    case 'orderedList': {
      let idx = 1
      for (const item of node.content ?? []) {
        const itemText = extractText(item.content ?? [])
        lines.push(`${idx}. ${itemText}`)
        idx++
      }
      break
    }

    case 'blockquote': {
      for (const child of node.content ?? []) {
        const childText = extractText(child.content ?? [])
        lines.push(`> ${childText}`)
      }
      break
    }

    case 'codeBlock': {
      const code = extractText(node.content ?? [])
      lines.push(code)
      break
    }

    case 'horizontalRule': {
      lines.push('---')
      break
    }

    case 'listItem': {
      const text = extractText(node.content ?? [])
      if (orderedIndex !== undefined) {
        lines.push(`${orderedIndex}. ${text}`)
      } else {
        lines.push(`• ${text}`)
      }
      break
    }

    default: {
      // Recurse into unknown container nodes
      for (const child of node.content ?? []) {
        lines.push(...processNode(child))
      }
      break
    }
  }

  return lines
}

export function tiptapToLines(doc: Record<string, unknown>): string[] {
  const content = doc.content as TiptapNode[] | undefined
  if (!content) return []

  const lines: string[] = []
  for (const node of content) {
    lines.push(...processNode(node))
  }
  return lines
}
