'use client';

import React, { useState } from 'react';
import { ChevronDown, Volume2, Play, Pause } from 'lucide-react';
import { GOOGLE_VOICES } from '@/lib/services/google-voices';
import { OPENAI_VOICES } from '@/lib/services/openai-voices';
import { useTextToSpeech } from '@/lib/hooks/use-text-to-speech';
import { useTextToSpeechOpenAI } from '@/lib/hooks/use-text-to-speech-openai';

interface VoiceSelectorEnhancedProps {
  value: string;
  onChange: (value: string) => void;
  provider?: 'google' | 'openai';
  onProviderChange?: (provider: 'google' | 'openai') => void;
  className?: string;
  disabled?: boolean;
}

export const VoiceSelectorEnhanced: React.FC<VoiceSelectorEnhancedProps> = ({
  value,
  onChange,
  provider = 'google',
  onProviderChange,
  className = '',
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [previewingVoice, setPreviewingVoice] = useState<string | null>(null);
  
  const googleTTS = useTextToSpeech();
  const openaiTTS = useTextToSpeechOpenAI();

  const currentVoices = provider === 'google' 
    ? GOOGLE_VOICES.map(v => ({ value: v.name, name: v.name, description: `${v.gender} ${v.type} voice` }))
    : Object.values(OPENAI_VOICES).map(v => ({ value: v.id, name: v.name, description: v.description }));
  
  const currentVoice = currentVoices.find((v: any) => v.value === value) || currentVoices[0];

  const handleVoiceSelect = (voiceValue: string) => {
    onChange(voiceValue);
    setIsOpen(false);
  };

  const handlePreview = async (voiceValue: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (previewingVoice === voiceValue) {
      // Stop current preview
      if (provider === 'google') {
        googleTTS.cancel();
      } else {
        openaiTTS.stop();
      }
      setPreviewingVoice(null);
      return;
    }

    setPreviewingVoice(voiceValue);
    
    const sampleText = "Hello! This is how I sound. I'm ready to help you with your financial analysis.";
    
    try {
      if (provider === 'google') {
        await googleTTS.speak(sampleText, voiceValue, 1.0);
      } else {
        await openaiTTS.speak(sampleText, {
          voice: voiceValue as any,
          model: 'gpt-4o-mini-tts'
        });
      }
    } catch (error) {
      console.error('Voice preview error:', error);
    } finally {
      setPreviewingVoice(null);
    }
  };

  const isCurrentlyPlaying = (voiceValue: string) => {
    return previewingVoice === voiceValue && (
      (provider === 'google' && googleTTS.isSpeaking) ||
      (provider === 'openai' && openaiTTS.isPlaying)
    );
  };

  const isCurrentlyLoading = (voiceValue: string) => {
    return previewingVoice === voiceValue && (
      (provider === 'openai' && openaiTTS.isLoading)
    );
  };

  return (
    <div className={`relative ${className}`}>
      {/* Provider Toggle */}
      {onProviderChange && (
        <div className="flex mb-3 bg-black/20 rounded-lg p-1">
          <button
            type="button"
            onClick={() => onProviderChange('google')}
            className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-all ${
              provider === 'google'
                ? 'bg-white/10 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Google TTS
          </button>
          <button
            type="button"
            onClick={() => onProviderChange('openai')}
            className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-all ${
              provider === 'openai'
                ? 'bg-white/10 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            OpenAI TTS
          </button>
        </div>
      )}

      {/* Voice Selector */}
      <div className="relative">
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={`w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white text-left focus:outline-none focus:ring-2 focus:ring-white/20 transition-all ${
            disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-black/30'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Volume2 className="w-4 h-4 text-slate-400" />
              <div>
                <div className="font-medium">{currentVoice.name}</div>
                <div className="text-sm text-slate-400">{currentVoice.description}</div>
              </div>
            </div>
            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </div>
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900/95 backdrop-blur-sm border border-white/10 rounded-xl shadow-xl z-50 max-h-64 overflow-y-auto">
            {currentVoices.map((voice) => (
              <div
                key={voice.value}
                className={`px-4 py-3 hover:bg-white/5 cursor-pointer transition-colors border-b border-white/5 last:border-b-0 ${
                  voice.value === value ? 'bg-white/10' : ''
                }`}
                onClick={() => handleVoiceSelect(voice.value)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-medium text-white">{voice.name}</div>
                    <div className="text-sm text-slate-400">{voice.description}</div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => handlePreview(voice.value, e)}
                    className="ml-3 p-2 hover:bg-white/10 rounded-lg transition-colors"
                    disabled={isCurrentlyLoading(voice.value)}
                  >
                    {isCurrentlyLoading(voice.value) ? (
                      <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    ) : isCurrentlyPlaying(voice.value) ? (
                      <Pause className="w-4 h-4 text-white" />
                    ) : (
                      <Play className="w-4 h-4 text-slate-400 hover:text-white" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Error Display */}
      {openaiTTS.error && provider === 'openai' && (
        <div className="mt-2 text-sm text-red-400">
          {openaiTTS.error}
        </div>
      )}
    </div>
  );
};
