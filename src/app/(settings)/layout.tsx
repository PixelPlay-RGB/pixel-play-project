import { SettingsShell } from "@/components/setting/settings-shell";
import { ReactNode } from "react";

export default function Layout({ children }: { children: ReactNode }) {
  return <SettingsShell>{children}</SettingsShell>;
}
