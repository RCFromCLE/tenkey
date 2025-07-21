/**
 * AISettings Component
 * Manages AI-related settings including web search, TTS, and analysis mode
 */

import React from 'react';
import { Globe, Volume2, BrainCircuit } from 'lucide-react';
import { ToggleSwitch } from './ToggleSwitch';
import { VoiceSelector } from '../ui/voice-selector';

interface AISettingsProps {
  isWebSearchEnabled: boolean;
  autoRead: boolean;
  enableTTS: boolean;
  selectedVoice: string;
  speakingRate: number;
  isTTSAvailable: boolean;
  analysisMode: boolean;
  onWebSearchToggle: (enabled: boolean) => void;
  onAutoReadToggle: (enabled: boolean) => void;
  onEnableTTSToggle: (enabled: boolean) => void;
  onVoiceChange: (voice: string) => void;
  onSpeakingRateChange: (rate: number) => void;
  onAnalysisModeChange: (enabled: boolean) => void;
}

export function AISettings({
  isWebSearchEnabled,
  autoRead,
  enableTTS,
  selectedVoice,
  speakingRate,
  isTTSAvailable,
  analysisMode,
  onWebSearchToggle,
  onAutoReadToggle,
  onEnableTTSToggle,
  onVoiceChange,
  onSpeakingRateChange,
  onAnalysisModeChange
}: AISettingsProps) {
  return (
    <div className="p-3 space-y-2 rounded-lg bg-slate-800/80 border border-slate-700/60">
      <ToggleSwitch
        checked={isWebSearchEnabled}
        onChange={onWebSearchToggle}
        title="Toggle Web Search"
        Icon={Globe}
        label="Web Search"
        description="Enhance answers with real-time data."
      />
      
      <ToggleSwitch
        checked={analysisMode}
        onChange={onAnalysisModeChange}
        title="Toggle Agent Conversation"
        Icon={BrainCircuit}
        label="Agent Conversation"
        description="Enable interactive discussions between AI agents."
      />
      
      {isTTSAvailable && (
        <>
          <ToggleSwitch
            checked={autoRead}
            onChange={onAutoReadToggle}
            title="Toggle Auto-Read"
            Icon={Volume2}
            label="Auto-Read Responses"
            description="Automatically read new messages aloud."
          />
          
          <div className="space-y-4 pl-8">
            <VoiceSelector
              selectedVoice={selectedVoice}
              onVoiceChange={onVoiceChange}
              disabled={!isTTSAvailable}
            />
            
            <div className="space-y-2">
              <label htmlFor="speed-slider" className="text-sm font-medium text-slate-300">
                Speed ({speakingRate.toFixed(2)}x)
              </label>
              <input
                id="speed-slider"
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={speakingRate}
                onChange={(e) => onSpeakingRateChange(parseFloat(e.target.value))}
                disabled={!isTTSAvailable}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
          </div>
        </>
      )}
      
    </div>
  );
}
