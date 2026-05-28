// OBS 후원 알림 오버레이의 표시 문구를 포맷합니다.
export function formatDonationDonorLabel(donorName: string | undefined) {
  if (!donorName) {
    return "시청자님";
  }

  return donorName.endsWith("님") ? donorName : `${donorName}님`;
}
