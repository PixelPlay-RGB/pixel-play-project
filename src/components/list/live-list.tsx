export default function LiveList() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] w-full border border-zinc-200 dark:border-zinc-800/50 bg-white/50 dark:bg-zinc-900/30 rounded-3xl backdrop-blur-sm hover:border-brand/30 transition-colors group shadow-sm dark:shadow-none">
      <div className="p-4 bg-zinc-100 dark:bg-zinc-800/50 rounded-full mb-4 group-hover:bg-brand/10 transition-colors">
        <span className="text-2xl">📡</span>
      </div>
      <h2 className="text-zinc-500 dark:text-zinc-400 font-bold text-xl mb-2 group-hover:text-brand transition-colors">현재 라이브 준비 중 입니다.</h2>
    </div>
  );
}