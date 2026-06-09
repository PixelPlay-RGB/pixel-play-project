// 헤더의 로고 링크를 렌더링합니다.

import Logo from "@/components/common/logo";
import Link from "next/link";

export default function HeaderMainNav() {
  return (
    <div className="flex min-w-0 items-center gap-2 sm:gap-6">
      <Link href="/" className="h-9 w-20 shrink-0 sm:w-38" aria-label="PixelPlay 홈">
        <Logo className="text-foreground h-full w-full [--logo-accent:var(--brand)]" />
      </Link>
    </div>
  );
}
