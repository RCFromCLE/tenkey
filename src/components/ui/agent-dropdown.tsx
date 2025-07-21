'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Check, ChevronDown, Users, Brain, TrendingUp, TrendingDown, Shield, BarChart3, Globe2, Zap, DollarSign, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AGENT_PERSONAS, type AgentPersona } from '@/lib/services/agent-personas';

interface AgentDropdownProps {
  selectedAgents: string[];
  onAgentsChange: (agents: string[]) => void;
  className?: string;
  label?: string;
  placeholder?: string;
}

// Icon mapping for each agent type
const AGENT_ICONS = {
  bull: TrendingUp,
  bear: TrendingDown,
  balanced: BarChart3,
  skeptic: AlertTriangle,
  technical: BarChart3,
  macro: Globe2,
  risk: Shield,
  growth: Zap,
  value: DollarSign,
  contrarian: Brain
};

// Quick preset combinations for financial analysis
const QUICK_PRESETS = [
  {
    id: 'debate',
    name: 'Bull vs Bear Debate',
    description: 'Classic optimistic vs pessimistic showdown',
    agents: ['bull', 'bear'],
    icon: TrendingUp
  },
  {
    id: 'roundtable',
    name: 'Expert Roundtable',
    description: 'Balanced discussion with multiple perspectives',
    agents: ['bull', 'bear', 'balanced', 'skeptic'],
    icon: Users
  },
  {
    id: 'technical',
    name: 'Technical Deep Dive',
    description: 'Data-driven quantitative analysis',
    agents: ['technical', 'value', 'risk'],
    icon: BarChart3
  },
  {
    id: 'strategic',
    name: 'Strategic Council',
    description: 'Big picture strategic discussion',
    agents: ['macro', 'growth', 'contrarian', 'balanced'],
    icon: Globe2
  },
  {
    id: 'comprehensive',
    name: 'Full Panel (5 Agents)',
    description: 'Maximum diversity of viewpoints',
    agents: ['bull', 'bear', 'balanced', 'skeptic', 'technical'],
    icon: Users
  }
];

export function AgentDropdown({ 
  selectedAgents, 
  onAgentsChange, 
  className,
  label = "Analysis Agents",
  placeholder = "Select analysis perspectives"
}: AgentDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
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

  const selectPreset = (agentIds: string[]) => {
    onAgentsChange(agentIds);
    setIsOpen(false);
  };

  const clearAll = () => {
    onAgentsChange([]);
  };

  const selectedCount = selectedAgents.length;
  const agents = Object.values(AGENT_PERSONAS);

  // Get display text for selected agents
  const getDisplayText = () => {
    if (selectedCount === 0) return placeholder;
    if (selectedCount === 1) {
      const agent = agents.find(a => a.id === selectedAgents[0]);
      return agent?.name || 'Unknown Agent';
    }
    return `${selectedCount} Agents Selected`;
  };

  return (
    <div className={cn("relative", className)} ref={dropdownRef}>
      {label && (
        <label className="block text-sm font-medium text-slate-300 mb-2">
          {label}
        </label>
      )}
      
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full flex items-center justify-between gap-2 px-3 py-2.5 text-sm",
          "bg-slate-800/60 hover:bg-slate-800 rounded-lg border transition-all",
          selectedCount > 0 
            ? "border-blue-500/50 text-blue-400" 
            : "border-slate-700/50 text-slate-300"
        )}
      >
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4" />
          <span>{getDisplayText()}</span>
        </div>
        <ChevronDown className={cn("w-4 h-4 transition-transform", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-slate-800 border border-slate-700 rounded-lg shadow-xl overflow-hidden">
          {/* Quick Presets */}
          <div className="p-3 border-b border-slate-700">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                Quick Presets
              </h3>
              {selectedCount > 0 && (
                <button
                  onClick={clearAll}
                  className="text-xs text-slate-400 hover:text-red-400 transition-colors"
                >
                  Clear All
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 gap-1">
              {QUICK_PRESETS.map((preset) => {
                const Icon = preset.icon;
                const isSelected = JSON.stringify(selectedAgents.sort()) === JSON.stringify(preset.agents.sort());
                
                return (
                  <button
                    key={preset.id}
                    onClick={() => selectPreset(preset.agents)}
                    className={cn(
                      "flex items-center gap-2 p-2 text-xs rounded-md border transition-all text-left",
                      isSelected
                        ? "bg-blue-500/20 border-blue-500/50 text-blue-400"
                        : "bg-slate-900/50 border-slate-700/50 text-slate-300 hover:bg-slate-700/50"
                    )}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <div>
                      <div className="font-medium">{preset.name}</div>
                      <div className="text-[10px] text-slate-500">{preset.description}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Individual Agents */}
          <div className="max-h-[300px] overflow-y-auto">
            <div className="p-3">
              <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
                Individual Agents
              </h3>
              <div className="space-y-1">
                {agents.map((agent) => {
                  const Icon = AGENT_ICONS[agent.id as keyof typeof AGENT_ICONS] || Brain;
                  const isSelected = selectedAgents.includes(agent.id);
                  
                  return (
                    <button
                      key={agent.id}
                      onClick={() => toggleAgent(agent.id)}
                      className={cn(
                        "w-full flex items-center gap-3 p-2.5 text-left transition-all rounded-lg",
                        isSelected 
                          ? `${agent.bgColor} ${agent.borderColor} border`
                          : "hover:bg-slate-700/30"
                      )}
                    >
                      <div className="flex-shrink-0">
                        <div className={cn(
                          "w-5 h-5 rounded border-2 flex items-center justify-center transition-all",
                          isSelected
                            ? `${agent.color} border-current`
                            : "border-slate-600"
                        )}>
                          {isSelected && <Check className="w-3 h-3" />}
                        </div>
                      </div>
                      
                      <Icon className={cn(
                        "w-4 h-4 flex-shrink-0",
                        isSelected ? agent.color : "text-slate-400"
                      )} />
                      
                      <div className="flex-1 min-w-0">
                        <div className={cn(
                          "font-medium text-sm",
                          isSelected ? agent.color : "text-slate-200"
                        )}>
                          {agent.name}
                        </div>
                        <div className="text-xs text-slate-400 truncate">
                          {agent.description}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Footer */}
          {selectedCount > 0 && (
            <div className="p-3 border-t border-slate-700 bg-slate-900/50">
              <div className="text-xs text-slate-400">
                {selectedCount} agent{selectedCount > 1 ? 's' : ''} will provide unique perspectives on the financial data
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
