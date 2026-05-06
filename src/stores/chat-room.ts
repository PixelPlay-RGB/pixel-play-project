import type { ChatRoomTab } from "@/types/chat-room";
import { create } from "zustand";
import { devtools } from "zustand/middleware";

interface ChatRoomState {
  tabType: ChatRoomTab;
  setTabType: (tabType: ChatRoomTab) => void;
}

export const useChatRoomStore = create<ChatRoomState>()(
  devtools(
    (set) => ({
      tabType: "JOINED",
      setTabType: (tabType) => set({ tabType }, false, "chatRoom/setTabType"),
    }),
    {
      name: "ChatRoomStore",
      enabled: process.env.NODE_ENV !== "production",
    },
  ),
);
