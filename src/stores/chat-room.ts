import { DEFAULT_CHAT_ROOM_SORT_OPTION } from "@/constants/chat-room";
import type { ChatRoomSortOption, ChatRoomTab } from "@/types/chat-room";
import { create } from "zustand";
import { devtools } from "zustand/middleware";

interface ChatRoomState {
  tabType: ChatRoomTab;
  sortOption: ChatRoomSortOption;
  setTabType: (tabType: ChatRoomTab) => void;
  setSortOption: (sortOption: ChatRoomSortOption) => void;
}

export const useChatRoomStore = create<ChatRoomState>()(
  devtools(
    (set) => ({
      tabType: "JOINED",
      sortOption: DEFAULT_CHAT_ROOM_SORT_OPTION,
      setTabType: (tabType) =>
        set(
          {
            tabType,
            sortOption: DEFAULT_CHAT_ROOM_SORT_OPTION,
          },
          false,
          "chatRoom/setTabType",
        ),
      setSortOption: (sortOption) => set({ sortOption }, false, "chatRoom/setSortOption"),
    }),
    {
      name: "ChatRoomStore",
      enabled: process.env.NODE_ENV !== "production",
    },
  ),
);
