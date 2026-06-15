// 기본 구독 배지 이미지 경로가 Next Image 로컬 패턴에 허용되는지 검증합니다.
import assert from "node:assert/strict";
import { test } from "node:test";

import nextConfig from "../../../next.config.ts";

test("next image localPatterns allow default subscription badge cache version", () => {
  assert.deepEqual(nextConfig.images?.localPatterns, [
    {
      pathname: "/subscription-badges/**",
      search: "?v=20260615-fixed-slots-v1",
    },
  ]);
});
