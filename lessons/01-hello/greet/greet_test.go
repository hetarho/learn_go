package greet

import "testing"

// 명세: Hello는 이름을 받아 인사말을 만든다.
//   - Hello("Gopher") == "안녕하세요, Gopher님!"
//   - Hello("")       == "안녕하세요, 낯선 분!"  (빈 이름 처리)
//
// 구현 조건: 인사말 조립 부분을 unexported 함수(예: decorate)로 분리할 것.
func TestHello(t *testing.T) {
	got := Hello("Gopher")
	want := "안녕하세요, Gopher님!"
	if got != want {
		t.Errorf("Hello(%q) = %q, want %q", "Gopher", got, want)
	}
}

func TestHelloEmptyName(t *testing.T) {
	got := Hello("")
	want := "안녕하세요, 낯선 분!"
	if got != want {
		t.Errorf(`Hello("") = %q, want %q`, got, want)
	}
}
