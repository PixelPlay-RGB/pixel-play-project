// 팀원 GitHub 링크 목록. 사이드바 크레딧과 푸터가 동일한 members 맵 JSX를 공유한다.
// 아이콘 크기·링크 클래스는 사용처(작은 사이드바 / 넓은 푸터)에 맞춰 prop으로 흡수한다.

import Image from "next/image";
import Link from "next/link";

import { members } from "@/constants/common/footer";
import { cn } from "@/lib/utils";

interface Props {
  // GitHub 아이콘 한 변 길이(px). 사이드바 12 / 푸터 16.
  iconSize: number;
  linkClassName?: string;
}

export function MemberLinks({ iconSize, linkClassName }: Props) {
  return (
    <>
      {members.map(({ name, github }) => (
        <Link
          key={github}
          href={`https://github.com/${github}`}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            "route-accent-text-hover flex items-center gap-1 transition-colors",
            linkClassName,
          )}
        >
          <Image
            src="/github.svg"
            alt="GitHub"
            width={iconSize}
            height={iconSize}
            className="dark:invert"
            aria-hidden
          />
          {name}
        </Link>
      ))}
    </>
  );
}
