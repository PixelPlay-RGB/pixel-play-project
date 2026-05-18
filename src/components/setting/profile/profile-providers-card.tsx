"use client";
// profile-providers-card 컴포넌트를 제공합니다.

import LinkedOAuthAlertDialog from "@/components/setting/profile/linked-oauth-alert-dialog";
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
import { useUser } from "@/hooks/profile/use-profile";
import { cn } from "@/lib/utils";
import { OAuthProvider } from "@/types/auth";
import Image from "next/image";

export default function ProfileProvidersCard() {
  const { data: user, isError, isLoading } = useUser();

  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <Spinner />
      </div>
    );
  }

  if (isError || !user) {
    return null;
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
        <CardTitle>계정 연동</CardTitle>
        {!hasEmailAuth && (
          <CardDescription>
            소셜 연동 계정은 최소 1개의 연결 상태를 유지해야 합니다.
          </CardDescription>
        )}
        <CardAction>
          <span
            className={cn(
              "bg-muted rounded border px-2 py-1 font-mono text-xs",
              "border-brand/30 text-brand",
            )}
          >
            {hasEmailAuth ? "이메일 계정" : "소셜 연동 계정"}
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
                      <span
                        className={cn(
                          "rounded-sm px-1 py-0.5 text-xs font-medium tracking-widest uppercase",
                          "bg-muted text-brand",
                        )}
                      >
                        기본
                      </span>
                    )}
                  </div>
                  <div className="text-muted-foreground truncate font-mono text-xs">
                    {isLinked ? "연동됨" : "연동되지 않음"}
                  </div>
                </div>
              </div>

              <LinkedOAuthAlertDialog
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
