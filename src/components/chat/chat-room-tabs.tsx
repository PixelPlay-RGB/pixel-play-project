import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CHAT_ROOM_TABS, ROOM_TAB_LABELS } from "@/constants/chat-room";
import { cn } from "@/lib/utils";
import type { ChatRoomTab } from "@/types/chat-room";

interface Props {
  tabType: ChatRoomTab;
  setTabType: (value: ChatRoomTab) => void;
}

export default function ChatRoomTabs({ tabType, setTabType }: Props) {
  return (
    <Tabs value={tabType} onValueChange={(nextValue) => setTabType(nextValue as ChatRoomTab)}>
      <TabsList className="flex flex-wrap gap-3 bg-transparent p-0">
        {CHAT_ROOM_TABS.map((tabType) => (
          <TabsTrigger
            key={tabType}
            value={tabType}
            className={({ active }) =>
              cn(
                "h-auto cursor-pointer rounded-xl px-6 py-2 text-sm font-bold transition-all",
                active
                  ? "bg-brand shadow-brand/20 text-white shadow-lg"
                  : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/50 dark:hover:text-zinc-100",
              )
            }
          >
            {ROOM_TAB_LABELS[tabType]}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
