# 학습 저널

새 세션은 맨 아래에 추가한다. 과거 기록은 수정하지 않는다.

---

## 2026-07-29 (세션 0) · 부트스트랩

### 한 것
- 환경 확인: Go 1.26.4 (macOS arm64 — 프로필상 WSL2였으나 실제는 Mac), Docker 28.1.1, git 설정 완료
- `git init` (main 브랜치) + `go mod init learn-go` (단일 모듈)
- 웹 리서치 3갈래 (Go 관용구/스타일 · 아키텍처/방법론 · 백엔드 실무 패턴) → `REFERENCES.md`
- `RUBRIC.yaml` / `CURRICULUM.md` / `PROGRESS.md` / `JOURNAL.md` / `README.md` / `.gitignore` 생성

### 리서치에서 채점 기준에 반영한 것 (요약)
- 에러 처리: `%w` vs `%v`는 API 설계 결정 (go.dev/blog/go1.13-errors), "handle errors once" (Uber), 에러 문자열 소문자·마침표 금지 (Code Review Comments)
- 인터페이스: consumer-owned ports는 Cockburn(원저자)·Ben Johnson·Go Proverbs("The bigger the interface, the weaker the abstraction")가 일치
- 레이아웃: `pkg/`는 표준 아님 (Russ Cox, project-layout issue #117), `internal/` 적극 활용이 공식 권장 (go.dev/doc/modules/layout)
- composition root: wiring은 main/cmd에서만 (Mark Seemann + go.dev/blog/wire)
- 테스트: Go 1.22+에서 `tt := tt` 루프 변수 캡처가 불필요해짐 → 채점 시 "구버전 지식"으로만 다룸
- 제네릭: "Write code first, not types" (Ian Lance Taylor)

### 다음에 이어갈 것
- L01 · Go 툴체인, 모듈, 패키지와 가시성

---

## 2026-07-30 (세션 1) · L01 시작 + 학습 환경 개편
- 커밋: `feat: 레슨 뷰어 웹 UI + 튜터 말투 지침`, `feat(L01): 레슨 본문 집필`

### 학습자 피드백 (중요)
1. **"채팅창에서 보니까 너무 안 보인다"** → 웹 UI를 만들어 레슨을 보면서 학습하기로.
2. **"말투가 완전 번역 말투라 이해가 잘 안 간다"** → 토스·네이버 D2·카카오 기술 블로그 톤을 기준으로 말투 지침을 만들었다.

### 한 것
- **레슨 뷰어**(`web/`, Vite + React 19 + marked + Prism, 의존성 6개)
  - 콘텐츠 소스는 여전히 git의 markdown이다. 뷰어는 상태를 저장하지 않는다.
    - `lessons/*/LESSON.md` → 레슨 본문 (`import.meta.glob` + HMR)
    - `PROGRESS.md` 표 → 레슨 상태·점수 (파싱)
    - `CURRICULUM.md`의 `### L01 · 제목 \`slug\`` 줄 → 레슨 목록·slug (파싱)
  - 학습용 커스텀 markdown 문법: `:::spec` / `:::compare`(TS↔Go 2단) / `:::gotcha` / `:::be` / `:::check` / `:::try` / `:::note` / `:::details`(힌트 접기)
  - 코드 블록: 파일명 헤더 + 줄 번호 + 복사 + `mark=3,5-7` 강조(채점 근거 지목용) + 탭 인덴트 유지
  - 다크/라이트, `[` `]` 레슨 이동, `t` 테마 전환, TOC
- **`TUTOR.md` 신규** — 말투 지침(해요체, 짧은 문장, 번역투 블랙리스트 17항목, before/after 예시) + `LESSON.md` 작성 형식 레퍼런스
- **`lessons/01-hello/LESSON.md`** — L01 본문을 새 말투로 집필. 데모 코드는 과제 정답이 되지 않도록 `mathx.Double`로 분리

### 세션 운영 방식 변경
레슨 본문은 이제 **채팅이 아니라 `LESSON.md`에 쓴다.** 채팅에는 3~4문장만 남기고, 질문·채점·힌트만 대화로 주고받는다. (`TUTOR.md` §2)

### 검증
- `pnpm typecheck` / `pnpm build` 통과. 파서를 실제 파일로 검증: 40레슨·7 Phase 전부 파싱, `:::check` 안의 `:::details` 중첩 정상, `:::compare` 2열 분리 정상.
- 개선 3건:
  - `:::compare` 안의 `### Go` 같은 헤딩이 문서 TOC에 섞이던 것 제외
  - 콜아웃 제목의 백틱을 `<code>`로 렌더
  - dev 서버 로그에 `Could not Fast Refresh ("stripFrontmatter" export is incompatible)`가 반복 출력됨 → 파싱(`markdown-parse.ts`)과 렌더링(`markdown.tsx`)을 분리해 해결. 렌더 모듈이 컴포넌트만 export하게 되니 경계가 깨끗해졌다. 마침 우리가 가르치려는 관심사 분리와 같은 모양이라 구조도 나아졌다.
  - 검증 방법: dev 서버가 변환해 내려주는 모듈을 받아 `registerExportsForReactRefresh` 주입 여부를 확인했다. `markdown.tsx` / `App.tsx` 둘 다 경계 ✓, 로그 경고 0건.

### L01 채점 (완료)

**코드 3.9 / 이해 3 — 통과.** Phase 0 게이트 통과.

| 축 | 점수 | 근거 |
|---|---|---|
| correctness | 4 | `gofmt -l` 조용, `go vet` exit 0, `go test` ok, `go run` 출력 확인 |
| go_idiom | 4 | `greet.Hello` 패키지명 중복 없음, exported/unexported 분리, red flag 0 |
| boundaries | 4 | `main.go` 가 조립만 함 |
| readability | 3 | exported `Hello` 에 doc comment 없음 / 파일명 `great.go` 오타(패키지는 `greet`) |
| error_handling · testability | N/A | L01 범위 밖 (L11 / L07) |

이해도 체크 3문항: 1번 3점(전이) · 2번 2점(설명) · 3번 2점(설명).
1번은 core 항목이라 3 필요 — `internal/` × 대소문자 2×2 예측을 4개 다 맞혀 도달했다.
특히 "서브트리 밖 + 소문자"에서 **경로 담장이 이름 담장보다 먼저 걸린다**를 맞혔다.

3번(순환 import가 설계에 주는 영향)은 재질문 3회가 필요했다. 첫 답은 사실 재진술
("막아버려서 순환하지 않게 막아준다"), 두 번째는 방향만("빌드 전에 설계"),
세 번째에 "의존성 방향을 미리 정해야 한다"로 도달. `dep-direction` 약점 등록 → L09에서 재확인.

### 학습자가 잡아낸 튜터의 결함 (3건)

이 세션의 실질적 산출물이다. 전부 학습자가 먼저 발견했다.

1. **L01이 `struct`(L05)로 가시성을 설명** — `type Config struct` 코드 블록. const 예시로 교체.
2. **L01 과제가 분기문(`if`, L03)을 요구** — `Hello("")` → `"안녕하세요, 낯선 분!"`.
   `greet_test.go` 의 `TestHelloEmptyName` 제거하고 CURRICULUM L03 산출물로 이관.
3. **`internal/` 실험 증거가 전부 `main.go`** — "main.go 안에서만 쓸 수 있나?"라는
   합리적 오해를 유발했다. `package main` 이 아닌 파일로 재실험해 위치만이 변수임을 보였다.

이 사고들 때문에 L02~L40 전수 대조를 했고 선행 개념 위반 6건을 더 찾았다(커밋 `eba2529`).
`tools/check-order.py` 로 기계화 — 다음부터 레슨 집필 후 반드시 돌린다.

### 레슨 구조 개편

개념 5개에 실습이 0개였고 맨 끝에 과제 하나뿐이었다("읽었지만 못 한다" 상태로 끝나는 구조).
개념별 `:::drill` 6개로 재구성하고, 실습 2·3이 **정반대 결과**(컴파일 에러 / 통과)를 내도록 짰다.
6개를 스크래치 복제본에서 전부 실행해 검증했고, 그 과정에서 내 실습에도 버그 2건이 있었다.
- `lessons/_scratch` → Go가 `_` 로 시작하는 디렉토리를 컴파일에서 제외해 internal 위반이 안 났다
- 실습 1의 `Hello()` 시그니처가 `greet_test.go` 와 어긋나 실습 6의 `go vet` 조건이 성립 불가였다

### 그 외

- 뷰어: 레슨 본문 우측정렬 → 중앙정렬, `:::drill` 콜아웃 추가, `gotcha` 라벨 중복 출력 수정
- 한국어 윤문: 연결어미 뒤 쉼표 7건, 해요체에 섞인 합니다체 2건, "지금 어디까지 왔나" → "학습 현황"
- dev 서버 포트 3010 고정
- gopls 특성 2건을 실습에 반영: 소문자 선택자만 있으면 import 를 지운다 / 터미널로
  디렉토리를 옮기면 진단이 낡는다 → 판정은 항상 `go build`

### 다음에 이어갈 것

- L02 집필 (zero value). struct 필드 예시 금지 — 그게 L01의 사고였다.
- 집필 후 `python3 tools/check-order.py --lessons`
