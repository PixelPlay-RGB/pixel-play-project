"use client";
// 채팅 입력 행 — 이모티콘 버튼, 메시지 입력창, 후원·투표·메뉴 CTA를 렌더링합니다.
// 비로그인 및 canChat=false 상태에서는 입력이 비활성화됩니다.

import { useState } from "react";
import { Smile } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LiveDonationDialog } from "@/components/live/view/live-donation-dialog";
import { LiveVotePopover } from "@/components/live/view/live-vote-popover";
import { LIVE_LABEL } from "@/constants/live/live";
import type { LivePoll, LiveViewerChatState } from "@/types/live/live";

interface Props {
  polls: LivePoll[];
  chatState: LiveViewerChatState;
  isLoggedIn: boolean;
  onLoginPrompt: () => void;
  onSendMessage: (content: string) => Promise<void>;
}

function getChatPlaceholder(chatState: LiveViewerChatState, isLoggedIn: boolean): string {
  if (!isLoggedIn) return LIVE_LABEL.chatLoginPlaceholder;
  if (chatState.canChat) return LIVE_LABEL.chatPlaceholder;

  switch (chatState.chatUnavailableReason) {
    case "follower_required":
    case "follower_wait_required":
      return LIVE_LABEL.chatFollowerPlaceholder;
    case "slow_mode_required":
      return LIVE_LABEL.chatWaitPlaceholder;
    case "manager_only":
      return LIVE_LABEL.chatManagerOnlyPlaceholder;
    default:
      return LIVE_LABEL.chatLoginPlaceholder;
  }
}

export function LiveChatInputBar({
  polls,
  chatState,
  isLoggedIn,
  onLoginPrompt,
  onSendMessage,
}: Props) {
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);

  const isInputActive = isLoggedIn && chatState.canChat;
  const placeholder = getChatPlaceholder(chatState, isLoggedIn);

  function handleInputClick() {
    if (!isLoggedIn) {
      onLoginPrompt();
    }
  }

  async function handleSend() {
    const trimmed = draft.trim();
    if (!trimmed || isSending || !isInputActive) return;

    setIsSending(true);
    setDraft("");
    try {
      await onSendMessage(trimmed);
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="border-border flex flex-col gap-2 border-t px-3 py-3">
      {/* 입력 행 */}
      <div className="flex items-center gap-2">
        <Button size="sm" variant="ghost" aria-label="이모티콘" className="size-8 shrink-0 p-0">
          <Smile className="text-muted-foreground size-5" />
        </Button>
        <Input
          value={isInputActive ? draft : ""}
          placeholder={placeholder}
          readOnly={!isInputActive}
          disabled={isSending}
          onClick={handleInputClick}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.nativeEvent.isComposing) {
              e.preventDefault();
              void handleSend();
            }
          }}
          aria-label={placeholder}
          className="read-only:bg-muted/70 h-8 flex-1 text-sm read-only:cursor-pointer"
        />
      </div>

      {/* CTA 행 */}
      <div className="flex items-center gap-2">
        <LiveDonationDialog isLoggedIn={isLoggedIn} onLoginPrompt={onLoginPrompt} />
        <LiveVotePopover polls={polls} isLoggedIn={isLoggedIn} onLoginPrompt={onLoginPrompt} />
      </div>
    </div>
  );
}
