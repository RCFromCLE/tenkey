import React from 'react';
import { Message } from '../../lib/types/filing-chat';
import { ClaudeStyleMessage } from './ClaudeStyleMessage';
import { Filing } from '../../lib/types/filing';

interface ClaudeStyleMessageListProps {
  messages: Message[];
  loading: boolean;
  selectedFilings: Filing[];
  companyName?: string;
  symbol?: string;
  apiKey: string;
  analysisMode: boolean;
  selectedAgentPersonas: string[];
  isTTSAvailable: boolean;
  isSpeaking: boolean;
  currentlyPlaying: string | null;
  onSpeakerClick: (text: string, messageId: string) => void;
  onAnalysisUpdate?: (analysis: string) => void;
}

export function ClaudeStyleMessageList({
  messages,
  loading,
  selectedFilings,
  companyName,
  symbol = 'UNKNOWN',
  apiKey,
  analysisMode,
  selectedAgentPersonas,
  isTTSAvailable,
  isSpeaking,
  currentlyPlaying,
  onSpeakerClick,
  onAnalysisUpdate
}: ClaudeStyleMessageListProps) {

  return (
    <div className="flex-1 overflow-y-auto bg-slate-950">
      {/* Empty state */}
      {messages.length === 0 && !loading && (
        <div className="flex items-center justify-center h-full">
          <div className="text-center max-w-md">
            <h3 className="text-lg font-medium text-slate-200 mb-2">
              Start a conversation
            </h3>
            <p className="text-slate-400">
              Ask questions about the SEC filing to begin your analysis.
            </p>
          </div>
        </div>
      )}
      
      {/* Messages */}
      <div className="divide-y divide-slate-800/50">
        {messages.map((message, index) => {
          const messageId = `${message.timestamp.getTime()}-${index}`;
          return (
            <ClaudeStyleMessage
              key={messageId}
              message={message}
              isStreaming={index === messages.length - 1 && loading}
              isTTSAvailable={isTTSAvailable}
              isSpeaking={isSpeaking}
              currentlyPlaying={currentlyPlaying}
              onSpeakerClick={onSpeakerClick}
            />
          );
        })}
      </div>
      
      {/* Loading state */}
      {loading && messages.length > 0 && (
        <div className="py-6 bg-slate-900">
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-600 flex items-center justify-center shadow-lg">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-slate-200 mb-2">Tenkey</div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}