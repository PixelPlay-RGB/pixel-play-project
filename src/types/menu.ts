import { LucideIcon } from "lucide-react";

type ProfileMenuItemBase = {
  id: string;
  label: string;
  icon?: LucideIcon;
};

export type ProfileMenuItem =
  | (ProfileMenuItemBase & { type: "link"; href: string })
  | (ProfileMenuItemBase & { type: "action" })
  | (ProfileMenuItemBase & { type: "logout" });
