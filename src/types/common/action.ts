// 서버 액션의 공통 결과 타입을 정의하는 타입 모음

import type { AppMessageCode } from "@/constants/common/app-message-code";
import type { FORM_MESSAGE } from "@/constants/common/form-message";

type StaticFormMessageValue<T> = T extends (...args: never[]) => unknown
  ? never
  : T extends string
    ? T
    : T extends Record<string, unknown>
      ? StaticFormMessageValue<T[keyof T]>
      : never;

export type FormMessage = StaticFormMessageValue<typeof FORM_MESSAGE>;

export type AppActionResult<T = undefined> = {
  success: boolean;
  data?: T;
  code?: AppMessageCode;
  photoUrl?: string | null;
};

export type ActionResponse = AppActionResult;

export type FieldActionResult<T = undefined> = AppActionResult<T> & {
  fieldMessage?: FormMessage;
};
