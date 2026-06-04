// 날짜 입력과 검증에 사용하는 순수 유틸리티를 제공합니다.

const DATE_INPUT_VALUE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const DATE_INPUT_FORMATTER = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Seoul",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

// 시·분 표기를 KST로 고정한다. 타임존을 박지 않으면 서버(UTC)·클라이언트 출력이 달라져
// SSR 텍스트가 하이드레이션 때 어긋난다.
const KST_TIME_FORMATTER = new Intl.DateTimeFormat("ko-KR", {
  timeZone: "Asia/Seoul",
  hourCycle: "h23", // 24시간 "14:30" 표기로 고정(좁은 mono 셀에 맞고 오전/오후 표기 폭 변동 제거)
  hour: "2-digit",
  minute: "2-digit",
});

export function formatKstTime(at: number | string | Date) {
  return KST_TIME_FORMATTER.format(new Date(at));
}

export function getTodayDateInputValue() {
  const parts = DATE_INPUT_FORMATTER.formatToParts(new Date());
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  return `${year}-${month}-${day}`;
}

export function isValidDateInputValue(value: string) {
  if (!DATE_INPUT_VALUE_PATTERN.test(value)) {
    return false;
  }

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
  );
}

export function isDateInputValueOnOrBeforeToday(value: string) {
  return isValidDateInputValue(value) && value <= getTodayDateInputValue();
}
