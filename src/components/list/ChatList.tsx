import { useState, Dispatch, SetStateAction, useEffect, useMemo } from "react";
import { createRoom, getRooms, ChatRoom } from "@/lib/room";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FieldError } from "@/components/ui/field";

interface ChatListProps {
  chats: ChatRoom[];
  setChats: Dispatch<SetStateAction<ChatRoom[]>>;
  maxCapacity: number;
}

const supabase = createClient();

export default function ChatList({ chats, setChats, maxCapacity }: ChatListProps) {
  const [filter, setFilter] = useState<'joined' | 'others' | 'my'>('joined');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sessionUser, setSessionUser] = useState<{ id: string; email: string; nickname: string } | null>(null);

  const roomSchema = useMemo(() => z.object({
    title: z.string().min(1, "방 제목을 입력해주세요."),
    capacity: z.number({ error: "참가 가능 인원을 입력해주세요." })
      .min(2, "최소 2명 이상이어야 합니다.")
      .max(maxCapacity, `최대 ${maxCapacity}명까지 가능합니다.`),
    description: z.string().optional(),
  }), [maxCapacity]);

  type RoomFormValues = z.infer<typeof roomSchema>;

  const { register, handleSubmit, reset, formState: { errors, isValid } } = useForm<RoomFormValues>({
    resolver: zodResolver(roomSchema),
    mode: "onChange",
    defaultValues: { title: "", capacity: undefined, description: "" }
  });

  // 세션 정보 가져오기
  useEffect(() => {
    // 방 목록 초기 가져오기
    const fetchRooms = async () => {
      const { data, error } = await getRooms(sessionUser?.id);
      if (error) {
        toast.error("채팅방 목록을 불러오는데 실패했습니다.");
        console.log("select error: ", error)
      } else if (data) {
        setChats(data);
      }
    };

    fetchRooms();
  }, [setChats, sessionUser?.id]);

  useEffect(() => {
    const getSession = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        const { data: userData, error } = await supabase
          .from("user")
          .select("id, email, nickname")
          .eq("oauth_id", authUser.id)
          .single();

        if (userData && !error) {
          setSessionUser({
            id: userData.id,
            email: userData.email,
            nickname: userData.nickname,
          });
        }
      }
    };
    getSession();
  }, []);

  const handleJoinChat = async (roomId: string, maxCapacity: number) => {
    const { count, error } = await supabase
      .from("chatroommember")
      .select("*", { count: "exact", head: true })
      .eq("chat_room_id", roomId)
      .eq("status", "JOINED");

    if (error) 
    {
      toast.error("방 인원 정보를 확인하는 중 오류가 발생했습니다.");
      return;
    }

    if (count !== null && count >= maxCapacity) 
    {
      toast.error("정원이 가득 차서 입장할 수 없습니다.");
      return;
    }
  };

  const handleCreateChat = async (values: RoomFormValues) => {
    // 세션 정보가 없는 경우 실행 방지
    if (!sessionUser) 
    {
      toast.error("로그인 세션이 만료되었거나 정보가 없습니다. 다시 로그인해 주세요.");
      return;
    }

    const { data, error } = await createRoom(
      values.title, 
      values.capacity, 
      sessionUser.id, 
      values.description || ""
    );

    if (error) 
    {
      toast.error("⚠️채팅방 생성 중 오류가 발생했습니다. 관리자에게 문의해주세요.");
      console.log("insert error: ", error);
      return;
    }

    if (data && data.length > 0)
    {
      const createdRoom = data[0];
      const newRoom: ChatRoom = {
        id: createdRoom.id,
        title: createdRoom.title,
        owner_id: sessionUser.id,
        created_at: createdRoom.created_at,
        max_capacity: createdRoom.max_capacity,
        description: createdRoom.description,
        owner: {
          nickname: sessionUser.nickname,
        },
        member_cnt: 1,
        is_joined: true
      };

      toast.success("채팅방이 생성되었습니다.");
      setChats((prev) => [newRoom, ...prev]);
      reset();
      setIsModalOpen(false);
    }
  };

  const filteredChats = chats.filter((chat) => {
    if (filter === 'joined') return chat.is_joined;
    if (filter === 'others') return !chat.is_joined && chat.owner_id !== sessionUser?.id;
    if (filter === 'my') return chat.owner_id === sessionUser?.id;
    return true;
  });

  return (
    <div className="flex flex-col h-full">
      {/* 채팅 필터 서브 메뉴 */}
      <div className="flex items-center justify-between mb-8 border-b border-zinc-200 dark:border-zinc-800/50 pb-6">
        <div className="flex gap-3">
          {(['joined', 'others', 'my'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${
                filter === f
                  ? 'bg-brand text-white shadow-lg shadow-brand/20'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/50'
              }`}
            >
              {f === 'joined' ? '참여중인 채팅방' : f === 'others' ? '참여 가능 채팅방' : '내가 만든 채팅방'}
            </button>
          ))}
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-6 py-2 bg-brand hover:opacity-90 text-white rounded-xl text-sm font-black transition-all active:scale-95 shadow-lg shadow-brand/20"
        >
          방 만들기
        </button>
      </div>

      {/* 리스트 출력 */}
      {filteredChats.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredChats.map((chat) => {
            const displayNickname = chat.owner?.nickname || 'Unknown';

            return (
              <div 
                key={chat.id} 
                onClick={() => handleJoinChat(chat.id, chat.max_capacity)} 
                className="flex items-center justify-between p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800/50 bg-white dark:bg-zinc-900/50 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 hover:border-brand/50 dark:hover:border-brand/50 cursor-pointer transition-all group active:scale-[0.99] shadow-sm dark:shadow-none"
              >
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-zinc-900 dark:text-zinc-100">{chat.title}</h3>
                    <span className="text-xs text-zinc-500">@{displayNickname}</span>
                  </div>
                  <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-mono">{chat.description}</span>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-xs font-mono font-bold text-brand group-hover:opacity-80">
                    {chat.member_cnt ?? 0}/{chat.max_capacity}
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
        <div className="absolute inset-0 z-50 flex items-start justify-center bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md rounded-2xl p-4 sm:p-8 text-zinc-900 dark:text-zinc-100">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 w-full max-w-md rounded-3xl p-8 shadow-xl animate-in fade-in zoom-in duration-200 sticky top-10">
            <h2 className="text-xl font-bold mb-4 dark:text-white">새 채팅방 생성</h2>
            <form onSubmit={handleSubmit(handleCreateChat)}>
              <div className="mb-5">
                <label className="block text-sm font-medium text-zinc-400 mb-2">방 제목</label>
                <input
                  autoFocus
                  type="text"
                  {...register("title")}
                  placeholder="방 제목을 입력하세요"
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-brand transition-colors"
                />
                <FieldError errors={[errors.title]} />
              </div>
              <div className="mb-5">
                <label className="block text-sm font-medium text-zinc-400 mb-2">방 설명</label>
                <input 
                  type="text"
                  {...register("description")}
                  placeholder="방의 목적이나 규칙을 짧게 적어주세요"
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-brand transition-colors resize-none"
                />
                <FieldError errors={[errors.description]} />
              </div>
              <div className="mb-8">
                <label className="block text-sm font-medium text-zinc-400 mb-2">참가 가능 인원</label>
                <input 
                  type="number"
                  {...register("capacity", { valueAsNumber: true })}
                  min={2}
                  max={maxCapacity}
                  placeholder={`참가 가능한 인원을 적어주세요. (최대 ${maxCapacity}명)`}
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-brand transition-colors resize-none"
                />
                <FieldError errors={[errors.capacity]} />
              </div>

              <div className="flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-6 py-3 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl font-bold transition-all text-zinc-600 dark:text-zinc-300">취소</button>
                <button 
                  type="submit" 
                  disabled={!isValid || !sessionUser}
                  className="flex-1 px-6 py-3 bg-brand hover:opacity-90 text-white rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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