// 라이브 검색 페이지를 렌더링합니다.
import LiveSearchResults from "@/components/search/live-search-results";
import { Separator } from "@/components/ui/separator";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "라이브 검색",
  description: "PixelPlay에서 라이브 방송을 검색합니다.",
};

interface Props {
  searchParams: Promise<{
    query?: string;
  }>;
}

export default async function LiveSearchPage({ searchParams }: Props) {
  const { query = "" } = await searchParams;
  const trimmedQuery = query.trim();

  return (
    <div className="min-h-app-content mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-6 sm:px-5 md:px-6 md:py-8">
      {trimmedQuery && (
        <div className="flex flex-col gap-1 px-1">
          <p className="text-muted-foreground text-sm">라이브 검색 결과</p>
          <h1 className="text-foreground text-xl font-bold">
            <span className="text-live">&quot;{trimmedQuery}&quot;</span>으로 검색한 결과입니다.
          </h1>
        </div>
      )}
      <Separator />
      <LiveSearchResults query={query} />
    </div>
  );
}
