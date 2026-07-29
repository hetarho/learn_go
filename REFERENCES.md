# REFERENCES — 채점 기준의 근거 출처

> 2026-07-29 부트스트랩 리서치. 모든 URL은 WebFetch로 접근 검증됨.
> 발견한 권고가 목표 코드베이스의 실측 패턴과 충돌하면 **코드베이스가 이긴다** — 하단 "충돌 노트" 참조.

## A. Go 언어 관용구 / 스타일

| # | 출처 | 핵심 |
|---|---|---|
| A1 | [Effective Go](https://go.dev/doc/effective_go) | naming(MixedCaps, getter에 Get 금지), 단일 메서드 인터페이스 `-er`, error는 값, panic 최소화 |
| A2 | [Go Code Review Comments](https://go.dev/wiki/CodeReviewComments) | 에러 문자열 소문자 시작·마침표 금지, 패키지명 stuttering 금지(`chubby.File`), 에러 `_` 버리기 금지, early return, 리시버 선택 기준(변경/mutex/큰 struct → 포인터) |
| A3 | [Go Proverbs](https://go-proverbs.github.io/) | "The bigger the interface, the weaker the abstraction" / "Errors are values" / "Don't just check errors, handle them gracefully" / "Don't panic" / "Clear is better than clever" / "Make the zero value useful" |
| A4 | [Jack Lindamood — accept interfaces, return structs](https://medium.com/@cep21/what-accept-interfaces-return-structs-means-in-go-2fe879e25ee8) + [Preemptive Interface Anti-Pattern](https://medium.com/@cep21/preemptive-interface-anti-pattern-in-go-54c18ac0668a) | 인터페이스는 필요해질 때(소비처에서) 만든다. 선제적 인터페이스는 복잡성. ※ 공식 proverb 아님, 커뮤니티 관용구 |
| A5 | [Uber Go Style Guide](https://github.com/uber-go/guide/blob/master/style.md) | sentinel은 `Err` prefix, 커스텀 타입은 `Error` suffix, **"handle errors once"**(로그+반환 동시 금지), 컴파일 타임 인터페이스 검증 `var _ I = (*T)(nil)`, mutex는 named field로 |
| A6 | [Google Go Style Guide](https://google.github.io/styleguide/go/) + [Best Practices](https://google.github.io/styleguide/go/best-practices) | clarity > cleverness, 에러 annotation에 중복 없는 컨텍스트(`"failed to"` 남발 금지), `%w`는 에러 체인을 API로 노출할 때 |
| A7 | [Working with Errors in Go 1.13](https://go.dev/blog/go1.13-errors) | `%w` → Unwrap 체인 → `errors.Is/As`; `%v`는 underlying error를 버림. **wrap 여부는 API 설계 결정** |
| A8 | [Go Concurrency Patterns: Context](https://go.dev/blog/context) + [context pkg docs](https://pkg.go.dev/context) | ctx는 항상 첫 파라미터·이름 `ctx`, struct에 저장 금지, `context.Value`는 request-scoped data 전용(옵션 파라미터 전달 남용 금지) |
| A9 | [Go Wiki: TableDrivenTests](https://go.dev/wiki/TableDrivenTests) | 테이블 + `t.Run` 서브테스트, 케이스 이름으로 실패 식별. **Go 1.22+에서 `tt := tt` 캡처 불필요** |
| A10 | [Google Best Practices — test doubles](https://google.github.io/styleguide/go/best-practices) | mock보다 실제 구현/fake 우선, `t.Helper()`로 실패 위치 보정, goroutine 안 `t.Fatal` 금지 |
| A11 | [When To Use Generics — Ian Lance Taylor](https://go.dev/blog/when-generics) | "Write code first, not types". 메서드만 호출한다면 인터페이스로 충분 |

## B. 아키텍처 / 방법론

| # | 출처 | 핵심 |
|---|---|---|
| B1 | [Hexagonal Architecture — Alistair Cockburn](https://alistair.cockburn.us/hexagonal-architecture/) | port는 application이 자기 필요로 선언, adapter는 바깥. "inside 코드가 outside로 새면 안 된다" |
| B2 | [The Clean Architecture — Robert Martin](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html) | The Dependency Rule: 의존성은 항상 안쪽으로. 경계를 넘을 땐 단순 자료구조만 |
| B3 | [Why Clean Architecture Struggles in Golang](https://dev.to/lucasdeataides/why-clean-architecture-struggles-in-golang-and-what-works-better-m4g) + [Three Dots Labs — Is Clean Architecture Overengineering?](https://threedots.tech/episode/is-clean-architecture-overengineering/) | Go에서 레이어 남발·사용처 하나뿐인 인터페이스는 anti-pattern. package-by-feature 권장 |
| B4 | [BoundedContext — Martin Fowler](https://martinfowler.com/bliki/BoundedContext.html) | 거대한 통일 모델 대신 context 단위 분리, context마다 일관된 언어 |
| B5 | [project-layout issue #117 — Russ Cox](https://github.com/golang-standards/project-layout/issues/117) | "this is not a standard Go project layout". `pkg/`는 근거 없는 관습 |
| B6 | [Organizing a Go module (공식)](https://go.dev/doc/modules/layout) | flat하게 시작, `cmd/`는 멀티 바이너리일 때, **`internal/`에 최대한 많이** 넣기를 공식 권장. `pkg/`는 공식 문서에 없음 |
| B7 | [Standard Package Layout — Ben Johnson](https://medium.com/@benbjohnson/standard-package-layout-7cdbc8391fc1) | 도메인 타입은 의존성 없는 패키지에, 구현은 의존성 이름 패키지(`postgres`, `http`)에, `main`이 조립 지점. `util` 패키지 금지 |
| B8 | [Compile-time DI with Wire (go.dev blog)](https://go.dev/blog/wire) + [google/wire](https://github.com/google/wire) | Go DI의 본질은 constructor injection. ※ wire는 2025-08 archive됨 → 도구가 아닌 패턴으로 평가 |
| B9 | [Composition Root — Mark Seemann](https://blog.ploeh.dk/2011/07/28/CompositionRoot/) | 조립은 entry point 근처 한 곳에서만. 라이브러리 패키지에 wiring 금지 |
| B10 | [12-factor: Config](https://12factor.net/config) / [Processes](https://12factor.net/processes) / [Logs](https://12factor.net/logs) | config는 env로("코드를 지금 공개해도 자격증명이 새지 않는가" 테스트), 프로세스는 stateless, 로그는 stdout 스트림 |

## C. 백엔드 실무 패턴

| # | 출처 | 핵심 |
|---|---|---|
| C1 | [PostgreSQL SELECT — Locking Clause (공식)](https://www.postgresql.org/docs/current/sql-select.html) | `SKIP LOCKED`는 공식 문서가 queue 용도로 직접 권장. 범용 조회에 쓰면 inconsistent view |
| C2 | [Postgres Job Queues & Failure By MVCC — brandur](https://brandur.org/postgres-queues) | 긴 트랜잭션 → dead tuple 스캔 폭발. claim은 짧게 commit하고 lease/상태 컬럼으로 소유권 관리 |
| C3 | [How to do distributed locking — Kleppmann](https://martin.kleppmann.com/2016/02/08/how-to-do-distributed-locking.html) | timeout 기반 lock만으로 상호 배제 보장 안 됨 → **fencing token**(단조 증가, storage가 낮은 토큰 거부) |
| C4 | [Stripe — idempotency](https://stripe.com/blog/idempotency) + [brandur — Idempotency Keys in Postgres](https://brandur.org/idempotency-keys) | client 생성 키 + 응답 replay, `(user_id, key)` unique index, 외부 호출은 트랜잭션 밖 |
| C5 | [use-the-index-luke — No OFFSET](https://use-the-index-luke.com/no-offset) | OFFSET은 선형 저하 + insert 시 중복/누락. keyset은 deterministic sort + unique tiebreaker + index 필요 |
| C6 | [pgxpool docs](https://pkg.go.dev/github.com/jackc/pgx/v5/pgxpool) + [HikariCP About Pool Sizing](https://github.com/brettwooldridge/HikariCP/wiki/About-Pool-Sizing) | 기본 `MaxConns = max(4, NumCPU)`. 공식: `(core × 2) + spindle`. 작은 풀이 오히려 빠르다 |
| C7 | [RFC 7517 (JWK)](https://datatracker.ietf.org/doc/html/rfc7517) + [Auth0 — JWKS](https://auth0.com/docs/secure/tokens/json-web-tokens/json-web-key-sets) | `kid`로 key rollover, JWKS 5–10분 캐싱, 모르는 kid → 캐시 무효화 후 재조회. stateless의 대가 = 즉시 revocation 불가 |
| C8 | [net/http Server.Shutdown](https://pkg.go.dev/net/http#Server.Shutdown) | listener 닫고 in-flight 대기, `ErrServerClosed`는 에러 아님, Shutdown return까지 기다려야 함 |
| C9 | [sqlc Query annotations](https://docs.sqlc.dev/en/latest/reference/query-annotations.html) | `:one/:many/:exec/:execrows` 구분, 생성 코드 수정 금지 |
| C10 | [pressly/goose](https://github.com/pressly/goose) | `-- +goose Up/Down`, `StatementBegin/End`, `NO TRANSACTION`(CONCURRENTLY), `goose_db_version` |
| C11 | [Buf Docs](https://buf.build/docs/) + [Connect Go Getting Started](https://connectrpc.com/docs/go/getting-started) | schema가 source of truth, lint/breaking check, 생성 인터페이스 구현 + mux mount, 하나의 핸들러가 Connect/gRPC/gRPC-Web 동시 지원 |

## 충돌 노트 — 리서치 권고 vs 목표 코드베이스 (코드베이스가 이긴다)

| 리서치 권고 | 목표 코드베이스 | 판정 |
|---|---|---|
| `golang-standards/project-layout`의 `pkg/` | `pkg/` 안 씀. `internal/<context>` 플랫 구조 | 코드베이스 승 — Russ Cox(B5)와 공식 문서(B6)도 같은 편. `pkg/` 사용을 가점 요소로 삼지 않는다 |
| Google 스타일(A6): 시스템 경계에서 `%v`로 도메인 에러 은닉 | 도메인 sentinel을 `%w`로 광범위하게 노출, `errors.Is` 400곳 | 코드베이스 승 — 이 코드베이스는 sentinel 체인을 **의도적으로 API로 취급**한다(A7의 "wrap 여부는 API 설계 결정"과 일치). rpc 어댑터의 Connect 코드 매핑이 클라이언트 노출을 차단하는 별도 경계 |
| Uber(A5): 컴파일 타임 인터페이스 검증 `var _ I = (*T)(nil)` | consumer-owned ports라 구현체가 인터페이스를 모름 — 검증 선언을 강제하지 않음 | 코드베이스 승 — 가점 요소로만, 필수 아님 |
| wire 같은 DI 도구(B8) | 도구 없음, `cmd/`에서 손으로 생성자 주입 | 코드베이스 승 — wire는 archive됐고(2025-08), 패턴(constructor injection + composition root)은 동일 |
| brandur(C2): 잡 처리를 claim 트랜잭션 안에 넣지 말 것 | lease/`locked_until` + fence 토큰으로 소유권 관리, 처리 후 별도 Complete/Fail | 충돌 아님 — 코드베이스가 권고를 그대로 따름. L33 채점 기준으로 사용 |
| Clean Architecture 원전(B2)의 다층 원 | 레이어 최소화: `ports.go`/`service.go`/`pg/`/`rpc/`만 | 코드베이스 승 — B3 비판론과 일치. **레이어 수를 가점 요소로 삼지 않는다** |
| Go 1.22 이전 `tt := tt` 루프 변수 캡처(A9) | Go 1.26 사용 | 채점에서 "필수"가 아닌 구버전 지식으로만 다룸 |
| testify/gomock 등 라이브러리 | 표준 `testing`만 + 손으로 쓴 fake | 코드베이스 승 — Google Best Practices(A10)의 "mock보다 fake" 권고와 일치 |
