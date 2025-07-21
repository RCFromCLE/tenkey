/**
 * MessageList Component
 * Container for rendering chat messages with loading and empty states
 */

import React from 'react';
import { Message } from '../../lib/types/filing-chat';
import { ChatMessage } from './ChatMessage';
import { LoadingMessage } from './LoadingMessage';
import { Filing } from '../../lib/types/filing';
import { FilingReferenceFormatter } from '../../lib/services/filing-reference-formatter';

interface MessageListProps {
  messages: Message[];
  loading: boolean;
  selectedFilings: Filing[];
  companyName?: string;
  apiKey: string;
  analysisMode: boolean;
  selectedAgentPersonas: string[];
  isTTSAvailable: boolean;
  isSpeaking: boolean;
  currentlyPlaying: string | null;
  onSpeakerClick: (text: string, messageId: string) => void;
  onAnalysisUpdate?: (analysis: string) => void;
}

const MessageListComponent = ({
  messages,
  loading,
  selectedFilings,
  companyName,
  apiKey,
  analysisMode,
  selectedAgentPersonas,
  isTTSAvailable,
  isSpeaking,
  currentlyPlaying,
  onSpeakerClick,
  onAnalysisUpdate,
  onConfirmAnalysis,
  onDeclineAnalysis
}: MessageListProps & {
  onConfirmAnalysis?: (buffer: string) => void;
  onDeclineAnalysis?: () => void;
}) => {
  // Extract filing contents for reference highlighting (memoized)
  const filingContents = React.useMemo(() => 
    selectedFilings.map(filing => filing.content || ''), 
    [selectedFilings]
  );

  return (
    <div className="p-4 space-y-4">
      {messages.length === 0 && (
        <div className="text-center text-slate-500 pt-20">
          <p className="text-lg">Chat with your SEC filing.</p>
          <p className="text-sm">Use the suggestions below or ask your own questions.</p>
        </div>
      )}
      
      {messages.map((message, index) => {
        const messageId = `${message.timestamp.getTime()}-${index}`;
        return (
          <ChatMessage
            key={messageId}
            message={message}
            isStreaming={index === messages.length - 1 && loading}
            isTTSAvailable={isTTSAvailable}
            isSpeaking={isSpeaking}
            currentlyPlaying={currentlyPlaying}
            onSpeakerClick={onSpeakerClick}
            filingContents={filingContents}
            onConfirmAnalysis={onConfirmAnalysis}
            onDeclineAnalysis={onDeclineAnalysis}
          />
        );
      })}
      
      {loading && <LoadingMessage />}
    </div>
  );
};

// Memoize the component to prevent unnecessary re-renders
export const MessageList = React.memo(MessageListComponent);
