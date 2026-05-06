import { z } from "zod";
import { CHAT_ROOM_MAX_CAPACITY, CHAT_ROOM_MIN_CAPACITY } from "@/constants/chat-room";

export const createChatRoomSchema = z.object({
  title: z.string().trim().min(1, "방 제목을 입력해주세요."),
  capacity: z
    .number({
      error: "참여 가능 인원을 입력해주세요.",
    })
    .int("참여 가능 인원은 정수로 입력해주세요.")
    .min(CHAT_ROOM_MIN_CAPACITY, `최소 ${CHAT_ROOM_MIN_CAPACITY}명 이상이어야 합니다.`)
    .max(CHAT_ROOM_MAX_CAPACITY, `최대 ${CHAT_ROOM_MAX_CAPACITY}명까지 가능합니다.`),
  description: z.string().trim().optional(),
});

export type CreateChatRoomInput = z.infer<typeof createChatRoomSchema>;

export const CREATE_CHAT_ROOM_DEFAULT_VALUES: CreateChatRoomInput = {
  title: "",
  capacity: CHAT_ROOM_MIN_CAPACITY,
  description: "",
};
