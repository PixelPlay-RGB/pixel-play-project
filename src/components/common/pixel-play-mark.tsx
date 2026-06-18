// PixelPlay 브랜드 마크 — favicon(src/app/icon.svg)과 동일 디자인. 둘 중 하나를 바꾸면 함께 맞춘다.
// (favicon은 브라우저 규약상 정적 .svg가 필요해 매체가 달라, React 사용처는 이 컴포넌트로 단일화한다.)
// 정사각 다크 라운드 배경 + 민트 그라데이션 플레이 삼각형. 색은 브랜드 고정값.
// 아래 hex는 favicon(.svg)과 1:1 동기화해야 하는 의도된 하드코딩 — CSS 토큰/테마 변수로 빼지 않는다.

interface Props {
  className?: string;
}

export function PixelPlayMark({ className }: Props) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden focusable="false">
      <defs>
        <linearGradient id="pixel-play-mark-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6ee7b7" />
          <stop offset="100%" stopColor="#34d399" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="6" fill="#1a1f26" />
      <path d="M10 8V24L24 16L10 8Z" fill="url(#pixel-play-mark-gradient)" />
      <rect x="22" y="22" width="4" height="4" fill="#6ee7b7" />
      <rect x="18" y="22" width="2" height="2" fill="#6ee7b7" opacity="0.6" />
    </svg>
  );
}
