/**
 * ConversationConsole Component
 * Terminal-like interface for streaming agent conversations
 */

import React, { useState, useEffect, useRef } from 'react';
import { Terminal, Play, Pause, Volume2, VolumeX, Download, Copy, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AGENT_PERSONAS } from '@/lib/services/agent-personas';
import { SynchronizedStreamingText } from './SynchronizedStreamingText';

interface ConversationConsoleProps {
  messages: Array<{
    id: string;
    agentId: string;
    content: string;
    timestamp: Date;
  }>;
  isActive: boolean;
  currentSpeaker: string | null;
  currentlyPlaying: string | null;
  textSyncState?: {
    currentCharIndex: number;
    totalChars: number;
  };
  onToggleSound: () => void;
  isMuted: boolean;
  onSaveConversation?: () => void;
  onGenerateSummary?: () => void;
  className?: string;
}

export function ConversationConsole({
  messages,
  isActive,
  currentSpeaker,
  currentlyPlaying,
  textSyncState,
  onToggleSound,
  isMuted,
  onSaveConversation,
  onGenerateSummary,
  className
}: ConversationConsoleProps) {
  const [displayedMessages, setDisplayedMessages] = useState<string[]>([]);
  const [currentLine, setCurrentLine] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const consoleRef = useRef<HTMLDivElement>(null);
  const typewriterRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-scroll to bottom only when conversation is active and user hasn't scrolled up
  const [userHasScrolled, setUserHasScrolled] = useState(false);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);

  useEffect(() => {
    if (consoleRef.current && shouldAutoScroll && !userHasScrolled) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
    }
  }, [displayedMessages, currentLine, shouldAutoScroll, userHasScrolled]);

  // Handle scroll events to detect user scrolling
  const handleScroll = () => {
    if (consoleRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = consoleRef.current;
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10; // 10px tolerance
      
      if (!isAtBottom) {
        setUserHasScrolled(true);
        setShouldAutoScroll(false);
      } else {
        setUserHasScrolled(false);
        setShouldAutoScroll(true);
      }
    }
  };

  // Process messages for display with synchronized streaming
  useEffect(() => {
    if (messages.length === 0) {
      setDisplayedMessages([]);
      return;
    }

    // Convert all messages except the last one to display format
    const completedMessages = messages.slice(0, -1).map(msg => {
      const agent = AGENT_PERSONAS[msg.agentId];
      const agentName = agent?.name || 'Moderator';
      return `[${msg.timestamp.toLocaleTimeString()}] ${agentName}: ${msg.content}`;
    });

    setDisplayedMessages(completedMessages);
  }, [messages]);

  const getAgentColor = (agentId: string) => {
    const colorMap: Record<string, string> = {
      bull: 'text-green-400',
      bear: 'text-red-400',
      balanced: 'text-blue-400',
      skeptic: 'text-yellow-400',
      technical: 'text-purple-400',
      macro: 'text-cyan-400',
      risk: 'text-orange-400',
      growth: 'text-indigo-400',
      value: 'text-emerald-400',
      contrarian: 'text-pink-400',
      moderator: 'text-blue-400'
    };
    return colorMap[agentId] || 'text-slate-300';
  };

  const copyToClipboard = async () => {
    const conversationText = messages.map(msg => {
      const agent = AGENT_PERSONAS[msg.agentId];
      const agentName = agent?.name || 'Moderator';
      return `[${msg.timestamp.toLocaleTimeString()}] ${agentName}: ${msg.content}`;
    }).join('\n');
    
    try {
      await navigator.clipboard.writeText(conversationText);
      // Could add a toast notification here
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const downloadConversation = () => {
    const conversationText = messages.map(msg => {
      const agent = AGENT_PERSONAS[msg.agentId];
      const agentName = agent?.name || 'Moderator';
      return `[${msg.timestamp.toLocaleTimeString()}] ${agentName}: ${msg.content}`;
    }).join('\n');
    
    const blob = new Blob([conversationText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `agent-conversation-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatMessageLine = (line: string) => {
    // Extract timestamp, agent name, and content
    const match = line.match(/^\[(.*?)\] (.*?): (.*)$/);
    if (!match) return line;
    
    const [, timestamp, agentName, content] = match;
    const agentId = Object.keys(AGENT_PERSONAS).find(id => 
      AGENT_PERSONAS[id].name === agentName
    ) || 'moderator';
    
    const agentColor = getAgentColor(agentId);
    
    return (
      <span key={line}>
        <span className="text-slate-500">[{timestamp}]</span>{' '}
        <span className={cn("font-semibold", agentColor)}>{agentName}:</span>{' '}
        <span className="text-slate-200">{content}</span>
      </span>
    );
  };

  return (
    <div className={cn("bg-black rounded-lg border border-slate-700 overflow-hidden flex flex-col", className)}>
      {/* Terminal Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-800 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-green-400" />
          <span className="text-sm font-mono text-slate-300">Agent Discussion Terminal</span>
          {isActive && (
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-xs text-green-400">LIVE</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {messages.length > 0 && (
            <>
              <button
                onClick={() => setShowActions(!showActions)}
                className="p-1 rounded transition-colors text-slate-400 hover:text-slate-300"
                title="Actions"
              >
                <FileText className="w-4 h-4" />
              </button>
              
              {showActions && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={copyToClipboard}
                    className="p-1 rounded transition-colors text-slate-400 hover:text-slate-300"
                    title="Copy to Clipboard"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  
                  <button
                    onClick={downloadConversation}
                    className="p-1 rounded transition-colors text-slate-400 hover:text-slate-300"
                    title="Download Conversation"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  
                  {onSaveConversation && (
                    <button
                      onClick={onSaveConversation}
                      className="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-500 rounded transition-colors text-white"
                      title="Save to Database"
                    >
                      Save
                    </button>
                  )}
                  
                  {onGenerateSummary && (
                    <button
                      onClick={onGenerateSummary}
                      className="px-2 py-1 text-xs bg-purple-600 hover:bg-purple-500 rounded transition-colors text-white"
                      title="Generate Summary"
                    >
                      Summary
                    </button>
                  )}
                </div>
              )}
            </>
          )}
          
          <button
            onClick={onToggleSound}
            className={cn(
              "p-1 rounded transition-colors",
              isMuted ? "text-red-400 hover:text-red-300" : "text-slate-400 hover:text-slate-300"
            )}
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          
          {/* Terminal window controls */}
          <div className="flex gap-1">
            <button
              onClick={() => {
                if (consoleRef.current) {
                  consoleRef.current.scrollTop = 0;
                }
              }}
              className="w-3 h-3 bg-red-500 hover:bg-red-400 rounded-full transition-colors"
              title="Scroll to top"
            />
            <button
              onClick={() => {
                setDisplayedMessages([]);
                setCurrentLine('');
              }}
              className="w-3 h-3 bg-yellow-500 hover:bg-yellow-400 rounded-full transition-colors"
              title="Clear terminal"
            />
            <button
              onClick={() => {
                if (consoleRef.current) {
                  consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
                }
              }}
              className="w-3 h-3 bg-green-500 hover:bg-green-400 rounded-full transition-colors"
              title="Scroll to bottom"
            />
          </div>
        </div>
      </div>

      {/* Terminal Content */}
      <div 
        ref={consoleRef}
        className="flex-1 p-4 font-mono text-sm overflow-y-auto bg-black scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800"
        style={{ 
          background: 'linear-gradient(135deg, #000000 0%, #0a0a0a 100%)',
          textShadow: '0 0 10px rgba(0, 255, 0, 0.3)',
          minHeight: '400px'
        }}
        onScroll={handleScroll}
      >
        {messages.length === 0 && (
          <div className="text-slate-500 italic">
            <span className="text-green-400">$</span> Waiting for agent discussion to begin...
            <span className="animate-pulse">_</span>
          </div>
        )}
        
        {/* Display completed messages */}
        {displayedMessages.map((line, index) => (
          <div key={index} className="mb-1 leading-relaxed">
            {formatMessageLine(line)}
          </div>
        ))}
        
        {/* Display current message with synchronized streaming */}
        {messages.length > 0 && (
          (() => {
            const currentMessage = messages[messages.length - 1];
            const agent = AGENT_PERSONAS[currentMessage.agentId];
            const agentName = agent?.name || 'Moderator';
            const agentColor = getAgentColor(currentMessage.agentId);
            const timestamp = currentMessage.timestamp.toLocaleTimeString();
            
            // Check if this message is currently playing
            const isCurrentlyPlaying = currentlyPlaying === currentMessage.id;
            const syncCharIndex = textSyncState?.currentCharIndex;
            
            // Create the full message line
            const fullMessageLine = `[${timestamp}] ${agentName}: ${currentMessage.content}`;
            
            return (
              <div className="mb-1 leading-relaxed">
                <span className="text-slate-500">[{timestamp}]</span>{' '}
                <span className={cn("font-semibold", agentColor)}>{agentName}:</span>{' '}
                <SynchronizedStreamingText
                  text={currentMessage.content}
                  isStreaming={isCurrentlyPlaying && !isMuted}
                  currentCharIndex={isCurrentlyPlaying ? syncCharIndex : undefined}
                  speed={25} // Slower speed for better readability
                  className="text-slate-200"
                  showCursor={false} // Don't show cursor in terminal mode
                />
              </div>
            );
          })()
        )}
        
        {isActive && (
          <div className="text-green-400 mt-2">
            <span>$</span> <span className="animate-pulse">_</span>
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="px-4 py-2 bg-slate-900 border-t border-slate-700 text-xs text-slate-400">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span>Messages: {messages.length}</span>
            {currentSpeaker && (
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                {AGENT_PERSONAS[currentSpeaker]?.name || 'Unknown'} speaking
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <span className={cn(
              "px-2 py-1 rounded text-xs",
              isActive ? "bg-green-900 text-green-400" : "bg-slate-700 text-slate-400"
            )}>
              {isActive ? 'ACTIVE' : 'IDLE'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
