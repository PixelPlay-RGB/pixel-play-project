// 채팅 메시지 본문(content) 입력 검증 스키마를 정의한다.
import { z } from "zod";

import { MESSAGE_CONTENT_MAX_LENGTH } from "@/constants/message";

export const messageContentSchema = z
  .string()
  .min(1, "메시지를 입력해주세요.")
  .max(
    MESSAGE_CONTENT_MAX_LENGTH,
    `메시지는 ${MESSAGE_CONTENT_MAX_LENGTH}자 이하로 입력해주세요.`,
  );
