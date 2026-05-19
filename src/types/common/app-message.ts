// 앱 전역 사용자 노출 메시지 타입을 정의하는 파일입니다.

export interface AppMessage {
  title: string;
  description?: string;
}

type AppMessageLeaf = {
  readonly title: string;
  readonly description?: string;
};

export type AppMessageCodeSchema<T, Prefix extends string = ""> = {
  readonly [K in keyof T]: T[K] extends AppMessageLeaf
    ? `${Prefix}${Extract<K, string>}`
    : T[K] extends Record<string, unknown>
      ? AppMessageCodeSchema<T[K], `${Prefix}${Extract<K, string>}.`>
      : never;
};
