// 비로그인 사용자에게 홈 공유 preview를 제공합니다.
import { buttonVariants } from "@/components/ui/button";
import { PUBLIC_HOME_FEATURES } from "@/constants/public/public";
import { cn } from "@/lib/utils";
import { createPathWithNext } from "@/utils/common/redirect";
import Link from "next/link";

export default function PublicHomePreview() {
  return (
    <section className="h-app-content mx-auto flex w-full max-w-5xl flex-col px-5 py-10 sm:px-8 md:justify-center md:py-14">
      <div className="flex flex-col gap-8">
        <div className="flex max-w-2xl flex-col gap-5">
          <div className="flex flex-col gap-3">
            <h1 className="text-foreground text-3xl leading-tight font-black sm:text-4xl">
              실시간 채팅 및 스트리밍 서비스, PixelPlay
            </h1>
            <p className="text-muted-foreground text-base leading-7 sm:text-lg">
              PixelPlay는 채팅방을 만들고 참여하며 실시간 대화를 이어가는 서비스입니다.
              <br/>
              로그인하면 내 채팅방과 새 메시지를 확인할 수 있습니다.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href={createPathWithNext("/auth/login", "/")}
              className={cn(buttonVariants(), "bg-brand hover:bg-brand/90 text-white")}
            >
              로그인
            </Link>
            <Link
              href={createPathWithNext("/auth/signup", "/")}
              className={cn(buttonVariants({ variant: "outline" }), "border-brand/30 text-brand")}
            >
              회원가입
            </Link>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {PUBLIC_HOME_FEATURES.map((feature) => (
            <article
              key={feature.title}
              className="border-brand/15 bg-card/70 flex flex-col gap-3 rounded-xl border p-4"
            >
              <feature.icon className="text-brand size-5" />
              <div className="flex flex-col gap-1">
                <h2 className="text-foreground text-sm font-bold">{feature.title}</h2>
                <p className="text-muted-foreground text-sm leading-6">{feature.description}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
