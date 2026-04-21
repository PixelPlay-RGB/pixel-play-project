import Image from "next/image";
import Link from "next/link";

const members = [
  { name: "전지호", github: "wjswlgh96" },
  { name: "이주영", github: "ele-003" },
  { name: "안혜진", github: "Hyejinjin-An" },
];

export default function Footer() {
  return (
    <footer className="border-t border-brand/15 bg-brand/5 px-10 py-5 text-center text-sm text-muted-foreground dark:border-border dark:bg-muted/60">
      <div className="flex items-center justify-center gap-3">
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
