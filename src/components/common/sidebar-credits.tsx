// 사이드바 하단에 표시하는 팀 크레딧과 저작권 영역입니다.

import { members } from "@/constants/common/footer";
import Image from "next/image";
import Link from "next/link";

export function SidebarCredits() {
  return (
    <div className="text-muted-foreground border-border/60 flex flex-col gap-2 border-t px-3 py-3">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        {members.map(({ name, github }) => (
          <Link
            key={github}
            href={`https://github.com/${github}`}
            target="_blank"
            rel="noopener noreferrer"
            className="route-accent-text-hover flex items-center gap-1 text-xs transition-colors"
          >
            <Image
              src="/github.svg"
              alt=""
              width={12}
              height={12}
              className="size-3 dark:invert"
              aria-hidden
            />
            {name}
          </Link>
        ))}
      </div>
      <p className="text-xs">© {new Date().getFullYear()} Team RGB</p>
    </div>
  );
}
