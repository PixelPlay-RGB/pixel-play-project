import { useState, Dispatch, SetStateAction, FormEvent } from "react";

interface ChatRoom 
{
  id: number;
  title: string;
  ownerId: string;
  email: string;
  name: string;
  currentParticipants: number;
  created_at: string;
}

interface ChatListProps {
  chats: ChatRoom[];
  setChats: Dispatch<SetStateAction<ChatRoom[]>>;
  maxCapacity: number;
}

export default function ChatList({ chats, setChats, maxCapacity }: ChatListProps) {
  const [filter, setFilter] = useState<'all' | 'available' | 'full'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newRoomTitle, setNewRoomTitle] = useState('');

  const handleJoinChat = (id: number) => {
    setChats((prev) =>
      prev.map((chat) =>
        chat.id === id && chat.currentParticipants < maxCapacity
          ? { ...chat, currentParticipants: chat.currentParticipants + 1 }
          : chat
      )
    );
  };

  const handleCreateChat = (e: FormEvent) => {
    e.preventDefault();
    if (!newRoomTitle.trim()) return;

    const newRoom: ChatRoom = {
      id: Date.now(),
      title: newRoomTitle,
      ownerId: 'user_me',
      email: 'me@pixelplay.com',
      name: '나',
      currentParticipants: 1,
      created_at: new Date().toISOString(),
    };

    setChats((prev) => [newRoom, ...prev]);
    setIsModalOpen(false);
    setNewRoomTitle('');
  };

  const filteredChats = chats.filter((chat) => {
    const isFull = chat.currentParticipants >= maxCapacity;
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
              {f === 'all' ? '전체' : f === 'available' ? '참여 가능' : '꽉 찬 방'}
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
        <div className="flex flex-col space-y-2">
          {filteredChats.map((chat) => {
            const isFull = chat.currentParticipants >= maxCapacity;
            const displayId = chat.email.split('@')[0];

            return (
              <div 
                key={chat.id} 
                onClick={() => !isFull && handleJoinChat(chat.id)} 
                className={`flex items-center justify-between p-4 rounded-lg border transition-all 
                  ${isFull 
                    ? 'bg-zinc-950 border-zinc-900 grayscale opacity-50 cursor-not-allowed' 
                    : 'bg-zinc-900 border-zinc-800 hover:bg-zinc-800 hover:border-zinc-700 cursor-pointer active:scale-[0.98]'
                  }`}
              >
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-zinc-100">{chat.title}</h3>
                    <span className="text-xs text-zinc-500">@{chat.name}</span>
                  </div>
                  <span className="text-[10px] text-zinc-600 font-mono">{displayId}</span>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={`text-xs font-mono font-bold ${isFull ? 'text-zinc-500' : 'text-blue-400'}`}>
                    {chat.currentParticipants}/{maxCapacity}
                  </span>
                  <span className="text-[10px] text-zinc-600">{new Date(chat.created_at).toLocaleDateString()}</span>
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
              <div className="flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-6 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl font-bold transition-all">취소</button>
                <button type="submit" className="flex-1 px-6 py-3 bg-zinc-100 hover:bg-zinc-200 text-black rounded-xl font-bold transition-all">생성하기</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}