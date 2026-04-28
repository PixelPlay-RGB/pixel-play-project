"use client";

import UnLinkOAuthDialog from "@/components/setting/profile/unlink-oauth-dialog";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { OAUTH_PROVIDER_META, OAUTH_PROVIDERS } from "@/constants/auth";
import { useUser } from "@/hooks/use-profile";
import { cn } from "@/lib/utils";
import { OAuthProvider } from "@/types/auth";
import Image from "next/image";

export default function ProfileProvidersCard() {
  const { data: user, isLoading } = useUser();

  if (isLoading || !user) {
    return (
      <div className="flex justify-center py-10">
        <Spinner />
      </div>
    );
  }

  const hasEmailAuth = user.linked_providers.includes("email");
  const linkedOAuth = user.linked_providers.filter((p): p is OAuthProvider =>
    OAUTH_PROVIDERS.includes(p as OAuthProvider),
  );

  const primaryProvider = linkedOAuth[0] ?? null;
  const canUnlink = hasEmailAuth || linkedOAuth.length > 1;

  return (
    <Card>
      <CardHeader>
        <CardTitle>연동된 계정</CardTitle>
        {!hasEmailAuth && (
          <CardDescription>OAuth로 가입한 경우 최소 1개의 계정이 필요합니다.</CardDescription>
        )}
        <CardAction>
          <span
            className={cn(
              "bg-muted rounded border px-2 py-1 font-mono text-[11px]",
              hasEmailAuth ? "border-brand/30 text-brand" : "border-border text-muted-foreground",
            )}
          >
            {hasEmailAuth ? "이메일 가입" : "OAuth 가입"}
          </span>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-2.5">
        {OAUTH_PROVIDERS.map((provider) => {
          const { name, logo } = OAUTH_PROVIDER_META[provider];
          const isLinked = linkedOAuth.includes(provider);
          const isPrimary = primaryProvider === provider;
          const isDisableUnlink = isLinked && !canUnlink;

          return (
            <div
              key={provider}
              className="flex items-center justify-between gap-3 rounded-lg border p-3.5"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="bg-muted flex size-10 shrink-0 items-center justify-center rounded-lg">
                  <Image
                    src={logo}
                    alt={name}
                    width={20}
                    height={20}
                    className={provider === "github" ? "dark:invert" : undefined}
                  />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium">{name}</span>
                    {isPrimary && isLinked && (
                      <span className="bg-muted text-brand rounded-sm px-1 py-0.5 text-[10px] font-medium tracking-widest uppercase">
                        기본
                      </span>
                    )}
                  </div>
                  <div className="text-muted-foreground truncate font-mono text-[12px]">
                    {isLinked ? "연동됨" : "연동되지 않음"}
                  </div>
                </div>
              </div>

              <UnLinkOAuthDialog
                isLinked={isLinked}
                isDisableUnlink={isDisableUnlink}
                provider={provider}
                linkedOAuth={linkedOAuth}
              />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
