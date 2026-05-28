// 후원 알림 오버레이에서 사용하는 PixelPlay 플레이 아이콘을 렌더링합니다.
export function PixelPlayPlayIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
      focusable="false"
    >
      <path
        d="M7.4 5.7L18.4 11.1C19.2 11.5 19.2 12.5 18.4 12.9L7.4 18.3C6.6 18.7 5.7 18 5.7 17V7C5.7 6 6.6 5.3 7.4 5.7Z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
