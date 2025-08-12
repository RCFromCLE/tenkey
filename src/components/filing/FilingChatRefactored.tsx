/**
 * FilingChatRefactored Component
 * Main container component that orchestrates all filing chat functionality
 */

import React, { useRef, useEffect } from 'react';
import { Filing } from '../../lib/types/filing';
import { Model } from '../../lib/types/filing-chat';
import { useFilingChat } from '../../lib/hooks/use-filing-chat';
import { useChatScroll } from '../../lib/hooks/use-chat-scroll';
import { usePromptManagement } from '../../lib/hooks/use-prompt-management';
import { useSpeechRecognition } from '../../lib/hooks/use-speech-recognition';
import { useFilingManagement } from '../../lib/hooks/use-filing-management';
import { useTextToSpeech } from '../../lib/hooks/use-text-to-speech-enhanced';
import { ChatHeader } from './ChatHeader';
import { MessageList } from './MessageList';
import { ClaudeStyleMessageList } from '../chat/ClaudeStyleMessageList';
import { ChatInput } from './ChatInput';
import { ClaudeStyleInput } from '../chat/ClaudeStyleInput';
import { PromptSelector } from './PromptSelector';
import { ControlPanel } from './ControlPanel';
import { FilingSelectorModal } from './FilingSelectorModal';
import { ScrollToBottomButton } from './ScrollToBottomButton';
import { StockInfoDisplay } from './StockInfoDisplay';
import { AgentPromptButtons } from './AgentPromptButtons';

interface FilingChatRefactoredProps {
  symbol: string;
  companyName?: string;
  initialFilings?: Filing[];
  availableFilings?: Filing[];
  models: Model[];
  selectedModel: string;
  selectedAnalysisModel: string;
  selectedAgentPersonas: string[];
  agentModels: Record<string, string>;
  onModelSelect: (model: string) => void;
  onAnalysisModelSelect: (model: string) => void;
  onAgentPersonasChange: (personas: string[]) => void;
  onAgentModelsChange: (models: Record<string, string>) => void;
  apiKey: string;
  chatId?: string;
  onChatIdChange?: (chatId: string) => void;
  onFilingSelect?: (filing: any) => void;
  stockInfo?: {
    price: string;
    change: string;
    changePercent: string;
    dayRange?: string;
    volume?: string;
    marketCap?: string;
  };
}

export function FilingChatRefactored({
  symbol,
  companyName,
  initialFilings = [],
  availableFilings: providedAvailableFilings,
  models,
  selectedModel,
  selectedAnalysisModel,
  selectedAgentPersonas,
  agentModels,
  onModelSelect,
  onAnalysisModelSelect,
  onAgentPersonasChange,
  onAgentModelsChange,
  apiKey,
  chatId,
  onChatIdChange,
  onFilingSelect,
  stockInfo: providedStockInfo
}: FilingChatRefactoredProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null!);
  const [input, setInput] = React.useState('');

  // Custom hooks
  const {
    messages,
    loading,
    isWebSearchEnabled,
    analysisMode,
    stockInfo: hookStockInfo,
    loadedFilings,
    sendMessage,
    setIsWebSearchEnabled,
    setAnalysisMode,
    clearChat,
    handleConfirmAnalysis,
    handleDeclineAnalysis,
    stopGeneration
  } = useFilingChat({
    symbol,
    companyName,
    selectedModel,
    selectedAnalysisModel,
    selectedAgentPersonas,
    apiKey,
    chatId,
    onChatIdChange
  });

  // Use provided stock info if available, otherwise use hook's stock info
  const stockInfo = providedStockInfo || hookStockInfo;

  const { showScrollButton, scrollToBottom, forceScrollToBottom } = useChatScroll(chatContainerRef, messages);

  const {
    prompts,
    addCustomPrompt,
    updatePrompt,
    deletePrompt,
    toggleFavorite
  } = usePromptManagement('default-user-id'); // TODO: Get actual user ID from auth context

  const {
    selectedFilings,
    availableFilings,
    filingsLoading,
    isSaving,
    showFilingSelector,
    setShowFilingSelector,
    addFiling,
    removeFiling,
    addMultipleFilings,
    removeMultipleFilings,
    loadAvailableFilings
  } = useFilingManagement(
    symbol, 
    // Use loaded filings from chat history if available, otherwise use initial filings (latest 10-Q)
    loadedFilings && loadedFilings.length > 0 ? loadedFilings : initialFilings, 
    chatId, 
    onChatIdChange
  );

  // Use provided available filings if available
  const filingsForModal = providedAvailableFilings || availableFilings;

  const {
    isTTSAvailable,
    isSpeaking,
    currentlyPlaying,
    selectedVoice,
    speakingRate,
    autoRead,
    enableTTS,
    setSelectedVoice,
    setSpeakingRate,
    setAutoRead,
    setEnableTTS,
    speak,
    stop
  } = useTextToSpeech();

  // No need to force TTS availability - let the hook handle it

  const {
    isListening,
    isAvailable: isSpeechRecognitionAvailable,
    startListening,
    stopListening
  } = useSpeechRecognition({
    onResult: (transcript) => {
      setInput(transcript);
    }
  });

  // Auto-read new messages
  useEffect(() => {
    if (autoRead && enableTTS && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === 'assistant' && !lastMessage.isStreaming) {
        speak(lastMessage.content, `${messages.length - 1}`);
      }
    }
  }, [messages, autoRead, enableTTS, speak]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleSendMessage = async () => {
    console.log('handleSendMessage called', {
      input: input.trim(),
      loading,
      selectedFilingsCount: selectedFilings.length,
      selectedFilings: selectedFilings.map(f => ({ form: f.form, hasContent: !!f.content })),
      messagesCount: messages.length
    });
    
    if (!input.trim() || loading) return;
    
    // Allow messages with or without filings - let the backend decide how to handle them
    console.log('Sending message with filings:', selectedFilings);
    console.log('Current messages before send:', messages);
    await sendMessage(input, selectedFilings);
    setInput('');
    console.log('Messages after send:', messages);
  };

  const handlePromptSelect = (prompt: any) => {
    setInput(prompt.text);
  };

  const handleAgentPromptSelect = (prompt: string, agentId: string) => {
    setInput(prompt);
  };

  const handleSpeakerClick = (text: string, messageId: string) => {
    if (isSpeaking && currentlyPlaying === messageId) {
      stop();
    } else {
      speak(text, messageId);
    }
  };

  // Memoize expensive filing calculations to prevent re-computation on every render
  const filingStats = React.useMemo(() => ({
    hasFilings: selectedFilings.length > 0,
    has10K: selectedFilings.some(f => f.form.includes('10-K')),
    has10Q: selectedFilings.some(f => f.form.includes('10-Q'))
  }), [selectedFilings]);

  return (
    <div className="flex h-full bg-slate-950">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative overflow-hidden">
        {/* Header - Fixed height */}
        <div className="h-14 flex-shrink-0">
          <ChatHeader
            symbol={symbol}
            companyName={companyName || ''}
            stockInfo={stockInfo}
            onClearChat={clearChat}
          />
        </div>

        {/* Messages Container */}
        <div 
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto relative bg-slate-950"
        >
          <ClaudeStyleMessageList
            messages={messages}
            loading={loading}
            selectedFilings={selectedFilings}
            companyName={companyName}
            symbol={symbol}
            apiKey={apiKey}
            analysisMode={analysisMode}
            selectedAgentPersonas={selectedAgentPersonas}
            isTTSAvailable={isTTSAvailable}
            isSpeaking={isSpeaking}
            currentlyPlaying={currentlyPlaying}
            onSpeakerClick={handleSpeakerClick}
          />
          <div ref={messagesEndRef} />
          
          {showScrollButton && (
            <ScrollToBottomButton onClick={forceScrollToBottom} visible={showScrollButton} />
          )}
        </div>

        {/* Input Area */}
        <div className="border-t border-slate-800 p-4 bg-slate-900/50">
          {/* Prompt Dropdown, Stock Info and Blue Text Note */}
          {!loading && (
            <div className="mb-3 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <PromptSelector
                    prompts={prompts}
                    loading={false}
                    hasFilings={filingStats.hasFilings}
                    has10K={filingStats.has10K}
                    has10Q={filingStats.has10Q}
                    onPromptSelect={handlePromptSelect}
                    onAddPrompt={addCustomPrompt}
                    onUpdatePrompt={updatePrompt}
                    onDeletePrompt={deletePrompt}
                    onToggleFavorite={toggleFavorite}
                  />
                  
                  {/* Stock Info Display */}
                  {stockInfo && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-slate-400">{symbol}</span>
                      <span className="text-white font-medium">${stockInfo.price}</span>
                      <span className={`font-medium ${
                        stockInfo.change?.startsWith('-') ? 'text-red-400' : 'text-green-400'
                      }`}>
                        {stockInfo.change} ({stockInfo.changePercent})
                      </span>
                    </div>
                  )}

                  {/* Filing Save Status */}
                  {isSaving && (
                    <div className="flex items-center gap-1 text-xs text-blue-400">
                      <div className="w-3 h-3 border border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                      <span>Saving filings...</span>
                    </div>
                  )}
                </div>
                
              </div>

            </div>
          )}
          
          <ClaudeStyleInput
            input={input}
            loading={loading}
            isListening={isListening}
            isSpeechRecognitionAvailable={isSpeechRecognitionAvailable}
            companyName={companyName}
            onInputChange={setInput}
            onSubmit={handleSendMessage}
            onMicClick={() => {
              if (isListening) {
                stopListening();
              } else {
                startListening();
              }
            }}
            onStopGeneration={stopGeneration}
          />
        </div>
      </div>

      {/* Right Sidebar - Control Panel */}
      <ControlPanel
        isWebSearchEnabled={isWebSearchEnabled}
        autoRead={autoRead}
        enableTTS={enableTTS}
        selectedVoice={selectedVoice}
        speakingRate={speakingRate}
        isTTSAvailable={isTTSAvailable}
        onWebSearchToggle={setIsWebSearchEnabled}
        onAutoReadToggle={setAutoRead}
        onEnableTTSToggle={setEnableTTS}
        onVoiceChange={setSelectedVoice}
        onSpeakingRateChange={setSpeakingRate}
        models={models}
        selectedModel={selectedModel}
        selectedAnalysisModel={selectedAnalysisModel}
        selectedAgentPersonas={selectedAgentPersonas}
        agentModels={agentModels}
        analysisMode={analysisMode ? 'agent' : 'none'}
        onModelSelect={onModelSelect}
        onAnalysisModelSelect={onAnalysisModelSelect}
        onAgentPersonasChange={onAgentPersonasChange}
        onAgentModelsChange={onAgentModelsChange}
        onAnalysisModeChange={(mode) => setAnalysisMode(mode === 'agent')}
        selectedFilings={selectedFilings}
        onRemoveFiling={removeFiling}
        onAddFilingClick={() => {
          loadAvailableFilings();
          setShowFilingSelector(true);
        }}
        messages={messages}
        companyName={companyName}
        symbol={symbol}
        apiKey={apiKey}
      />

      {/* Filing Selector Modal */}
      {showFilingSelector && (
        <FilingSelectorModal
          isOpen={showFilingSelector}
          onClose={() => setShowFilingSelector(false)}
          filings={filingsForModal}
          selectedFilings={selectedFilings}
          loading={filingsLoading}
          onFilingSelect={(filing) => {
            console.log('FilingSelectorModal onFilingSelect called with:', filing);
            console.log('Current selectedFilings:', selectedFilings);
            
            // Toggle filing - add if not selected, remove if selected
            const isSelected = selectedFilings.some(f => f.accessionNumber === filing.accessionNumber);
            console.log('Is filing selected?', isSelected);
            
            if (isSelected) {
              console.log('Removing filing:', filing.accessionNumber);
              removeFiling(filing.accessionNumber);
            } else {
              console.log('Adding filing:', filing);
              addFiling(filing as Filing);
              // Also call parent handler if provided
              if (onFilingSelect) {
                onFilingSelect(filing);
              }
            }
          }}
          onBulkAdd={(filings) => {
            addMultipleFilings(filings as Filing[]);
            // Call parent handler for each filing if provided
            if (onFilingSelect) {
              filings.forEach(filing => onFilingSelect(filing));
            }
          }}
          onBulkRemove={(accessionNumbers) => {
            removeMultipleFilings(accessionNumbers);
          }}
        />
      )}
    </div>
  );
}
