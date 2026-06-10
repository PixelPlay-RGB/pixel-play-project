// 아직 준비되지 않은 화면을 안내하는 공용 placeholder.
import Link from "next/link";
import { Hammer } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Props {
  title: string;
  description?: string;
  backHref: string;
  backLabel?: string;
}

export default function PlaceholderPage({
  title,
  description = "곧 준비될 예정이에요.",
  backHref,
  backLabel = "돌아가기",
}: Props) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
      <div className="bg-muted text-muted-foreground flex size-14 items-center justify-center rounded-2xl">
        <Hammer className="size-7" />
      </div>
      <div className="flex flex-col gap-1.5">
        <h2 className="text-foreground text-xl font-black">{title}</h2>
        <p className="text-muted-foreground text-sm">{description}</p>
      </div>
      <Link href={backHref} className={cn(buttonVariants({ variant: "outline" }), "rounded-xl")}>
        {backLabel}
      </Link>
    </div>
  );
}
