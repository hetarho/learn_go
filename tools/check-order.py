#!/usr/bin/env python3
"""선행 개념 검사 — 아직 안 배운 개념으로 레슨을 설명하고 있는지 찾는다.

L01에서 struct(L05)를 설명 재료로 쓰고, 과제가 분기문(L03)을 요구하던 사고가
있었다. 사람 눈으로는 40개 레슨을 매번 대조할 수 없어서 기계로 돌린다.

    python3 tools/check-order.py           # CURRICULUM.md 검사
    python3 tools/check-order.py --lessons # lessons/*/LESSON.md 본문까지 검사

위반이 있으면 exit 1. 레슨을 새로 쓸 때마다 돌린다 (TUTOR.md §3).
"""

import re
import sys
import pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent

# 개념 → 처음 가르치는 레슨 번호. CURRICULUM.md 의 목표란이 근거다.
# 여기 없는 개념은 검사되지 않는다 — 새 개념을 도입하면 이 표에 추가할 것.
CONCEPTS = [
    ("struct",            r'\bstruct\b',                                  5),
    ("메서드/리시버",       r'리시버|메서드 셋',                             5),
    ("포인터",             r'포인터|&/\*|\*time\.Time',                     6),
    ("interface",         r'인터페이스|\binterface\b',                      8),
    ("errors 패키지",      r'errors\.(Is|As|New|Unwrap)|sentinel',          11),
    ("%w 래핑",            r'%w|fmt\.Errorf',                              12),
    ("context",           r'context\.Context|ctx context|WithCancel|WithTimeout', 14),
    ("클로저 DI",          r'클로저|캡처',                                  15),
    ("defer",             r'\bdefer\b',                                   17),
    ("panic/recover",     r'\brecover\(\)|panic을',                        17),
    ("임베딩",             r'임베딩|embedding',                             10),
    ("테이블 주도 테스트",   r'테이블 주도|테이블 테스트|t\.Parallel',          19),
    ("고루틴/select",      r'고루틴|\bgoroutine\b|\bselect\b로',             22),
    ("mutex",             r'sync\.(RW)?Mutex',                            23),
    ("트랜잭션",           r'트랜잭션|tx\.(Commit|Rollback)|pgx\.Tx',        27),
    ("제네릭",             r'제네릭|타입 파라미터',                          34),
    ("init/blank import", r'init\(\)|blank import',                       35),
]

# 정당한 예외. 앞을 가리키는 것 자체는 괜찮다 — "L05에서 배운다"처럼
# 미래 참조라고 명시했거나, 개념이 아니라 증상·소재로만 언급한 경우.
# (개념명, 레슨번호, 이유)
ALLOW = [
    ("errors 패키지", 3,  "(T, error) 관례가 L03 의 주제. error 가 인터페이스라는 사실만 L11"),
    ("panic/recover", 6,  "nil 역참조가 죽는다는 증상 경고. recover 구문은 L17"),
    ("포인터",        5,  "리시버 설명에 필요한 최소 도입. 용도·옵셔널은 L06 (명시됨)"),
    ("임베딩",        23, "L10 에서 배운 struct 임베딩의 적용"),
    ("트랜잭션",      17, "L27 로 미룬다고 본문에 명시됨"),
    ("테이블 주도 테스트", 16, "L19 에서 정식으로 다룬다고 명시됨"),
    ("메서드/리시버",  9,  "L05 이후이므로 후방 참조"),
    ("struct",        2,  "'struct 필드에서 터지는 건 L05' 라고 미래 참조로만 언급"),
    ("포인터",        2,  "'해법은 L06 포인터에서' 라고 미래 참조로만 언급"),
]


def lesson_blocks(text):
    """### Lnn 헤딩 기준으로 레슨별 본문을 모은다."""
    out, cur = {}, None
    for line in text.split('\n'):
        m = re.match(r'^#{2,3} L(\d+)', line)
        if m:
            cur = int(m.group(1))
            out[cur] = []
        elif cur is not None:
            if re.match(r'^#{2,3} ', line) and not re.match(r'^#{2,3} L\d+', line):
                cur = None
            else:
                out[cur].append(line)
    return {k: '\n'.join(v) for k, v in out.items()}


def check(blocks, source):
    allow = {(n, l) for n, l, _ in ALLOW}
    violations = []
    for name, pat, intro in CONCEPTS:
        rx = re.compile(pat)
        for num in sorted(blocks):
            if num >= intro or (name, num) in allow:
                continue
            for line in blocks[num].split('\n'):
                if rx.search(line):
                    violations.append((num, name, intro, line.strip(), source))
                    break
    return violations


def main():
    targets = [(ROOT / 'CURRICULUM.md', None)]
    if '--lessons' in sys.argv:
        for p in sorted(ROOT.glob('lessons/*/LESSON.md')):
            m = re.search(r'lesson:\s*L(\d+)', p.read_text())
            if m:
                targets.append((p, int(m.group(1))))

    all_v = []
    for path, fixed in targets:
        if not path.exists():
            continue
        text = path.read_text()
        blocks = {fixed: text} if fixed else lesson_blocks(text)
        all_v += check(blocks, path.relative_to(ROOT))

    if not all_v:
        print(f"선행 개념 검사 통과 — 검사 대상 {len(targets)}개 파일")
        return 0

    print(f"선행 개념 위반 {len(all_v)}건\n")
    for num, name, intro, line, src in sorted(all_v):
        print(f"  L{num:02d} 가 '{name}'(도입 L{intro:02d})를 먼저 씀  [{src}]")
        print(f"      {line[:120]}")
    print("\n고치는 방법: 개념을 빼거나, 도입 레슨을 앞으로 옮기거나,")
    print("'L05 에서 배운다'처럼 미래 참조로 명시한 뒤 ALLOW 에 근거와 함께 추가한다.")
    return 1


if __name__ == '__main__':
    sys.exit(main())
