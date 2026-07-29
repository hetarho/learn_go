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
