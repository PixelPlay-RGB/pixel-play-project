// 후원 포인트 포맷팅 유틸리티의 출력 계약을 검증합니다.
import assert from "node:assert/strict";
import { test } from "node:test";

import { formatPoint } from "./format";

test("formatPoint formats donation points with Korean thousands separators", () => {
  assert.equal(formatPoint(0), "0P");
  assert.equal(formatPoint(1000), "1,000P");
  assert.equal(formatPoint(1234567), "1,234,567P");
});
