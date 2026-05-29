"use client";
// 별도 탭으로 열리는 채팅 전용 팝아웃 화면입니다.

import { useEffect, useState } from "react";
import { Radio } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { LiveChatInputBar } from "@/components/live/view/live-chat-input-bar";
import { LiveChatMessageList } from "@/components/live/chat/live-chat-message-list";
import { LIVE_LABEL } from "@/constants/live/live";
import { useLiveBroadcastView } from "@/hooks/live/use-live-broadcast-view";
import { createPathWithNext } from "@/utils/common/redirect";

interface Props {
  creatorId: string;
}

export function LiveChatPopout({ creatorId }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);

  const {
    chatRuleText,
    isLoading,
    broadcast,
    messages,
    isLoggedIn,
    isAuthLoading,
    walletBalance,
    chatState,
    sendMessage,
    acceptChatRule,
  } = useLiveBroadcastView(creatorId);

  useEffect(() => {
    setOpen(true);
  }, []);

  function moveToLogin() {
    const query = searchParams.toString();
    const next = `${pathname}${query ? `?${query}` : ""}`;
    router.push(createPathWithNext("/auth/login", next));
  }

  const sheetContentClass =
    "flex h-dvh flex-col gap-0 p-0 md:left-auto md:right-0 md:w-88 md:rounded-tl-xl";

  if (isAuthLoading || isLoading) {
    return (
      <div className="bg-background min-h-screen">
        <Sheet open={open} modal={false}>
          <SheetContent side="bottom" showCloseButton={false} className={sheetContentClass}>
            <div className="flex flex-1 items-center justify-center">
              <div className="border-brand/30 border-t-brand h-8 w-8 animate-spin rounded-full border-2" />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    );
  }

  if (!broadcast) {
    return (
      <div className="bg-background min-h-screen">
        <Sheet open={open} modal={false}>
          <SheetContent side="bottom" showCloseButton={false} className={sheetContentClass}>
            <div className="flex flex-1 items-center justify-center">
              <p className="text-muted-foreground text-sm">{LIVE_LABEL.broadcastOffline}</p>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen">
      <Sheet open={open} modal={false}>
        <SheetContent side="bottom" showCloseButton={false} className={sheetContentClass}>
          <div className="border-border flex items-center gap-2 border-b px-4 py-3">
            <span className="bg-live flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-bold text-white">
              <Radio className="size-3" />
              {LIVE_LABEL.live}
            </span>
            <span className="text-foreground text-sm font-semibold">{broadcast.creator.name}</span>
            <span className="text-muted-foreground ml-auto text-xs">{LIVE_LABEL.chat}</span>
          </div>

          <ScrollArea className="min-h-0 flex-1">
            <LiveChatMessageList messages={messages} />
          </ScrollArea>

          <LiveChatInputBar
            polls={[]}
            chatState={chatState}
            isLoggedIn={isLoggedIn}
            walletBalance={walletBalance}
            onLoginPrompt={moveToLogin}
            onSendMessage={sendMessage}
            chatRuleText={chatRuleText}
            showActions={false}
            onAcceptChatRule={acceptChatRule}
          />
        </SheetContent>
      </Sheet>
    </div>
  );
}
