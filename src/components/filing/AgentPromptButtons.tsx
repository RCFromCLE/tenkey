/**
 * AgentPromptButtons Component
 * Displays clickable agent buttons with their specific prompts
 */

import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '../../lib/utils';
import { getAgentPersona, AGENT_PERSONAS } from '../../lib/services/agent-personas-improved';
import { getAgentSpecificPrompts } from '../../lib/constants/filing-prompts';

interface AgentPromptButtonsProps {
  selectedAgents: string[];
  onPromptSelect: (prompt: string, agentId: string) => void;
  className?: string;
}

export function AgentPromptButtons({
  selectedAgents,
  onPromptSelect,
  className
}: AgentPromptButtonsProps) {
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null);

  if (selectedAgents.length === 0) return null;

  const handleAgentClick = (agentId: string) => {
    setExpandedAgent(expandedAgent === agentId ? null : agentId);
  };

  const handlePromptClick = (prompt: string, agentId: string) => {
    onPromptSelect(prompt, agentId);
    setExpandedAgent(null); // Collapse after selection
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="text-xs text-slate-400 font-medium mb-2">
        Agent-Specific Analysis ({selectedAgents.length} selected)
      </div>
      
      {selectedAgents.map(agentId => {
        const persona = getAgentPersona(agentId);
        const prompts = getAgentSpecificPrompts(agentId);
        const isExpanded = expandedAgent === agentId;

        return (
          <div key={agentId} className="border border-slate-700/50 rounded-lg overflow-hidden">
            {/* Agent Header Button */}
            <button
              onClick={() => handleAgentClick(agentId)}
              className={cn(
                "w-full flex items-center justify-between p-3 text-left transition-all",
                "hover:bg-slate-800/50",
                persona.bgColor,
                persona.borderColor,
                isExpanded && "bg-slate-800/30"
              )}
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">{persona.emoji}</span>
                <div>
                  <div className={cn("font-medium", persona.color)}>
                    {persona.name}
                  </div>
                  <div className="text-xs text-slate-400">
                    {persona.description}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">
                  {prompts.length} prompts
                </span>
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                )}
              </div>
            </button>

            {/* Agent Prompts */}
            {isExpanded && (
              <div className="border-t border-slate-700/50 bg-slate-900/20">
                <div className="p-2 space-y-1 max-h-60 overflow-y-auto">
                  {prompts.map((prompt, index) => (
                    <button
                      key={index}
                      onClick={() => handlePromptClick(prompt, agentId)}
                      className={cn(
                        "w-full text-left p-2 text-sm rounded-md transition-all",
                        "hover:bg-slate-800/50 text-slate-300 hover:text-white",
                        "border border-transparent hover:border-slate-600/50"
                      )}
                    >
                      <div className="line-clamp-2">
                        {prompt}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
