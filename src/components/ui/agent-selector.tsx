'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Check, ChevronDown, Users, X, Info, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AGENT_PERSONAS, type AgentPersona } from '@/lib/services/agent-personas';

interface AgentSelectorProps {
  selectedAgents: string[];
  onAgentsChange: (agents: string[]) => void;
  className?: string;
}

export function AgentSelector({ selectedAgents, onAgentsChange, className }: AgentSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredAgent, setHoveredAgent] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleAgent = (agentId: string) => {
    if (selectedAgents.includes(agentId)) {
      onAgentsChange(selectedAgents.filter(id => id !== agentId));
    } else {
      onAgentsChange([...selectedAgents, agentId]);
    }
  };

  const clearAll = () => {
    onAgentsChange([]);
  };

  const selectPreset = (preset: string[]) => {
    onAgentsChange(preset);
  };

  const agents = Object.values(AGENT_PERSONAS);
  const selectedCount = selectedAgents.length;

  // Preset combinations
  const presets = [
    { name: 'Balanced View', agents: ['balanced'], description: 'Single objective analyst' },
    { name: 'Bull vs Bear', agents: ['bull', 'bear'], description: 'Optimistic vs pessimistic perspectives' },
    { name: 'Full Spectrum', agents: ['bull', 'bear', 'balanced', 'skeptic'], description: 'Complete range of viewpoints' },
    { name: 'Technical Deep Dive', agents: ['technical', 'value', 'growth'], description: 'Quantitative analysis focus' },
    { name: 'Risk Assessment', agents: ['risk', 'bear', 'skeptic'], description: 'Conservative risk analysis' },
    { name: 'Growth Focus', agents: ['growth', 'bull', 'macro'], description: 'Growth and opportunity hunting' },
  ];

  return (
    <div className={cn("relative", className)} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full flex items-center justify-between gap-2 px-3 py-2 text-sm",
          "bg-slate-800/60 hover:bg-slate-800 rounded-lg border transition-all",
          selectedCount > 0 
            ? "border-blue-500/50 text-blue-400" 
            : "border-slate-700/50 text-slate-300"
        )}
      >
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4" />
          <span>
            {selectedCount === 0 
              ? "Select Analysis Agents" 
              : `${selectedCount} Agent${selectedCount > 1 ? 's' : ''} Selected`}
          </span>
        </div>
        <ChevronDown className={cn("w-4 h-4 transition-transform", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-slate-800 border border-slate-700 rounded-lg shadow-xl overflow-hidden">
          {/* Header with presets */}
          <div className="p-3 border-b border-slate-700">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-slate-200 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-yellow-400" />
                Quick Presets
              </h3>
              {selectedCount > 0 && (
                <button
                  onClick={clearAll}
                  className="text-xs text-slate-400 hover:text-red-400 transition-colors flex items-center gap-1"
                >
                  <X className="w-3 h-3" />
                  Clear All
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {presets.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => selectPreset(preset.agents)}
                  className={cn(
                    "p-2 text-xs rounded-md border transition-all text-left",
                    JSON.stringify(selectedAgents.sort()) === JSON.stringify(preset.agents.sort())
                      ? "bg-blue-500/20 border-blue-500/50 text-blue-400"
                      : "bg-slate-900/50 border-slate-700/50 text-slate-300 hover:bg-slate-700/50"
                  )}
                >
                  <div className="font-medium">{preset.name}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{preset.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Individual agent selection */}
          <div className="max-h-[400px] overflow-y-auto">
            <div className="p-3">
              <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
                Individual Agents
              </h3>
              <div className="space-y-1">
                {agents.map((agent) => (
                  <div
                    key={agent.id}
                    className={cn(
                      "relative rounded-lg transition-all",
                      selectedAgents.includes(agent.id) 
                        ? agent.bgColor 
                        : "hover:bg-slate-700/30"
                    )}
                    onMouseEnter={() => setHoveredAgent(agent.id)}
                    onMouseLeave={() => setHoveredAgent(null)}
                  >
                    <button
                      onClick={() => toggleAgent(agent.id)}
                      className={cn(
                        "w-full flex items-start gap-3 p-3 text-left transition-all rounded-lg",
                        selectedAgents.includes(agent.id) && agent.borderColor,
                        selectedAgents.includes(agent.id) && "border"
                      )}
                    >
                      <div className="flex-shrink-0 mt-0.5">
                        <div className={cn(
                          "w-5 h-5 rounded border-2 flex items-center justify-center transition-all",
                          selectedAgents.includes(agent.id)
                            ? `${agent.color} border-current`
                            : "border-slate-600"
                        )}>
                          {selectedAgents.includes(agent.id) && (
                            <Check className="w-3 h-3" />
                          )}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className={cn(
                            "font-medium",
                            selectedAgents.includes(agent.id) ? agent.color : "text-slate-200"
                          )}>
                            {agent.name}
                          </h4>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">{agent.description}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-[10px] text-slate-500">Personality:</span>
                          <span className="text-[10px] text-slate-400">{agent.personality}</span>
                        </div>
                      </div>
                      {hoveredAgent === agent.id && (
                        <Info className="w-4 h-4 text-slate-500 flex-shrink-0 mt-1" />
                      )}
                    </button>

                    {/* Hover tooltip with more details */}
                    {hoveredAgent === agent.id && (
                      <div className="absolute left-full ml-2 top-0 z-10 w-64 p-3 bg-slate-900 border border-slate-700 rounded-lg shadow-xl">
                        <h5 className={cn("font-medium mb-2", agent.color)}>
                          {agent.name}
                        </h5>
                        <div className="space-y-2 text-xs">
                          <div>
                            <span className="text-slate-400">Focus Areas:</span>
                            <div className="mt-1 flex flex-wrap gap-1">
                              {agent.analysisStyle.focus.map((focus) => (
                                <span key={focus} className="px-2 py-0.5 bg-slate-800 rounded text-slate-300">
                                  {focus}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div>
                            <span className="text-slate-400">Analysis Style:</span>
                            <p className="text-slate-300 mt-0.5">{agent.analysisStyle.tone}</p>
                          </div>
                          <div>
                            <span className="text-slate-400">Key Words:</span>
                            <p className="text-slate-300 mt-0.5 italic">
                              "{agent.analysisStyle.keywords.slice(0, 3).join('", "')}"
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer with summary */}
          {selectedCount > 0 && (
            <div className="p-3 border-t border-slate-700 bg-slate-900/50">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Users className="w-3 h-3" />
                <span>Selected agents will provide unique perspectives on the financial data</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
