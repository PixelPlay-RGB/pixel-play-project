import { SettingShell } from "@/components/setting/setting-shell";
import { ReactNode } from "react";

export default function Layout({ children }: { children: ReactNode }) {
  return <SettingShell>{children}</SettingShell>;
}
