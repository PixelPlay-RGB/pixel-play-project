// 모든 날짜·시간 계산을 Asia/Seoul(KST, UTC+9 고정) 기준으로 처리하는 공용 유틸입니다.
// 서비스 지역이 항상 한국이므로 런타임 로컬 타임존에 의존하지 않도록 KST로 고정합니다.

export const KST_TIME_ZONE = "Asia/Seoul";

interface KstDateParts {
  year: number;
  month: number; // 1-12
  day: number;
}

const KST_DATE_PARTS_FORMATTER = new Intl.DateTimeFormat("en-CA", {
  timeZone: KST_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

// 주어진 시점(기본: 현재)을 KST 달력의 연/월/일로 분해합니다.
export function getKstDateParts(date: Date = new Date()): KstDateParts {
  const parts = KST_DATE_PARTS_FORMATTER.formatToParts(date);
  const pick = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value);

  return {
    year: pick("year"),
    month: pick("month"),
    day: pick("day"),
  };
}

// KST 기준 'YYYY-MM-DD' 키 문자열을 만듭니다. (날짜 비교·입력값 등에 사용)
export function getKstDateKey(date: Date = new Date()): string {
  const { year, month, day } = getKstDateParts(date);
  return `${year}-${pad(month)}-${pad(day)}`;
}

// KST 연/월에 개월 수를 더한 연/월을 반환합니다. (연도 경계 안전 처리)
export function addKstMonths(
  year: number,
  month: number,
  monthsToAdd: number,
): { year: number; month: number } {
  const zeroBasedMonth = month - 1 + monthsToAdd;
  const normalizedMonth = ((zeroBasedMonth % 12) + 12) % 12;

  return {
    year: year + Math.floor(zeroBasedMonth / 12),
    month: normalizedMonth + 1,
  };
}

function pad(value: number): string {
  return String(value).padStart(2, "0");
}
