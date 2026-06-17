// 스티커(이모지) 도메인 타입을 정의합니다.

export interface Sticker {
  // 토큰·파일명에 쓰는 식별자([a-z0-9-]+). 기본 스티커는 고정값, 채널 스티커(추후)는 UUID 등.
  id: string;
  // 접근성 alt·피커 툴팁·목록 스니펫(이미지 미표시 맥락)에서 쓰는 짧은 한글 라벨.
  label: string;
  // 이미지 경로. 기본 스티커는 정적 public 경로, 채널 스티커(추후)는 storage public URL.
  src: string;
  // GIF 등 애니메이션 여부(추후 채널 스티커). next/image unoptimized로 렌더해 애니메이션을 보존한다.
  isAnimated?: boolean;
}
