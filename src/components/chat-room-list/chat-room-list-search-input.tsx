// 채팅방 목록 탭 내부 검색 입력을 렌더링합니다.
"use client";

import SearchInput from "@/components/search/search-input";
import { useChatRoomStore } from "@/stores/chat-room";
import { useEffect, useState } from "react";

export default function ChatRoomListSearchInput() {
  const tabType = useChatRoomStore((s) => s.tabType);
  const searchQuery = useChatRoomStore((s) => s.searchQuery);
  const setSearchQuery = useChatRoomStore((s) => s.setSearchQuery);

  const [localValue, setLocalValue] = useState(searchQuery);

  // tab 변경 시 store의 searchQuery가 ""로 초기화됨 → 로컬 input도 동기화
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLocalValue(searchQuery);
  }, [tabType, searchQuery]);

  const handleSubmit = () => {
    const trimmed = localValue.trim();
    if (trimmed === searchQuery) return;
    setSearchQuery(trimmed);
  };

  return (
    <SearchInput
      value={localValue}
      onChange={setLocalValue}
      onSubmit={handleSubmit}
      placeholder="현재 탭에서 채팅방 검색"
      className="sm:w-100"
    />
  );
}
