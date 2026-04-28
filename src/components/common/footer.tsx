import { members } from "@/constants/auth";
import Image from "next/image";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-brand/15 bg-brand/5 text-muted-foreground dark:border-border dark:bg-muted/60 border-t px-4 py-3 text-center text-sm sm:px-10 sm:py-5">
      <div className="flex flex-wrap items-center justify-center gap-3">
        {members.map(({ name, github }) => (
          <Link
            key={github}
            href={`https://github.com/${github}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 hover:opacity-70"
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
