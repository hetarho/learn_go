package greet

import "testing"

// 명세: Hello는 이름을 받아 인사말을 만든다.
//   - Hello("Gopher") == "안녕하세요, Gopher님!"
//
// 구현 조건: 인사말 조립 부분을 unexported 함수(예: decorate)로 분리할 것.
//
// 빈 이름 처리는 분기문(if)이 필요해서 L03으로 옮겼다. L01은 가시성에만 집중한다.
func TestHello(t *testing.T) {
	got := Hello("Gopher")
	want := "안녕하세요, Gopher님!"
	if got != want {
		t.Errorf("Hello(%q) = %q, want %q", "Gopher", got, want)
	}
}
