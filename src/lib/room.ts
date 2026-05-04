export interface ChatRoom 
{
  id: string;
  title: string;
  description: string | null;
  max_capacity: number;
  owner_id: string;
  created_at: string;
  owner: { nickname: string } | null;
  member_cnt: number;
  is_joined: boolean;
}
