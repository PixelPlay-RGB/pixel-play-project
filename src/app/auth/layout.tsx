export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex flex-1 items-center justify-center py-6 sm:py-12 dark:bg-transparent">
      <div className="bg-auth-grid absolute inset-0 opacity-15 dark:opacity-10" />
      <div className="bg-auth-vignette absolute inset-0" />
      <div className="relative z-10 w-full">{children}</div>
    </div>
  );
}
