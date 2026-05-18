// footer 컴포넌트를 제공합니다.
import { members } from "@/constants/footer";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";

export default function Footer() {
  return (
    <footer
      className={cn(
        "w-full border-t px-4 py-3 text-center text-sm sm:px-10 sm:py-5",
        "border-brand/15 bg-brand/5 text-muted-foreground",
        "dark:border-border dark:bg-muted/60",
      )}
    >
      <div className="flex flex-wrap items-center justify-center gap-3">
        {members.map(({ name, github }) => (
          <Link
            key={github}
            href={`https://github.com/${github}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 transition-opacity hover:opacity-70"
          >
            <Image src="/github.svg" alt="GitHub" width={16} height={16} className="dark:invert" />
            {name}
          </Link>
        ))}
      </div>
      <p className="mt-2">© {new Date().getFullYear()} Team RGB. All rights reserved.</p>
    </footer>
  );
}
