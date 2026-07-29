import { useEffect, useState } from 'react'
import {
  docs,
  lessonBySlug,
  lessons,
  phases,
  section,
  stats,
  stripFrontmatter,
  type Lesson,
  type Status,
} from './content'
import { Markdown } from './markdown'
import { useToc } from './markdown-parse'

// ── 라우팅: 해시만 쓴다 (라우터 라이브러리 없이) ───────────────────
type Route = { view: 'home' } | { view: 'lesson'; slug: string } | { view: 'doc'; name: DocName }
type DocName = 'curriculum' | 'journal' | 'tutor' | 'rubric' | 'progress'

function parseHash(): Route {
  const h = location.hash.replace(/^#\/?/, '')
  if (!h) return { view: 'home' }
  const [head, tail] = h.split('/')
  if (head === 'l' && tail) return { view: 'lesson', slug: tail }
  if (['curriculum', 'journal', 'tutor', 'rubric', 'progress'].includes(head)) {
    return { view: 'doc', name: head as DocName }
  }
  return { view: 'home' }
}

function useRoute(): Route {
  const [route, setRoute] = useState<Route>(parseHash)
  useEffect(() => {
    const on = () => {
      setRoute(parseHash())
      window.scrollTo(0, 0)
    }
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])
  return route
}

// ── 테마 ────────────────────────────────────────────────────────
function useTheme() {
  const [theme, setTheme] = useState(() => localStorage.getItem('lg-theme') ?? 'dark')
  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem('lg-theme', theme)
  }, [theme])
  return { theme, toggle: () => setTheme((t) => (t === 'dark' ? 'light' : 'dark')) }
}

const STATUS_ICON: Record<Status, string> = { done: '✓', doing: '›', redo: '↻', todo: '' }

// ── 사이드바 ────────────────────────────────────────────────────
function Sidebar({ route }: { route: Route }) {
  const activeSlug = route.view === 'lesson' ? route.slug : null
  const [openPhases, setOpenPhases] = useState<Set<number>>(() => {
    const active = activeSlug ? lessonBySlug(activeSlug) : null
    return new Set([active?.phase ?? stats.current?.phase ?? 0])
  })

  const toggle = (n: number) =>
    setOpenPhases((prev) => {
      const next = new Set(prev)
      next.has(n) ? next.delete(n) : next.add(n)
      return next
    })

  return (
    <nav className="sidebar">
      <a className="brand" href="#/">
        <span className="brand-mark">go</span>
        <span className="brand-text">
          learn-go
          <small>백엔드 코드 리딩 훈련</small>
        </span>
      </a>

      <div className="progress-card">
        <div className="progress-top">
          <strong>
            {stats.done} <span>/ {stats.total}</span>
          </strong>
          <span className="progress-pct">{stats.percent}%</span>
        </div>
        <div className="bar">
          <div className="bar-fill" style={{ width: `${Math.max(stats.percent, 1.5)}%` }} />
        </div>
        <div className="progress-meta">
          코드 평균 <b>{stats.avgCode}</b>
        </div>
      </div>

      <div className="side-links">
        <a href="#/progress">진행 상태</a>
        <a href="#/curriculum">커리큘럼</a>
        <a href="#/rubric">채점 기준</a>
        <a href="#/journal">저널</a>
        <a href="#/tutor">튜터 지침</a>
      </div>

      <div className="phase-list">
        {phases.map((p) => {
          const done = p.lessons.filter((l) => l.status === 'done').length
          const open = openPhases.has(p.num)
          return (
            <section key={p.num} className={open ? 'phase open' : 'phase'}>
              <button className="phase-head" onClick={() => toggle(p.num)} type="button">
                <span className="phase-caret">{open ? '▾' : '▸'}</span>
                <span className="phase-name">
                  <em>P{p.num}</em> {p.title}
                </span>
                <span className="phase-count">
                  {done}/{p.lessons.length}
                </span>
              </button>
              {open && (
                <ul className="lesson-list">
                  {p.lessons.map((l) => (
                    <li key={l.id}>
                      <a
                        className={[
                          'lesson-link',
                          `st-${l.status}`,
                          l.slug === activeSlug ? 'active' : '',
                          l.body ? '' : 'empty',
                        ].join(' ')}
                        href={`#/l/${l.slug}`}
                      >
                        <span className="lesson-id">{l.id}</span>
                        <span className="lesson-title">{l.title}</span>
                        <span className="lesson-status">{STATUS_ICON[l.status]}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )
        })}
      </div>
    </nav>
  )
}

// ── 홈 ──────────────────────────────────────────────────────────
function Home() {
  const next = section(docs.progress, '다음 세션 시작점')
  const doing = section(docs.progress, '진행 중')
  const weak = section(docs.progress, '약점 목록')

  return (
    <article className="page">
      <header className="page-head">
        <p className="eyebrow">Go 백엔드 학습</p>
        <h1>지금 어디까지 왔나</h1>
        <p className="lede">
          진행 상태의 정본은 <code>PROGRESS.md</code>예요. 이 화면은 그 파일을 읽어서 보여주기만 해요.
        </p>
      </header>

      <div className="stat-row">
        <div className="stat">
          <span className="stat-label">완료</span>
          <strong className="stat-value">
            {stats.done}
            <small>/ {stats.total}</small>
          </strong>
        </div>
        <div className="stat">
          <span className="stat-label">진행률</span>
          <strong className="stat-value">
            {stats.percent}
            <small>%</small>
          </strong>
        </div>
        <div className="stat">
          <span className="stat-label">코드 점수 평균</span>
          <strong className="stat-value">{stats.avgCode}</strong>
        </div>
        <div className="stat">
          <span className="stat-label">현재</span>
          <strong className="stat-value sm">{stats.current?.id ?? '—'}</strong>
        </div>
      </div>

      {stats.current && (
        <a className="next-card" href={`#/l/${stats.current.slug}`}>
          <span className="next-label">다음 레슨</span>
          <strong>
            {stats.current.id} · {stats.current.title}
          </strong>
          <span className="next-go">시작하기 →</span>
        </a>
      )}

      {next && (
        <section className="block">
          <h2>▶ 다음 세션 시작점</h2>
          <Markdown source={next} />
        </section>
      )}
      {doing && (
        <section className="block">
          <h2>⏸ 진행 중</h2>
          <Markdown source={doing} />
        </section>
      )}
      {weak && (
        <section className="block">
          <h2>약점 목록</h2>
          <Markdown source={weak} />
        </section>
      )}
    </article>
  )
}

// ── 레슨 ────────────────────────────────────────────────────────
function LessonView({ lesson }: { lesson: Lesson }) {
  const raw = lesson.body ?? ''
  const { meta, body } = stripFrontmatter(raw)
  const toc = useToc(body)
  const idx = lessons.findIndex((l) => l.id === lesson.id)
  const prev = lessons[idx - 1]
  const next = lessons[idx + 1]

  if (!lesson.body) {
    return (
      <article className="page">
        <header className="page-head">
          <p className="eyebrow">
            Phase {lesson.phase} · {lesson.id}
          </p>
          <h1>{lesson.title}</h1>
        </header>
        <div className="empty-state">
          <p>이 레슨의 본문은 아직 없어요.</p>
          <p className="muted">
            튜터가 세션을 시작하면 <code>lessons/{lesson.slug}/LESSON.md</code>가 만들어지고, 이 화면에 바로 나타나요.
            커리큘럼상 목표와 체크 질문은 <a href="#/curriculum">커리큘럼</a>에서 볼 수 있어요.
          </p>
        </div>
      </article>
    )
  }

  return (
    <div className="lesson-wrap">
      <article className="page">
        <header className="page-head lesson-head">
          <p className="eyebrow">
            Phase {lesson.phase} · {lesson.id}
            {meta.duration && <span className="dot">·</span>}
            {meta.duration && <span>{meta.duration}분</span>}
            {meta.focus && <span className="focus-tag">중점 축 {meta.focus}</span>}
          </p>
          <h1>{lesson.title}</h1>
          {(lesson.status !== 'todo' || lesson.codeScore) && (
            <div className="score-row">
              <span className={`chip st-${lesson.status}`}>
                {lesson.status === 'done'
                  ? '통과'
                  : lesson.status === 'doing'
                    ? '진행 중'
                    : lesson.status === 'redo'
                      ? '재작업'
                      : '미시작'}
              </span>
              {lesson.codeScore && (
                <span className="chip">
                  코드 <b>{lesson.codeScore}</b>
                </span>
              )}
              {lesson.compScore && (
                <span className="chip">
                  이해 <b>{lesson.compScore}</b>
                </span>
              )}
              {lesson.date && <span className="chip ghost">{lesson.date}</span>}
            </div>
          )}
        </header>

        <Markdown source={body} />

        <footer className="lesson-nav">
          {prev ? (
            <a href={`#/l/${prev.slug}`} className="nav-prev">
              <span>← 이전</span>
              <b>
                {prev.id} {prev.title}
              </b>
            </a>
          ) : (
            <span />
          )}
          {next ? (
            <a href={`#/l/${next.slug}`} className="nav-next">
              <span>다음 →</span>
              <b>
                {next.id} {next.title}
              </b>
            </a>
          ) : (
            <span />
          )}
        </footer>
      </article>

      {toc.length > 2 && (
        <aside className="toc">
          <p className="toc-label">이 레슨</p>
          <ul>
            {toc.map((t) => (
              <li key={t.id} className={`lv-${t.level}`}>
                <a href={`#${t.id}`}>{t.text}</a>
              </li>
            ))}
          </ul>
        </aside>
      )}
    </div>
  )
}

// ── 문서 ────────────────────────────────────────────────────────
const DOC_TITLE: Record<DocName, string> = {
  progress: '진행 상태',
  curriculum: '커리큘럼',
  journal: '학습 저널',
  tutor: '튜터 지침',
  rubric: '채점 기준',
}

function DocView({ name }: { name: DocName }) {
  const src = name === 'rubric' ? '```yaml\n' + docs.rubric + '\n```' : docs[name]
  return (
    <article className="page">
      <header className="page-head">
        <p className="eyebrow">
          {name === 'rubric' ? 'RUBRIC.yaml' : `${name.toUpperCase()}.md`}
        </p>
        <h1>{DOC_TITLE[name]}</h1>
      </header>
      <Markdown source={src} />
    </article>
  )
}

// ── 앱 ──────────────────────────────────────────────────────────
export default function App() {
  const route = useRoute()
  const { theme, toggle } = useTheme()
  const lesson = route.view === 'lesson' ? lessonBySlug(route.slug) : null

  // [ / ] 로 레슨 이동, t 로 테마 전환
  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      if (e.key === 't') return toggle()
      if (!lesson) return
      const i = lessons.findIndex((l) => l.id === lesson.id)
      if (e.key === '[' && lessons[i - 1]) location.hash = `#/l/${lessons[i - 1].slug}`
      if (e.key === ']' && lessons[i + 1]) location.hash = `#/l/${lessons[i + 1].slug}`
    }
    window.addEventListener('keydown', on)
    return () => window.removeEventListener('keydown', on)
  }, [lesson, toggle])

  return (
    <div className="shell">
      <Sidebar route={route} />
      <main className="main">
        <div className="topbar">
          <span className="kbd-hint">
            <kbd>[</kbd> <kbd>]</kbd> 레슨 이동 · <kbd>t</kbd> 테마
          </span>
          <button className="theme-btn" onClick={toggle} type="button">
            {theme === 'dark' ? '☾' : '☀'}
          </button>
        </div>
        {route.view === 'home' && <Home />}
        {route.view === 'doc' && <DocView name={route.name} />}
        {route.view === 'lesson' &&
          (lesson ? (
            <LessonView lesson={lesson} />
          ) : (
            <article className="page">
              <h1>없는 레슨이에요</h1>
              <p>
                <a href="#/">처음으로</a>
              </p>
            </article>
          ))}
      </main>
    </div>
  )
}
