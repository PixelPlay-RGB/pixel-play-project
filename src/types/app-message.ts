export interface AppMessage {
  title: string;
  description?: string;
}

export type AppMessageType = "success" | "error";

export type AppMessageDomain =
  | "common"
  | "auth"
  | "chatRoom"
  | "chatRoomList"
  | "chatRoomMember"
  | "message"
  | "profile"
  | "oauth"
  | "supabase";

export type AppMessageCode = `${AppMessageType}.${AppMessageDomain}.${string}`;

export type AppActionResult<T = undefined> = {
  success: boolean;
  data?: T;
  code?: AppMessageCode;
  message?: string;
};
