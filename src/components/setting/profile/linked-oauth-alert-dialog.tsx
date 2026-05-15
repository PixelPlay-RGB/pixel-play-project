"use client";

import { unLinkOAuthAction } from "@/actions/auth";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { APP_MESSAGE_CODE } from "@/constants/app-message-code";
import { OAUTH_PROVIDER_META } from "@/constants/auth";
import { QUERY_KEYS } from "@/constants/query-keys";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { OAuthProvider } from "@/types/auth";
import { toastAppError, toastAppSuccess } from "@/utils/toast-message";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Plug, Unlink } from "lucide-react";
import Image from "next/image";

interface Props {
  isLinked: boolean;
  isDisableUnlink: boolean;

  provider: OAuthProvider;
  linkedOAuth: OAuthProvider[];
}

export default function LinkedOAuthAlertDialog({
  isLinked,
  isDisableUnlink,
  provider,
  linkedOAuth,
}: Props) {
  const queryClient = useQueryClient();

  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const linkOAuthAction = async (provider: OAuthProvider) => {
    const supabase = createClient();

    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/profile`,
      },
    });

    if (error) {
      console.error("linkOAuthAction signInWithOAuth error", error);
      toastAppError(APP_MESSAGE_CODE.error.oauth.linkFailed);
      setIsLoading(false);
    }
  };

  const handleToggle = async (provider: OAuthProvider) => {
    setIsLoading(true);
    const isLinked = linkedOAuth.includes(provider);

    try {
      if (isLinked) {
        // 연동 해제 로직
        const result = await unLinkOAuthAction(provider);
        if (result.success) {
          toastAppSuccess(
            APP_MESSAGE_CODE.success.oauth.unlinked,
            `${OAUTH_PROVIDER_META[provider].name} 연동이 해제되었습니다.`,
          );
          await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.auth.all });
          setOpen(false);
        } else {
          toastAppError(result.code ?? APP_MESSAGE_CODE.error.oauth.unlinkFailed);
        }
        setIsLoading(false);
      } else {
        await linkOAuthAction(provider);
      }
    } catch (error) {
      console.error("LinkedOAuthAlertDialog toggle error", error);
      toastAppError(APP_MESSAGE_CODE.error.oauth.actionFailed);
      setIsLoading(false);
    }
  };

  const { logo, name: providerName } = OAUTH_PROVIDER_META[provider];

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (!isLoading) setOpen(next);
      }}
    >
      <AlertDialogTrigger
        render={
          <Button
            size="sm"
            variant={isLinked ? "destructive" : "default"}
            disabled={isDisableUnlink}
            title={isDisableUnlink ? "기본 계정은 해제할 수 없습니다." : undefined}
            className={cn(
              "font-semibold",
              !isLinked && "bg-brand/40 text-brand hover:bg-brand cursor-pointer hover:text-white",
            )}
          >
            {isLinked ? (
              <>
                <Unlink className="size-3.5" />
                해제
              </>
            ) : (
              <>
                <Plug className="size-3.5" />
                연동
              </>
            )}
          </Button>
        }
      />
      <AlertDialogContent
        className={cn(
          "overflow-hidden rounded-2xl p-0 shadow-xl sm:max-w-md",
          isLinked
            ? "border-destructive/20 shadow-destructive/10"
            : "border-brand/20 shadow-brand/10 dark:border-brand/10",
        )}
      >
        <AlertDialogHeader
          className={cn(
            "flex items-center gap-4 border-b px-5 pt-5 pb-4 text-left",
            isLinked ? "bg-destructive/5 border-destructive/10" : "bg-brand/5 border-brand/10",
          )}
        >
          <span
            className={cn(
              "bg-background flex size-10 shrink-0 items-center justify-center rounded-xl ring-1",
              isLinked ? "ring-destructive/20" : "ring-brand/20",
            )}
          >
            <Image
              src={logo}
              alt={providerName}
              width={20}
              height={20}
              className={provider === "github" ? "dark:invert" : undefined}
            />
          </span>
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <AlertDialogTitle className="text-lg leading-tight font-bold">
              {isLinked ? `${providerName} 계정 연동 해제` : `${providerName} 계정 연동`}
            </AlertDialogTitle>
            <AlertDialogDescription className="leading-snug text-pretty whitespace-pre-line">
              {isLinked
                ? `${providerName} 계정 연결을 해제합니다.`
                : `${providerName} 계정을 현재 프로필에 연결합니다.`}
            </AlertDialogDescription>
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter className="m-0 flex-row justify-end gap-2 border-0 bg-transparent px-5 pt-4 pb-5">
          <AlertDialogCancel
            disabled={isLoading}
            className={cn(
              "h-10 min-w-24 rounded-xl px-4 font-semibold",
              "border-border bg-background text-foreground hover:bg-muted",
            )}
          >
            돌아가기
          </AlertDialogCancel>
          <AlertDialogAction
            variant={isLinked ? "destructive" : "default"}
            disabled={isLoading}
            className={cn(
              "h-10 min-w-24 rounded-xl px-4 font-bold shadow-sm",
              isLinked
                ? "shadow-destructive/10"
                : "bg-brand shadow-brand/20 hover:bg-brand/90 text-white",
            )}
            onClick={() => handleToggle(provider)}
          >
            {isLoading ? <Spinner /> : isLinked ? "해제하기" : "연동하기"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
