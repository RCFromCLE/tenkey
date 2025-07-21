'use client';

import React, { useState } from 'react';
import { X, Check, Users, User } from 'lucide-react';
import { AGENT_PERSONAS } from '../../lib/services/agent-personas-improved';
import { cn } from '../../lib/utils';

interface AgentSelectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (selectedAgents: string[]) => void;
  preSelectedAgents?: string[];
  question: string;
}

export function AgentSelectionDialog({
  isOpen,
  onClose,
  onConfirm,
  preSelectedAgents = [],
  question
}: AgentSelectionDialogProps) {
  const [selectedAgents, setSelectedAgents] = useState<string[]>(preSelectedAgents);
  const [selectAll, setSelectAll] = useState(false);

  if (!isOpen) return null;

  const handleAgentToggle = (agentId: string) => {
    setSelectedAgents(prev => 
      prev.includes(agentId) 
        ? prev.filter(id => id !== agentId)
        : [...prev, agentId]
    );
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedAgents([]);
    } else {
      setSelectedAgents(Object.keys(AGENT_PERSONAS));
    }
    setSelectAll(!selectAll);
  };

  const handleConfirm = () => {
    if (selectedAgents.length > 0) {
      onConfirm(selectedAgents);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="w-full max-w-4xl max-h-[80vh] bg-slate-800 rounded-xl shadow-2xl border border-slate-700 overflow-hidden flex flex-col" 
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-slate-200 mb-2">
                Select Analysis Perspectives
              </h2>
              <p className="text-sm text-slate-400">
                Choose which expert analysts you'd like to hear from regarding your question:
              </p>
              <div className="mt-3 p-3 bg-slate-900/50 rounded-lg border border-slate-700">
                <p className="text-sm text-slate-300 italic">"{question}"</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Agent Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-slate-300">Available Analysts</h3>
            <button
              onClick={handleSelectAll}
              className="flex items-center gap-2 px-3 py-1.5 text-xs bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
            >
              <Users className="w-3.5 h-3.5" />
              {selectAll ? 'Deselect All' : 'Select All'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {Object.entries(AGENT_PERSONAS).map(([id, agent]) => {
              const isSelected = selectedAgents.includes(id);
              return (
                <button
                  key={id}
                  onClick={() => handleAgentToggle(id)}
                  className={cn(
                    "p-4 rounded-lg border-2 transition-all text-left",
                    isSelected
                      ? `${agent.bgColor} ${agent.borderColor} border-opacity-100`
                      : "bg-slate-900/50 border-slate-700 hover:border-slate-600"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-lg",
                        isSelected ? agent.bgColor : "bg-slate-800"
                      )}>
                        {agent.emoji}
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className={cn(
                          "font-medium",
                          isSelected ? agent.color : "text-slate-200"
                        )}>
                          {agent.name}
                        </h4>
                        {isSelected && (
                          <Check className={cn("w-4 h-4", agent.color)} />
                        )}
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        {agent.description}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {agent.analysisStyle.focus.slice(0, 3).map((focus, idx) => (
                          <span
                            key={idx}
                            className={cn(
                              "px-2 py-0.5 text-xs rounded-full",
                              isSelected
                                ? `${agent.bgColor} ${agent.color}`
                                : "bg-slate-800 text-slate-500"
                            )}
                          >
                            {focus}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-700 bg-slate-900/50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-400">
              {selectedAgents.length === 0 ? (
                'Select at least one analyst to continue'
              ) : (
                <>
                  <span className="font-medium text-slate-200">{selectedAgents.length}</span>
                  {' analyst'}
                  {selectedAgents.length !== 1 ? 's' : ''} selected
                </>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm text-slate-300 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={selectedAgents.length === 0}
                className={cn(
                  "px-6 py-2 text-sm font-medium rounded-lg transition-all",
                  selectedAgents.length > 0
                    ? "bg-blue-600 hover:bg-blue-500 text-white"
                    : "bg-slate-700 text-slate-500 cursor-not-allowed"
                )}
              >
                Get Analysis
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
