// 채널 관리 사이드바 메뉴 구조를 검증합니다.
import assert from "node:assert/strict";
import { test } from "node:test";

import { CHANNEL_MENU_GROUPS } from "./channel-menu.ts";

test("subscription menu opens subscriber and benefit pages", () => {
  const revenueGroup = CHANNEL_MENU_GROUPS.find((group) => group.label === "수익");
  const subscriptionMenu = revenueGroup?.items.find((item) => item.id === "subscription");

  assert.ok(subscriptionMenu);
  assert.equal(subscriptionMenu.label, "구독");
  assert.deepEqual(
    subscriptionMenu.children?.map((child) => ({
      id: child.id,
      label: child.label,
      href: child.href,
    })),
    [
      { id: "subscribers", label: "구독자", href: "/channel/subscribers" },
      {
        id: "subscription-benefits",
        label: "구독 혜택",
        href: "/channel/subscription-benefits",
      },
    ],
  );
});
