package values

import "testing"

// 명세: Label은 개수를 사람이 읽는 문자열로 만든다.
//   - Label(3) == "3개"
//   - Label(0) == "0개"   ← zero value 도 그냥 값이다. 특별 취급하지 않는다
//
// 구현 조건: 숫자 → 문자열 변환에 strconv 를 쓴다.
// string(n) 은 전혀 다른 뜻이다 — 레슨 실습 5에서 직접 밟아본 함정이다.
// 단위 "개" 는 unexported 상수로 뽑는다.
func TestLabel(t *testing.T) {
	got := Label(3)
	want := "3개"
	if got != want {
		t.Errorf("Label(3) = %q, want %q", got, want)
	}

	got = Label(0)
	want = "0개"
	if got != want {
		t.Errorf("Label(0) = %q, want %q", got, want)
	}
}

// 명세: Scaled는 정수 금액에 float64 배율을 적용한다.
//   - Scaled(1000, 1.5) == 1500
//   - Scaled(1000, 0.5) == 500
//   - Scaled(0, 1.5) == 0
//
// 구현 조건: int 와 float64 는 그냥 곱해지지 않는다 — 레슨 실습 3. 명시 변환이 필요하다.
// rate 가 0 이하인 경우는 검사하지 않는다. 걸러내려면 분기문이 필요하고 그건 L03이다.
func TestScaled(t *testing.T) {
	got := Scaled(1000, 1.5)
	want := 1500.0
	if got != want {
		t.Errorf("Scaled(1000, 1.5) = %v, want %v", got, want)
	}

	got = Scaled(1000, 0.5)
	want = 500.0
	if got != want {
		t.Errorf("Scaled(1000, 0.5) = %v, want %v", got, want)
	}

	got = Scaled(0, 1.5)
	want = 0.0
	if got != want {
		t.Errorf("Scaled(0, 1.5) = %v, want %v", got, want)
	}
}
