'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Brain, Zap, DollarSign, Database, Search, Filter, 
  ChevronDown, Info, ExternalLink, Sparkles, Globe,
  ArrowLeft, Copy, Check, Settings, Save, Users, BrainCircuit
} from 'lucide-react';
import { OpenRouterService } from '../../lib/services/openrouter';
import { cn } from '../../lib/utils';

interface ModelInfo {
  id: string;
  name: string;
  provider?: string;
  contextLength?: number;
  description?: string;
  costTier?: 'free' | 'low' | 'medium' | 'high';
  pricing?: {
    prompt: string;
    completion: string;
  };
}

const MODEL_ICONS: Record<string, React.ReactNode> = {
  'gpt': <Brain className="w-6 h-6 text-purple-400" />,
  'claude': <Sparkles className="w-6 h-6 text-blue-400" />,
  'gemini': <Zap className="w-6 h-6 text-yellow-400" />,
  'llama': <Globe className="w-6 h-6 text-green-400" />,
  'mistral': <Brain className="w-6 h-6 text-orange-400" />,
  'mixtral': <Brain className="w-6 h-6 text-pink-400" />,
};

const COST_COLORS = {
  free: 'text-green-400 bg-green-400/10 border-green-400/20',
  low: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  medium: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  high: 'text-red-400 bg-red-400/10 border-red-400/20',
};

const COST_LABELS = {
  free: 'Free',
  low: 'Low Cost',
  medium: 'Medium Cost',
  high: 'High Cost',
};

export default function ModelsPage() {
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProvider, setSelectedProvider] = useState<string>('all');
  const [selectedCostTier, setSelectedCostTier] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'context' | 'cost'>('name');
  const [copiedModelId, setCopiedModelId] = useState<string | null>(null);
  const [userDefaultChatModel, setUserDefaultChatModel] = useState<string>('google/gemini-2.0-flash-exp');
  const [userDefaultAgentModel, setUserDefaultAgentModel] = useState<string>('openai/gpt-4o');
  const [savingDefaults, setSavingDefaults] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchModels = async () => {
      try {
        const response = await fetch('https://openrouter.ai/api/v1/models');
        const data = await response.json();
        
        const transformedModels: ModelInfo[] = data.data.map((model: any) => {
          const provider = model.id.split('/')[0];
          const providerName = provider.charAt(0).toUpperCase() + provider.slice(1);
          
          let costTier: 'free' | 'low' | 'medium' | 'high' = 'medium';
          const pricing = model.pricing;
          if (pricing) {
            const promptPrice = parseFloat(pricing.prompt);
            if (promptPrice === 0) costTier = 'free';
            else if (promptPrice < 0.001) costTier = 'low';
            else if (promptPrice < 0.01) costTier = 'medium';
            else costTier = 'high';
          }
          
          return {
            id: model.id,
            name: model.name || model.id.split('/')[1],
            provider: providerName,
            contextLength: model.context_length,
            description: model.description,
            costTier,
            pricing: model.pricing
          };
        });
        
        setModels(transformedModels);
      } catch (error) {
        console.error('Failed to fetch models:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchModels();
  }, []);

  // Fetch user's default models
  useEffect(() => {
    const fetchUserDefaults = async () => {
      try {
        const response = await fetch('/api/user/models');
        if (response.ok) {
          const data = await response.json();
          setUserDefaultChatModel(data.defaultChatModel);
          setUserDefaultAgentModel(data.defaultAgentModel);
        }
      } catch (error) {
        console.error('Failed to fetch user defaults:', error);
      }
    };
    
    fetchUserDefaults();
  }, []);

  const getModelIcon = (model: ModelInfo) => {
    const modelIdLower = model.id.toLowerCase();
    for (const [key, icon] of Object.entries(MODEL_ICONS)) {
      if (modelIdLower.includes(key)) return icon;
    }
    return <Brain className="w-6 h-6 text-slate-400" />;
  };

  const copyModelId = (modelId: string) => {
    navigator.clipboard.writeText(modelId);
    setCopiedModelId(modelId);
    setTimeout(() => setCopiedModelId(null), 2000);
  };

  const setAsDefaultChat = async (modelId: string) => {
    setSavingDefaults(true);
    try {
      const response = await fetch('/api/user/models', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ defaultChatModel: modelId })
      });
      
      if (response.ok) {
        setUserDefaultChatModel(modelId);
        setSaveMessage('Default chat model updated!');
        setTimeout(() => setSaveMessage(null), 3000);
      } else {
        const error = await response.json();
        console.error('Failed to update default chat model:', error);
        setSaveMessage(error.error || 'Failed to update default model');
        setTimeout(() => setSaveMessage(null), 3000);
      }
    } catch (error) {
      console.error('Failed to update default chat model:', error);
      setSaveMessage('Failed to update default model');
      setTimeout(() => setSaveMessage(null), 3000);
    } finally {
      setSavingDefaults(false);
    }
  };

  const setAsDefaultAgent = async (modelId: string) => {
    setSavingDefaults(true);
    try {
      const response = await fetch('/api/user/models', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ defaultAgentModel: modelId })
      });
      
      if (response.ok) {
        setUserDefaultAgentModel(modelId);
        setSaveMessage('Default agent model updated!');
        setTimeout(() => setSaveMessage(null), 3000);
      } else {
        const error = await response.json();
        console.error('Failed to update default agent model:', error);
        setSaveMessage(error.error || 'Failed to update default model');
        setTimeout(() => setSaveMessage(null), 3000);
      }
    } catch (error) {
      console.error('Failed to update default agent model:', error);
      setSaveMessage('Failed to update default model');
      setTimeout(() => setSaveMessage(null), 3000);
    } finally {
      setSavingDefaults(false);
    }
  };

  // Get unique providers
  const providers = Array.from(new Set(models.map(m => m.provider).filter(Boolean)));

  // Filter and sort models
  const filteredModels = models
    .filter(model => {
      const matchesSearch = searchQuery === '' || 
        model.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        model.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (model.description && model.description.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesProvider = selectedProvider === 'all' || model.provider === selectedProvider;
      const matchesCost = selectedCostTier === 'all' || model.costTier === selectedCostTier;
      
      return matchesSearch && matchesProvider && matchesCost;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'context':
          return (b.contextLength || 0) - (a.contextLength || 0);
        case 'cost':
          const costOrder = { free: 0, low: 1, medium: 2, high: 3 };
          return costOrder[a.costTier || 'medium'] - costOrder[b.costTier || 'medium'];
        default:
          return a.name.localeCompare(b.name);
      }
    });

  // Group models by provider
  const groupedModels = filteredModels.reduce((acc, model) => {
    const provider = model.provider || 'Other';
    if (!acc[provider]) acc[provider] = [];
    acc[provider].push(model);
    return acc;
  }, {} as Record<string, ModelInfo[]>);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0B0E14] to-[#0F1218] flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl font-bold bg-gradient-to-br from-blue-400 to-cyan-600 bg-clip-text text-transparent mb-4 animate-pulse">
            01
          </div>
          <p className="text-slate-400 font-light">Loading available models...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0B0E14] to-[#0F1218] text-white antialiased pt-20">
      {/* Subtle grid background */}
      <div className="fixed inset-0 pointer-events-none opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='grid' width='60' height='60' patternUnits='userSpaceOnUse'%3E%3Cpath d='M 60 0 L 0 0 0 60' fill='none' stroke='rgba(255,255,255,0.1)' stroke-width='1'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='url(%23grid)'/%3E%3C/svg%3E")`,
          backgroundSize: '60px 60px'
        }} />
      </div>

      {/* Header */}
      <div className="relative border-b border-slate-800/50 backdrop-blur-sm sticky top-16 z-10 bg-[#0B0E14]/80">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-6">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-white/5 rounded-lg transition-all"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-2xl font-bold tracking-tight">
                <span className="bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                  AI Models & Agents
                </span>
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm text-slate-500 font-mono">
                {filteredModels.length} models
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* Filters and Search */}
      <div className="relative max-w-7xl mx-auto px-6 py-8">
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search models..."
              className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-white/20 focus:bg-white/10 transition-all"
            />
          </div>

          {/* Provider Filter */}
          <select
            value={selectedProvider}
            onChange={(e) => setSelectedProvider(e.target.value)}
            className="px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/20 appearance-none cursor-pointer [&>option]:bg-slate-800 [&>option]:text-white"
          >
            <option value="all">All Providers</option>
            {providers.map(provider => (
              <option key={provider} value={provider}>{provider}</option>
            ))}
          </select>

          {/* Cost Filter */}
          <select
            value={selectedCostTier}
            onChange={(e) => setSelectedCostTier(e.target.value)}
            className="px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/20 appearance-none cursor-pointer [&>option]:bg-slate-800 [&>option]:text-white"
          >
            <option value="all">All Price Tiers</option>
            <option value="free">Free</option>
            <option value="low">Low Cost</option>
            <option value="medium">Medium Cost</option>
            <option value="high">High Cost</option>
          </select>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/20 appearance-none cursor-pointer [&>option]:bg-slate-800 [&>option]:text-white"
          >
            <option value="name">Sort by Name</option>
            <option value="context">Sort by Context Size</option>
            <option value="cost">Sort by Cost</option>
          </select>
        </div>

        {/* Models Grid */}
        <div className="space-y-12">
          {Object.entries(groupedModels).map(([provider, providerModels]) => (
            <div key={provider}>
              <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-3">
                {provider}
                <span className="text-sm font-normal text-slate-500 font-mono">
                  {providerModels.length} models
                </span>
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {providerModels.map(model => (
                  <div
                    key={model.id}
                    className="bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/10 hover:border-white/20 transition-all group hover:scale-[1.02]"
                  >
                    {/* Model Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        {getModelIcon(model)}
                        <div className="flex-1">
                          <h3 className="font-semibold text-white">{model.name}</h3>
                          <div className="flex items-center gap-2 mt-2">
                            <code className="text-xs text-slate-500 bg-black/20 px-2 py-1 rounded font-mono">
                              {model.id}
                            </code>
                            <button
                              onClick={() => copyModelId(model.id)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-slate-700 rounded"
                              title="Copy model ID"
                            >
                              {copiedModelId === model.id ? (
                                <Check className="w-3 h-3 text-green-400" />
                              ) : (
                                <Copy className="w-3 h-3 text-slate-400" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Cost Badge */}
                    <div className="mb-4">
                      <span className={cn(
                        "inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border",
                        COST_COLORS[model.costTier || 'medium']
                      )}>
                        <DollarSign className="w-3 h-3" />
                        {COST_LABELS[model.costTier || 'medium']}
                      </span>
                    </div>

                    {/* Model Info */}
                    <div className="space-y-3 text-sm">
                      {model.contextLength && (
                        <div className="flex items-center gap-2 text-slate-300">
                          <Database className="w-4 h-4 text-slate-500" />
                          <span className="font-mono text-xs">{model.contextLength.toLocaleString()} tokens</span>
                        </div>
                      )}
                      
                      {model.pricing && (
                        <div className="text-xs text-slate-500 space-y-1 font-mono">
                          <div>Input: ${model.pricing.prompt}/1K</div>
                          <div>Output: ${model.pricing.completion}/1K</div>
                        </div>
                      )}
                    </div>

                    {/* Description */}
                    {model.description && (
                      <p className="mt-4 text-xs text-slate-500 line-clamp-3 leading-relaxed">
                        {model.description}
                      </p>
                    )}

                    {/* Current user defaults */}
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      {model.id === userDefaultChatModel && (
                        <span className="inline-flex items-center gap-1 px-3 py-1.5 text-xs bg-gradient-to-r from-yellow-500/20 to-orange-500/20 text-yellow-400 rounded-lg border border-yellow-500/30 font-medium">
                          <Zap className="w-3 h-3" />
                          Chat Default
                        </span>
                      )}
                      
                      {model.id === userDefaultAgentModel && (
                        <span className="inline-flex items-center gap-1 px-3 py-1.5 text-xs bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-400 rounded-lg border border-purple-500/30 font-medium">
                          <Brain className="w-3 h-3" />
                          Agent Default
                        </span>
                      )}
                    </div>

                    {/* Set as default buttons */}
                    <div className="mt-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                      {model.id !== userDefaultChatModel && (
                        <button
                          onClick={() => setAsDefaultChat(model.id)}
                          disabled={savingDefaults}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-white/5 hover:bg-white/10 text-white rounded-lg transition-all disabled:opacity-50 border border-white/10 hover:border-white/20"
                          title="Set as default chat model"
                        >
                          <Settings className="w-3 h-3" />
                          Set as Chat
                        </button>
                      )}
                      
                      {model.id !== userDefaultAgentModel && (
                        <button
                          onClick={() => setAsDefaultAgent(model.id)}
                          disabled={savingDefaults}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-white/5 hover:bg-white/10 text-white rounded-lg transition-all disabled:opacity-50 border border-white/10 hover:border-white/20"
                          title="Set as default agent model"
                        >
                          <Settings className="w-3 h-3" />
                          Set as Agent
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredModels.length === 0 && (
          <div className="text-center py-20">
            <div className="text-4xl font-bold bg-gradient-to-br from-slate-400 to-slate-600 bg-clip-text text-transparent mb-4">
              00
            </div>
            <p className="text-slate-500 font-light">No models found matching your criteria</p>
          </div>
        )}
      </div>

      {/* Save notification */}
      {saveMessage && (
        <div className="fixed bottom-6 right-6 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-5 py-3 shadow-2xl flex items-center gap-3">
          <Save className="w-4 h-4 text-emerald-400" />
          <span className="text-sm text-white font-medium">{saveMessage}</span>
        </div>
      )}
    </div>
  );
}
