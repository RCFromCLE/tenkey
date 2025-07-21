import React from 'react';
import { OPENAI_VOICES } from '../../lib/hooks/use-text-to-speech-openai-enhanced';

interface VoiceSelectorProps {
  selectedVoice: string;
  onVoiceChange: (voice: string) => void;
  disabled?: boolean;
}

export const VoiceSelector: React.FC<VoiceSelectorProps> = ({ selectedVoice, onVoiceChange, disabled }) => {
  return (
    <div className="space-y-2">
      <label htmlFor="voice-selector" className="text-sm font-medium text-slate-300">
        Voice
      </label>
      <select
        id="voice-selector"
        value={selectedVoice}
        onChange={(e) => onVoiceChange(e.target.value)}
        disabled={disabled}
        className="w-full px-3 py-2 text-sm text-white bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed [&>option]:bg-slate-800 [&>option]:text-white"
      >
        {OPENAI_VOICES.map((voice) => (
          <option key={voice.id} value={voice.id}>
            {voice.name}
          </option>
        ))}
      </select>
    </div>
  );
};
