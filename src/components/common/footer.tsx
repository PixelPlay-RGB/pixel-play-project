// footer 컴포넌트를 제공합니다.
import { MemberLinks } from "@/components/common/member-links";
import { cn } from "@/lib/utils";

export default function Footer() {
  return (
    <footer
      className={cn(
        "w-full border-t px-4 py-3 text-center text-sm sm:px-10 sm:py-5",
        "route-accent-chrome text-muted-foreground",
      )}
    >
      <div className="flex flex-wrap items-center justify-center gap-3">
        <MemberLinks iconSize={16} />
      </div>
      <p className="mt-2">© {new Date().getFullYear()} Team RGB</p>
    </footer>
  );
}
