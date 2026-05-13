// 참가자-최대정원
export const formatCapacity = (memberCnt: number, maxCapacity: number) =>
  `${memberCnt}/${maxCapacity}`;

export const getCapacityColorClass = (capacityPercent: number) => {
  if (capacityPercent >= 100) return "bg-live";
  if (capacityPercent > 80) return "bg-warning";
  return "bg-brand";
};

const TIME_FORMATTER = new Intl.DateTimeFormat("ko-KR", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

const DATE_FORMATTER = new Intl.DateTimeFormat("ko-KR", {
  year: "2-digit",
  month: "2-digit",
  day: "2-digit",
});

const formatDateParts = (date: Date) => {
  const parts = DATE_FORMATTER.formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value ?? "";
  const month = parts.find((part) => part.type === "month")?.value ?? "";
  const day = parts.find((part) => part.type === "day")?.value ?? "";

  return `${year}.${month}.${day}`;
};

// 채팅방 생성일
// 당일인 경우 hh:mm, 아닌 경우 yymmdd
export const formatRoomDate = (dateString: string) => {
  const date = new Date(dateString);
  const today = new Date();
  const isToday = formatDateParts(date) === formatDateParts(today);

  return isToday ? TIME_FORMATTER.format(date) : formatDateParts(date);
};
