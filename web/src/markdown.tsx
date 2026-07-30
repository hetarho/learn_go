// LESSON.md 를 학습용 컴포넌트로 렌더링한다. 파싱은 markdown-parse.ts 가 한다.
// 이 모듈은 컴포넌트만 export 한다 (React Fast Refresh 경계 유지).
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
import { useDocument, type CodeNode, type ContainerNode, type Node } from './markdown-parse'

marked.setOptions({ gfm: true, breaks: false })

// styles.css 의 .code-pre line-height 와 반드시 일치해야 mark 오버레이가 줄에 맞는다.
const LINE_H = 25

function escapeHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
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

const CALLOUTS: Record<string, { icon: string; label: string }> = {
  drill: { icon: '⌨️', label: '실습' },
  spec: { icon: '📝', label: '과제' },
  gotcha: { icon: '⚠️', label: '주의' },
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

/** :::compare — 미리 raw HTML 로 치환된 h3 를 기준으로 좌/우 열을 나눈다. */
function Compare({ node }: { node: ContainerNode }) {
  const cols: { head: string; nodes: Node[] }[] = []
  for (const child of node.children) {
    if (child.kind === 'prose') {
      for (const part of child.text.split(/(?=<h3\b)/)) {
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

function renderNodes(nodes: Node[]) {
  return nodes.map((n, i) => {
    if (n.kind === 'code') return <CodeBlock key={i} node={n} />
    if (n.kind === 'container') return <Container key={i} node={n} />
    return <div key={i} className="prose" dangerouslySetInnerHTML={{ __html: marked.parse(n.text) as string }} />
  })
}

export function Markdown({ source }: { source: string }) {
  const { nodes } = useDocument(source)
  return <div className="md">{renderNodes(nodes)}</div>
}
