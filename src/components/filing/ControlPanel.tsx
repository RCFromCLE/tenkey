/**
 * ControlPanel Component
 * Right sidebar control panel for filing chat settings
 */

import React, { useCallback } from 'react';
import { Filing } from '../../lib/types/filing';
import { Model } from '../../lib/types/filing-chat';
import { ModelSelection } from './ModelSelection';
import { AISettings } from './AISettings';
import { FilingsList } from './FilingsList';
import { ConversationSummaryModal } from './ConversationSummaryModal';
import { useConversationSummary } from '../../lib/hooks/use-conversation-summary';
import { X, FileText, Settings, Brain } from 'lucide-react';

interface ControlPanelProps {
  isWebSearchEnabled: boolean;
  autoRead: boolean;
  enableTTS: boolean;
  selectedVoice: string;
  speakingRate: number;
  isTTSAvailable: boolean;
  onWebSearchToggle: (enabled: boolean) => void;
  onAutoReadToggle: (enabled: boolean) => void;
  onEnableTTSToggle: (enabled: boolean) => void;
  onVoiceChange: (voice: string) => void;
  onSpeakingRateChange: (rate: number) => void;
  models: Model[];
  selectedModel: string;
  selectedAnalysisModel: string;
  selectedAgentPersonas: string[];
  agentModels: Record<string, string>;
  analysisMode: 'none' | 'basic' | 'agent';
  onModelSelect: (model: string) => void;
  onAnalysisModelSelect: (model: string) => void;
  onAgentPersonasChange: (personas: string[]) => void;
  onAgentModelsChange: (models: Record<string, string>) => void;
  onAnalysisModeChange: (mode: 'none' | 'basic' | 'agent') => void;
  selectedFilings: Filing[];
  onRemoveFiling: (accessionNumber: string) => void;
  onAddFilingClick: () => void;
  messages: any[];
  companyName?: string;
  symbol: string;
  apiKey: string;
}

export function ControlPanel({
  isWebSearchEnabled,
  autoRead,
  enableTTS,
  selectedVoice,
  speakingRate,
  isTTSAvailable,
  onWebSearchToggle,
  onAutoReadToggle,
  onEnableTTSToggle,
  onVoiceChange,
  onSpeakingRateChange,
  models,
  selectedModel,
  selectedAnalysisModel,
  selectedAgentPersonas,
  agentModels,
  analysisMode,
  onModelSelect,
  onAnalysisModelSelect,
  onAgentPersonasChange,
  onAgentModelsChange,
  onAnalysisModeChange,
  selectedFilings,
  onRemoveFiling,
  onAddFilingClick,
  messages,
  companyName,
  symbol,
  apiKey
}: ControlPanelProps) {
  const [activeTab, setActiveTab] = React.useState<'filings' | 'models' | 'settings'>('filings');
  const [showSummaryModal, setShowSummaryModal] = React.useState(false);

  // Use the optimized conversation summary hook
  const {
    summary,
    isGenerating: isGeneratingSummary,
    error: summaryError,
    conversationStats,
    generateSummary,
    clearError
  } = useConversationSummary({
    messages,
    symbol,
    companyName
  });

  const handleGenerateSummary = useCallback((model: string) => {
    generateSummary(model);
  }, [generateSummary]);

  const handleRemoveFiling = useCallback((accessionNumber: string) => {
    onRemoveFiling(accessionNumber);
  }, [onRemoveFiling]);

  return (
    <div className="w-80 bg-slate-900 border-l border-slate-800 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-slate-800">
        <h2 className="text-lg font-semibold text-white">Chat Settings</h2>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800">
        <button
          onClick={() => setActiveTab('filings')}
          className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'filings'
              ? 'text-emerald-400 border-b-2 border-emerald-400'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <FileText className="w-4 h-4 inline mr-1" />
          Filings
        </button>
        <button
          onClick={() => setActiveTab('models')}
          className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'models'
              ? 'text-emerald-400 border-b-2 border-emerald-400'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Brain className="w-4 h-4 inline mr-1" />
          Models
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'settings'
              ? 'text-emerald-400 border-b-2 border-emerald-400'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Settings className="w-4 h-4 inline mr-1" />
          Settings
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'filings' && (
          <FilingsList
            selectedFilings={selectedFilings}
            onRemoveFiling={handleRemoveFiling}
            onAddFilingClick={onAddFilingClick}
          />
        )}

        {activeTab === 'models' && (
          <ModelSelection
            models={models}
            selectedModel={selectedModel}
            selectedAnalysisModel={selectedAnalysisModel}
            selectedAgentPersonas={selectedAgentPersonas}
            agentModels={agentModels}
            analysisMode={analysisMode === 'agent'}
            onModelSelect={onModelSelect}
            onAnalysisModelSelect={onAnalysisModelSelect}
            onAgentPersonasChange={onAgentPersonasChange}
            onAgentModelsChange={onAgentModelsChange}
            onAnalysisModeChange={(enabled: boolean) => {
              onAnalysisModeChange(enabled ? 'agent' : 'none');
            }}
          />
        )}

        {activeTab === 'settings' && (
          <AISettings
            isWebSearchEnabled={isWebSearchEnabled}
            autoRead={autoRead}
            enableTTS={enableTTS}
            selectedVoice={selectedVoice}
            speakingRate={speakingRate}
            isTTSAvailable={isTTSAvailable}
            analysisMode={analysisMode === 'agent'}
            onWebSearchToggle={onWebSearchToggle}
            onAutoReadToggle={onAutoReadToggle}
            onEnableTTSToggle={onEnableTTSToggle}
            onVoiceChange={onVoiceChange}
            onSpeakingRateChange={onSpeakingRateChange}
            onAnalysisModeChange={(enabled: boolean) => {
              onAnalysisModeChange(enabled ? 'agent' : 'none');
            }}
          />
        )}
      </div>

      {/* Summary Button */}
      {messages.length > 0 && (
        <div className="p-4 border-t border-slate-800">
          <button
            onClick={() => setShowSummaryModal(true)}
            className="w-full px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
          >
            Generate Summary
          </button>
        </div>
      )}

      {/* Summary Modal */}
      {showSummaryModal && (
        <ConversationSummaryModal
          isOpen={showSummaryModal}
          onClose={() => setShowSummaryModal(false)}
          summary={summary}
          isGenerating={isGeneratingSummary}
          onGenerateSummary={handleGenerateSummary}
          models={models}
          selectedModel={selectedModel}
          conversationData={{
            symbol,
            companyName,
            topic: 'SEC Filing Analysis',
            messages
          }}
          filingContents={selectedFilings.map(filing => filing.content || '')}
        />
      )}
    </div>
  );
}
