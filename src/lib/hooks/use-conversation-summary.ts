/**
 * useConversationSummary Hook - Optimized for Performance
 * Manages conversation summary state and operations
 */

import { useState, useCallback, useMemo } from 'react';

interface ConversationSummaryState {
  summary: string | null;
  isGenerating: boolean;
  error: string | null;
  lastGenerated: Date | null;
}

interface UseConversationSummaryProps {
  messages: any[];
  symbol: string;
  companyName?: string;
}

export function useConversationSummary({
  messages,
  symbol,
  companyName
}: UseConversationSummaryProps) {
  const [state, setState] = useState<ConversationSummaryState>({
    summary: null,
    isGenerating: false,
    error: null,
    lastGenerated: null
  });

  // Memoize conversation stats to avoid recalculation
  const conversationStats = useMemo(() => {
    const totalMessages = messages.length;
    const agentResponses = messages.filter(m => m.agentId !== 'moderator').length;
    const hasContent = totalMessages > 0;
    return { totalMessages, agentResponses, hasContent };
  }, [messages]);

  // Optimized message preparation
  const prepareMessages = useCallback((messages: any[]) => {
    return messages
      .filter(msg => msg.content && msg.content.trim().length > 0)
      .slice(-50) // Limit to last 50 messages
      .map(msg => ({
        role: msg.role,
        content: msg.content.length > 2000 ? msg.content.substring(0, 2000) + '...' : msg.content,
        timestamp: msg.timestamp,
        agentId: msg.agentId
      }));
  }, []);

  const generateSummary = useCallback(async (model: string) => {
    if (state.isGenerating) return; // Prevent duplicate requests

    setState(prev => ({
      ...prev,
      isGenerating: true,
      error: null
    }));

    try {
      const optimizedMessages = prepareMessages(messages);

      const response = await fetch('/api/conversation-summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages: optimizedMessages,
          model: model,
          conversationContext: {
            symbol,
            companyName,
            topic: 'SEC Filing Analysis'
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate summary');
      }

      const data = await response.json();
      
      setState(prev => ({
        ...prev,
        summary: data.summary,
        isGenerating: false,
        lastGenerated: new Date()
      }));

    } catch (error) {
      console.error('Failed to generate summary:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to generate summary',
        isGenerating: false
      }));
    }
  }, [messages, symbol, companyName, prepareMessages, state.isGenerating]);

  const clearSummary = useCallback(() => {
    setState({
      summary: null,
      isGenerating: false,
      error: null,
      lastGenerated: null
    });
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({
      ...prev,
      error: null
    }));
  }, []);

  return {
    ...state,
    conversationStats,
    generateSummary,
    clearSummary,
    clearError
  };
}
