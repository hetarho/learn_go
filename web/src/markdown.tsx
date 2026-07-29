// LESSON.md 를 학습용 컴포넌트로 렌더링한다.
//
// 지원 문법 (자세한 설명은 레포 루트 TUTOR.md 참고):
//   :::spec 제목 … :::        과제 명세 카드
//   :::compare … :::          TypeScript ↔ Go 2단 대조 (h3 두 개로 구분)
//   :::gotcha 제목 … :::      어긋나는 지점 / 함정
//   :::be 제목 … :::          🧭 BE 상식
//   :::check 제목 … :::       이해도 체크 질문
//   :::try 제목 … :::         직접 실험해보기
//   :::note 제목 … :::        참고
//   :::details 제목 … :::     접히는 블록 (힌트)
//   ```go title=경로 mark=3,5-7
import { useMemo, useState } from 'react'
import { marked } from 'marked'
import Prism from 'prismjs'
import 'prismjs/components/prism-go'
import 'prismjs/components/prism-typescript'
import 'prismjs/components/prism-jsx'
import 'prismjs/components/prism-tsx'
import 'prismjs/components/prism-sql'
import 'prismjs/components/prism-bash'
import 'prismjs/components/prism-json'
import 'prismjs/components/prism-yaml'
import 'prismjs/components/prism-protobuf'
import 'prismjs/components/prism-docker'
import 'prismjs/components/prism-diff'

marked.setOptions({ gfm: true, breaks: false })

// ── 파싱 ────────────────────────────────────────────────────────
type ProseNode = { kind: 'prose'; text: string }
type CodeNode = { kind: 'code'; lang: string; title?: string; mark: Set<number>; code: string }
type ContainerNode = { kind: 'container'; name: string; title: string; children: Node[] }
type Node = ProseNode | CodeNode | ContainerNode

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
function extractHeadings(src: string): { src: string; toc: Toc } {
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
      const inner = h[2].replace(/`([^`]+)`/g, '<code>$1</code>')
      out.push(`<h${level} id="${id}">${inner}</h${level}>`)
      continue
    }
    out.push(line)
  }
  return { src: out.join('\n'), toc }
}

/** 콜아웃 제목처럼 짧은 문구에서 `코드`만 살려 렌더한다. */
function InlineText({ text }: { text: string }) {
  return (
    <>
      {text.split(/(`[^`]+`)/).map((part, i) =>
        part.startsWith('`') && part.endsWith('`') && part.length > 2 ? (
          <code key={i}>{part.slice(1, -1)}</code>
        ) : (
          part
        ),
      )}
    </>
  )
}

function parseNodes(src: string): Node[] {
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

// ── 코드 블록 ───────────────────────────────────────────────────
const LINE_H = 25 // styles.css 의 .code-pre line-height 와 반드시 일치

function CodeBlock({ node }: { node: CodeNode }) {
  const [copied, setCopied] = useState(false)
  const lines = node.code.split('\n')
  const html = useMemo(() => {
    const grammar = Prism.languages[node.lang]
    return grammar ? Prism.highlight(node.code, grammar, node.lang) : escapeHtml(node.code)
  }, [node.code, node.lang])

  const copy = () => {
    navigator.clipboard.writeText(node.code).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1400)
    })
  }

  return (
    <figure className="code">
      <div className="code-bar">
        <span className="code-title">{node.title ?? <span className="code-lang-only">{node.lang}</span>}</span>
        <div className="code-bar-right">
          {node.title && <span className="code-lang">{node.lang}</span>}
          <button className="code-copy" onClick={copy} type="button">
            {copied ? '복사됨' : '복사'}
          </button>
        </div>
      </div>
      <div className="code-scroll">
        <div className="code-inner">
          {[...node.mark].map((n) => (
            <div key={n} className="code-mark" style={{ top: (n - 1) * LINE_H }} />
          ))}
          <div className="code-gutter" aria-hidden="true">
            {lines.map((_, i) => (
              <span key={i} className={node.mark.has(i + 1) ? 'ln on' : 'ln'}>
                {i + 1}
              </span>
            ))}
          </div>
          <pre className="code-pre">
            <code dangerouslySetInnerHTML={{ __html: html }} />
          </pre>
        </div>
      </div>
    </figure>
  )
}

function escapeHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

// ── 컨테이너 ────────────────────────────────────────────────────
const CALLOUTS: Record<string, { icon: string; label: string }> = {
  spec: { icon: '📝', label: '과제' },
  gotcha: { icon: '⚠️', label: '어긋나는 지점' },
  be: { icon: '🧭', label: 'BE 상식' },
  check: { icon: '❓', label: '이해도 체크' },
  try: { icon: '🔬', label: '직접 해보기' },
  note: { icon: '💡', label: '참고' },
}

function Container({ node }: { node: ContainerNode }) {
  if (node.name === 'compare') return <Compare node={node} />
  if (node.name === 'details') return <Details node={node} />

  const meta = CALLOUTS[node.name]
  if (!meta) return <>{renderNodes(node.children)}</>

  return (
    <aside className={`callout callout-${node.name}`}>
      <header className="callout-head">
        <span className="callout-icon">{meta.icon}</span>
        <span className="callout-label">{meta.label}</span>
        {node.title && (
          <span className="callout-title">
            <InlineText text={node.title} />
          </span>
        )}
      </header>
      <div className="callout-body">{renderNodes(node.children)}</div>
    </aside>
  )
}

function Details({ node }: { node: ContainerNode }) {
  const [open, setOpen] = useState(false)
  return (
    <div className={open ? 'details open' : 'details'}>
      <button className="details-head" onClick={() => setOpen(!open)} type="button">
        <span className="details-caret">{open ? '▾' : '▸'}</span>
        <InlineText text={node.title || '펼쳐보기'} />
      </button>
      {open && <div className="details-body">{renderNodes(node.children)}</div>}
    </div>
  )
}

/** :::compare — h3 를 기준으로 좌/우 열을 나눈다. */
function Compare({ node }: { node: ContainerNode }) {
  const cols: { head: string; nodes: Node[] }[] = []
  for (const child of node.children) {
    if (child.kind === 'prose') {
      // 미리 raw HTML로 치환된 <h3 …>제목</h3> 을 열 구분자로 쓴다.
      const parts = child.text.split(/(?=<h3\b)/)
      for (const part of parts) {
        const h = /^<h3[^>]*>([\s\S]*?)<\/h3>/.exec(part)
        if (h) {
          cols.push({ head: h[1].replace(/<[^>]+>/g, ''), nodes: [] })
          const rest = part.slice(h[0].length)
          if (rest.trim()) cols[cols.length - 1].nodes.push({ kind: 'prose', text: rest })
        } else if (part.trim() && cols.length) {
          cols[cols.length - 1].nodes.push({ kind: 'prose', text: part })
        }
      }
      continue
    }
    if (cols.length) cols[cols.length - 1].nodes.push(child)
  }

  return (
    <div className="compare">
      {cols.map((c, i) => (
        <section key={i} className={i === 0 ? 'compare-col left' : 'compare-col right'}>
          <h4 className="compare-head">{c.head}</h4>
          <div className="compare-body">{renderNodes(c.nodes)}</div>
        </section>
      ))}
    </div>
  )
}

// ── 렌더 ────────────────────────────────────────────────────────
function renderNodes(nodes: Node[]) {
  return nodes.map((n, i) => {
    if (n.kind === 'code') return <CodeBlock key={i} node={n} />
    if (n.kind === 'container') return <Container key={i} node={n} />
    return <div key={i} className="prose" dangerouslySetInnerHTML={{ __html: marked.parse(n.text) as string }} />
  })
}

export function stripFrontmatter(src: string): { meta: Record<string, string>; body: string } {
  const m = /^---\n([\s\S]*?)\n---\n?/.exec(src)
  if (!m) return { meta: {}, body: src }
  const meta: Record<string, string> = {}
  for (const line of m[1].split('\n')) {
    const kv = /^(\w+):\s*(.*)$/.exec(line)
    if (kv) meta[kv[1]] = kv[2].trim().replace(/^["']|["']$/g, '')
  }
  return { meta, body: src.slice(m[0].length) }
}

export function Markdown({ source }: { source: string }) {
  const { nodes } = useMemo(() => {
    const { src } = extractHeadings(source)
    return { nodes: parseNodes(src) }
  }, [source])
  return <div className="md">{renderNodes(nodes)}</div>
}

export function useToc(source: string): Toc {
  return useMemo(() => extractHeadings(source).toc, [source])
}
