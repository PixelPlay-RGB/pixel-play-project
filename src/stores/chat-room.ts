// chat-room Zustand store를 관리합니다.
import { DEFAULT_CHAT_ROOM_SORT_OPTION_BY_TAB } from "@/constants/chat-room/chat-room";
import type { ChatRoomSortOption, ChatRoomTab } from "@/types/chat-room/chat-room";
import { create } from "zustand";
import { devtools } from "zustand/middleware";

interface ChatRoomState {
  tabType: ChatRoomTab;
  sortOption: ChatRoomSortOption;
  currentPage: number;
  searchQuery: string;
  setTabType: (tabType: ChatRoomTab) => void;
  setSortOption: (sortOption: ChatRoomSortOption) => void;
  setCurrentPage: (page: number) => void;
  setSearchQuery: (query: string) => void;
}

export const useChatRoomStore = create<ChatRoomState>()(
  devtools(
    (set) => ({
      tabType: "JOINED",
      sortOption: DEFAULT_CHAT_ROOM_SORT_OPTION_BY_TAB.JOINED,
      currentPage: 1,
      searchQuery: "",
      setTabType: (tabType) =>
        set(
          {
            tabType,
            sortOption: DEFAULT_CHAT_ROOM_SORT_OPTION_BY_TAB[tabType],
            currentPage: 1,
            searchQuery: "",
          },
          false,
          "chatRoom/setTabType",
        ),
      setSortOption: (sortOption) =>
        set({ sortOption, currentPage: 1 }, false, "chatRoom/setSortOption"),
      setCurrentPage: (currentPage) => set({ currentPage }, false, "chatRoom/setCurrentPage"),
      setSearchQuery: (searchQuery) =>
        set({ searchQuery, currentPage: 1 }, false, "chatRoom/setSearchQuery"),
    }),
    {
      name: "ChatRoomStore",
      enabled: process.env.NODE_ENV !== "production",
    },
  ),
);
