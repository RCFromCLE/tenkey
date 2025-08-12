/**
 * FilingChatAdapter Component
 * Adapter that bridges the company page with the FilingChatRefactored component
 */

import React, { useState, useEffect } from 'react';
import { Filing } from '../../lib/types/filing';
import { FilingChatRefactored } from './FilingChatRefactored';
import { useOpenRouterModels } from '../../lib/hooks/use-openrouter-models';

interface FilingChatAdapterProps {
  filing: Filing;
  companyName?: string;
  userId: string;
  onFilingChange: (filing: Filing) => void;
  filings: Filing[];
  onFilingSelect: (filing: any) => void;
  isLoadingFiling: boolean;
  initialChatId?: string;
  stockInfo?: {
    price: string;
    change: string;
    changePercent: string;
    dayRange?: string;
    volume?: string;
    marketCap?: string;
  };
}

export function FilingChatAdapter({
  filing,
  companyName,
  userId,
  onFilingChange,
  filings,
  onFilingSelect,
  isLoadingFiling,
  initialChatId,
  stockInfo
}: FilingChatAdapterProps) {
  const [selectedModel, setSelectedModel] = useState('openai/gpt-5-chat');
  const [selectedAnalysisModel, setSelectedAnalysisModel] = useState('openai/gpt-5-chat');
  const [selectedAgentPersonas, setSelectedAgentPersonas] = useState<string[]>([]);
  const [agentModels, setAgentModels] = useState<Record<string, string>>({});
  const [apiKey, setApiKey] = useState('');
  const [loadedFilings, setLoadedFilings] = useState<Filing[] | null>(null);
  const [loadingChatHistory, setLoadingChatHistory] = useState(!!initialChatId);
  
  // Fetch models from OpenRouter
  const { models, loading: modelsLoading } = useOpenRouterModels();

  // Load chat history filings if we have a chatId
  useEffect(() => {
    const loadChatHistory = async () => {
      if (!initialChatId) {
        setLoadingChatHistory(false);
        return;
      }
      
      setLoadingChatHistory(true);
      try {
        const response = await fetch(`/api/chat/${initialChatId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.filing?.filings && data.filing.filings.length > 0) {
            console.log('FilingChatAdapter: Loading filings from chat history:', data.filing.filings.map((f: any) => f.form));
            setLoadedFilings(data.filing.filings);
          }
        }
      } catch (error) {
        console.error('Failed to load chat history:', error);
      } finally {
        setLoadingChatHistory(false);
      }
    };
    
    loadChatHistory();
  }, [initialChatId]);

  // Fetch user's API key and default models
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Fetch API key
        const apiKeyResponse = await fetch('/api/user/api-key');
        if (apiKeyResponse.ok) {
          const apiKeyData = await apiKeyResponse.json();
          setApiKey(apiKeyData.apiKey || '');
        }
        
        // Fetch user's default models
        const modelsResponse = await fetch('/api/user/models');
        if (modelsResponse.ok) {
          const modelsData = await modelsResponse.json();
          if (modelsData.defaultChatModel) {
            setSelectedModel(modelsData.defaultChatModel);
          }
          if (modelsData.defaultAgentModel) {
            setSelectedAnalysisModel(modelsData.defaultAgentModel);
          }
          if (modelsData.defaultAgentPersonas) {
            setSelectedAgentPersonas(modelsData.defaultAgentPersonas);
          }
        }
      } catch (error) {
        console.error('Failed to fetch user data:', error);
      }
    };
    fetchUserData();
  }, []);

  // Show loading state while models or chat history are being fetched
  if (modelsLoading || loadingChatHistory) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="text-4xl font-bold bg-gradient-to-br from-blue-400 to-cyan-600 bg-clip-text text-transparent mb-4 animate-pulse">
            01
          </div>
          <p className="text-slate-400 font-light">
            {loadingChatHistory ? 'Loading chat history...' : 'Loading AI models...'}
          </p>
        </div>
      </div>
    );
  }

  // Determine which filings to use:
  // 1. If we have loaded filings from chat history, use those
  // 2. Otherwise, use the current filing (latest 10-Q for new chats)
  const initialFilings = loadedFilings || [filing];
  
  console.log('FilingChatAdapter: Using filings:', {
    hasLoadedFilings: !!loadedFilings,
    filingCount: initialFilings.length,
    forms: initialFilings.map(f => f.form),
    chatId: initialChatId
  });

  return (
    <FilingChatRefactored
      symbol={filing.symbol}
      companyName={companyName}
      // Use loaded filings from chat history if available, otherwise use current filing
      initialFilings={initialFilings}
      availableFilings={filings}
      models={models}
      selectedModel={selectedModel}
      selectedAnalysisModel={selectedAnalysisModel}
      selectedAgentPersonas={selectedAgentPersonas}
      agentModels={agentModels}
      onModelSelect={setSelectedModel}
      onAnalysisModelSelect={setSelectedAnalysisModel}
      onAgentPersonasChange={setSelectedAgentPersonas}
      onAgentModelsChange={setAgentModels}
      apiKey={apiKey}
      chatId={initialChatId}
      onChatIdChange={(newChatId) => {
        // Handle chat ID changes if needed
        console.log('Chat ID changed:', newChatId);
      }}
      onFilingSelect={onFilingSelect}
      stockInfo={stockInfo}
    />
  );
}
