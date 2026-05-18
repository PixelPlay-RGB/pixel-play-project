// 날짜 입력과 검증에 사용하는 순수 유틸리티를 제공합니다.

const DATE_INPUT_VALUE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const DATE_INPUT_FORMATTER = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Seoul",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

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
