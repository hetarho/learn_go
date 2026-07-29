// LESSON.md 파싱 — 렌더링과 분리해 둔다.
// 여기에는 컴포넌트가 없어서 markdown.tsx 가 React Fast Refresh 경계를 온전히 유지한다.
//
// 지원 문법은 레포 루트 TUTOR.md §3 에 정리돼 있다.
import { useMemo } from 'react'

export type ProseNode = { kind: 'prose'; text: string }
export type CodeNode = { kind: 'code'; lang: string; title?: string; mark: Set<number>; code: string }
export type ContainerNode = { kind: 'container'; name: string; title: string; children: Node[] }
export type Node = ProseNode | CodeNode | ContainerNode

export type Toc = { id: string; text: string; level: number }[]

const LANG_ALIAS: Record<string, string> = {
  ts: 'typescript',
  tsx: 'tsx',
  js: 'javascript',
  sh: 'bash',
  shell: 'bash',
  console: 'bash',
  yml: 'yaml',
  proto: 'protobuf',
  dockerfile: 'docker',
  text: 'none',
  txt: 'none',
}

/** "3", "3,7", "5-9" 를 줄 번호 집합으로 바꾼다. */
function parseMark(spec: string | undefined): Set<number> {
  const out = new Set<number>()
  if (!spec) return out
  for (const part of spec.split(',')) {
    const range = part.split('-').map((s) => Number(s.trim()))
    if (range.length === 2) for (let i = range[0]; i <= range[1]; i++) out.add(i)
    else if (!Number.isNaN(range[0])) out.add(range[0])
  }
  return out
}

/** ```go title=a/b.go mark=3,5-7 의 info string 을 읽는다. */
function parseFenceInfo(info: string): { lang: string; title?: string; mark?: string } {
  const [first, ...rest] = info.trim().split(/\s+/)
  const attrs: Record<string, string> = {}
  for (const token of rest.join(' ').matchAll(/(\w+)=("([^"]*)"|'([^']*)'|[^\s]+)/g)) {
    attrs[token[1]] = token[3] ?? token[4] ?? token[2]
  }
  return { lang: first || 'none', title: attrs.title, mark: attrs.mark }
}

/**
 * 헤딩을 raw HTML로 미리 바꿔 안정적인 anchor id를 붙이고 TOC를 모은다.
 * 컨테이너 안(:::compare 의 `### Go` 등)의 헤딩은 문서 목차가 아니므로 TOC에서 뺀다.
 */
export function extractHeadings(src: string): { src: string; toc: Toc } {
  const toc: Toc = []
  const out: string[] = []
  let inFence = false
  let depth = 0
  let n = 0
  for (const line of src.split('\n')) {
    if (/^\s*```/.test(line)) inFence = !inFence
    if (!inFence) {
      if (/^:::\w+/.test(line)) depth += 1
      else if (/^:::\s*$/.test(line)) depth = Math.max(0, depth - 1)
    }
    const h = !inFence && /^(#{2,3})\s+(.+?)\s*$/.exec(line)
    if (h) {
      n += 1
      const id = `sec-${n}`
      const level = h[1].length
      if (depth === 0) {
        toc.push({ id, text: h[2].replace(/`([^`]+)`/g, '$1').replace(/\*\*/g, ''), level })
      }
      out.push(`<h${level} id="${id}">${h[2].replace(/`([^`]+)`/g, '<code>$1</code>')}</h${level}>`)
      continue
    }
    out.push(line)
  }
  return { src: out.join('\n'), toc }
}

/** `:::이름` 컨테이너와 fenced code block 을 트리로 만든다. 컨테이너는 중첩된다. */
export function parseNodes(src: string): Node[] {
  const lines = src.split('\n')
  const root: Node[] = []
  const stack: Node[][] = [root]
  let prose: string[] = []

  const flush = () => {
    const text = prose.join('\n')
    if (text.trim()) stack[stack.length - 1].push({ kind: 'prose', text })
    prose = []
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    const open = /^:::(\w+)(?:\s+(.*))?$/.exec(line)
    if (open) {
      flush()
      const node: ContainerNode = { kind: 'container', name: open[1], title: (open[2] ?? '').trim(), children: [] }
      stack[stack.length - 1].push(node)
      stack.push(node.children)
      continue
    }
    if (/^:::\s*$/.test(line)) {
      flush()
      if (stack.length > 1) stack.pop()
      continue
    }

    const fence = /^```(.*)$/.exec(line)
    if (fence) {
      flush()
      const { lang, title, mark } = parseFenceInfo(fence[1])
      const buf: string[] = []
      i += 1
      while (i < lines.length && !/^```\s*$/.test(lines[i])) {
        buf.push(lines[i])
        i += 1
      }
      stack[stack.length - 1].push({
        kind: 'code',
        lang: LANG_ALIAS[lang] ?? lang,
        title,
        mark: parseMark(mark),
        code: buf.join('\n'),
      })
      continue
    }

    prose.push(line)
  }
  flush()
  return root
}

export function useDocument(source: string): { nodes: Node[]; toc: Toc } {
  return useMemo(() => {
    const { src, toc } = extractHeadings(source)
    return { nodes: parseNodes(src), toc }
  }, [source])
}

export function useToc(source: string): Toc {
  return useMemo(() => extractHeadings(source).toc, [source])
}
