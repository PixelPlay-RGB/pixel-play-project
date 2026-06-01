// 채널 보안 설정 화면의 표시용 값을 포맷합니다.
export function maskSensitiveValue(value: string) {
  const maskLength = Math.min(Math.max(value.length, 24), 72);

  return "•".repeat(maskLength);
}
