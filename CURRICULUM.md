# 커리큘럼 정본 — 7 Phase / 40 레슨

> 레슨 하나 = 세션 하나(30~60분). 실습 코드는 `lessons/NN-slug/`에 쌓인다. 실행은 `go run ./lessons/NN-slug`.
> 표기: **목표** / **산출물** / **체크**(이해도 질문) / **BE**(백엔드 상식, 있는 레슨만).
>
> 졸업 기준: **회사 프로젝트의 Go 백엔드를 완벽히 이해하며 읽을 수 있는 상태.**
> 목표 코드베이스: Go 1.26 단일 모듈, ConnectRPC + buf(contract-first), Postgres 17 + pgvector,
> pgx/pgxpool + sqlc + goose, Postgres 잡 큐(`FOR UPDATE SKIP LOCKED`), JWT+JWKS 무세션 인증,
> domain-first ports-and-adapters(`cmd/` composition root, `internal/<context>`, consumer-owned ports),
> 표준 `testing`만 사용(테이블 주도 + 손으로 쓴 fake), Docker 멀티스테이지 → distroless.

---

## Phase 0 — 툴체인 (L01)

### L01 · Go 툴체인, 모듈, 패키지와 가시성 `01-hello`
- **목표**: `go run`/`build`/`vet`/`gofmt`, `package main`, 대문자=exported·소문자=unexported, `internal/`의 강제력, import cycle 금지.
- **산출물**: `main.go` + 별도 패키지 하나를 만들어 unexported 접근 실패/성공을 직접 경험.
- **체크**: "`internal/`은 무엇을 강제하는가? 회사 코드가 `internal/<context>`를 쓰는 이유를 가시성 관점에서."
- **BE**: 단일 정적 바이너리 → 런타임 없는 배포(distroless의 전제).

---

## Phase 1 — 기본 문법 (L02–L07)

### L02 · 변수, 타입, zero value `02-values`
- **목표**: `var` vs `:=`, **zero value**(Go에 `undefined` 없음), `string`/`[]byte`/`rune`, 암묵 변환 없음, 상수.
- **산출물**: 모든 기본 타입의 zero value 출력 + `strconv` 변환.
- **체크**: "TS `let x: number`는 `undefined`일 수 있는데 Go `var x int`는 왜 아닌가? struct 필드에서 이 차이가 만드는 문제는?"

### L03 · 함수, 다중 반환값, 제어 흐름 `03-func-flow`
- **목표**: `(T, error)` 관례, named return, `if err != nil` 리듬, `if`의 init statement, `for`(유일한 루프), `switch`(fallthrough 없음).
- **산출물**: `parseAge(s string) (int, error)` 류 3개 + 호출부.
- **체크**: "예외 던지기 vs error 반환 — 호출부 모양이 어떻게 다르고, 어느 쪽이 에러를 잊기 쉬운가?"

### L04 · slice와 map `04-slice-map`
- **목표**: array vs slice, `len`/`cap`, `append` 재할당, **aliasing 함정**, `map` comma-ok, 순회 순서 무작위, nil slice vs nil map.
- **산출물**: aliasing 버그를 일부러 만들고 고치기 + map 집계 함수.
- **체크**: "`append` 결과를 재대입하는 이유? nil map에 쓰기 vs nil slice에 append는 각각 어떻게 되나?"

### L05 · struct와 메서드, 값/포인터 리시버 `05-struct-method`
- **목표**: struct 리터럴, 메서드 선언, **값 vs 포인터 리시버**, 메서드 셋, 회사 관례(서비스=포인터, 어댑터=값).
- **산출물**: 값 리시버가 변경을 잃는 예제 + 포인터로 고친 버전.
- **체크**: "어댑터는 값 리시버, 서비스는 포인터 리시버인 이유를 각각 추론해봐."

### L06 · 포인터와 옵셔널 값 `06-pointer`
- **목표**: `&`/`*`, nil, 포인터를 쓰는 3가지 이유(변경·복사 회피·**옵셔널**), `*time.Time` nil = "없음", nil 역참조 panic. **TS 대응물 없음 → 비유 금지, 메모리 그림으로 천천히.**
- **산출물**: `DeletedAt *time.Time`을 안전하게 다루는 함수.
- **체크**: "zero `time.Time`으로 미설정 표현 vs `*time.Time` nil — 트레이드오프는? 회사 코드는 둘 다 쓴다, 각각 언제일까?"

### L07 · 표준 testing 기초 `07-testing`
- **목표**: `_test.go` 규칙, `go test ./...`, `t.Errorf` vs `t.Fatalf`, `t.Run`, `t.Helper()`. **assert 라이브러리 없이** 비교를 손으로.
- **산출물**: L03/L04 함수의 테스트.
- **체크**: "testify가 없을 때 실패 메시지를 유용하게 만드는 책임은 누구에게 있나?"

---

## Phase 2 — 핵심 관용구 ★가장 깊게 (L08–L19)

### L08 · 인터페이스와 암묵적 구현 `08-interface`
- **목표**: 메서드 집합, **implements 선언 없음**, 작은 인터페이스, 인터페이스 값의 (타입, 값) 구조, **nil 인터페이스 vs nil 포인터를 담은 인터페이스** 함정.
- **산출물**: `Notifier` + 구현체 2개 + 인터페이스로 받는 함수.
- **체크**: "TS structural typing과의 가장 큰 차이 하나. (힌트: 런타임에 인터페이스 값이 무엇을 들고 있나)"

### L09 · consumer-owned ports `09-ports`
- **목표**: **쓰는 쪽 패키지가 인터페이스를 선언한다.** `ports.go`의 역할, "필요한 메서드만", 구현체가 암묵적으로 만족.
- **산출물**: `service/ports.go` + 별도 `memstore` 구현체 + 조립 파일. **구현체가 service를 import하지 않음**을 확인.
- **체크**: "인터페이스를 구현체 패키지에 두면 어떤 의존 방향 문제가 생기나? 소비자가 선언하면 무엇이 뒤집히나?"
- **BE**: 도메인이 인프라를 모르게 하는 장치 = ports-and-adapters의 핵심.

### L10 · 인터페이스 임베딩과 표면 조합 `10-iface-embed`
- **목표**: 인터페이스 안 인터페이스, 작은 것들을 합쳐 "표면" 만들기(회사의 TxSurface), `io.Reader`/`Writer`/`ReadWriter`.
- **산출물**: `UserReader`+`NoteWriter`를 임베딩한 `TxSurface`와 이를 만족하는 struct 하나.
- **체크**: "왜 큰 인터페이스를 처음부터 선언하지 않고 임베딩으로 합치는가?"

### L11 · 에러 1층: sentinel error와 `errors.Is` `11-err-sentinel`
- **목표**: `error`는 인터페이스, `errors.New`, **패키지 레벨 `var ErrNotFound`**, `errors.Is`(문자열 비교 금지), 도메인 에러를 한 파일에 모으는 관행.
- **산출물**: `errors.go` sentinel 3개 + 반환하는 서비스 함수 + 분기 테스트.
- **체크**: "에러 문자열 비교는 왜 위험한가? sentinel error는 사실상 무엇의 역할인가(TS로 비유하면)?"

### L12 · 에러 2층: `%w` 래핑과 체인 `12-err-wrap`
- **목표**: `fmt.Errorf("get user %s: %w", id, err)`, `%w` vs `%v`, `errors.Unwrap`, **언제 래핑하고 언제 그냥 반환하나**, 로그와 반환을 동시에 하지 않는 규칙.
- **산출물**: 3층 호출 스택에서 최하단 sentinel이 최상단 `errors.Is`로 잡히는 것을 테스트로 증명.
- **체크**: "`%v`로 래핑하면 무엇이 깨지나? `errors.Is` 400곳이라는 사실과 어떻게 연결되나?"

### L13 · 에러 3층: 커스텀 타입, `errors.As`, behavior interface `13-err-types`
- **목표**: `Error() string` struct로 **데이터를 실은 에러**, `Unwrap()`으로 sentinel 연결, `errors.As`, Is vs As, **behavior interface**(`interface{ Retryable() bool }`)를 As로 발견.
- **산출물**: `ValidationError{Field string}` + `Unwrap() → ErrInvalidInput` + As로 필드 꺼내는 호출부 + `Retryable()` 하나.
- **체크**: "Is와 As는 각각 언제? 잡 큐의 '재시도 가능 에러' 판별은 어느 쪽을 어떻게?"

### L14 · `context.Context` `14-context`
- **목표**: **첫 파라미터 관례**, `WithCancel`/`WithTimeout`, `Done()`/`Err()`, **context value + unexported key 타입**, value 남용 안티패턴, `Background()`는 어디서만 만드나.
- **산출물**: `platform/auth` 흉내: `WithUserID` / `UserIDFrom` + unexported `type ctxKey struct{}`.
- **체크**: "context key를 왜 unexported로? 다른 패키지가 같은 문자열 키를 쓰면?"
- **BE**: 요청 스코프 값(user id, request id)이 서버에 왜 필요한가.

### L15 · 클로저 DI: 주입된 clock과 id 생성기 `15-closure-di`
- **목표**: 함수는 값, 캡처, **`now func() time.Time`을 struct 필드로 주입**, 함수를 반환하는 함수(미들웨어 예고).
- **산출물**: `Service{now func() time.Time}` + 고정 시각 주입으로 결정론적 테스트.
- **체크**: "`time.Now()`를 직접 부르면 왜 테스트가 어렵나? React에서 같은 문제를 어떻게 다뤘는지와 비교."

### L16 · 검증하는 생성자와 불변식 `16-constructor`
- **목표**: `NewService(deps) (*Service, error)` — **의존성 누락 시 sentinel error**, unexported 필드 + 생성자 전용 생성으로 "잘못된 상태의 값"을 타입으로 차단.
- **산출물**: `ServiceDeps` + nil마다 다른 sentinel + 테이블 테스트.
- **체크**: "unexported 필드 + 생성자만 노출하면 무엇을 보장하나? 왜 '패키지 경계로 불변식을 강제한다'인가?"

### L17 · defer 3패턴과 panic/recover `17-defer-recover`
- **목표**: defer 실행/인자 평가 시점, ① 리소스 정리 ② `defer tx.Rollback()`(commit 후 no-op) ③ **named return + `defer recover()` → panic을 error로**, panic은 거의 안 쓴다.
- **산출물**: `safeRun(fn func() error) (err error)` + 테스트.
- **체크**: "named return 없이 recover만 하면 왜 에러를 전달할 수 없나? 인터셉터의 panic recovery는 어느 패턴인가?"

### L18 · typed string enum과 시간 `18-enum-time`
- **목표**: `type JobKind string` + const 블록, **`iota`를 안 쓰는 이유**(문자열이 곧 DB/wire 값), `Valid()`, 항상 UTC, zero time = 미설정, date-only, `time.Duration`.
- **산출물**: `JobKind`/`JobStatus` + `Valid()` + UTC 정규화 + date-only 비교.
- **체크**: "iota int enum이 DB 컬럼/wire 값이 되면 어떤 위험이? 문자열 enum이 무엇을 사준 건가?"
- **BE**: DB에 저장된 표현은 마이그레이션 없이 못 바꾼다.

### L19 · 테이블 주도 테스트와 손으로 쓴 stateful fake `19-table-fake`
- **목표**: 테이블 테스트 관용구, `t.Parallel()`과 루프 변수, `t.Helper()`, **mock 라이브러리 없이 stateful fake**(map 기반 in-memory Store가 port를 만족).
- **산출물**: L09 `Store`의 `fakeStore`(상태 + 호출 기록) + 서비스 로직 테이블 테스트 6케이스 이상.
- **체크**: "gomock 없이 fake를 손으로 쓰면 뭘 얻고 뭘 잃나? port가 작을수록 왜 쉬워지나?"

---

## Phase 3 — 표준 라이브러리 웹서버 (L20–L23)

### L20 · `net/http`: 핸들러와 mux `20-http`
- **목표**: `http.Handler`/`HandlerFunc`, `ServeMux`, `*http.Request`/`ResponseWriter`, 상태 코드, JSON 인·디코딩과 struct 태그(**가장자리에서만**), `http.Server` 타임아웃.
- **산출물**: 인메모리 저장소 JSON 서버(GET/POST 각 1) + `curl` 확인.
- **체크**: "`http.Handler`가 메서드 하나짜리 인터페이스라는 사실이 미들웨어를 가능하게 하는 이유."
- **BE**: 서버 타임아웃을 안 걸면 무슨 일이 생기나.

### L21 · 미들웨어 체인, request id, 구조화 로그 `21-middleware`
- **목표**: `func(http.Handler) http.Handler`, 체인 합성, **실행 순서(바깥→안, 응답은 반대)**, `X-Request-Id` 생성/전파 + context 저장, `log/slog`, ResponseWriter 래핑으로 상태 코드 캡처.
- **산출물**: `requestID` → `logger` → `recoverPanic` 3개 + 합성 함수.
- **체크**: "axios interceptor와의 공통점·차이점? 순서를 바꾸면 panic recovery가 왜 망가지나?"
- **BE**: request id 상관관계 / 에러 마스킹.

### L22 · 고루틴 최소한, `select`, graceful shutdown, CORS `22-shutdown`
- **목표**: `go` 키워드, 서버를 고루틴에 띄우고 메인은 신호를 기다리는 구조, `signal.NotifyContext`, `select`로 serve-vs-shutdown, `srv.Shutdown(ctx)` 드레인, 서버 관점 CORS/preflight. **채널 파이프라인·worker pool·errgroup은 다루지 않는다.**
- **산출물**: L21 서버에 graceful shutdown + CORS 미들웨어, `Ctrl+C`로 진행 중 요청이 끝나는 것 관찰.
- **체크**: "graceful shutdown이 없으면 배포 때 사용자에게 뭐가 보이나? `select`는 여기서 정확히 무엇 둘을 기다리나?"
- **BE**: 무중단 배포 / CORS는 브라우저가 강제하는 규칙이지 보안 경계가 아니다.

### L23 · JWT/JWKS 무세션 인증 + mutex TTL 캐시 `23-auth`
- **목표**: Bearer 파싱, JWT 구조, **공개키 서명 검증**과 JWKS, claims를 struct embedding으로, 인증 미들웨어가 user id를 context에, JWKS를 `sync.RWMutex` + TTL 캐시.
- **산출물**: 인증 미들웨어(fake JWKS 제공자) + 실패 케이스 테이블 테스트 + TTL 캐시.
- **체크**: "세션/쿠키 vs JWT+JWKS를 서버 상태 관점에서. 서버는 왜 인증 DB 조회가 없나, 그 대가는?"
- **BE**: JWKS / per-user 격리의 출발점(context의 user id → 이후 모든 쿼리의 `WHERE user_id`).

---

## Phase 4 — 데이터베이스 (L24–L29)

### L24 · Postgres, pgx/pgxpool, 커넥션 풀 `24-pgx`
- **목표**: `docker compose`로 Postgres 17+pgvector, `pgxpool.New`, **프로세스당 풀 하나**, `QueryRow`/`Query`/`Exec`, `pgx.ErrNoRows` → 도메인 sentinel 변환, DSN을 env로.
- **산출물**: `docker-compose.yml` + 풀 열고 CRUD.
- **체크**: "커넥션 풀은 왜 필요한가? 무한정 키우면 왜 안 되나? 요청마다 새 커넥션의 문제는?"
- **BE**: 커넥션은 비싼 자원이고 DB에 상한이 있다.

### L25 · goose 마이그레이션 `25-goose`
- **목표**: 번호 붙은 SQL + `-- +goose Up/Down`, up/down/status, `goose_db_version`, **되돌릴 수 있는 변경 vs 파괴적 변경**, 배포에서 마이그레이션 선행 이유.
- **산출물**: `users`/`notes` 마이그레이션 2~3개 + down 실습.
- **체크**: "구버전과 신버전 서버가 잠시 동시에 도는 상황에서 안전한 마이그레이션이란?"
- **BE**: 스키마도 버전 관리 대상.

### L26 · sqlc와 pg 어댑터(행↔도메인) `26-sqlc`
- **목표**: `sqlc.yaml`, `-- name: X :one/:many/:exec`, 생성 코드는 손대지 않는다, 핵심: **`pg/`가 sqlc 행을 도메인 타입으로 변환**해 도메인이 sqlc/pgx를 모르게.
- **산출물**: `query.sql` 4개 + 생성 + `pg/store.go`(매핑, port를 암묵적으로 만족) + 도메인이 pgx를 import하지 않음 확인.
- **체크**: "ORM 대신 sqlc면 뭘 얻나? `pg/`가 sqlc 행을 그대로 반환하면 아키텍처의 어떤 규칙이 깨지나?"
- **BE**: contract-first 코드 생성 — 스키마가 진실의 원천, 타입은 파생물.

### L27 · 트랜잭션 클로저 패턴 `27-tx`
- **목표**: ACID 감각, `pgx.Tx` begin/commit/rollback, **`InXxxTx(ctx, fn func(TxSurface) error) error`** 직접 작성, 트랜잭션 스코프 저장소를 fn에 넘기기, 장기 트랜잭션 주의.
- **산출물**: 두 테이블 원자적 갱신 use-case + fn이 에러 반환 시 롤백됨을 통합 테스트로 증명.
- **체크**: "클로저로 감싸면 호출자가 절대 잊을 수 없게 되는 것은? `defer tx.Rollback()`이 commit 후 문제되지 않는 이유는?"
- **BE**: "둘 다 되거나 둘 다 안 된다"가 필요한 순간.

### L28 · 인덱스, keyset 페이지네이션, 멱등성, per-user 격리 `28-sql-craft`
- **목표**: 인덱스의 원리, 복합 인덱스 컬럼 순서, 부분 인덱스, `EXPLAIN`, **OFFSET의 문제**와 keyset 커서, 멱등성(dedup key + `ON CONFLICT DO NOTHING`), `FOR UPDATE`·advisory lock 개요, **모든 쿼리에 `WHERE user_id`**.
- **산출물**: keyset 쿼리 + 복합 인덱스 마이그레이션 + 멱등 insert + 같은 요청 두 번에도 행 하나임을 테스트.
- **체크**: "OFFSET 1000이 느린 이유와, 그 사이 행이 삽입되면 사용자가 겪는 버그? keyset 커서의 기준은?"
- **BE**: 멱등성 / keyset / 복합·부분 인덱스 / per-user 격리(인증은 통과했지만 남의 데이터를 읽는 사고).

### L29 · 통합 테스트 `t.Skip`과 pgvector `29-integration`
- **목표**: 유닛(fake) vs 통합(실 Postgres) 역할 분담, **env 없으면 `t.Skip`** 관용구, 테스트 격리(롤백/스키마 초기화), pgvector `vector` 컬럼·유사도 검색·HNSW(정확도-속도 트레이드오프).
- **산출물**: `TEST_DATABASE_URL` 없으면 skip하는 통합 테스트 + 유사도 검색 쿼리.
- **체크**: "왜 실패시키지 않고 skip하나? 그 위험은? HNSW가 B-tree와 근본적으로 다른 점은?"

---

## Phase 5 — 실전 스택 (L30–L35)

### L30 · protobuf와 buf: contract-first `30-proto`
- **목표**: `.proto` 문법(message, **field number를 바꾸면 안 되는 이유**, service, rpc), `buf.yaml`/`buf.gen.yaml`, 생성으로 Go 스텁 + TS 클라이언트 동시 획득.
- **산출물**: `proto/notes/v1/notes.proto`(unary 3개) + `buf generate`.
- **체크**: "손으로 유지하는 OpenAPI vs contract-first codegen. FE 개발자로서 이 파이프라인이 실제로 뭘 바꿔주나?"
- **BE**: 계약이 한 곳에 있으면 FE/BE 타입 불일치가 구조적으로 사라진다.

### L31 · ConnectRPC 서버, rpc 어댑터, 에러 코드 매핑 `31-connect`
- **목표**: Connect 핸들러를 `net/http` mux에 붙이기(**결국 HTTP 서버다**), `*connect.Request/Response[T]`, **`rpc/`가 proto↔도메인 변환**, 도메인 sentinel → Connect 코드를 **한 곳에서** 매핑.
- **산출물**: `rpc/handler.go` + `errorCode(err error) connect.Code` + 테이블 테스트.
- **체크**: "에러 코드 매핑이 각 핸들러에 흩어지면 뭐가 나빠지나? proto 타입이 서비스 시그니처에 등장하면 어떤 위반인가?"

### L32 · 인터셉터 체인 조립 `32-interceptor`
- **목표**: `connect.UnaryInterceptorFunc`, 체인 순서와 이유(**panic recovery → request id → 마스킹 → 로깅 → 인증 → 계정 상태**), 각 단계가 context에 무엇을 넣고 꺼내나, 미들웨어(HTTP) vs 인터셉터(RPC) 역할 분리.
- **산출물**: 6단 체인 + "로그에는 상세, 클라이언트에는 마스킹"을 테스트로 증명.
- **체크**: "인증이 로깅보다 안쪽인 이유? 마스킹이 로깅보다 바깥이 아니면 무슨 문제가?"

### L33 · Postgres를 잡 큐로: SKIP LOCKED, lease, 백오프, dead-letter `33-jobqueue`
- **목표**: `jobs` 스키마(kind, payload, status, run_at, attempts, locked_until, fence), **`FOR UPDATE SKIP LOCKED`로 클레임**하는 이유, lease/`locked_until`과 죽은 워커 복구, **fence 토큰**으로 좀비 워커의 늦은 쓰기 차단, 지수 백오프, `max_attempts` 초과 시 dead-letter.
- **산출물**: 마이그레이션 + `Claim`/`Complete`/`Fail`(백오프) + dead-letter 이동 + 워커 2개 동시 클레임에도 중복 없음을 통합 테스트로 증명.
- **체크**: "`SKIP LOCKED` 없이 `FOR UPDATE`만이면 워커 2개는 어떻게 되나? 워커가 잡을 들고 죽으면? fence 토큰이 막는 정확한 사고 시나리오는?"
- **BE**: 왜 Redis/Kafka 없이 Postgres로 충분할 수 있는가 / 잡 핸들러는 왜 두 번 실행돼도 안전해야 하나(멱등성 재등장).

### L34 · 제네릭 `Runner[J Job]`과 `cmd/worker` `34-runner`
- **목표**: 제네릭 기초를 **딱 이 용도만큼**(타입 파라미터·제약·추론), `Runner[J Job]`으로 잡 종류별 타입 안전 실행기, **단일 스레드 폴링 루프**, 유휴 sleep, context 취소로 종료, **두 번째 바이너리의 존재 이유**와 얇은 main.
- **산출물**: `Runner[J Job]` + payload 언마샬 + 핸들러 등록 + `cmd/worker/main.go` + fake 큐 유닛 테스트.
- **체크**: "제네릭 없이 `any`+타입 단정이면 뭘 잃나? API와 워커를 왜 같은 바이너리에 안 넣었을까(스케일링·배포 관점)?"

### L35 · blank import 자기 등록, mock 폴백, no-op Sentry `35-registry`
- **목표**: `init()`, **blank import로 어댑터 자기 등록** 플러그인 패턴과 트레이드오프, 키 없으면 mock 폴백, **인터페이스 뒤 Sentry가 DSN 없으면 no-op**, env config 읽고 검증.
- **산출물**: `llm` 팩토리 + 어댑터 2개 자기 등록 + `cmd`에서 blank import + `ErrorReporter` no-op 구현.
- **체크**: "blank import 한 줄을 지우면 무슨 일이 생기고 컴파일러는 왜 못 잡나? no-op 구현이 nil 체크보다 나은 이유는?"

---

## Phase 6 — 캡스톤: 목표 코드베이스의 미니어처 (L36–L40)

주제: **일기 저장 API(`journal`)** — 작성/조회/목록(keyset), JWT 인증 + per-user 격리, 작성 시 임베딩 잡 enqueue → 워커 처리, 2 바이너리, 표준 testing만.

### L36 · 설계를 학습자가 직접 세운다 `capstone/`
- **목표**: 학습자가 **직접** 디렉토리 트리와 각 파일 책임, import 허용 방향을 문서화. 튜터는 아키텍처 규칙 위반만 지적하고 **정답 레이아웃을 먼저 제시하지 않는다.**
- **산출물**: `capstone/DESIGN.md`(패키지 트리, import 허용 목록, 도메인 타입 초안, proto 계약 초안).
- **체크**: "이 트리에서 'sqlc 행이 도메인으로 새는' 경로가 물리적으로 가능한 지점은? 어떻게 막을 건가?"

### L37 · 캡스톤 1: 계약 · 스키마 · 데이터 계층
- **목표**: proto + buf generate, goose 마이그레이션(users/entries/jobs + 복합·부분 인덱스), sqlc 쿼리(keyset 포함), `pg/` 매핑, 순수 도메인 타입 + sentinel error 파일.
- **산출물**: 위 전부 + `pg` 통합 테스트(`t.Skip`).
- **체크**: "도메인 패키지의 import 목록을 소리내 읽어봐. 표준 라이브러리 외에 무엇이 있나, 있으면 왜?"

### L38 · 캡스톤 2: 서비스 · rpc · 인터셉터 · 인증
- **목표**: `ports.go` + `service.go`(주입된 clock/id, 트랜잭션 클로저) + `rpc/` + 에러 매핑 한 곳 + 6단 인터셉터 + JWT/JWKS + user id 격리 + `cmd/api` 얇은 main(composition root).
- **산출물**: 서버 구동, 인증 요청으로 작성/조회, 남의 일기 접근이 not-found로 차단됨을 테스트로 증명.
- **체크**: "`cmd/api/main.go`에서 구체 타입 생성이 몇 군데인가? 서비스 계층은 자기가 Postgres 위에서 도는 걸 아는가 — 코드로 근거를."

### L39 · 캡스톤 3: 워커 · jobs 큐 · 테스트 스위트
- **목표**: 작성과 잡 enqueue를 같은 트랜잭션에, `Runner[J Job]` + 폴링 루프 + `cmd/worker`, 백오프/dead-letter, 임베딩 어댑터 mock 폴백, 테이블 테스트 + stateful fake로 서비스 커버.
- **산출물**: `go test ./...` 전부 통과 + 워커가 임베딩 컬럼을 채우는 것 관찰 + 일부러 실패시켜 재시도/dead-letter 확인.
- **체크**: "insert와 enqueue를 같은 트랜잭션에 넣는 이유? 다른 트랜잭션이면 어떤 사고가 가능한가?"

### L40 · 캡스톤 4: Docker · 배포 · 최종 코드 리딩 시험
- **목표**: 멀티스테이지 Dockerfile(`CGO_ENABLED=0` → distroless), 이미지 2개, 배포 시 마이그레이션 선행. 그리고 **최종 시험**: 튜터가 목표 코드베이스 패턴들을 섞은 **학습자가 처음 보는 Go 코드 200~300줄**을 작성해 제시하고, 학습자가 읽으며 패턴을 지목·설명한다. 졸업 체크리스트로 채점.
- **산출물**: Dockerfile + 빌드/실행 + `capstone/EXAM.md` 답변 기록 + `PROGRESS.md` 졸업 판정.
- **BE**: distroless와 정적 링킹 / 배포 순서(마이그레이션 → 롤아웃).
