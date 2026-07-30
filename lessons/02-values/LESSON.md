---
lesson: L02
slug: 02-values
title: 변수, 타입, zero value
phase: 1
duration: 50
focus: correctness
---

## Go에는 `undefined`가 없어요

TypeScript에서 `let n: number`를 선언하면 값은 `undefined`예요. 대입할 때까지 "아직 없음" 상태로 있죠.
Go에는 그 상태가 아예 없어요. 선언하는 순간 타입이 정해둔 **zero value**가 들어가요.

:::compare
### TypeScript

```ts
let n: number
console.log(n)     // undefined
console.log(n + 1) // NaN
```

"값이 아직 안 들어왔다"가 타입 안에 들어 있어요.

### Go

```go
var n int
fmt.Println(n)     // 0
fmt.Println(n + 1) // 1
```

선언과 초기화가 한 몸이에요. 빈 칸이 생길 틈이 없어요.
:::

Go가 이걸 왜 언어 규칙으로 만들었을까요? **선언된 변수는 언제 읽어도 쓸 수 있는 값이다**를 보장하려고요.
그래서 `undefined`를 읽다가 터지는 부류의 버그가 통째로 없어져요. 대신 잃는 것도 있는데 그건 오늘 마지막에 볼게요.

zero value는 타입마다 정해져 있어요. 표로 외우기 전에 직접 찍어봐요.

:::drill 1. zero value 여섯 개를 눈으로 확인하기
파일 하나로 시작해요.

```go title=lessons/02-values/main.go
package main

import "fmt"

func main() {
	var i int
	var f float64
	var s string
	var b bool
	var by byte
	var r rune

	fmt.Printf("int      %v\n", i)
	fmt.Printf("float64  %v\n", f)
	fmt.Printf("string   %q\n", s)
	fmt.Printf("bool     %v\n", b)
	fmt.Printf("byte     %v\n", by)
	fmt.Printf("rune     %v\n", r)

	fmt.Printf("%T %T %T %T %T %T\n", i, f, s, b, by, r)
}
```

**검사**: `go run ./lessons/02-values` → 여섯 줄이 `0 / 0 / "" / false / 0 / 0` 이면 통과예요.

빈 문자열을 `%q`로 찍은 게 포인트예요. `%v`로 찍으면 아무것도 안 보여서 "출력이 안 됐나?" 싶어져요. `%q`는 따옴표를 붙여줘서 `""`가 눈에 보여요.

**생각해볼 것**: 마지막 줄의 `%T`가 `byte`와 `rune`을 뭐라고 부르나요? 예상과 다를 거예요.
:::

방금 본 마지막 줄이 이렇게 나왔을 거예요.

```text
int float64 string bool uint8 int32
```

`byte`는 `uint8`의 별명이고 `rune`은 `int32`의 별명이에요. 진짜 타입이 따로 있는 게 아니라 **읽는 사람에게 의도를 알려주는 이름**이에요. `[]uint8`이라고 쓰면 "숫자 배열"로 읽히지만 `[]byte`라고 쓰면 "바이트 뭉치"로 읽히죠. 컴파일러한테는 똑같아요.

:::note 값을 여러 개 담는 타입들
`[]byte`처럼 여러 값을 담는 타입의 zero value는 `nil`이에요. `var b []byte`를 찍으면 `[]`가 나오고 `len(b)`는 `0`이에요. 그런데 `b == nil`도 `true`예요. "빈 것"과 "없는 것"이 여기서 섞이는데, 그게 왜 골치인지는 L04에서 다뤄요. 오늘은 `nil`도 zero value의 하나라는 것만 알고 가요.
:::

## `var`와 `:=`는 어디서 갈리나

선언하는 방법이 네 가지예요.

```go
var n int      // 타입만 쓰고 zero value 에 맡긴다
var n int = 10 // 둘 다 쓴다 — 대부분 군더더기다
var n = 10     // 타입을 추론한다
n := 10        // 제일 짧다. 함수 안에서만 된다
```

실무 기준은 단순해요. **함수 안에서는 `:=`, 함수 밖에서는 `var`.** 함수 안이어도 zero value로 시작하고 싶으면 `var`를 써요. 값이 있는데 타입까지 적는 `var n int = 10`은 거의 안 써요.

`:=`가 함수 안에서만 된다는 것과, Go가 안 쓰는 변수를 어떻게 대하는지. 둘 다 말로 들으면 안 남아요. 에러 메시지로 받아봐요.

:::drill 2. 컴파일 에러 두 개 받아보기
**① `:=` 를 함수 밖에 써보기**

`main.go`의 `import` 아래, `func main` 위에 이 줄을 넣어요.

```go title=lessons/02-values/main.go mark=5
package main

import "fmt"

count := 10 // ← 이 줄이 문제

func main() {
```

`go build ./...` → **에러가 나야 정상이에요.**

Go는 이 줄을 "선언"으로 안 봐요. 에러 메시지에 그 단어가 그대로 나와요. 읽고 나서 `var count = 10`으로 고치면 통과해요.

**② 선언만 하고 안 쓰기**

이번엔 `main` 안에 변수를 하나 넣고 쓰지 않아요.

```go title=lessons/02-values/main.go
func main() {
	total := 100 // 선언만 하고 아래에서 안 쓴다
	var i int
	...
}
```

`go build ./...` → **또 에러가 나야 정상이에요.** 이번 메시지는 다섯 단어예요.

**튜터에게**: 두 에러 메시지를 그대로 붙여주세요. 서로 다른 종류의 에러예요.

확인했으면 `count`와 `total` 두 줄 다 지우고 넘어가요.
:::

:::gotcha 안 쓰는 변수는 경고가 아니라 에러예요
ESLint의 `no-unused-vars`는 경고죠. 팀에 따라 끄기도 하고요. Go는 **컴파일을 거부**해요. 안 쓰는 `import`도 같아요 — `"strconv" imported and not used`가 뜨고 빌드가 멈춰요.

처음엔 짜증나요. 디버깅하려고 변수 하나 만들어두면 빌드가 안 되니까요. 빠져나갈 구멍으로 `_`라는 이름이 있어요. `_ = total`이라고 쓰면 "썼다"로 취급돼서 빌드가 통과해요. 잠깐 디버깅할 때 쓰는 장치예요 — L03에서 `_`를 남용하면 진짜 문제가 되는 자리를 보게 돼요.

**예외가 하나 있어요.** 함수 밖에 선언한 변수와 상수는 안 써도 괜찮아요. 이 규칙은 **함수 안의 지역 변수에만** 적용돼요. L01 본문에서 본 `const Pi = 3.14` / `const seed = 42`처럼 패키지 레벨에 놓인 것들은 아무도 안 써도 빌드가 돼요.
:::

## Go는 타입을 자동으로 안 바꿔줘요

TypeScript에서 `1 + 1.5`는 그냥 돼요. JS에 숫자 타입이 하나뿐이니까요. Go에서 `int`와 `float64`는 남남이에요.

:::drill 3. 섞으면 어떻게 되나
`main.go`의 `main` 안에 잠깐 넣어봐요.

```go
n := 10
rate := 1.5
fmt.Println(n * rate)
```

`go build ./...` → **에러예요.** 메시지 끝의 괄호 안에 두 타입 이름이 그대로 나와요.

이제 고쳐요. **명시 변환**은 `타입(값)` 형태예요.

```go
fmt.Println(float64(n) * rate) // 15
```

**검사**: `go run ./lessons/02-values` → `15` 가 찍히면 통과예요.

확인했으면 이 세 줄은 지워요. 마무리 과제에서 제대로 쓸 거예요.
:::

`float64(n)`이 함수 호출처럼 보이지만 함수가 아니에요. 타입 이름 자체가 변환 문법이에요. `int(x)`, `byte(x)`, `string(x)` 다 같은 모양이에요.

:::gotcha 변환은 안전을 보장하지 않아요
컴파일러가 막는 건 **섞어 쓰는 것**뿐이에요. 변환을 명시하면 그다음은 안 봐줘요.

```go
price := 3.9
fmt.Println(int(price)) // 3  — 소수점이 잘린다. 반올림이 아니다

var big int = 300
fmt.Println(byte(big))  // 44 — byte 는 0~255 라서 넘친 값이 돌아버린다
```

둘 다 `go build`, `go vet`이 전부 조용해요. 값이 조용히 깨지는 거예요.
`byte(big)`이 `44`가 되는 건 `300 - 256 = 44`라서 그래요.

그래서 Go의 규칙은 "변환하면 안전하다"가 아니라 **"변환은 네가 책임진다고 서명한 것"**이에요. 자동으로 안 해주는 이유가 여기 있어요. 서명 없이 값이 깨지는 걸 막으려고요.
:::

:::note 상수는 좀 다르게 굴어요
방금 `int(price)`는 됐는데 `int(3.9)`는 컴파일 에러가 나요. `cannot convert 3.9 (untyped float constant) to type int`. 변수는 런타임 값이라 잘라주지만, 상수는 컴파일 시점에 "이건 정수가 아니다"를 알 수 있어서 아예 막아요. 상수 이야기는 아래에서 이어서 해요.
:::

## 문자열은 문자 배열이 아니라 바이트 뭉치예요

Go의 `string`은 **읽기 전용 바이트 뭉치**예요. 그 바이트가 UTF-8로 인코딩된 텍스트라고 약속돼 있을 뿐이에요.
그래서 `len`이 세는 건 글자 수가 아니라 **바이트 수**예요.

:::drill 4. `len` 이 뭘 세는지 확인하기
먼저 예상부터 적어보세요. `len("한글abc")`는 몇일까요?

그다음 `main` 안에서 확인해요.

```go
s := "한글abc"
fmt.Println(len(s))          // ?
fmt.Println(len([]rune(s)))  // ?
fmt.Println([]byte("한"))
fmt.Println([]rune("한"))
```

**검사**: `go run ./lessons/02-values` → 네 줄이 이렇게 나오면 통과예요.

```text
9
5
[237 149 156]
[54620]
```

한글 한 글자가 UTF-8에서 3바이트예요. `한글`이 6, `abc`가 3이라 합이 9죠.
`[]rune`으로 바꾸면 코드 포인트 단위로 세서 5가 돼요.

**생각해볼 것**: 사용자 이름을 "20자까지"로 제한해야 한다면 `len(name)`을 쓸까요, 아니면 다른 걸 세야 할까요?

확인했으면 이 줄들은 지워요.
:::

`string`에서 인덱스로 하나를 꺼내면 글자가 아니라 **바이트**가 나와요.

```go
s := "한글abc"
fmt.Println(s[0])        // 237  — 바이트 하나
fmt.Printf("%q\n", s[0]) // 'í'  — 한 글자의 첫 바이트일 뿐이다
```

`한`의 3바이트 중 첫 바이트만 떼어낸 거라 글자가 깨졌어요. TypeScript에서 `"한글"[0]`이 `"한"`을 주는 것과 완전히 다르죠.

:::gotcha TS 문자열과 어긋나는 지점
JS/TS 문자열은 **UTF-16 코드 유닛**의 배열이에요. `"한글".length`는 `2`고, `"한글"[0]`은 `"한"`이에요. 사람이 기대하는 대로죠. 대신 이모지 같은 4바이트 문자에서 `.length`가 2가 되는 문제가 있어요.

Go는 **UTF-8 바이트**를 그대로 노출해요. 그래서 `len`과 인덱싱이 사람 기준과 어긋나요. 대신 어긋나는 지점이 명확해요 — 글자 단위로 다루고 싶으면 `[]rune`으로 바꾸면 돼요.

정리하면 이렇게 세 층이에요.

| 무엇을 세나 | Go에서 | `"한글abc"` |
|---|---|---|
| 바이트 | `len(s)` | 9 |
| 코드 포인트(≈글자) | `len([]rune(s))` | 5 |
| 사람이 보는 글자 | 표준 라이브러리로 안 됨 | — |

세 번째 층은 결합 문자·이모지 조합 때문에 어렵고, Go 표준에는 없어요. 실무에서는 대부분 두 번째 층까지면 충분해요.
:::

여기서 초보가 제일 많이 밟는 함정이 하나 있어요. 숫자를 문자열로 만들려고 `string(n)`을 쓰는 거예요.

:::drill 5. `string(n)` 함정을 직접 밟아보기
`main` 안에 넣어요.

```go
n := 65
fmt.Println(string(n))
```

`go build ./...` → **통과해요.** 에러가 안 나요.

`go run ./lessons/02-values` → 뭐가 찍히나요? `65`가 아닐 거예요.

이번엔 L01에서 배운 나머지 도구를 써요.

```bash
go vet ./lessons/02-values
```

**검사**: `go vet`이 한 줄 경고를 뱉으면 통과예요. 그 문장이 정확히 무슨 일이 벌어졌는지 설명해줘요.

**튜터에게**: `go run` 결과와 `go vet` 메시지를 같이 붙여주세요.

확인했으면 두 줄 다 지워요.
:::

`string(n)`은 "숫자 65를 글자로 바꿔라"가 아니라 **"코드 포인트 65번 문자를 만들어라"**예요. 그래서 `A`가 나와요.
`go build`가 통과하는 이유는 문법적으로 완벽히 정당한 변환이기 때문이에요. 의도만 틀렸죠. 이게 `go vet`을 매번 돌리는 이유예요 — 컴파일러가 못 잡는 "맞지만 틀린" 코드를 잡아줘요.

숫자를 사람이 읽는 문자열로 만들려면 `strconv` 패키지를 써요.

```go
strconv.Itoa(65)                     // "65"      — Itoa = Integer to ASCII
strconv.FormatBool(true)             // "true"
strconv.FormatFloat(1.5, 'f', 2, 64) // "1.50"
```

의도를 이름으로 구분한 거예요. `string(...)`은 코드 포인트 변환, `strconv`는 사람이 읽는 표기.

:::note 반대 방향은 오늘 안 해요
`"65"` → `65`는 실패할 수 있어요. `"abc"`가 들어오면 어쩌죠? 그래서 `strconv.Atoi`는 값을 **두 개** 돌려줘요. 하나는 숫자, 하나는 실패했는지 여부. 그 두 번째 값을 다루는 게 L03의 주제라서 오늘은 `Atoi`를 안 씁니다. 오늘은 나가는 방향(숫자 → 문자열)만 해요.
:::

## 상수는 타입이 없을 수도 있어요

`const`는 컴파일 시점에 값이 박히는 이름이에요. TypeScript의 `const`와 이름만 같고 다른 물건이에요 — TS `const`는 "재대입 금지"지 컴파일 시점 상수가 아니죠.

Go 상수의 진짜 특징은 **타입을 안 붙일 수 있다**는 거예요.

:::drill 6. untyped 상수와 typed 상수
`main.go`의 함수 밖(파일 위쪽)에 상수 두 개를 선언해요.

```go title=lessons/02-values/main.go
const ratio = 3          // untyped — 타입을 안 적었다
const fixed int = 3      // typed — int 라고 못 박았다
```

그리고 `main` 안에서 양쪽 다 `float64`에 넣어봐요.

```go
var a float64 = ratio
fmt.Println(a)

var b float64 = fixed // ← 이 줄이 문제
fmt.Println(b)
```

`go build ./...` → **에러가 하나 나야 정상이에요.** 어느 줄인지 보세요.

에러 메시지에 `constant 3 of type int`이 나와요. 타입을 못 박은 순간 `int`로 굳어서 `float64` 자리에 못 들어가요.
반면 `ratio`는 타입이 없어서 `float64` 자리에도, `int` 자리에도 그냥 들어가요.

확인했으면 상수 두 줄과 `a`/`b` 관련 줄을 전부 지우고 넘어가요. 마무리 과제에서 상수를 다시 쓰는데, 거기서는 `main.go`가 아니라 `values` 패키지에 넣어요.
:::

이래서 Go에서 `1.5 * 2`나 `arr[3]`처럼 리터럴을 섞어 써도 아무 에러가 안 나요. 리터럴이 다 untyped 상수라서 쓰이는 자리에 맞춰 타입이 정해지거든요. **앞에서 본 "자동 변환 없음" 규칙은 변수에만 적용돼요.** 상수는 예외예요.

그래서 상수에 타입을 붙이는 건 "굳이 제한하고 싶을 때"만 해요. 회사 코드에서 상수에 타입이 붙어 있으면 그건 의도예요 — 다른 타입 자리에 쓰이는 걸 막고 싶은 거죠. L18에서 그 기법을 정면으로 다뤄요.

---

:::spec 마무리 — zero value 표와 변환 함수
실습 1에서 만든 `main.go`를 정리하고, 작은 패키지 하나를 붙여요.

- **구조**
  - `lessons/02-values/main.go` — `package main`
  - `lessons/02-values/values/values.go` — `package values`
- **`main.go` 요구사항**
  - `int`, `float64`, `string`, `bool`, `byte`, `rune` 여섯 개를 **`var`로 선언만 해서** zero value를 한 줄씩 출력한다 (실습 1 그대로)
  - 빈 문자열은 `%q`로 출력해서 눈에 보이게 한다
  - `values` 패키지를 import해서 아래 두 함수의 결과를 출력한다
- **`values` 패키지 요구사항**
  - `func Label(n int) string` — `Label(3)` → `"3개"`. 숫자를 문자열로 만드는 데 **`strconv`를 쓴다**
  - `func Scaled(price int, rate float64) float64` — `Scaled(1000, 1.5)` → `1500`. 명시 변환이 필요하다
  - `"개"` 단위 문자열은 **unexported 상수**로 뽑는다 (L01 가시성 복습)
  - **exported 함수 두 개에 doc comment를 붙인다.** 주석은 그 이름으로 시작한다 — `// Label은 ...`
- **금지**: 외부 라이브러리 (`fmt`, `strconv`만), `string(n)`으로 숫자→문자열 변환
- **완료 조건**: 아래 다섯 명령이 전부 통과
- **채점**: `RUBRIC.yaml` code_review — 이번 레슨 중점 축은 `correctness`, 그리고 L01에서 지적된 `readability`

```bash
gofmt -l .                              # 아무것도 안 나와야 통과
go vet ./...                            # 조용해야 통과
go test ./lessons/02-values/...
go run ./lessons/02-values
go doc ./lessons/02-values/values Label # 주석 문장이 나와야 통과
```

마지막 명령이 핵심이에요. 함수 서명만 나오고 설명 문장이 없으면 doc comment가 없는 거예요.
:::

테스트 파일은 이미 있어요: `lessons/02-values/values/values_test.go`. 실행 가능한 명세니까 **먼저 읽어보세요.**
`Label(0)`과 `Scaled(0, 1.5)` 케이스가 왜 들어 있는지 생각해보면 오늘 주제가 보여요.

`Scaled`에서 `rate`가 0이거나 음수인 경우는 요구하지 않아요. 걸러내려면 분기문이 필요한데 그건 L03이라서요.

:::details `Label`이 막힌다면
`strconv.Itoa`는 `int`를 받아서 `string`을 돌려줘요. 문자열 붙이기는 `+`로도 되고 `fmt.Sprintf`로도 돼요.
`values.go` 첫 줄은 `package values`이고, `main.go`의 import 경로는 `learn-go/lessons/02-values/values`예요.
:::

:::details doc comment 형식이 헷갈린다면
`go doc`은 **선언 바로 위에 빈 줄 없이 붙은 주석**만 문서로 읽어요. 빈 줄이 하나 끼면 그냥 주석이 돼요.
L01 채점에서 이 지적을 받았죠. `go doc` 명령으로 직접 확인하는 게 이번 레슨의 검사 방법이에요.
:::

---

:::check zero value의 대가
TS `let x: number`는 `undefined`일 수 있는데 Go `var x int`는 왜 아닌가요?
그리고 이 설계 때문에 **"값이 아직 안 들어왔다"를 표현해야 할 때** Go에서는 무엇이 곤란해지나요?

:::details 방향만
`0`이라는 값이 두 가지 뜻을 동시에 갖게 되는 상황을 하나 떠올려봐요. 누가 `0`을 넣은 건지, 아무도 안 넣은 건지.
:::
:::

:::check 자동 변환을 막아서 얻은 것과 못 막은 것
Go가 `int`와 `float64`를 자동으로 안 섞어주는 게 무슨 사고를 막아주나요?
그런데 `byte(big)`이 `44`가 된 실습을 떠올려보면, 명시 변환은 무엇을 **못** 막아주죠?
:::

:::check 바이트인가 글자인가
`len("한글")`이 `2`가 아니라 `6`인 이유를 설명해보세요.
그리고 실전 상황 하나. 회사 API에서 "제목은 최대 40자"라는 제약을 서버가 검사해야 한다면, Go에서 무엇을 세야 하나요? `len(title)`을 쓰면 어떤 사용자가 억울해질까요?
:::

:::check `string(n)` 은 왜 컴파일이 되나
`string(n)`은 의도가 틀렸는데 `go build`가 통과했어요. 왜 컴파일러가 못 잡을까요?
그리고 `go vet`은 어떻게 잡을 수 있었을까요? 둘의 역할 차이로 답해보세요.
:::

:::be 안 보낸 값과 0을 구분해야 할 때
서버 개발에서 zero value가 처음 문제가 되는 지점이 있어요. 클라이언트가 보낸 요청에서 어떤 필드가 **빠졌을 때**예요.

`{"retryCount": 0}`을 보낸 건지 `retryCount`를 아예 안 보낸 건지, 서버는 구분해야 할 때가 있어요. "0번 재시도"와 "기본값 3을 써라"는 완전히 다른 지시니까요. 그런데 Go로 요청을 받으면 두 경우가 **둘 다 `0`**이 돼요. 값이 없으면 zero value가 채워지니까요.

TypeScript 서버라면 `undefined`로 구분됐을 거예요. Go에는 그 상태가 없어요. 오늘 배운 규칙이 여기서 대가를 청구하는 셈이에요.

해법은 두 가지고 회사 코드는 둘 다 써요. 하나는 "0은 미설정으로 취급한다"고 규칙을 정하는 것, 다른 하나는 "값 없음"을 표현할 수 있는 별도 수단을 쓰는 것. 후자가 **포인터**인데 L06에서 정면으로 다뤄요. 오늘은 이 문제가 존재한다는 것만 알아두면 돼요.
:::
