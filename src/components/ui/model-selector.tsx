'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Sparkles, Zap, Brain, Globe, Check } from 'lucide-react';
import { cn } from '../../lib/utils';

interface Model {
  id: string;
  name: string;
  provider?: string;
  contextLength?: number;
  description?: string;
  capabilities?: string[];
  costTier?: 'free' | 'low' | 'medium' | 'high';
}

interface ModelSelectorProps {
  models: Model[];
  selectedModel: string;
  onModelSelect: (modelId: string) => void;
  label?: string;
  className?: string;
  showDescription?: boolean;
}

const MODEL_ICONS: Record<string, React.ReactNode> = {
  'gpt-4': <Brain className="w-4 h-4 text-purple-400" />,
  'claude': <Sparkles className="w-4 h-4 text-blue-400" />,
  'gemini': <Zap className="w-4 h-4 text-yellow-400" />,
  'llama': <Globe className="w-4 h-4 text-green-400" />,
};

const COST_COLORS = {
  free: 'text-green-400',
  low: 'text-blue-400',
  medium: 'text-yellow-400',
  high: 'text-red-400',
};

export function ModelSelector({
  models,
  selectedModel,
  onModelSelect,
  label = 'Model',
  className,
  showDescription = true,
}: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  // Filter models based on search query
  const filteredModels = models.filter(model => {
    const searchLower = searchQuery.toLowerCase();
    return (
      model.name.toLowerCase().includes(searchLower) ||
      model.id.toLowerCase().includes(searchLower) ||
      (model.provider && model.provider.toLowerCase().includes(searchLower)) ||
      (model.description && model.description.toLowerCase().includes(searchLower))
    );
  });

  // Group models by provider
  const groupedModels = filteredModels.reduce((acc, model) => {
    const provider = model.provider || 'Other';
    if (!acc[provider]) acc[provider] = [];
    acc[provider].push(model);
    return acc;
  }, {} as Record<string, Model[]>);

  const selectedModelData = models.find(m => m.id === selectedModel);

  const getModelIcon = (model: Model) => {
    const modelIdLower = model.id.toLowerCase();
    for (const [key, icon] of Object.entries(MODEL_ICONS)) {
      if (modelIdLower.includes(key)) return icon;
    }
    return <Brain className="w-4 h-4 text-slate-400" />;
  };

  return (
    <div className={cn("relative", className)} ref={dropdownRef}>
      {label && (
        <label className="block text-sm font-medium text-slate-300 mb-1">
          {label}
        </label>
      )}
      
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full flex items-center justify-between gap-2 px-3 py-2.5",
          "bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50",
          "rounded-lg transition-all duration-200",
          "text-sm text-slate-200 hover:text-white",
          "focus:outline-none focus:ring-2 focus:ring-blue-500/50",
          isOpen && "ring-2 ring-blue-500/50 bg-slate-800"
        )}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {selectedModelData && getModelIcon(selectedModelData)}
          <span className="truncate">
            {selectedModelData?.name || 'Select a model'}
          </span>
          {selectedModelData?.costTier && (
            <span className={cn(
              "text-xs px-1.5 py-0.5 rounded-full bg-slate-700/50",
              COST_COLORS[selectedModelData.costTier]
            )}>
              {selectedModelData.costTier}
            </span>
          )}
        </div>
        <ChevronDown className={cn(
          "w-4 h-4 text-slate-400 transition-transform duration-200",
          isOpen && "rotate-180"
        )} />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-slate-800 border border-slate-700 rounded-lg shadow-xl overflow-hidden">
          {/* Search Input */}
          <div className="p-3 border-b border-slate-700">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search models..."
                className="w-full pl-10 pr-3 py-2 text-sm bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>
          </div>

          {/* Models List */}
          <div className="max-h-[400px] overflow-y-auto">
            {Object.entries(groupedModels).map(([provider, providerModels]) => (
              <div key={provider} className="border-b border-slate-700/50 last:border-0">
                <div className="px-3 py-2 bg-slate-900/30">
                  <h4 className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                    {provider}
                  </h4>
                </div>
                <div className="p-1">
                  {providerModels.map(model => (
                    <button
                      key={model.id}
                      onClick={() => {
                        onModelSelect(model.id);
                        setIsOpen(false);
                        setSearchQuery('');
                      }}
                      className={cn(
                        "w-full flex items-start gap-3 px-3 py-2.5 rounded transition-all duration-150",
                        "hover:bg-slate-700/50 text-left",
                        selectedModel === model.id && "bg-blue-600/20 hover:bg-blue-600/30"
                      )}
                    >
                      <div className="flex-shrink-0 mt-0.5">
                        {getModelIcon(model)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-slate-200">
                            {model.name}
                          </span>
                          {model.costTier && (
                            <span className={cn(
                              "text-xs px-1.5 py-0.5 rounded-full bg-slate-700/50",
                              COST_COLORS[model.costTier]
                            )}>
                              {model.costTier}
                            </span>
                          )}
                          {selectedModel === model.id && (
                            <Check className="w-4 h-4 text-blue-400 ml-auto" />
                          )}
                        </div>
                        {showDescription && model.description && (
                          <p className="text-xs text-slate-400 mt-1">
                            {model.description}
                          </p>
                        )}
                        {model.contextLength && (
                          <p className="text-xs text-slate-500 mt-1">
                            Context: {model.contextLength.toLocaleString()} tokens
                          </p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
            
            {filteredModels.length === 0 && (
              <div className="p-8 text-center">
                <p className="text-sm text-slate-400">No models found</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
