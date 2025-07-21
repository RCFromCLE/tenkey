/**
 * PromptSelector Component
 * Dropdown component for selecting prompts with search, tabs, and CRUD operations for custom prompts
 */

import React, { useRef, useEffect, useState } from 'react';
import { ChevronDown, Search, Lightbulb, Edit2, Trash2, Plus } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Prompt } from '../../lib/types/filing-chat';
import { PromptList } from './PromptList';

interface PromptSelectorProps {
  prompts: Prompt[];
  loading: boolean;
  hasFilings: boolean;
  has10K: boolean;
  has10Q: boolean;
  onPromptSelect: (prompt: Prompt) => void;
  onAddPrompt: (text: string) => void;
  onUpdatePrompt: (promptId: string, newText: string) => void;
  onDeletePrompt: (promptId: string) => void;
  onToggleFavorite: (promptId: string) => void;
}

type TabType = 'All' | '10-K' | '10-Q' | 'Custom';

export function PromptSelector({
  prompts,
  loading,
  hasFilings,
  has10K,
  has10Q,
  onPromptSelect,
  onAddPrompt,
  onUpdatePrompt,
  onDeletePrompt,
  onToggleFavorite
}: PromptSelectorProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [promptSearch, setPromptSearch] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('All');
  const [newPromptText, setNewPromptText] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter prompts based on search and active tab
  const filteredPrompts = prompts.filter(prompt => {
    const searchMatch = prompt.text.toLowerCase().includes(promptSearch.toLowerCase()) ||
                        prompt.category.toLowerCase().includes(promptSearch.toLowerCase());

    if (!searchMatch) return false;

    switch (activeTab) {
      case '10-K':
        return prompt.filingType === '10-K' || prompt.filingType === 'common';
      case '10-Q':
        return prompt.filingType === '10-Q' || prompt.filingType === 'common';
      case 'Custom':
        return prompt.isCustom;
      case 'All':
      default:
        return !prompt.isCustom;
    }
  });

  // Group prompts by category
  const groupedPrompts = filteredPrompts.reduce((acc, prompt) => {
    const key = prompt.isCustom ? 'Custom Prompts' : prompt.category;
    if (!acc[key]) acc[key] = [];
    acc[key].push(prompt);
    return acc;
  }, {} as Record<string, Prompt[]>);

  const handleAddPrompt = () => {
    if (!newPromptText.trim()) return;
    onAddPrompt(newPromptText.trim());
    setNewPromptText('');
  };

  const handlePromptSelect = (prompt: Prompt) => {
    onPromptSelect(prompt);
    setShowDropdown(false);
    setPromptSearch('');
  };

  if (!hasFilings || loading) return null;

  return (
    <div className="mb-3 relative" ref={dropdownRef}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center gap-2 px-4 py-2 text-sm text-slate-300 bg-slate-800/60 hover:bg-slate-800 rounded-lg border border-slate-700/50 transition-all"
      >
        <span>Suggested prompts ({prompts.length})</span>
        <ChevronDown className={cn("w-4 h-4 transition-transform", showDropdown && "rotate-180")} />
      </button>

      {showDropdown && (
        <div className="absolute bottom-full mb-2 left-0 w-[600px] max-h-[50vh] bg-slate-800 border border-slate-700 rounded-lg shadow-xl flex flex-col z-50">
          {/* Header with Search and Tabs */}
          <div className="p-3 border-b border-slate-700">
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={promptSearch}
                onChange={(e) => setPromptSearch(e.target.value)}
                placeholder="Search prompts..."
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>
            <div className="flex items-center border-b border-slate-700">
              {(['All', '10-K', '10-Q', 'Custom'] as TabType[]).map(tab => {
                const isDisabled = (tab === '10-K' && !has10K) || (tab === '10-Q' && !has10Q);
                
                return (
                  <button
                    key={tab}
                    onClick={() => !isDisabled && setActiveTab(tab)}
                    disabled={isDisabled}
                    className={cn(
                      "px-4 py-2 text-sm font-medium transition-colors",
                      activeTab === tab ? "text-blue-400 border-b-2 border-blue-400" : "text-slate-400 hover:text-white",
                      isDisabled && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    {tab}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Prompts List */}
          <PromptList
            groupedPrompts={groupedPrompts}
            onPromptSelect={handlePromptSelect}
            onUpdatePrompt={onUpdatePrompt}
            onDeletePrompt={onDeletePrompt}
            onToggleFavorite={onToggleFavorite}
          />
          
          {/* Add New Prompt Section */}
          {activeTab === 'Custom' && (
            <div className="p-3 border-t border-slate-700 bg-slate-900/30">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newPromptText}
                  onChange={(e) => setNewPromptText(e.target.value)}
                  placeholder="Add a new custom prompt..."
                  className="flex-1 px-3 py-2 text-sm bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddPrompt();
                    }
                  }}
                />
                <button
                  onClick={handleAddPrompt}
                  disabled={!newPromptText.trim()}
                  className="p-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:opacity-50 rounded-lg transition-colors"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
