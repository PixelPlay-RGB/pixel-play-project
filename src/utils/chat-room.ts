// 참가자-최대정원
export const formatCapacity = (memberCnt: number, maxCapacity: number) =>
  `${memberCnt}/${maxCapacity}`;

// 채팅방 생성일
// 당일인 경우 hh:mm, 아닌 경우 yymmdd
export const formatRoomDate = (dateString: string) => {
  const date = new Date(dateString);
  const isToday = date.toDateString() === new Date().toDateString();
  return isToday
    ? date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false })
    : date.toLocaleDateString();
};
