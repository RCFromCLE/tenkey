'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { 
  Users, ArrowLeft, Save, Volume2, VolumeX, Play, Pause,
  Settings, Brain, Mic, Speaker, Check, AlertCircle, FileText,
  Calendar, Building2, TrendingUp, BarChart3, Activity
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { AGENT_PERSONAS, AgentPersona } from '../../lib/services/agent-personas';
import { OPENAI_VOICES, OpenAIVoice, getDefaultVoiceForAgent, getAllVoices } from '../../lib/services/openai-voices';
import { useSECFilings } from '../../lib/services/sec';

interface AgentVoiceConfig {
  agentId: string;
  voice: string;
  enabled: boolean;
}

export default function AgentsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const [defaultAgentPersonas, setDefaultAgentPersonas] = useState<string[]>([]);
  const [agentVoiceConfigs, setAgentVoiceConfigs] = useState<Record<string, AgentVoiceConfig>>({});
  const [hasOpenAIKey, setHasOpenAIKey] = useState(false);
  const [hasGoogleCredentials, setHasGoogleCredentials] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [playingVoice, setPlayingVoice] = useState<string | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [recentFilings, setRecentFilings] = useState<any[]>([]);
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);

  // Get symbol from URL params if available
  const symbolFromParams = searchParams.get('symbol');

  useEffect(() => {
    const fetchSettings = async () => {
      if (!session) return;
      setIsLoading(true);
      try {
        // Fetch user settings
        const settingsResponse = await fetch('/api/settings');
        if (settingsResponse.ok) {
          const settingsData = await settingsResponse.json();
          setHasOpenAIKey(settingsData.hasOpenAIKey || false);
          setHasGoogleCredentials(settingsData.hasGoogleCredentials || false);
        }

        // Fetch user models and agent configs
        const modelsResponse = await fetch('/api/user/models');
        if (modelsResponse.ok) {
          const modelsData = await modelsResponse.json();
          setDefaultAgentPersonas(modelsData.defaultAgentPersonas || []);
        }

        // Fetch agent voice configs separately
        const voiceResponse = await fetch('/api/user/agent-voices');
        if (voiceResponse.ok) {
          const voiceData = await voiceResponse.json();
          const savedConfigs = voiceData.agentVoiceConfigs || {};
          
          // Initialize voice configs with defaults
          const voiceConfigs: Record<string, AgentVoiceConfig> = {};
          Object.keys(AGENT_PERSONAS).forEach(agentId => {
            voiceConfigs[agentId] = {
              agentId,
              voice: savedConfigs[agentId]?.voice || getDefaultVoiceForAgent(agentId),
              enabled: savedConfigs[agentId]?.enabled ?? true
            };
          });
          
          setAgentVoiceConfigs(voiceConfigs);
        }
      } catch (error) {
        console.error('Failed to fetch settings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, [session]);

  const handleAgentToggle = (agentId: string) => {
    const newPersonas = defaultAgentPersonas.includes(agentId)
      ? defaultAgentPersonas.filter(id => id !== agentId)
      : [...defaultAgentPersonas, agentId];
    setDefaultAgentPersonas(newPersonas);
  };

  const handleVoiceChange = (agentId: string, voice: string) => {
    setAgentVoiceConfigs(prev => ({
      ...prev,
      [agentId]: {
        ...prev[agentId],
        voice
      }
    }));
  };

  const handleVoiceToggle = (agentId: string) => {
    setAgentVoiceConfigs(prev => ({
      ...prev,
      [agentId]: {
        ...prev[agentId],
        enabled: !prev[agentId].enabled
      }
    }));
  };

  const playVoicePreview = async (voiceId: string) => {
    if (!hasOpenAIKey) return;
    
    if (playingVoice === voiceId) {
      // Stop current playback
      if (audioElement) {
        audioElement.pause();
        audioElement.currentTime = 0;
      }
      setPlayingVoice(null);
      return;
    }

    try {
      setPlayingVoice(voiceId);
      
      const response = await fetch('/api/tts/openai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text: "Hello! This is a preview of my voice for financial analysis.",
          voice: voiceId
        }),
      });

      if (!response.ok) throw new Error('Failed to generate voice preview');

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      const audio = new Audio(url);
      setAudioElement(audio);
      
      audio.onended = () => {
        setPlayingVoice(null);
        URL.revokeObjectURL(url);
      };
      
      audio.onerror = () => {
        setPlayingVoice(null);
        URL.revokeObjectURL(url);
      };
      
      await audio.play();
    } catch (error) {
      console.error('Error playing voice preview:', error);
      setPlayingVoice(null);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveMessage(null);
    
    try {
      // Save agent personas
      const modelsResponse = await fetch('/api/user/models', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          defaultAgentPersonas
        })
      });
      
      // Save voice configs
      const voiceResponse = await fetch('/api/user/agent-voices', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          agentVoiceConfigs
        })
      });
      
      if (modelsResponse.ok && voiceResponse.ok) {
        setSaveMessage('Agent configuration saved successfully!');
        setTimeout(() => setSaveMessage(null), 3000);
      } else {
        throw new Error('Failed to save configuration');
      }
    } catch (error) {
      console.error('Failed to save agent configuration:', error);
      setSaveMessage('Failed to save configuration');
      setTimeout(() => setSaveMessage(null), 3000);
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0B0E14] to-[#0F1218] flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl font-bold bg-gradient-to-br from-blue-400 to-cyan-600 bg-clip-text text-transparent mb-4 animate-pulse">
            01
          </div>
          <p className="text-slate-400 font-light">Loading agent configuration...</p>
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
                  Agent Configuration
                </span>
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/20 disabled:bg-white/5 disabled:text-slate-500 rounded-lg font-medium transition-all disabled:cursor-not-allowed border border-white/20 hover:border-white/30 disabled:border-white/10"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="relative max-w-7xl mx-auto px-6 py-8">

        {/* TTS Status */}
        <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className={cn(
            "p-4 rounded-xl border transition-all",
            hasOpenAIKey 
              ? "bg-green-900/20 border-green-700/30 text-green-400"
              : "bg-red-900/20 border-red-700/30 text-red-400"
          )}>
            <div className="flex items-center gap-3">
              <Speaker className="w-5 h-5" />
              <div>
                <h3 className="font-medium">OpenAI Text-to-Speech</h3>
                <p className="text-xs opacity-75">
                  {hasOpenAIKey ? 'Available - High quality voices' : 'Requires OpenAI API key in settings'}
                </p>
              </div>
            </div>
          </div>
          
          <div className={cn(
            "p-4 rounded-xl border transition-all",
            hasGoogleCredentials 
              ? "bg-green-900/20 border-green-700/30 text-green-400"
              : "bg-yellow-900/20 border-yellow-700/30 text-yellow-400"
          )}>
            <div className="flex items-center gap-3">
              <Mic className="w-5 h-5" />
              <div>
                <h3 className="font-medium">Google Text-to-Speech</h3>
                <p className="text-xs opacity-75">
                  {hasGoogleCredentials ? 'Available - Fallback option' : 'Optional fallback'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Agent Personas */}
        <div className="space-y-8">
          <div>
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-3">
              <Users className="w-6 h-6" />
              Analysis Agent Personas
              <span className="text-sm font-normal text-slate-500 font-mono">
                {defaultAgentPersonas.length} active
              </span>
            </h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {Object.values(AGENT_PERSONAS).map(agent => {
                const isActive = defaultAgentPersonas.includes(agent.id);
                const voiceConfig = agentVoiceConfigs[agent.id];
                const selectedVoice = OPENAI_VOICES[voiceConfig?.voice || 'alloy'];
                
                return (
                  <div
                    key={agent.id}
                    className={cn(
                      "p-6 rounded-xl border transition-all hover:scale-[1.02]",
                      isActive
                        ? `${agent.bgColor} ${agent.borderColor} border`
                        : "bg-white/5 border-white/10 hover:border-white/20"
                    )}
                  >
                    {/* Agent Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className={cn(
                            "font-semibold text-lg",
                            isActive ? agent.color : "text-slate-200"
                          )}>
                            {agent.name}
                          </h3>
                          <button
                            onClick={() => handleAgentToggle(agent.id)}
                            className={cn(
                              "px-3 py-1 text-xs font-medium rounded-lg transition-all",
                              isActive
                                ? "bg-white/20 text-white"
                                : "bg-white/5 text-slate-400 hover:bg-white/10"
                            )}
                          >
                            {isActive ? 'Active' : 'Inactive'}
                          </button>
                        </div>
                        <p className="text-sm text-slate-400 mb-3">{agent.description}</p>
                        <div className="text-xs text-slate-500">
                          <span className="font-medium">Focus:</span> {agent.analysisStyle.focus.join(', ')}
                        </div>
                      </div>
                    </div>

                    {/* Voice Configuration */}
                    {isActive && (
                      <div className="mt-4 pt-4 border-t border-white/10">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-sm font-medium text-slate-300">Voice Settings</h4>
                          <button
                            onClick={() => handleVoiceToggle(agent.id)}
                            className={cn(
                              "flex items-center gap-1 px-2 py-1 text-xs rounded transition-all",
                              voiceConfig?.enabled
                                ? "bg-green-900/30 text-green-400"
                                : "bg-red-900/30 text-red-400"
                            )}
                          >
                            {voiceConfig?.enabled ? <Volume2 className="w-3 h-3" /> : <VolumeX className="w-3 h-3" />}
                            {voiceConfig?.enabled ? 'Enabled' : 'Disabled'}
                          </button>
                        </div>
                        
                        {voiceConfig?.enabled && (
                          <div className="space-y-3">
                            <div>
                              <label className="text-xs text-slate-400 mb-2 block">Voice</label>
                              <div className="flex items-center gap-2">
                                <select
                                  value={voiceConfig.voice}
                                  onChange={(e) => handleVoiceChange(agent.id, e.target.value)}
                                  className="flex-1 px-3 py-2 bg-black/20 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-white/20 [&>option]:bg-slate-800 [&>option]:text-white"
                                  disabled={!hasOpenAIKey}
                                >
                                  {getAllVoices().map(voice => (
                                    <option key={voice.id} value={voice.id}>
                                      {voice.name} - {voice.description}
                                    </option>
                                  ))}
                                </select>
                                
                                {hasOpenAIKey && (
                                  <button
                                    onClick={() => playVoicePreview(voiceConfig.voice)}
                                    disabled={!voiceConfig.voice}
                                    className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all disabled:opacity-50"
                                    title="Preview voice"
                                  >
                                    {playingVoice === voiceConfig.voice ? (
                                      <Pause className="w-4 h-4" />
                                    ) : (
                                      <Play className="w-4 h-4" />
                                    )}
                                  </button>
                                )}
                              </div>
                            </div>
                            
                            {selectedVoice && (
                              <div className="text-xs text-slate-500 bg-black/20 p-3 rounded-lg">
                                <div className="font-medium text-slate-400 mb-1">{selectedVoice.name}</div>
                                <div>{selectedVoice.description}</div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Save notification */}
        {saveMessage && (
          <div className="fixed bottom-6 right-6 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-5 py-3 shadow-2xl flex items-center gap-3">
            {saveMessage.includes('success') ? (
              <Check className="w-4 h-4 text-green-400" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-400" />
            )}
            <span className="text-sm text-white font-medium">{saveMessage}</span>
          </div>
        )}
      </div>
    </div>
  );
}
