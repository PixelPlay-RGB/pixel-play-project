// 날짜 입력과 검증에 사용하는 순수 유틸리티를 제공합니다.
import { getKstDateKey } from "@/utils/common/kst";

const DATE_INPUT_VALUE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

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

// 월·일·시·분 표기를 KST로 고정한다(지난 방송 분석 등 날짜+시각 표기, SSR 결정성 보장).
const KST_DATE_TIME_FORMATTER = new Intl.DateTimeFormat("ko-KR", {
  timeZone: "Asia/Seoul",
  hourCycle: "h23",
  month: "long",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatKstDateTime(at: number | string | Date) {
  return KST_DATE_TIME_FORMATTER.format(new Date(at));
}

// 경과 시간을 "N시간 M분"(1시간 미만이면 "M분")으로 표기한다.
export function formatDurationKo(ms: number) {
  const totalMinutes = Math.max(0, Math.round(ms / 60_000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return hours > 0 ? `${hours}시간 ${minutes}분` : `${minutes}분`;
}

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
