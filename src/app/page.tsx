'use client';

import { useState } from 'react';
import ChatList from '@/components/list/ChatList';
import LiveList from '@/components/list/LiveList';
import { ChatRoom } from '@/lib/room';
import AuthToastHandler from "@/components/auth/auth-toast-handler";

export default function Home() {
  // 라이브 화면 default
  const [activeTab, setActiveTab] = useState<'live' | 'chat'>('chat');
  const [chats, setChats] = useState<ChatRoom[]>([]);

  return (
    <>
      <AuthToastHandler />
      <main className="flex min-h-2.5 flex-col p-8 bg-transparent text-zinc-900 dark:text-zinc-100">
        <div className="mx-auto w-full flex flex-row gap-8 max-w-full">
          {/* 왼쪽 사이드바*/}
          <aside className="w-72 flex-shrink-0">
            <div className="flex flex-col gap-6 bg-transparent">
              <button
                onClick={() => setActiveTab('chat')}
                className={`w-full px-8 py-6 text-left text-xl font-bold rounded-2xl transition-all duration-200 ${
                  activeTab === 'chat'
                    ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-md border border-zinc-200 dark:border-zinc-700'
                    : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800/50'
                }`}
              >
                채팅
              </button>

              <button
                onClick={() => setActiveTab('live')}
                className={`w-full px-8 py-6 text-left text-xl font-bold rounded-2xl transition-all duration-200 ${
                  activeTab === 'live'
                    ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-md border border-zinc-200 dark:border-zinc-700'
                    : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800/50'
                }`}
              >
                라이브
              </button>
            </div>
          </aside>

          {/* 오른쪽 리스트 구역 */}
          <section className="relative flex-1 bg-white/50 dark:bg-zinc-900/30 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 backdrop-blur-sm">
            {activeTab === 'chat' ? (
              <ChatList chats={chats} setChats={setChats} maxCapacity={30} />
            ) : (
              <LiveList />
            )}
          </section>
        </div>
      </main>
  </>
  )
}