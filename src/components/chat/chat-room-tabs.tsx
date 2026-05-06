import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CHAT_ROOM_TABS, ROOM_TAB_LABELS } from "@/constants/chat-room";
import { cn } from "@/lib/utils";
import { useChatRoomStore } from "@/stores/chat-room";

export default function ChatRoomTabs() {
  const tabType = useChatRoomStore((state) => state.tabType);
  const setTabType = useChatRoomStore((state) => state.setTabType);

  return (
    <Tabs value={tabType} onValueChange={(nextValue) => setTabType(nextValue)}>
      <TabsList className="flex w-full gap-1 bg-transparent p-0 sm:w-auto sm:gap-2">
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
