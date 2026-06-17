// 문자열을 [0, modulo) 범위의 결정적 인덱스로 매핑합니다(폴백 썸네일·닉네임 색 분산 등).

// 단순 합산 해시는 글자 순서가 달라도 같은 값이 되어("가나"="나가") 인덱스가 몰린다 —
// 자리 가중(31배) 누적으로 입력을 후보 전체에 고르게 분산시킨다.
// `>>> 0`로 32비트 부호 없는 정수로 고정해 오버플로 시에도 음수가 섞이지 않게 한다.
export function hashStringToIndex(value: string, modulo: number): number {
  if (modulo <= 0) {
    return 0;
  }

  let hash = 0;

  for (const character of value) {
    hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  }

  return hash % modulo;
}
