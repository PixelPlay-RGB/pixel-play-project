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
import { useQueryClient } from "@tanstack/react-query";
import { Plug, Unlink } from "lucide-react";
import { useState } from "react";

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
    setIsLoading(true);
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
    }

    setIsLoading(false);
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
        } else {
          toastAppError(result.code ?? APP_MESSAGE_CODE.error.oauth.unlinkFailed);
        }
      } else {
        // 연동 로직
        await linkOAuthAction(provider);
        return;
      }
    } catch {
      toastAppError(APP_MESSAGE_CODE.error.oauth.actionFailed);
    } finally {
      setIsLoading(false);
      setOpen(false);
    }
  };

  const providerName = OAUTH_PROVIDER_META[provider].name;

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
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
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isLinked ? `${providerName} 계정 연동 해제` : `${providerName} 계정 연동`}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isLinked
              ? `${providerName} 계정 연동을 해제하시겠습니까?`
              : `${providerName} 계정 연동을 진행하시겠습니까?`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className={"w-25"}>돌아가기</AlertDialogCancel>
          <AlertDialogAction
            variant={"outline"}
            className={cn(
              "w-25",
              isLinked ? "border-destructive! text-destructive" : "border-brand! text-brand",
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
