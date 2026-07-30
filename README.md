# learn-go — Go 백엔드 코드 리딩 훈련 레포

FE 6년차 → 회사 Go 백엔드를 "완벽히 이해하며 읽는" 상태까지. 40레슨 + 캡스톤.
Claude Code 튜터와 함께, **직접 코드를 쓰면서** 진행한다.

**진행률: 0 / 40 (Phase 0 진행 중) · 다음: L01 Go 툴체인, 모듈, 패키지와 가시성**

## 학습은 웹 UI로 본다

```bash
pnpm install   # 처음 한 번만
pnpm dev       # http://localhost:3010
```

레슨 본문(`lessons/*/LESSON.md`)을 읽기 좋게 렌더링해준다. 코드 블록에 줄 번호·파일명·복사 버튼이 붙고, TypeScript ↔ Go 대조와 과제 명세·체크 질문이 카드로 나온다.

- 사이드바의 진행 상태는 **`PROGRESS.md`를 읽어서** 보여준다. 뷰어는 상태를 저장하지 않는다.
- markdown을 저장하면 화면이 바로 갱신된다.
- 단축키: `[` `]` 레슨 이동, `t` 테마 전환.

## 이 레포 읽는 순서
| 파일 | 무엇 |
|---|---|
| `PROGRESS.md` | **지금 어디까지 했는지, 다음에 뭘 할지** ← 먼저 읽기 |
| `TUTOR.md` | 튜터 말투 지침 + `LESSON.md` 작성 형식 |
| `CURRICULUM.md` | 40레슨 전체 커리큘럼 |
| `RUBRIC.yaml` | 코드/이해도 채점 기준 |
| `JOURNAL.md` | 세션별 상세 로그 |
| `REFERENCES.md` | 채점 기준의 근거 출처 + 충돌 노트 |
| `lessons/NN-slug/LESSON.md` | 레슨 본문 (튜터가 쓴다) |
| `lessons/NN-slug/*.go` | 실습 구현 (**학습자만** 쓴다) |
| `lessons/NN-slug/NOTES.md` | 내 요약 (**학습자만** 쓴다) |
| `capstone/` | 최종 프로젝트(2 바이너리 미니 서버) |
| `web/` | 레슨 뷰어 (Vite + React, Go 모듈과 무관) |

## 이어서 학습하기
Claude Code를 이 디렉토리에서 열고 튜터 프롬프트를 붙여넣으면, `PROGRESS.md`와 `TUTOR.md`를 읽고 이어서 진행한다.

## 로컬 실행
```bash
go build ./... && go test ./...
docker compose up -d db   # L24 이후
```
