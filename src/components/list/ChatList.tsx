import { useState, Dispatch, SetStateAction, FormEvent, useEffect } from "react";
import { createRoom, ChatRoom } from "@/lib/room";
import { createClient } from "@/lib/supabase/client";

interface ChatListProps {
  chats: ChatRoom[];
  setChats: Dispatch<SetStateAction<ChatRoom[]>>;
  maxCapacity: number;
}

const supabase = createClient();

export default function ChatList({ chats, setChats, maxCapacity }: ChatListProps) {
  const [filter, setFilter] = useState<'all' | 'available' | 'full'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newRoomTitle, setNewRoomTitle] = useState('');
  const [newRoomCapacity, setNewRoomCapacity] = useState(0);
  const [newRoomDescription, setNewRoomDescription] = useState('');
  const [sessionUser, setSessionUser] = useState<{ id: string; email: string; name: string } | null>(null);

  // 세션 정보 가져오기
  useEffect(() => {
    const getSession = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setSessionUser({
          id: user.id,
          email: user.email || "",
          name: user.user_metadata?.name || user.email?.split('@')[0],
        });
      }
    };
    getSession();
  }, []);

  const handleJoinChat = (id: number) => {
    setChats((prev) =>
      prev.map((chat) =>
        chat.id === id && chat.capacity < maxCapacity
          ? { ...chat, capacity: chat.capacity + 1 }
          : chat
      )
    );
  };

  const handleCreateChat = async (e: FormEvent) => {
    e.preventDefault();

    // 세션 정보가 없는 경우 실행 방지
    if (!sessionUser) {
      alert("로그인 세션이 만료되었거나 정보가 없습니다. 다시 로그인해 주세요.");
      return;
    }

    const { data, error } = await createRoom(
      newRoomTitle, 
      Number(newRoomCapacity), 
      sessionUser.id, 
      sessionUser.name, 
      sessionUser.email,
      newRoomDescription
    );

    if (error) {
      console.error("채팅방 생성 실패:", error.message);
      alert("채팅방 생성 중 오류가 발생했습니다.");
      return;
    }

    if (data && data.length > 0) {
      const createdRoom = data[0];
      const newRoom: ChatRoom = {
        id: createdRoom.id,
        title: createdRoom.title,
        name: sessionUser.name,
        user_id: sessionUser.id,
        email: sessionUser.email,
        created_at: createdRoom.created_at,
        capacity: createdRoom.capacity,
        description: createdRoom.description,
      };

      setChats((prev) => [newRoom, ...prev]);
      setIsModalOpen(false);
      setNewRoomTitle("");
      setNewRoomCapacity(0);
      setNewRoomDescription("");
    }
  };

  const filteredChats = chats.filter((chat) => {
    const isFull = chat.capacity >= maxCapacity;
    if (filter === 'available') return !isFull;
    if (filter === 'full') return isFull;
    return true;
  });

  return (
    <div className="flex flex-col h-full">
      {/* 채팅 필터 서브 메뉴 */}
      <div className="flex items-center justify-between mb-8 border-b border-zinc-800/50 pb-6">
        <div className="flex gap-3">
          {(['all', 'available', 'full'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${
                filter === f
                  ? 'bg-zinc-100 text-black'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              {f === 'all' ? '전체' : f === 'available' ? '참여 가능' : '풀방'}
            </button>
          ))}
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold transition-all active:scale-95"
        >
          방 만들기
        </button>
      </div>

      {/* 리스트 출력 */}
      {filteredChats.length > 0 ? (
        <div className="flex flex-col space-y-2 ">
          {filteredChats.map((chat) => {
            const isFull = chat.capacity >= maxCapacity;
            const displayId = chat.email ? chat.email.split('@')[0] : 'user';

            return (
              <div 
                key={chat.id} 
                onClick={() => !isFull && handleJoinChat(chat.id)} 
                className={`flex items-center justify-between p-4 rounded-lg border transition-all 
                  ${isFull 
                    ? 'bg-zinc-950 border-gray-400 grayscale opacity-50 cursor-not-allowed' 
                    : 'bg-zinc-900 hover:bg-zinc-800 hover:border-zinc-300 cursor-pointer active:scale-[0.98]'
                  }`}
              >
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-zinc-100">{chat.title}</h3>
                    <span className="text-xs text-zinc-500">@{displayId}</span>
                  </div>
                  <span className="text-[10px] text-zinc-400 font-mono">{chat.description}</span>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={`text-xs font-mono font-bold ${isFull ? 'text-red-400' : 'text-blue-400'}`}>
                    {chat.capacity?chat.capacity:0}/{maxCapacity}
                  </span>
                  <span className="text-[10px] text-zinc-600">
                    {(() => {
                      const date = new Date(chat.created_at);
                      const isToday = date.toDateString() === new Date().toDateString();
                      return isToday 
                        ? date.toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit', 
                            hour12: false 
                          })
                        : date.toLocaleDateString();
                    })()}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-zinc-500">
          해당하는 채팅방이 없습니다.
        </div>
      )}

      {/* 채팅방 생성 모달 */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 text-zinc-100">
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-md rounded-2xl p-6 shadow-2xl">
            <h2 className="text-xl font-bold mb-4">새 채팅방 생성</h2>
            <form onSubmit={handleCreateChat}>
              <div className="mb-6">
                <label className="block text-sm font-medium text-zinc-400 mb-2">방 제목</label>
                <input
                  autoFocus
                  type="text"
                  value={newRoomTitle}
                  onChange={(e) => setNewRoomTitle(e.target.value)}
                  placeholder="방 제목을 입력하세요"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 focus:outline-none focus:border-zinc-500 transition-colors"
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-zinc-400 mb-2">방 설명</label>
                <input 
                  type="text"
                  value={newRoomDescription}
                  onChange={(e) => setNewRoomDescription(e.target.value)}
                  placeholder="방의 목적이나 규칙을 짧게 적어주세요"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 focus:outline-none focus:border-zinc-500 transition-colors resize-none"
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-zinc-400 mb-2">참가 가능 인원</label>
                <select
                  value={newRoomCapacity}
                  onChange={(e) => setNewRoomCapacity(Number(e.target.value))}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 focus:outline-none focus:border-zinc-500 transition-colors cursor-pointer"
                >
                  <option value={0} disabled>인원 수를 선택하세요</option>
                  {[2, 5, 10, 20, 50, 100].map((num) => (
                    <option key={num} value={num}>{num}명</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-6 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl font-bold transition-all">취소</button>
                <button 
                  type="submit" 
                  disabled={!newRoomTitle.trim() || newRoomCapacity === 0 || !sessionUser}
                  className="flex-1 px-6 py-3 bg-zinc-100 hover:bg-zinc-200 text-black rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  생성하기
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}