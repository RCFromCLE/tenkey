// src/components/chats/PreviousChats.tsx
import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { MessageCircle, FileText, Clock, Calendar, ChevronDown, ChevronRight } from 'lucide-react';

interface Filing {
  companyName: string;
  form: string;
  filingDate: string;
  accessionNumber: string;
  textUrl?: string;
  symbol?: string;
  cik?: string;
}

interface ChatHistory {
  id: string;
  filing: {
    filings: Filing[];
  };
  updatedAt: string;
}

export function PreviousChats() {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const { data: chats } = useQuery<ChatHistory[]>({
    queryKey: ['chatHistory'],
    queryFn: async () => {
      const response = await fetch('/api/chat/history');
      if (!response.ok) throw new Error('Failed to fetch chat history');
      return response.json();
    },
    refetchInterval: 60000,
    refetchIntervalInBackground: true,
    staleTime: 55000
  });

  if (!chats?.length) return null;

  const getChatIdentifier = (chat: ChatHistory): string | null => {
    const filings = chat.filing?.filings;
    if (!filings || filings.length === 0) return null;

    const firstFiling = filings[0];
    if (firstFiling.symbol) return firstFiling.symbol;
    if (firstFiling.cik) return firstFiling.cik;

    const tickerMatch = firstFiling.companyName?.match(/\(([^)]+)\)/);
    if (tickerMatch) return tickerMatch[1];

    return null;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffMinutes < 1440) {
      const hours = Math.floor(diffMinutes / 60);
      return `${hours}h ago`;
    }
    
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 mb-4 hover:text-slate-200 transition-colors duration-200 group"
      >
        {isExpanded ? (
          <ChevronDown className="w-4 h-4 text-blue-400 transition-transform duration-200" />
        ) : (
          <ChevronRight className="w-4 h-4 text-blue-400 transition-transform duration-200" />
        )}
        <MessageCircle className="w-4 h-4 text-blue-400" />
        <h2 className="text-sm font-medium text-slate-300 group-hover:text-slate-200">
          Recent Analyses {chats?.length ? `(${chats.length})` : ''}
        </h2>
      </button>
      
      {isExpanded && (
        <div className="grid gap-3 animate-in slide-in-from-top-2 duration-200">
        {chats.map((chat) => {
          const identifier = getChatIdentifier(chat);
          if (!identifier || !chat.filing?.filings?.[0]) return null;
          
          const mainFiling = chat.filing.filings[0];
          const filingCount = chat.filing.filings.length;
          const filingDate = new Date(mainFiling.filingDate);
          
          return (
            <Link
              key={chat.id}
              href={`/company/${identifier}?chatId=${chat.id}`}
              className="block p-4 bg-slate-800/50 hover:bg-slate-800/80 
                       rounded-lg border border-slate-700/50 hover:border-slate-600/50 
                       transition-all duration-200"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-slate-200 font-medium mb-1 truncate">
                    {mainFiling.companyName}
                  </h3>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5" />
                      <span>{filingCount} filing{filingCount !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>
                        {new Intl.DateTimeFormat('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        }).format(filingDate)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{formatDate(chat.updatedAt)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
        </div>
      )}
    </div>
  );
}
