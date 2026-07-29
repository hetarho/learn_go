---
lesson: L01
slug: 01-hello
title: Go 툴체인, 모듈, 패키지와 가시성
phase: 0
duration: 45
focus: correctness
---

## Go에는 `export` 키워드가 없어요

TypeScript에서 뭔가를 밖으로 내보내려면 `export`를 붙이죠. Go에는 그런 키워드가 아예 없어요.
대신 **이름의 첫 글자가 대문자면 공개, 소문자면 비공개**예요.

:::compare
### TypeScript

```ts
// mathx.ts
export function double(n: number) {
	return n * 2
}

function half(n: number) {
	return n / 2
}
```

`export`가 붙은 `double`만 밖에서 쓸 수 있어요. 키워드로 정하죠.

### Go

```go
// mathx/mathx.go
package mathx

func Double(n int) int {
	return n * 2
}

func half(n int) int {
	return n / 2
}
```

`Double`은 공개, `half`는 비공개예요. 첫 글자로 정해져요.
:::

이게 함수만의 규칙이 아니에요. 타입, 상수, 변수, **struct의 필드**까지 전부 같아요.

```go
type Config struct {
	Name   string // 공개 필드 — 다른 패키지에서 읽고 쓸 수 있어요
	secret string // 비공개 필드 — 이 패키지 안에서만
}
```

지금은 사소해 보이지만, 이 규칙 하나가 나중에 회사 코드의 핵심 장치가 돼요.
"비공개 필드 + 공개 생성자만 제공"으로 만들면 **잘못된 상태의 값이 애초에 존재할 수 없게** 만들 수 있거든요. L16에서 이걸 직접 만들어봐요.

:::gotcha 비유가 어긋나는 지점
TS의 `export`는 **파일 단위**예요. 같은 파일 안에서는 `export` 없는 것도 다 보이죠.
Go의 대소문자는 **패키지(= 디렉토리) 단위**예요. 같은 디렉토리의 다른 파일에서는 소문자 함수도 그냥 보여요.
그래서 "파일을 나눈다"가 Go에서는 캡슐화가 아니에요. **디렉토리를 나눠야** 경계가 생겨요.
:::

## 패키지는 파일이 아니라 디렉토리예요

Go에서 **패키지 하나 = 디렉토리 하나**예요. 그 디렉토리 안의 모든 `.go` 파일이 같은 `package` 선언을 갖고, 서로를 import 없이 그냥 씁니다.

```text
lessons/01-hello/
├── main.go          package main
└── greet/
    ├── greet.go     package greet
    └── greet_test.go
```

`main.go`에서 `greet` 패키지를 쓰려면 import해야 해요. 경로는 **모듈 이름부터 시작하는 전체 경로**예요.

```go title=예시 mark=4
package main

import (
	"learn-go/lessons/01-hello/greet"
)
```

상대 경로(`./greet`)가 아니라는 점이 TS와 다르죠. 4번째 줄의 `learn-go`가 `go.mod`에 적힌 모듈 이름이에요.

그리고 규칙 하나. **import는 순환할 수 없어요.** A가 B를 import하고 B가 A를 import하면 컴파일 자체가 실패해요. 경고가 아니라 에러예요. 이 제약이 있어서 Go 프로젝트는 의존성 방향을 억지로라도 한 방향으로 정리하게 돼요. 회사 코드의 "의존성은 항상 안쪽으로" 규칙도 여기에 뿌리를 두고 있어요.

## `go.mod`는 `package.json`의 아주 작은 사촌이에요

이미 만들어둔 파일을 볼게요.

```text title=go.mod
module learn-go

go 1.26
```

`module` 줄이 이 레포의 import 경로 루트예요. `package.json`의 `name`에 해당하죠.

:::gotcha 비슷해 보이지만 다른 세 가지
**`node_modules`가 없어요.** 의존성은 홈 디렉토리의 전역 캐시에 딱 한 번 다운로드돼요.

**버전 선택 방식이 달라요.** npm은 semver 범위에서 최신을 고르지만, Go는 **최소 버전 선택(MVS)** 이에요. 필요한 것 중 가장 낮은 버전을 고르죠. 그래서 lockfile 없이도 빌드가 재현돼요.

**빌드 결과가 파일 하나예요.** `go build`가 뱉는 건 실행 파일 하나고, 그 안에 런타임까지 들어 있어요. 이게 오늘 마지막 BE 상식으로 이어져요.
:::

## `internal/`은 컴파일러가 지키는 담장이에요

Go에는 디렉토리 이름 하나로 동작하는 특별 규칙이 있어요. **`internal/` 아래의 패키지는 `internal/`의 부모 디렉토리 서브트리 안에서만 import할 수 있어요.**

```text
myapp/
├── internal/
│   └── billing/      ← myapp/ 안에서만 import 가능
├── cmd/api/          ← OK
└── ...

otherapp/             ← myapp/internal/billing 을 import하면 컴파일 에러
```

`package.json`의 `exports` 필드와 목적이 같아요. 하지만 그건 도구가 지켜주는 약속이고, `internal/`은 **언어가 강제**해요. 어기면 빌드가 안 됩니다.

회사 코드가 `internal/<context>` 구조를 쓰는 이유가 여기 있어요. 도메인 로직을 `internal/` 안에 두면 "외부에서 이걸 직접 쓰지 마세요"가 문서의 부탁이 아니라 **컴파일 에러**가 돼요.

:::note 왜 `pkg/`는 안 쓰나요
인터넷에서 `golang-standards/project-layout`이라는 레포를 보게 될 거예요. `pkg/` 디렉토리를 권하는데, Go 팀의 Russ Cox가 직접 "이건 표준이 아니다"라고 반박한 이력이 있어요.
공식 문서(`go.dev/doc/modules/layout`)는 오히려 **최대한 많은 코드를 `internal/`에 두라**고 권해요. 회사 코드도 `pkg/`를 쓰지 않아요. 근거는 `REFERENCES.md`의 B5, B6에 있어요.
:::

## 도구는 네 개만 알면 돼요

```bash
go run ./lessons/01-hello     # 컴파일하고 바로 실행 (바이너리를 남기지 않음)
go build ./...                # 전체 컴파일 — 에러 잡기용으로 제일 많이 씀
go vet ./...                  # 정적 분석. ESLint의 아주 작은 버전
gofmt -l .                    # 포맷이 어긋난 파일 목록. 설정 옵션이 0개예요
```

`gofmt`에 옵션이 없다는 게 포인트예요. Prettier 설정으로 팀이 싸울 일이 Go에는 없어요. 탭 인덴트도 `gofmt`가 정한 거라 그냥 따르면 돼요.

`go test`는 L07에서 본격적으로 다루지만, 오늘 과제 검증에 쓰니까 형태만 봐둬요.

```bash
go test ./lessons/01-hello/...
```

---

:::spec 첫 패키지와 가시성
- **파일 2개**
  - `lessons/01-hello/greet/greet.go` → `package greet`
  - `lessons/01-hello/main.go` → `package main`
- **시그니처**: `func Hello(name string) string`
- **요구사항**
  - `Hello("Gopher")` → `"안녕하세요, Gopher님!"`
  - `Hello("")` → `"안녕하세요, 낯선 분!"`
  - 인사말을 조립하는 부분(`~님!` 붙이기)은 **unexported 함수로 분리**한다 (예: `decorate`)
  - `main.go`는 `greet` 패키지를 import해서 `Hello` 결과를 `fmt.Println`으로 출력한다
- **금지**: 외부 라이브러리 (표준 라이브러리 `fmt`만)
- **완료 조건**: `go test ./lessons/01-hello/...` 통과 + `go run ./lessons/01-hello` 실행
- **채점**: `RUBRIC.yaml` code_review — 이번 레슨 중점 축은 `correctness`
:::

테스트 파일은 이미 있어요: `lessons/01-hello/greet/greet_test.go`. 실행 가능한 명세니까 **먼저 읽어보세요.**

:::details 첫 줄이 막힌다면
`greet.go`의 첫 줄은 `package greet`, `main.go`의 첫 줄은 `package main`이에요.
문자열을 합치는 건 `+`로도 되고 `fmt.Sprintf`로도 돼요. 둘 중 뭘 골랐는지 나중에 물어볼게요.
:::

:::try 담장을 직접 넘어보기
과제를 통과했으면 이 실험을 해봐요. 5분이면 돼요.

1. `main.go`에서 `greet.decorate("아무거나")`를 호출해보고 에러 메시지를 읽어요.
2. `greet/` 디렉토리 이름을 `internal/greet/`로 바꿔봐요. import 경로를 고치면 여전히 되나요?
3. `lessons/02-values/`에서 `lessons/01-hello/internal/greet`를 import해보면요?

3번의 에러 메시지가 오늘의 핵심이에요. 나오는 문장을 그대로 채팅에 붙여주세요.
:::

---

:::check internal의 강제력
`internal/`은 정확히 무엇을 강제하나요? 회사 코드가 `internal/<context>` 구조를 쓰는 이유를 **가시성 관점에서** 설명해보세요.

:::details 방향만
"누가 못 하게 막는가"를 두 단계로 나눠 생각해봐요. 사람이 지키는 규칙인가요, 도구가 막는 건가요, 컴파일러가 막는 건가요?
:::
:::

:::check 파일 vs 디렉토리
`greet.go`를 `greet.go`와 `decorate.go` 두 파일로 쪼개면 `decorate`는 여전히 `greet.go`에서 보일까요? 왜 그런가요?
:::

:::check 순환 import
A 패키지가 B를, B가 A를 import하면 Go는 컴파일을 거부해요. TypeScript는 순환 import를 허용하는데(런타임에 `undefined`가 튀어나오죠), Go가 아예 막아버린 게 설계에 어떤 영향을 줄까요?
:::

:::be 런타임 없는 배포
`go build`가 만드는 건 실행 파일 하나예요. 그 안에 Go 런타임과 가비지 컬렉터까지 정적으로 링크돼 있어요. 그래서 서버에 Go를 설치할 필요가 없어요.

Node 앱을 배포할 때는 컨테이너에 Node 런타임과 `node_modules`가 들어가야 하죠. Go는 바이너리만 복사하면 끝이에요.

이게 나중에 **distroless 이미지**를 쓸 수 있는 이유예요. 셸도, 패키지 매니저도, libc조차 없는 이미지에 바이너리 하나만 넣고 실행해요. 공격 표면이 극단적으로 줄어들고 이미지 크기도 수십 MB로 떨어져요. L40에서 직접 만들어봐요.
:::
