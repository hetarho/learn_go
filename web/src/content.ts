// 레포의 markdown 파일이 유일한 콘텐츠 소스다.
// 여기서 하는 일은 "파일을 읽어 화면이 쓸 모양으로 정리"하는 것뿐이고,
// 상태를 새로 만들거나 저장하지 않는다. (PROGRESS.md 가 진행 상태의 정본)
import PROGRESS_RAW from '../../PROGRESS.md?raw'
import CURRICULUM_RAW from '../../CURRICULUM.md?raw'
import JOURNAL_RAW from '../../JOURNAL.md?raw'
import TUTOR_RAW from '../../TUTOR.md?raw'
import RUBRIC_RAW from '../../RUBRIC.yaml?raw'

const lessonFiles = import.meta.glob('../../lessons/*/LESSON.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

export type Status = 'todo' | 'doing' | 'done' | 'redo'

export type Lesson = {
  id: string // "L01"
  num: number // 1
  title: string
  slug: string // "01-hello"
  phase: number
  status: Status
  codeScore: string
  compScore: string
  date: string
  body: string | null // LESSON.md 원문 (없으면 아직 안 쓴 레슨)
}

export type Phase = {
  num: number
  title: string // "툴체인"
  label: string // "Phase 0 — 툴체인"
  lessons: Lesson[]
}

// ── CURRICULUM.md: 레슨 slug + phase 소속 ────────────────────────
// "### L01 · Go 툴체인, 모듈, 패키지와 가시성 `01-hello`"
// "## Phase 0 — 툴체인 (L01)"
type CurriculumEntry = { id: string; slug: string; title: string; phase: number }

function parseCurriculum(): { entries: CurriculumEntry[]; phases: Map<number, string> } {
  const entries: CurriculumEntry[] = []
  const phases = new Map<number, string>()
  let current = 0

  for (const line of CURRICULUM_RAW.split('\n')) {
    const p = /^##\s+Phase\s+(\d+)\s+—\s+(.+?)(?:\s*\(L\d+.*\))?\s*$/.exec(line)
    if (p) {
      current = Number(p[1])
      phases.set(current, p[2].trim())
      continue
    }
    const l = /^###\s+(L\d{2})\s+·\s+(.+?)\s+`([^`]+)`\s*$/.exec(line)
    if (l) {
      entries.push({
        id: l[1],
        title: l[2].trim(),
        slug: l[3].replace(/\/$/, ''),
        phase: current,
      })
      continue
    }
    // 캡스톤 후반부(L37~L40)는 slug 없이 제목만 있다.
    const l2 = /^###\s+(L\d{2})\s+·\s+(.+?)\s*$/.exec(line)
    if (l2) {
      entries.push({ id: l2[1], title: l2[2].trim(), slug: `capstone-${l2[1].toLowerCase()}`, phase: current })
    }
  }
  return { entries, phases }
}

// ── PROGRESS.md: 상태 + 점수 ─────────────────────────────────────
// "| L01 | Go 툴체인·모듈·가시성 | ✅ | 3.8 | 3 | 07-29 |"
type ProgressRow = { id: string; status: Status; code: string; comp: string; date: string }

function statusOf(cell: string): Status {
  if (cell.includes('✅')) return 'done'
  if (cell.includes('🔄')) return 'doing'
  if (cell.includes('🔁')) return 'redo'
  return 'todo'
}

function parseProgressRows(): Map<string, ProgressRow> {
  const rows = new Map<string, ProgressRow>()
  const re = /^\|\s*(L\d{2})\s*\|([^|]*)\|([^|]*)\|([^|]*)\|([^|]*)\|([^|]*)\|/gm
  let m: RegExpExecArray | null
  while ((m = re.exec(PROGRESS_RAW))) {
    rows.set(m[1], {
      id: m[1],
      status: statusOf(m[3]),
      code: m[4].trim(),
      comp: m[5].trim(),
      date: m[6].trim(),
    })
  }
  return rows
}

// ── 조립 ────────────────────────────────────────────────────────
function buildLessons(): Lesson[] {
  const { entries } = parseCurriculum()
  const rows = parseProgressRows()
  const bodies = new Map<string, string>()
  for (const [path, raw] of Object.entries(lessonFiles)) {
    const slug = /lessons\/([^/]+)\/LESSON\.md$/.exec(path)?.[1]
    if (slug) bodies.set(slug, raw)
  }

  return entries.map((e) => {
    const row = rows.get(e.id)
    return {
      id: e.id,
      num: Number(e.id.slice(1)),
      title: e.title,
      slug: e.slug,
      phase: e.phase,
      status: row?.status ?? 'todo',
      codeScore: row?.code && row.code !== '-' ? row.code : '',
      compScore: row?.comp && row.comp !== '-' ? row.comp : '',
      date: row?.date && row.date !== '-' ? row.date : '',
      body: bodies.get(e.slug) ?? null,
    }
  })
}

export const lessons = buildLessons()

export const phases: Phase[] = (() => {
  const { phases: titles } = parseCurriculum()
  const byPhase = new Map<number, Lesson[]>()
  for (const l of lessons) {
    const arr = byPhase.get(l.phase) ?? []
    arr.push(l)
    byPhase.set(l.phase, arr)
  }
  return [...byPhase.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([num, ls]) => ({
      num,
      title: titles.get(num) ?? '',
      label: `Phase ${num} — ${titles.get(num) ?? ''}`,
      lessons: ls,
    }))
})()

export const lessonBySlug = (slug: string) => lessons.find((l) => l.slug === slug)

export const stats = (() => {
  const done = lessons.filter((l) => l.status === 'done')
  const scores = done.map((l) => Number(l.codeScore)).filter((n) => !Number.isNaN(n) && n > 0)
  return {
    total: lessons.length,
    done: done.length,
    percent: Math.round((done.length / lessons.length) * 100),
    avgCode: scores.length ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2) : '—',
    current: lessons.find((l) => l.status === 'doing') ?? lessons.find((l) => l.status !== 'done') ?? null,
  }
})()

/** PROGRESS.md 의 특정 `## 제목` 섹션 본문만 잘라낸다. */
export function section(md: string, heading: string): string {
  const lines = md.split('\n')
  const start = lines.findIndex((l) => l.startsWith('## ') && l.includes(heading))
  if (start === -1) return ''
  const rest = lines.slice(start + 1)
  const end = rest.findIndex((l) => l.startsWith('## '))
  return (end === -1 ? rest : rest.slice(0, end)).join('\n').trim()
}

export const docs = {
  progress: PROGRESS_RAW,
  curriculum: CURRICULUM_RAW,
  journal: JOURNAL_RAW,
  tutor: TUTOR_RAW,
  rubric: RUBRIC_RAW,
}
