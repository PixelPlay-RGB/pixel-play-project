import { createClient } from "./client";

export interface ChatRoom {
  id: number;
  title: string;
  name: string;
  user_id: string;
  created_at: string;
  capacity: number;
  email?: string;
  description?: string;
}
const supabase = createClient();
export const createRoom = async (title: string, capacity: number, userId: string, userName: string, userEmail: string, description: string) => {
  // 서버 측 호출 전 유효성 검사 추가
  if (!userId) {
    return { data: null, error: { message: "로그인 정보가 유효하지 않습니다." } };
  }

  const { data, error } = await supabase
    .from("room")
    .insert([
      {
        title: title,
        capacity: capacity,
        name: userName,
        user_id: userId,
        email: userEmail,
        description: description,
      },
    ])
    .select();

  return { data, error };
};