/**
 * MessageList Component
 * Container for rendering chat messages with loading and empty states
 */

import React, { useState, useCallback, useMemo } from 'react';
import { Message } from '../../lib/types/filing-chat';
import { ChatMessage } from './ChatMessage';
import { LoadingMessage } from './LoadingMessage';
import { Filing } from '../../lib/types/filing';
import { FilingReferenceFormatter } from '../../lib/services/filing-reference-formatter';
import { ConversationSummary } from '../chat/ConversationSummary';
import { Sparkles, Loader2 } from 'lucide-react';

interface MessageListProps {
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

const MessageListComponent = ({
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
  onAnalysisUpdate,
  onConfirmAnalysis,
  onDeclineAnalysis
}: MessageListProps & {
  onConfirmAnalysis?: (buffer: string) => void;
  onDeclineAnalysis?: () => void;
}) => {
  const [showSummary, setShowSummary] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [summaryGeneratedAt, setSummaryGeneratedAt] = useState<Date | null>(null);
  const [summaryModel, setSummaryModel] = useState('openai/gpt-5-chat');
  // Extract filing contents for reference highlighting (memoized)
  const filingContents = React.useMemo(() => 
    selectedFilings.map(filing => filing.content || ''), 
    [selectedFilings]
  );

  // Generate summary inline when requested
  const generateSummary = useCallback(async () => {
    if (messages.length < 2) return;
    
    setIsGeneratingSummary(true);
    try {
      const conversationData = {
        symbol,
        companyName,
        messages: messages.map(m => ({
          role: m.role,
          content: m.content,
          timestamp: m.timestamp
        }))
      };

      const response = await fetch('/api/conversation-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation: conversationData,
          model: summaryModel
        })
      });

      if (response.ok) {
        const data = await response.json();
        setSummary(data.summary);
        setSummaryGeneratedAt(new Date());
        setShowSummary(true);
      }
    } catch (error) {
      console.error('Failed to generate summary:', error);
    } finally {
      setIsGeneratingSummary(false);
    }
  }, [messages, symbol, companyName, summaryModel]);

  // Check if we should show summary button
  const shouldShowSummaryButton = messages.length >= 4 && !loading;

  return (
    <div className="p-4 space-y-4">
      {messages.length === 0 && (
        <div className="text-center text-slate-500 pt-20">
          <p className="text-lg">Chat with your SEC filing.</p>
          <p className="text-sm">Use the suggestions below or ask your own questions.</p>
        </div>
      )}
      
      {/* Inline Summary Button */}
      {shouldShowSummaryButton && !showSummary && (
        <div className="flex justify-center my-4">
          <button
            onClick={generateSummary}
            disabled={isGeneratingSummary}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 disabled:from-slate-600 disabled:to-slate-700 text-white rounded-lg transition-all shadow-lg hover:shadow-xl disabled:cursor-not-allowed"
          >
            {isGeneratingSummary ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating Summary...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Generate Conversation Summary
              </>
            )}
          </button>
        </div>
      )}
      
      {/* Inline Summary Display */}
      {showSummary && summary && (
        <ConversationSummary
          summary={summary}
          symbol={symbol}
          companyName={companyName}
          messageCount={messages.length}
          generatedAt={summaryGeneratedAt || undefined}
          modelUsed={summaryModel}
        />
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
