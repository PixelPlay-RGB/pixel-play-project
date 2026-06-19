"use client";
// 방송 운영 투표 도구의 폼 상태와 생성·종료 흐름을 관리합니다.

import { type FormEvent, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { createChannelLivePollAction, endChannelLivePollAction } from "@/actions/channel/live";
import { DEFAULT_POLL_OPTIONS, POLL_TIMER_MAX_SECONDS } from "@/constants/channel/live-interaction";
import { APP_MESSAGE_CODE } from "@/constants/common/app-message-code";
import { QUERY_KEYS } from "@/constants/common/query-keys";
import type { LivePoll } from "@/types/live/live";
import { getPollResults } from "@/utils/channel/live-interaction";
import { toastAppError } from "@/utils/common/toast-message";

export function useChannelLiveVoteTool(broadcastId: string | null, polls: LivePoll[]) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [options, setOptions] = useState(DEFAULT_POLL_OPTIONS);
  const [isPollActionPending, setIsPollActionPending] = useState(false);
  const [isPollFormOpen, setIsPollFormOpen] = useState(false);
  const [isPollTimerEnabled, setIsPollTimerEnabled] = useState(false);
  const [pollTimerSeconds, setPollTimerSeconds] = useState(0);

  const trimmedOptions = options.map((option) => option.trim()).filter((option) => option !== "");
  const activePoll = polls.find((poll) => poll.status === "active") ?? null;
  const latestEndedPoll = [...polls].reverse().find((poll) => poll.status === "ended") ?? null;
  const visiblePoll = activePoll ?? (isPollFormOpen ? null : latestEndedPoll);
  const normalizedPollTimerSeconds = Math.min(
    Math.max(Math.floor(pollTimerSeconds), 0),
    POLL_TIMER_MAX_SECONDS,
  );
  const canCreatePoll =
    !!broadcastId &&
    !activePoll &&
    title.trim().length > 0 &&
    trimmedOptions.length >= 2 &&
    (!isPollTimerEnabled || normalizedPollTimerSeconds > 0);
  const pollResults = useMemo(() => getPollResults(visiblePoll), [visiblePoll]);
  const totalVotes = pollResults.reduce((total, result) => total + result.count, 0);

  const handleOptionChange = (index: number, value: string) => {
    setOptions((currentOptions) =>
      currentOptions.map((currentOption, currentIndex) =>
        currentIndex === index ? value : currentOption,
      ),
    );
  };

  const handleAddOption = () => {
    setOptions((currentOptions) =>
      currentOptions.length >= 5 ? currentOptions : [...currentOptions, ""],
    );
  };

  const handleRemoveOption = (index: number) => {
    if (options.length <= 2) return;

    setOptions((currentOptions) =>
      currentOptions.filter((_, currentIndex) => currentIndex !== index),
    );
  };

  const handlePollTimerSecondsChange = (value: string) => {
    const nextValue = Number(value);

    if (!Number.isFinite(nextValue)) {
      setPollTimerSeconds(0);
      return;
    }

    setPollTimerSeconds(Math.min(Math.max(Math.floor(nextValue), 0), POLL_TIMER_MAX_SECONDS));
  };

  const invalidatePolls = () => {
    if (!broadcastId) return;

    void queryClient.invalidateQueries({
      queryKey: QUERY_KEYS.live.polls(broadcastId),
    });
  };

  const handleCreatePoll = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!broadcastId || !canCreatePoll || isPollActionPending) return;

    setIsPollActionPending(true);

    try {
      const result = await createChannelLivePollAction({
        broadcastId,
        endsAt:
          isPollTimerEnabled && normalizedPollTimerSeconds > 0
            ? new Date(Date.now() + normalizedPollTimerSeconds * 1000).toISOString()
            : null,
        options: trimmedOptions,
        title: title.trim(),
      });

      if (!result.success) {
        toastAppError(result.code ?? APP_MESSAGE_CODE.error.common.unknown);
        return;
      }

      setTitle("");
      setOptions(DEFAULT_POLL_OPTIONS);
      setIsPollTimerEnabled(false);
      setPollTimerSeconds(0);
      setIsPollFormOpen(false);
      invalidatePolls();
    } catch (error) {
      console.error("방송 투표 생성 액션 실패", error);
      toastAppError(APP_MESSAGE_CODE.error.common.unknown);
    } finally {
      setIsPollActionPending(false);
    }
  };

  const handleEndPoll = async () => {
    if (!activePoll || isPollActionPending) return false;

    setIsPollActionPending(true);

    try {
      const result = await endChannelLivePollAction({ pollId: activePoll.id });

      if (!result.success) {
        toastAppError(result.code ?? APP_MESSAGE_CODE.error.common.unknown);
        return false;
      }

      invalidatePolls();
      return true;
    } catch (error) {
      console.error("방송 투표 종료 액션 실패", error);
      toastAppError(APP_MESSAGE_CODE.error.common.unknown);
      return false;
    } finally {
      setIsPollActionPending(false);
    }
  };

  const resetPollDraft = () => {
    setTitle("");
    setOptions(DEFAULT_POLL_OPTIONS);
    setIsPollFormOpen(false);
    setIsPollTimerEnabled(false);
    setPollTimerSeconds(0);
  };

  // 뒤로가기: 진행 중인 투표가 있으면 먼저 종료하고, 성공해야 도구를 떠난다.
  const exitTool = async () => {
    if (activePoll) {
      const didEndPoll = await handleEndPoll();

      if (!didEndPoll) return false;
    }

    resetPollDraft();
    return true;
  };

  return {
    activePoll,
    canCreatePoll,
    exitTool,
    handleAddOption,
    handleCreatePoll,
    handleEndPoll,
    handleOptionChange,
    handlePollTimerSecondsChange,
    handleRemoveOption,
    isPollActionPending,
    isPollTimerEnabled,
    options,
    pollResults,
    pollTimerSeconds,
    setIsPollFormOpen,
    setIsPollTimerEnabled,
    setTitle,
    title,
    totalVotes,
    visiblePoll,
  };
}

export type ChannelLiveVoteTool = ReturnType<typeof useChannelLiveVoteTool>;
