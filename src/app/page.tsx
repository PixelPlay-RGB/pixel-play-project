'use client';

import { useState } from 'react';
import ChatList from '@/components/list/ChatList';
import LiveList from '@/components/list/LiveList';
import { CHAT_DATA } from '@/mock/chat-list';
import { ChatRoom } from '@/lib/room';

export default function Home() {
  // 라이브 화면 default
  const [activeTab, setActiveTab] = useState<'live' | 'chat'>('chat');

  const [chats, setChats] = useState<ChatRoom[]>(CHAT_DATA as ChatRoom[]);

  return (
    <main className="flex min-h-screen flex-col p-8 bg-black text-zinc-100">
      <div className="mx-auto w-full flex flex-row gap-8 max-w-7xl">
        {/* 왼쪽 사이드바*/}
        <aside className="w-[30%]">
          <div className="flex flex-col gap-6 bg-transparent">
            <button
              onClick={() => setActiveTab('chat')}
              className={`w-full px-8 py-6 text-left text-xl font-bold rounded-2xl transition-all duration-200 ${
                activeTab === 'chat'
                  ? 'bg-zinc-100 text-black shadow-md'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
              }`}
            >
              채팅
            </button>

            <button
              onClick={() => setActiveTab('live')}
              className={`w-full px-8 py-6 text-left text-xl font-bold rounded-2xl transition-all duration-200 ${
                activeTab === 'live'
                  ? 'bg-zinc-100 text-black shadow-md'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
              }`}
            >
              라이브
            </button>
          </div>
        </aside>

        {/* 오른쪽 리스트 구역 */}
        <section className="w-[70%] min-h-[600px] bg-zinc-900/30 rounded-2xl border border-zinc-800 p-6">
          {activeTab === 'chat' ? (
            <ChatList chats={chats} setChats={setChats} maxCapacity={100} />
          ) : (
            <LiveList />
          )}
        </section>
      </div>
    </main>
  )
}
