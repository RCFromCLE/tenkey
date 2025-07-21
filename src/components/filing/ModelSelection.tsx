/**
 * ModelSelection Component
 * Handles model selection for chat and analysis, including agent personas
 */

import React from 'react';
import { BrainCircuit } from 'lucide-react';
import { ModelSelector } from '../ui/model-selector';
import { AgentDropdown } from '../ui/agent-dropdown';
import { Model } from '../../lib/types/filing-chat';
import { ToggleSwitch } from './ToggleSwitch';

interface ModelSelectionProps {
  models: Model[];
  selectedModel: string;
  selectedAnalysisModel: string;
  selectedAgentPersonas: string[];
  agentModels: Record<string, string>;
  analysisMode: boolean;
  onModelSelect: (model: string) => void;
  onAnalysisModelSelect: (model: string) => void;
  onAgentPersonasChange: (personas: string[]) => void;
  onAgentModelsChange: (models: Record<string, string>) => void;
  onAnalysisModeChange: (enabled: boolean) => void;
}

export function ModelSelection({
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
  onAnalysisModeChange
}: ModelSelectionProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-base font-semibold text-slate-200">AI Models</h3>
      
      {/* Main Chat Model */}
      <ModelSelector
        models={models}
        selectedModel={selectedModel}
        onModelSelect={onModelSelect}
        label="Chat Model"
        className="w-full"
      />

      {/* Analysis Mode Toggle */}
      <div className="p-3 rounded-lg bg-slate-800/80 border border-slate-700/60">
        <ToggleSwitch 
          checked={analysisMode} 
          onChange={(checked) => {
            onAnalysisModeChange(checked);
            // If turning off analysis mode, clear selected agents
            if (!checked) {
              onAgentPersonasChange([]);
            }
          }} 
          title="Toggle Multi-Agent Analysis" 
          Icon={BrainCircuit} 
          label="Multi-Agent Analysis" 
          description="Get multiple AI perspectives on financial data." 
        />
      </div>

      {/* Analysis Agent Configuration - Only show when analysis mode is enabled */}
      {analysisMode && (
        <div className="space-y-4 p-4 rounded-lg bg-slate-900/50 border border-slate-700/30">
          <h4 className="text-sm font-medium text-slate-300 flex items-center gap-2">
            <BrainCircuit className="w-4 h-4 text-purple-400" />
            Agent Analysis Configuration
          </h4>
          
          {/* Analysis Agent Model */}
          <ModelSelector
            models={models}
            selectedModel={selectedAnalysisModel}
            onModelSelect={onAnalysisModelSelect}
            label="Analysis Model"
            className="w-full"
          />
          
          {/* Simplified Agent Selector */}
          <AgentDropdown
            selectedAgents={selectedAgentPersonas}
            onAgentsChange={onAgentPersonasChange}
            className="w-full"
            label="Analysis Perspectives"
            placeholder="Choose analysis perspectives"
          />

          {/* Processing Flow Visualization */}
          {selectedAgentPersonas.length > 0 && (
            <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
              <h5 className="text-xs font-medium text-slate-400 mb-2">Analysis Flow</h5>
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <span className="text-slate-300">Filing Data → Chat Model</span>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                  <span className="text-slate-300">→ {selectedAgentPersonas.length} Agent{selectedAgentPersonas.length > 1 ? 's' : ''} Analysis</span>
                </div>
                <div className="flex items-center gap-2 ml-8">
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                  <span className="text-slate-400">Multi-perspective insights</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
