export interface Message {
  id: string
  roomId: string
  userId: string
  content: string
  createdAt: string
}

export interface Room {
  id: string
  title: string
  description: string
  createdBy: string
  createdAt: string
}

export interface RoomMember {
  chat_room_id: string
  user_id: string
  created_at: string
}

export interface RoomMemberQuery extends RoomMember {
  user: {
    nickname: string | null
  } | null
}
