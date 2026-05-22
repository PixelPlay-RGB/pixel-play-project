// 라이브 목록 페이지를 렌더링합니다.
import LiveList from "@/components/live/live-list";

export default function LivePage() {
  return (
    <div className="h-app-content overflow-auto p-4 md:p-6">
      <LiveList />
    </div>
  );
}
