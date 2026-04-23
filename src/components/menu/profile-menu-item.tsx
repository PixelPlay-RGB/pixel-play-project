import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ProfileMenuItem } from "@/types/menu";
import Link from "next/link";
import { ReactNode } from "react";

export type ProfileMenuHandlers = {
  onClose: () => void;
  onLogout: () => Promise<void>;
  // { id: "share", type: "action" } 아이템 → actions: { share: handleShare }
  actions?: Record<string, () => void | Promise<void>>;
};

const MENU_ITEM_CLASS = "cursor-pointer w-full flex-row justify-start gap-5";

export default function ProfileMenuItem(
  item: ProfileMenuItem,
  handlers: ProfileMenuHandlers,
): ReactNode {
  const { onClose, onLogout, actions } = handlers;
  const Icon = item.icon;

  switch (item.type) {
    case "link":
      return (
        <Link
          key={item.id}
          href={item.href}
          onClick={onClose}
          className={cn(buttonVariants({ variant: "ghost" }), MENU_ITEM_CLASS)}
        >
          {Icon && <Icon />}
          {item.label}
        </Link>
      );

    case "action":
      return (
        <Button
          key={item.id}
          variant="ghost"
          className={MENU_ITEM_CLASS}
          onClick={actions?.[item.id]}
        >
          {Icon && <Icon />}
          {item.label}
        </Button>
      );

    case "logout":
      return (
        <Button key={item.id} variant="ghost" className={MENU_ITEM_CLASS} onClick={onLogout}>
          {Icon && <Icon />}
          {item.label}
        </Button>
      );
  }
}
