export default function LiveList() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] w-full border border-border bg-card/50 rounded-3xl backdrop-blur-sm hover:border-live/30 transition-colors group shadow-sm dark:shadow-none">
      <div className="p-4 bg-muted rounded-full mb-4 group-hover:bg-live/10 transition-colors">
        <span className="text-2xl">📡</span>
      </div>
      <h2 className="text-muted-foreground font-bold text-xl mb-2 group-hover:text-live transition-colors">현재 라이브 준비 중 입니다.</h2>
    </div>
  );
}
