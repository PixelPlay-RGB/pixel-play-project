// 서버 액션의 공통 결과 타입을 정의하는 타입 모음

import type { AppMessageCode } from "@/constants/app-message";

export type AppActionResult<T = undefined> = {
  success: boolean;
  data?: T;
  code?: AppMessageCode;
  message?: string;
  photoUrl?: string | null;
};
