// 현재 상호작용 상태에 맞는 투표/추첨/룰렛 카드를 골라 렌더하는 팝오버 본문을 제공합니다.
import { InteractionHeader } from "@/components/live/view/live-vote-shared";
import { InteractionNoticeCard } from "@/components/live/view/live-vote-notice-cards";
import {
  ActiveVoteCard,
  ParticipatedCard,
  StandbyCard,
  VoteResults,
} from "@/components/live/view/live-vote-poll-cards";
import { Button } from "@/components/ui/button";
import { LIVE_LABEL, LIVE_VOTE_LABEL } from "@/constants/live/live";
import type { CurrentInteraction } from "@/utils/live/live-vote";

export function VoteBody({
  currentInteraction,
  isError,
  isInteractionNoticesError,
  isInteractionNoticesLoading,
  isLoading,
  isLoggedIn,
  onClose,
  onJoinDraw,
  onLoginPrompt,
  onVote,
}: {
  currentInteraction: CurrentInteraction;
  isError?: boolean;
  isInteractionNoticesError?: boolean;
  isInteractionNoticesLoading?: boolean;
  isLoading?: boolean;
  isLoggedIn: boolean;
  onClose: () => void;
  onJoinDraw?: (drawNoticeId: string) => Promise<boolean>;
  onLoginPrompt: () => void;
  onVote: (pollId: string, optionId: string) => Promise<boolean>;
}) {
  if (currentInteraction.type === "empty" && (isLoading || isInteractionNoticesLoading)) {
    return <p className="text-muted-foreground text-sm">{LIVE_VOTE_LABEL.loading}</p>;
  }

  if (currentInteraction.type === "empty" && (isError || isInteractionNoticesError)) {
    return <p className="text-muted-foreground text-sm">{LIVE_VOTE_LABEL.error}</p>;
  }

  if (currentInteraction.type === "empty") {
    return <StandbyCard />;
  }

  if (currentInteraction.type === "draw" || currentInteraction.type === "roulette") {
    return (
      <InteractionNoticeCard
        isLoggedIn={isLoggedIn}
        notice={currentInteraction.notice}
        onClose={onClose}
        onJoinDraw={onJoinDraw}
        onLoginPrompt={onLoginPrompt}
      />
    );
  }

  if (currentInteraction.type !== "poll") {
    return null;
  }

  const pollInteraction = currentInteraction;

  if (pollInteraction.mode === "result") {
    return <VoteResults poll={pollInteraction.poll} onClose={onClose} />;
  }

  if (!isLoggedIn) {
    return (
      <div className="flex flex-col overflow-hidden">
        <InteractionHeader
          title="투표"
          status={LIVE_VOTE_LABEL.active}
          tone="brand"
          onClose={onClose}
        />
        <p className="border-border text-muted-foreground border-t border-dashed py-3 text-sm">
          {LIVE_LABEL.loginDescription}
        </p>
        <div className="border-border border-t border-dashed pt-3">
          <Button
            type="button"
            onClick={() => {
              onClose();
              onLoginPrompt();
            }}
            className="bg-brand hover:bg-brand/90 text-brand-foreground h-9 w-full"
          >
            {LIVE_LABEL.loginButton}
          </Button>
        </div>
      </div>
    );
  }

  return pollInteraction.poll.userVotedOptionId ? (
    <ParticipatedCard poll={pollInteraction.poll} onClose={onClose} />
  ) : (
    <ActiveVoteCard activePoll={pollInteraction.poll} onVote={onVote} onClose={onClose} />
  );
}
