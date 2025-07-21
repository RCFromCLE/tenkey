/**
 * Custom hook for managing the main chat functionality
 * Handles message state, chat submission, API integration, and loading states
 */

import { useState, useCallback, useEffect } from 'react';
import { Message } from '../types/filing-chat';
import { Filing } from '../types/filing';
import { cleanHtml } from '../utils/filing-truncator';

interface UseFilingChatProps {
  symbol: string;
  companyName?: string;
  selectedModel: string;
  selectedAnalysisModel: string;
  selectedAgentPersonas: string[];
  apiKey: string;
  chatId?: string;
  onChatIdChange?: (chatId: string) => void;
}

interface UseFilingChatReturn {
  messages: Message[];
  loading: boolean;
  isWebSearchEnabled: boolean;
  analysisMode: boolean;
  stockInfo: any;
  loadedFilings: Filing[] | null; // Filings loaded from chat history
  sendMessage: (content: string, filings: Filing[]) => Promise<void>;
  setIsWebSearchEnabled: (enabled: boolean) => void;
  setAnalysisMode: (enabled: boolean) => void;
  clearChat: () => void;
  handleConfirmAnalysis: (buffer: string) => void;
  handleDeclineAnalysis: () => void;
}

export function useFilingChat({
  symbol,
  companyName,
  selectedModel,
  selectedAnalysisModel,
  selectedAgentPersonas,
  apiKey,
  chatId: initialChatId,
  onChatIdChange
}: UseFilingChatProps): UseFilingChatReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [chatId, setChatId] = useState<string | undefined>(initialChatId);
  const [isWebSearchEnabled, setIsWebSearchEnabled] = useState(false);
  const [analysisMode, setAnalysisMode] = useState(true);
  const [stockInfo, setStockInfo] = useState<any>(null);
  const [agentModels, setAgentModels] = useState<Record<string, string>>({});
  const [loadedFilings, setLoadedFilings] = useState<Filing[] | null>(null);

  // Load chat history on mount or when chatId changes
  useEffect(() => {
    const loadChatHistory = async () => {
      if (!chatId) return;
      try {
        const response = await fetch(`/api/chat/${chatId}`);
        if (!response.ok) throw new Error('Failed to fetch chat history');
        const data = await response.json();
        
        // Load messages
        if (data.messages?.length) {
          setMessages(data.messages.map((msg: any) => ({ 
            ...msg, 
            // Clean HTML from stored messages
            content: cleanHtml(msg.content || ''),
            timestamp: new Date(msg.timestamp || Date.now()) 
          })));
        }
        
        // Load filings from chat history
        if (data.filing?.filings) {
          console.log('Loading filings from chat history:', data.filing.filings);
          setLoadedFilings(data.filing.filings);
        }
      } catch (error) {
        console.error('Error loading chat history:', error);
      }
    };
    loadChatHistory();
  }, [chatId]);

  // Fetch stock info
  useEffect(() => {
    const fetchStockInfo = async () => {
      if (!symbol) return;
      try {
        const response = await fetch(`/api/yahoo?symbol=${symbol}&mode=quote`);
        if (response.ok) {
          const data = await response.json();
          setStockInfo(data);
        } else {
          console.error('Failed to fetch stock info:', response.status);
          // Set default values if API fails
          setStockInfo({
            price: '0.00',
            change: '0.00',
            changePercent: '0.00%',
            dayRange: 'N/A',
            volume: 'N/A',
            marketCap: 'N/A'
          });
        }
      } catch (error) {
        console.error('Error fetching stock info:', error);
        // Set default values if API fails
        setStockInfo({
          price: '0.00',
          change: '0.00',
          changePercent: '0.00%',
          dayRange: 'N/A',
          volume: 'N/A',
          marketCap: 'N/A'
        });
      }
    };
    fetchStockInfo();
  }, [symbol]);

  const sendMessage = useCallback(async (content: string, filings: Filing[]) => {
    if (!content.trim() || loading) return;

    setLoading(true);
    const newMessage: Message = { role: 'user', content, timestamp: new Date() };
    
    // Use functional update to avoid stale closure
    setMessages(prev => [...prev, newMessage]);

    try {
      // Get current messages for API call
      const currentMessages = [...messages, newMessage];
      
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'text/event-stream' },
        body: JSON.stringify({
          messages: currentMessages.map(m => ({ role: m.role, content: m.content })),
          filings: filings,
          chatId,
          model: isWebSearchEnabled ? `${selectedModel}:online` : selectedModel,
          analysisModel: selectedAnalysisModel,
          agentPersonas: selectedAgentPersonas,
          agentModels: agentModels
        })
      });

      if (!response.ok || !response.body) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Unknown API error');
      }

      // Add assistant message placeholder
      setMessages(prev => [...prev, { role: 'assistant', content: '', timestamp: new Date(), annotations: [], isStreaming: true }]);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let chatIdFound = false;
      let agentSeparatorFound = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        // Decode the chunk properly
        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;

        if (!chatIdFound) {
          const match = buffer.match(/<chatId>(.*?)<\/chatId>/);
          if (match) {
            const newChatId = match[1];
            setChatId(newChatId);
            onChatIdChange?.(newChatId);
            window.history.pushState({}, '', `${window.location.pathname}?chatId=${newChatId}`);
            chatIdFound = true;
          }
        }
        
        // Check for agent separator
        if (!agentSeparatorFound && buffer.includes('<AGENT_SEPARATOR>')) {
          agentSeparatorFound = true;
          
          // Split the buffer at the separator
          const parts = buffer.split('<AGENT_SEPARATOR>');
          const mainResponse = parts[0].replace(/<chatId>.*?<\/chatId>/, '');
          
          // Update the current assistant message with the main response
          setMessages(prev => {
            const newMessages = [...prev];
            const lastMessage = newMessages[newMessages.length - 1];
            if (lastMessage && lastMessage.role === 'assistant') {
              // Clean HTML from the main response
              lastMessage.content = cleanHtml(mainResponse.trim());
              lastMessage.isStreaming = false;
            }
            return newMessages;
          });
          
          // Add confirmation message
          setMessages(prev => [...prev, { 
            role: 'assistant', 
            content: '🤖 **Agent Analysis Available**\n\nWould you like to see the agent analysis of this response?', 
            timestamp: new Date(), 
            isConfirmation: true,
            agentAnalysisBuffer: parts[1] || ''
          }]);
          
          // Stop processing - wait for user confirmation
          break;
        }
        
        const cleanedText = buffer.replace(/<chatId>.*?<\/chatId>/, '');
        
        setMessages(prev => {
          const newMessages = [...prev];
          const lastMessage = newMessages[newMessages.length - 1];
          if (lastMessage && lastMessage.role === 'assistant') {
            if (agentSeparatorFound && lastMessage.isAgentAnalysis) {
              // Update agent analysis message - clean HTML
              lastMessage.content = '🤖 **Agent Analysis**\n\n' + cleanHtml(cleanedText.trim());
            } else {
              // Update main response - try to parse as JSON first
              try {
                const parsed = JSON.parse(cleanedText);
                if (parsed.content !== undefined) {
                  // Clean HTML from the AI response
                  lastMessage.content = cleanHtml(parsed.content);
                  lastMessage.annotations = parsed.annotations || [];
                } else {
                  // If JSON doesn't have content field, treat as plain text
                  lastMessage.content = cleanHtml(cleanedText);
                }
              } catch {
                // If it's not JSON, it's plain text - this is the most common case
                // Clean HTML from the AI response
                lastMessage.content = cleanHtml(cleanedText);
                lastMessage.annotations = [];
              }
            }
            // Keep streaming flag true while receiving chunks
            lastMessage.isStreaming = true;
          }
          return newMessages;
        });
      }
      
      // Mark streaming as complete
      setMessages(prev => {
        const newMessages = [...prev];
        const lastMessage = newMessages[newMessages.length - 1];
        if (lastMessage && lastMessage.role === 'assistant') {
          lastMessage.isStreaming = false;
        }
        return newMessages;
      });

    } catch (error) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `**Error:** ${error instanceof Error ? error.message : 'An unknown error occurred.'}`, 
        timestamp: new Date(),
        error: true 
      }]);
    } finally {
      setLoading(false);
    }
  }, [
    loading, 
    messages, 
    chatId, 
    selectedModel, 
    selectedAnalysisModel, 
    isWebSearchEnabled, 
    analysisMode, 
    selectedAgentPersonas, 
    agentModels,
    onChatIdChange
  ]);

  const clearChat = useCallback(() => {
    setMessages([]);
    setChatId(undefined);
    setLoadedFilings(null);
    window.history.pushState({}, '', window.location.pathname);
  }, []);

  const handleConfirmAnalysis = useCallback((buffer: string) => {
    // Remove the confirmation message and add the agent analysis
    setMessages(prev => {
      const newMessages = prev.filter(m => !m.isConfirmation);
      return [...newMessages, {
        role: 'assistant',
        // Clean HTML from agent analysis buffer
        content: cleanHtml(buffer.trim()),
        timestamp: new Date(),
        isAgentAnalysis: true
      }];
    });
  }, []);

  const handleDeclineAnalysis = useCallback(() => {
    // Just remove the confirmation message
    setMessages(prev => prev.filter(m => !m.isConfirmation));
  }, []);

  return {
    messages,
    loading,
    isWebSearchEnabled,
    analysisMode,
    stockInfo,
    loadedFilings,
    sendMessage,
    setIsWebSearchEnabled,
    setAnalysisMode,
    clearChat,
    handleConfirmAnalysis,
    handleDeclineAnalysis
  };
}
