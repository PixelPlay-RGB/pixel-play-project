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
                  ? "bg-brand shadow-brand/20 text-primary-foreground shadow-lg"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
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
