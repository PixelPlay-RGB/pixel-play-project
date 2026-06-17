// Next.js searchParams 값(string | string[] | undefined)을 단일 문자열로 정규화합니다.

// string이면 그대로, 그 외(배열·undefined)는 빈 문자열로 좁힌다.
// 배열일 때 첫 원소를 쓰는 동작이 필요하면 별도 헬퍼를 사용해야 한다(시맨틱이 다름).
export function readSingleSearchParam(value: string | string[] | undefined): string {
  return typeof value === "string" ? value : "";
}
