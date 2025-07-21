// src/components/layout/navbar.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AuthButton } from '../../lib/auth/components/auth/AuthButton';
import { useSession } from 'next-auth/react';
import { Settings, Brain, Users, X, Building2, FileText } from 'lucide-react';
import { cn } from '../../lib/utils';

const TenkeyLogo = () => (
  <svg
    width="48"
    height="48"
    viewBox="0 0 28 28"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="transition-transform duration-300"
  >
    <defs>
      <linearGradient 
        id="logoGradient" 
        x1="0" 
        y1="0" 
        x2="28" 
        y2="28" 
        gradientUnits="userSpaceOnUse"
      >
        <stop offset="0%" stopColor="#10B981" />
        <stop offset="100%" stopColor="#0EA5E9" />
      </linearGradient>
    </defs>
    <path
      d="M14 4L24 9.5V18.5L14 24L4 18.5V9.5L14 4Z"
      fill="#0F172A"
      stroke="url(#logoGradient)"
      strokeWidth="1.5"
    />
    <path
      d="M10 8H18M14 8V20"
      stroke="url(#logoGradient)"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

interface RecentChat {
  id: string;
  symbol: string;
  title: string;
  createdAt: string;
}

interface ChatHistoryResponse {
  id: string;
  filing: {
    filings: Array<{
      companyName: string;
      form: string;
      filingDate: string;
      accessionNumber: string;
      textUrl?: string;
      symbol?: string;
      cik?: string;
    }>;
  };
  updatedAt: string;
}

export function Navbar() {
  const { data: session } = useSession();
  const router = useRouter();
  const [recentChats, setRecentChats] = useState<RecentChat[]>([]);

  // Load recent chats from database
  useEffect(() => {
    const fetchRecentChats = async () => {
      if (!session) return;
      
      try {
        const response = await fetch('/api/chat/history?limit=5');
        if (response.ok) {
          const rawChats: ChatHistoryResponse[] = await response.json();
          
          // Transform the API response to match RecentChat interface
          const transformedChats: RecentChat[] = rawChats
            .map((chat) => {
              // Extract symbol from the first filing
              const firstFiling = chat.filing?.filings?.[0];
              const symbol = firstFiling?.symbol;
              
              // Only include chats that have a valid symbol
              if (!symbol) {
                console.warn('Chat missing symbol:', chat.id);
                return null;
              }
              
              return {
                id: chat.id,
                symbol: symbol.toUpperCase(),
                title: `${symbol.toUpperCase()} Chat`,
                createdAt: chat.updatedAt
              };
            })
            .filter((chat): chat is RecentChat => chat !== null)
            .slice(0, 5); // Show max 5 tabs
          
          setRecentChats(transformedChats);
        }
      } catch (error) {
        console.error('Failed to fetch recent chats:', error);
      }
    };

    fetchRecentChats();
  }, [session]);

  const removeTab = (chatIdToRemove: string) => {
    setRecentChats(prev => prev.filter(chat => chat.id !== chatIdToRemove));
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      {/* Main Navbar */}
      <nav className="h-14 border-b border-slate-800 bg-[#0B0E14]/80 backdrop-blur-lg">
        <div className="max-w-[1400px] mx-auto px-4 h-full flex items-center justify-between">
          <Link 
            href="/" 
            className="flex items-center gap-3 group transform transition-transform hover:scale-105"
          >
            <TenkeyLogo />
            <span className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400 group-hover:opacity-90 tracking-tight font-mono">
              TENKEY
            </span>
          </Link>
          
          <div className="flex items-center gap-4">
            {session && (
              <>
                <Link 
                  href="/models" 
                  className="text-slate-400 hover:text-white transition-colors group"
                  title="View AI Models"
                >
                  <Brain className="w-6 h-6 group-hover:text-blue-400 transition-colors" />
                </Link>
                <Link 
                  href="/agents" 
                  className="text-slate-400 hover:text-white transition-colors group"
                  title="Configure Agents"
                >
                  <Users className="w-6 h-6 group-hover:text-green-400 transition-colors" />
                </Link>
                <Link
                  href="/settings"
                  className="text-slate-400 hover:text-white transition-colors"
                  title="Settings"
                >
                  <Settings className="w-6 h-6" />
                </Link>
              </>
            )}
            <AuthButton />
          </div>
        </div>
      </nav>

      {/* Recent Chats Tabs */}
      {session && recentChats.length > 0 && (
        <div className="bg-[#0B0E14]/90 backdrop-blur-sm border-b border-slate-800/50">
          <div className="max-w-[1400px] mx-auto px-4">
            <div className="flex items-center gap-1 py-2 overflow-x-auto scrollbar-hide">
              <FileText className="w-4 h-4 text-slate-500 mr-2 flex-shrink-0" />
              {recentChats.map((chat) => (
                <div
                  key={chat.id}
                  className="group flex items-center gap-2 px-3 py-1.5 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700/50 hover:border-slate-600/50 rounded-lg transition-all text-sm whitespace-nowrap relative"
                >
                  <button
                    onClick={() => router.push(`/company/${chat.symbol}?chatId=${chat.id}`)}
                    className="flex items-center gap-2 flex-1"
                  >
                    <Building2 className="w-3 h-3 text-blue-400 flex-shrink-0" />
                    <span className="text-white font-medium">{chat.symbol}</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-medium flex-shrink-0 bg-green-900/50 text-green-400">
                      Chat
                    </span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeTab(chat.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 ml-1 p-0.5 hover:bg-slate-600/50 rounded transition-all flex-shrink-0"
                    title="Close tab"
                  >
                    <X className="w-3 h-3 text-slate-400 hover:text-white" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
