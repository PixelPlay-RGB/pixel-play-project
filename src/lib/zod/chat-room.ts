// chat-room Zod 검증 스키마를 정의합니다.
import { z } from "zod";
import {
  CHAT_ROOM_DESCRIPTION_MAX_LENGTH,
  CHAT_ROOM_MAX_CAPACITY,
  CHAT_ROOM_MIN_CAPACITY,
  CHAT_ROOM_TITLE_MAX_LENGTH,
} from "@/constants/chat-room";
import { FORM_MESSAGE } from "@/constants/form-message";

export const createChatRoomSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, FORM_MESSAGE.chatRoom.titleRequired)
    .max(CHAT_ROOM_TITLE_MAX_LENGTH, FORM_MESSAGE.chatRoom.titleMax(CHAT_ROOM_TITLE_MAX_LENGTH)),
  capacity: z
    .number({
      error: FORM_MESSAGE.chatRoom.capacityRequired,
    })
    .int(FORM_MESSAGE.chatRoom.capacityInteger)
    .min(CHAT_ROOM_MIN_CAPACITY, FORM_MESSAGE.chatRoom.capacityMin(CHAT_ROOM_MIN_CAPACITY))
    .max(CHAT_ROOM_MAX_CAPACITY, FORM_MESSAGE.chatRoom.capacityMax(CHAT_ROOM_MAX_CAPACITY)),
  description: z
    .string()
    .trim()
    .max(
      CHAT_ROOM_DESCRIPTION_MAX_LENGTH,
      FORM_MESSAGE.chatRoom.descriptionMax(CHAT_ROOM_DESCRIPTION_MAX_LENGTH),
    )
    .optional(),
});

export type CreateChatRoomInput = z.infer<typeof createChatRoomSchema>;

export const CREATE_CHAT_ROOM_DEFAULT_VALUES: CreateChatRoomInput = {
  title: "",
  capacity: CHAT_ROOM_MIN_CAPACITY,
  description: "",
};
