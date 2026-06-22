"use client";
// 매니저 추가 폼 — 닉네임/UUID 정확일치 검색 → 후보 선택 → 추가. 본인·기존 매니저는 추가 버튼을 막는다.

import { useState } from "react";

import { Search, ShieldPlus } from "lucide-react";

import { searchChannelUsersAction } from "@/actions/channel/moderation";
import { APP_MESSAGE_CODE } from "@/constants/common/app-message-code";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import type { ChannelUserCandidate } from "@/types/channel/moderation";
import { toastAppError } from "@/utils/common/toast-message";
import { getAvatarFallbackText, getAvatarImageSrc } from "@/utils/profile/avatar";

interface Props {
  creatorId: string;
  existingManagerIds: Set<string>;
  onAdd: (targetUserId: string) => Promise<boolean>;
  isAdding: boolean;
}

export function ChannelManagerAddForm({ creatorId, existingManagerIds, onAdd, isAdding }: Props) {
  const [query, setQuery] = useState("");
  const [candidates, setCandidates] = useState<ChannelUserCandidate[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [pendingAddId, setPendingAddId] = useState<string | null>(null);

  async function handleSearch() {
    if (isSearching) return;

    const trimmed = query.trim();
    // 빈 입력으로 검색하면 후보 목록을 초기화해 첫 화면 상태로 되돌린다.
    if (!trimmed) {
      setCandidates(null);
      return;
    }

    setIsSearching(true);
    let result: Awaited<ReturnType<typeof searchChannelUsersAction>>;
    try {
      result = await searchChannelUsersAction(trimmed);
    } finally {
      // 서버 액션이 전송 계층에서 reject 돼도 검색 버튼이 비활성으로 잠기지 않게 한다.
      setIsSearching(false);
    }

    if (!result.success || !result.data) {
      toastAppError(result.code ?? APP_MESSAGE_CODE.error.channel.userSearchFailed);
      return;
    }

    setCandidates(result.data);
  }

  async function handleAdd(targetUserId: string) {
    setPendingAddId(targetUserId);
    try {
      await onAdd(targetUserId);
    } finally {
      setPendingAddId(null);
    }
  }

  return (
    <div className="ring-foreground/10 bg-card flex flex-col gap-4 rounded-xl p-4 shadow-sm ring-1 sm:p-5">
      <div className="flex flex-col gap-1">
        <h2 className="text-foreground font-semibold">매니저 추가</h2>
        <p className="text-muted-foreground text-sm">
          매니저로 추가할 사용자를 이메일 또는 닉네임으로 정확히 검색하세요.
        </p>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          value={query}
          disabled={isSearching}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.nativeEvent.isComposing) {
              event.preventDefault();
              void handleSearch();
            }
          }}
          placeholder="이메일 또는 닉네임"
          aria-label="매니저 검색"
        />
        <Button
          type="button"
          className="bg-brand hover:bg-brand/85 text-brand-foreground h-auto self-stretch font-bold sm:w-auto"
          onClick={() => void handleSearch()}
          disabled={isSearching}
        >
          {isSearching ? <Spinner className="size-4" /> : <Search />}
          검색
        </Button>
      </div>

      {candidates !== null &&
        (candidates.length === 0 ? (
          <p className="text-muted-foreground py-2 text-center text-sm">
            검색 결과가 없어요. 이메일 또는 닉네임을 정확히 입력했는지 확인해 주세요.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {candidates.map((candidate) => {
              const isSelf = candidate.userId === creatorId;
              const isAlreadyManager = existingManagerIds.has(candidate.userId);
              const isPending = pendingAddId === candidate.userId && isAdding;

              return (
                <li
                  key={candidate.userId}
                  className="border-border flex items-center gap-3 rounded-lg border p-3"
                >
                  <Avatar className="size-9 shrink-0">
                    <AvatarImage src={getAvatarImageSrc(candidate.photoUrl)} alt="" />
                    <AvatarFallback>{getAvatarFallbackText(candidate.nickname)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="text-foreground truncate font-medium">{candidate.nickname}</p>
                    {candidate.email ? (
                      <p className="text-muted-foreground truncate text-xs">{candidate.email}</p>
                    ) : null}
                  </div>
                  {isSelf ? (
                    <span className="text-muted-foreground shrink-0 text-xs">본인</span>
                  ) : isAlreadyManager ? (
                    <span className="text-muted-foreground shrink-0 text-xs">이미 매니저</span>
                  ) : (
                    <Button
                      type="button"
                      size="sm"
                      className="bg-brand hover:bg-brand/85 text-brand-foreground shrink-0 font-bold"
                      onClick={() => void handleAdd(candidate.userId)}
                      disabled={isAdding}
                    >
                      {isPending ? <Spinner className="size-3.5" /> : <ShieldPlus />}
                      추가
                    </Button>
                  )}
                </li>
              );
            })}
          </ul>
        ))}
    </div>
  );
}
