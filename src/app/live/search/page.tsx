// 라이브 검색 페이지를 렌더링합니다.
import LiveSearchResults from "@/components/search/live-search-results";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";

interface Props {
  searchParams: Promise<{
    query?: string | string[];
  }>;
}

function normalizeQueryParam(value?: string | string[]) {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { query } = await searchParams;
  const rawQuery = normalizeQueryParam(query);
  const trimmedQuery = rawQuery.trim();

  if (!trimmedQuery) {
    return {
      title: "라이브 검색",
      description: "PixelPlay에서 진행 중인 라이브 방송과 크리에이터를 검색합니다.",
    };
  }

  return {
    title: `${trimmedQuery} 라이브 검색`,
    description: `PixelPlay에서 ${trimmedQuery}와 관련된 라이브 방송과 크리에이터를 검색합니다.`,
  };
}

export default async function LiveSearchPage({ searchParams }: Props) {
  const { query } = await searchParams;
  const rawQuery = normalizeQueryParam(query);
  const trimmedQuery = rawQuery.trim();

  return (
    <div
      className={cn(
        "min-h-app-content mx-auto flex w-full max-w-400 flex-1 flex-col",
        "gap-7 px-4 pt-10 pb-6 sm:px-6 lg:px-8 lg:pt-12",
      )}
    >
      {trimmedQuery && (
        <div className="flex flex-col gap-3 px-1">
          <h1 className={cn("text-foreground text-2xl", "leading-tight font-black")}>
            <span className="text-live">{trimmedQuery}</span> 검색{" "}
            <span className="text-brand">결과</span>
          </h1>
          <p className={cn("text-muted-foreground max-w-2xl", "text-sm leading-relaxed")}>
            진행 중인 방송과 크리에이터 검색 결과입니다.
          </p>
        </div>
      )}
      <LiveSearchResults query={trimmedQuery} />
    </div>
  );
}
