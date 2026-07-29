# learn-go — Go 백엔드 코드 리딩 훈련 레포

FE 6년차 → 회사 Go 백엔드를 "완벽히 이해하며 읽는" 상태까지. 40레슨 + 캡스톤.
Claude Code 튜터와 함께, **직접 코드를 쓰면서** 진행한다.

**진행률: 0 / 40 (Phase 0 시작 전) · 다음: L01 Go 툴체인, 모듈, 패키지와 가시성**

## 이 레포 읽는 순서
| 파일 | 무엇 |
|---|---|
| `PROGRESS.md` | **지금 어디까지 했는지, 다음에 뭘 할지** ← 먼저 읽기 |
| `CURRICULUM.md` | 40레슨 전체 커리큘럼 |
| `RUBRIC.yaml` | 코드/이해도 채점 기준 |
| `JOURNAL.md` | 세션별 상세 로그 |
| `REFERENCES.md` | 채점 기준의 근거 출처 |
| `lessons/NN-slug/` | 레슨별 실습 코드 + 내 요약(`NOTES.md`) |
| `capstone/` | 최종 프로젝트(2 바이너리 미니 서버) |

## 이어서 학습하기
Claude Code를 이 디렉토리에서 열고 튜터 프롬프트를 붙여넣으면, `PROGRESS.md`를 읽고 이어서 진행한다.

## 로컬 실행
```bash
go build ./... && go test ./...
docker compose up -d db   # L24 이후
```
