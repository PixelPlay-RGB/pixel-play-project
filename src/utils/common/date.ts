// 날짜 입력과 검증에 사용하는 순수 유틸리티를 제공합니다.
import { getKstDateKey } from "@/utils/common/kst";

const DATE_INPUT_VALUE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

// KST 기준 오늘 날짜('YYYY-MM-DD')를 반환합니다.
export function getTodayDateInputValue() {
  return getKstDateKey();
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
