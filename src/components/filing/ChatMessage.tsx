import React, { memo, useState } from 'react';
import { Bot, User, Copy, Volume2, VolumeX, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MessageContent } from './MessageContent';
import { LoadingMessage } from './LoadingMessage';
import type { Message } from '@/lib/types/filing-chat';

interface ChatMessageProps {
  message: Message;
  isStreaming?: boolean;
  isTTSAvailable?: boolean;
  isSpeaking?: boolean;
  currentlyPlaying?: string | null;
  onSpeakerClick?: (text: string, messageId: string) => void;
  filingContents?: string[];
  [key: string]: any; // Accept other props that MessageList passes
}

export const ChatMessage = memo(({ 
  message, 
  isStreaming = false, 
  isTTSAvailable = false,
  isSpeaking = false,
  currentlyPlaying = null,
  onSpeakerClick,
  filingContents = [],
  onConfirmAnalysis, 
  onDeclineAnalysis 
}: ChatMessageProps & {
  onConfirmAnalysis?: (buffer: string) => void;
  onDeclineAnalysis?: () => void;
}) => {
  const [copied, setCopied] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const isUser = message.role === 'user';
  const isAgentAnalysis = message.isAgentAnalysis || false;
  const isConfirmation = message.isConfirmation || false;
  
  const messageId = `${message.timestamp.getTime()}`;
  const isCurrentlyPlaying = currentlyPlaying === messageId;
  
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };
  
  const handleTTSClick = () => {
    if (onSpeakerClick) {
      onSpeakerClick(message.content, messageId);
    }
  };
  
  // Skip confirmation messages entirely - we don't want agent analysis
  if (isConfirmation) {
    return null;
  }
  
  // Skip agent analysis messages entirely - we don't want agent analysis
  if (isAgentAnalysis) {
    return null;
  }
  
  // Regular message display
  return (
    <div className={cn(
      "group relative",
      isUser 
        ? "flex justify-end mb-4" 
        : "flex justify-start mb-6"
    )}>
      <div className={cn(
        "flex gap-3 max-w-[85%] w-full",
        isUser ? "flex-row-reverse" : "flex-row"
      )}>
        <div className="flex-shrink-0">
          {isUser ? (
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className={cn(
            "rounded-2xl px-4 py-3 shadow-sm",
            isUser 
              ? "bg-blue-600 text-white ml-auto" 
              : "bg-slate-800/80 border border-slate-700/50 text-slate-100"
          )}>
            {!isUser && (
              <div className="flex items-center gap-2 mb-2 opacity-70">
                <span className="text-xs font-medium">
                  Assistant
                </span>
                <span className="text-xs">
                  {message.timestamp.toLocaleTimeString()}
                </span>
              </div>
            )}
            
            <div className={cn(
              isUser ? "text-white" : "text-slate-100"
            )}>
              <MessageContent 
                content={message.content} 
                isUser={isUser} 
                isStreaming={message.isStreaming || false}
                annotations={message.annotations}
                filingContents={filingContents}
              />
              {isStreaming && !message.content && (
                <LoadingMessage />
              )}
            </div>
          </div>
          
          {/* Action buttons - only show for assistant messages and when not streaming */}
          {!isUser && !isStreaming && message.content && (
            <div className={cn(
              "flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity",
              isUser ? "justify-end" : "justify-start"
            )}>
              {/* Copy button */}
              <button
                onClick={handleCopy}
                className="p-1.5 rounded-md hover:bg-slate-700/50 transition-colors text-slate-400 hover:text-slate-200"
                title="Copy message"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-400" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
              
              {/* TTS button */}
              {isTTSAvailable && (
                <button
                  onClick={handleTTSClick}
                  className={cn(
                    "p-1.5 rounded-md hover:bg-slate-700/50 transition-colors",
                    isCurrentlyPlaying 
                      ? "text-blue-400 hover:text-blue-300" 
                      : "text-slate-400 hover:text-slate-200"
                  )}
                  title={isCurrentlyPlaying ? "Stop reading" : "Read aloud"}
                >
                  {isCurrentlyPlaying ? (
                    <VolumeX className="w-4 h-4" />
                  ) : (
                    <Volume2 className="w-4 h-4" />
                  )}
                </button>
              )}
            </div>
          )}
          
          {isUser && (
            <div className="text-xs text-slate-500 mt-1 text-right">
              {message.timestamp.toLocaleTimeString()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

ChatMessage.displayName = 'ChatMessage';
