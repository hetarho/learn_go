#!/usr/bin/env python3
"""지금 어디서 이어가야 하는지를 한 화면으로 출력한다.

PROGRESS.md 가 상태의 정본이다. 이 스크립트는 그것을 읽어서
"다음에 할 일"까지 판정해준다. /start-study 스킬이 가장 먼저 실행한다.

    python3 tools/study-status.py
"""

import json
import re
import subprocess
import pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
DONE, DOING, REDO, TODO = '✅', '🔄', '🔁', '⬜'


def run(*cmd, timeout=90):
    try:
        p = subprocess.run(cmd, cwd=ROOT, capture_output=True, text=True, timeout=timeout)
        return p.returncode, (p.stdout + p.stderr).strip()
    except Exception as e:
        return -1, str(e)


def section(md, heading):
    """## 제목 섹션 본문만 잘라낸다 (web/src/content.ts 와 같은 규칙)."""
    lines = md.split('\n')
    for i, l in enumerate(lines):
        if l.startswith('## ') and heading in l:
            rest = lines[i + 1:]
            for j, r in enumerate(rest):
                if r.startswith('## '):
                    return '\n'.join(rest[:j]).strip()
            return '\n'.join(rest).strip()
    return ''


def main():
    progress = (ROOT / 'PROGRESS.md').read_text()
    curriculum = (ROOT / 'CURRICULUM.md').read_text()

    # ── 레슨 진행표에서 다음 레슨 찾기 ────────────────────────────
    rows = re.findall(r'^\|\s*(L\d+)\s*\|([^|]*)\|\s*(\S+)\s*\|([^|]*)\|([^|]*)\|([^|]*)\|',
                      progress, re.M)
    done = [r for r in rows if r[2] == DONE]
    pending = [r for r in rows if r[2] != DONE]
    nxt = pending[0] if pending else None

    # ── 커리큘럼에서 slug·목표 ────────────────────────────────────
    slug, goal = None, None
    if nxt:
        m = re.search(rf'^### {nxt[0]} · (.+?) `([^`]+)`', curriculum, re.M)
        if m:
            title_full, slug = m.group(1).strip(), m.group(2)
            after = curriculum[m.end():]
            g = re.search(r'- \*\*목표\*\*:\s*(.+)', after)
            goal = g.group(1).strip() if g else None

    lesson_md = ROOT / 'lessons' / slug / 'LESSON.md' if slug else None
    has_body = bool(lesson_md and lesson_md.exists())

    # ── 학습자 구현 파일이 있나 ───────────────────────────────────
    impl = []
    if slug and (ROOT / 'lessons' / slug).exists():
        impl = [str(p.relative_to(ROOT)) for p in (ROOT / 'lessons' / slug).rglob('*.go')
                if not p.name.endswith('_test.go')]

    print("═" * 66)
    print(" learn-go — 학습 상태")
    print("═" * 66)

    for label, pat in [("마지막 세션", r'마지막 세션'), ("완료", r'완료'),
                       ("현재 Phase", r'현재 Phase'), ("코드 평균", r'누적 코드 점수 평균'),
                       ("학습 시간", r'총 학습 시간')]:
        m = re.search(rf'^\|[^|]*{pat}[^|]*\|\s*([^|]+?)\s*\|', progress, re.M)
        if m:
            print(f"  {label:12} {m.group(1)}")

    print()
    if not nxt:
        print("  모든 레슨 완료 — 졸업 판정으로.")
    else:
        print(f"  다음 레슨    {nxt[0]} · {title_full if slug else nxt[1].strip()}")
        print(f"  slug        {slug or '(커리큘럼에 slug 없음)'}")
        print(f"  LESSON.md   {'있음' if has_body else '없음 — 집필부터'}")
        if impl:
            print(f"  학습자 코드  {', '.join(impl)}")
        if goal:
            print(f"  목표        {goal[:150]}")

    # ── 진행 중 / 약점 ────────────────────────────────────────────
    doing = section(progress, '진행 중')
    if doing and '없음' not in doing[:20]:
        print(f"\n  ── 진행 중 ──")
        for l in doing.split('\n')[:8]:
            print(f"  {l}")

    weak = section(progress, '약점 목록')
    wrows = [r for r in re.findall(r'^\|\s*([a-z-]+)\s*\|\s*([^|]+?)\s*\|', weak, re.M)
             if r[0] not in ('태그',) and not set(r[0]) <= {'-'}]
    if wrows:
        print(f"\n  ── 약점 {len(wrows)}건 (과제·질문에 재등장시킬 것) ──")
        for tag, desc in wrows:
            print(f"  · {tag}: {desc[:100]}")

    # ── 환경 점검 ─────────────────────────────────────────────────
    print(f"\n  ── 환경 ──")
    checks = []
    rc, out = run('gofmt', '-l', '.')
    checks.append(("gofmt", "깨끗" if not out else f"미포맷: {out.splitlines()[:3]}"))
    rc, out = run('go', 'build', './...')
    checks.append(("go build", "통과" if rc == 0 else out.splitlines()[0][:90]))
    rc, out = run('go', 'test', './...')
    if 'no test files' in out and rc == 0:
        checks.append(("go test", "통과"))
    else:
        checks.append(("go test", "통과" if rc == 0 else
                       next((l for l in out.splitlines() if 'FAIL' in l or '.go:' in l), out[:90])[:90]))
    rc, _ = run('python3', 'tools/check-order.py', '--lessons')
    checks.append(("선행 개념", "통과" if rc == 0 else "위반 있음 — check-order.py 확인"))
    rc, _ = run('curl', '-s', '-o', '/dev/null', '-m', '2', 'http://localhost:3010/')
    checks.append(("뷰어 :3010", "떠 있음" if rc == 0 else "안 떠 있음 — pnpm dev"))
    for k, v in checks:
        print(f"  {k:12} {v}")

    # ── 다음 동작 판정 ────────────────────────────────────────────
    print(f"\n  ── 다음 동작 ──")
    if not nxt:
        action = "졸업 판정 (RUBRIC.yaml graduation)"
    elif not has_body:
        action = f"{nxt[0]} LESSON.md 집필 → check-order.py → 학습자에게 3~4문장 안내"
    elif not impl:
        action = f"{nxt[0]} 학습자가 실습 1부터 진행 중. 에러 메시지 오면 확인해준다"
    else:
        action = f"{nxt[0]} 구현 검증(gofmt→vet→test→run) → 코드 채점 → 이해도 체크"
    print(f"  {action}")
    print("═" * 66)


if __name__ == '__main__':
    main()
