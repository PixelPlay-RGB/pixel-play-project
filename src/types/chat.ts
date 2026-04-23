export interface Message {
  id: string
  roomId: string
  userId: string
  content: string
  createdAt: string
  displayName?: string
}

export interface Room {
  id: string
  title: string
  description: string
  createdBy: string
  createdAt: string
}

export interface RoomMember {
  id: string
  userId: string
  name: string
  joinedAt: string
}
