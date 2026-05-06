export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex flex-1 items-center justify-center py-6 sm:py-12 dark:bg-transparent">
      <div
        className="absolute inset-0 opacity-[0.15] dark:opacity-[0.07]"
        style={{
          backgroundImage:
            "linear-gradient(to right, #46c6a9 1px, transparent 1px), linear-gradient(to bottom, #46c6a9 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_50%,transparent_40%,var(--background)_100%)]" />
      <div className="relative z-10 w-full">{children}</div>
    </div>
  );
}
