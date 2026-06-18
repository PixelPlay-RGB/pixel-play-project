// 사이드바 하단에 표시하는 팀 크레딧과 저작권 영역입니다.

import { MemberLinks } from "@/components/common/member-links";

export function SidebarCredits() {
  return (
    <div className="text-muted-foreground border-border/60 flex flex-col gap-2 border-t px-3 py-3">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <MemberLinks iconSize={12} linkClassName="text-xs" />
      </div>
      <p className="text-xs">© {new Date().getFullYear()} Team RGB</p>
    </div>
  );
}
