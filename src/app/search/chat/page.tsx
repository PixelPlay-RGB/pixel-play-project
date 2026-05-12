// 채팅방 검색 결과 페이지를 렌더링합니다.
import ChatSearchResults from "@/components/search/chat-search-results";
import { Separator } from "@/components/ui/separator";

interface Props {
  searchParams: Promise<{
    query?: string;
  }>;
}

export default async function ChatSearchPage({ searchParams }: Props) {
  const { query = "" } = await searchParams;
  const trimmedQuery = query.trim();

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-6 sm:px-5 md:px-6 md:py-8">
      {trimmedQuery && (
        <div className="flex flex-col gap-1 px-1">
          <p className="text-muted-foreground text-sm">채팅방 검색 결과</p>
          <h1 className="text-foreground text-xl font-bold">
            <span className="text-brand">&quot;{trimmedQuery}&quot;</span>으로 검색한 결과입니다.
          </h1>
        </div>
      )}
      <Separator />
      <ChatSearchResults query={query} />
    </div>
  );
}
