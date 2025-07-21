/**
 * Enhanced Text-to-Speech hook with additional state management
 */

import { useState, useCallback, useEffect } from 'react';
import { useTextToSpeech as useBaseTTS } from './use-text-to-speech';
import { DEFAULT_VOICE } from '../services/google-voices';

interface UseTextToSpeechEnhancedReturn {
  isTTSAvailable: boolean;
  isSpeaking: boolean;
  currentlyPlaying: string | null;
  selectedVoice: string;
  speakingRate: number;
  autoRead: boolean;
  enableTTS: boolean;
  setSelectedVoice: (voice: string) => void;
  setSpeakingRate: (rate: number) => void;
  setAutoRead: (enabled: boolean) => void;
  setEnableTTS: (enabled: boolean) => void;
  speak: (text: string, messageId: string) => void;
  stop: () => void;
}

export function useTextToSpeech(): UseTextToSpeechEnhancedReturn {
  const baseTTS = useBaseTTS();
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const [selectedVoice, setSelectedVoice] = useState(DEFAULT_VOICE);
  const [speakingRate, setSpeakingRate] = useState(1);
  const [autoRead, setAutoRead] = useState(false);
  const [enableTTS, setEnableTTS] = useState(true);

  // Clear currentlyPlaying when base TTS stops speaking
  useEffect(() => {
    if (!baseTTS.isSpeaking && currentlyPlaying) {
      setCurrentlyPlaying(null);
    }
  }, [baseTTS.isSpeaking, currentlyPlaying]);

  const speak = useCallback((text: string, messageId: string) => {
    if (!baseTTS.isAvailable || !enableTTS) {
      return;
    }

    if (currentlyPlaying === messageId) {
      baseTTS.cancel();
      setCurrentlyPlaying(null);
      return;
    }
    
    // Stop any currently playing audio
    if (currentlyPlaying) {
      baseTTS.cancel();
    }
    
    setCurrentlyPlaying(messageId);
    baseTTS.speak(text, selectedVoice, speakingRate);
  }, [baseTTS, selectedVoice, speakingRate, enableTTS, currentlyPlaying]);

  const stop = useCallback(() => {
    baseTTS.cancel();
    setCurrentlyPlaying(null);
  }, [baseTTS]);

  return {
    isTTSAvailable: baseTTS.isAvailable,
    isSpeaking: baseTTS.isSpeaking,
    currentlyPlaying,
    selectedVoice,
    speakingRate,
    autoRead,
    enableTTS,
    setSelectedVoice,
    setSpeakingRate,
    setAutoRead,
    setEnableTTS,
    speak,
    stop
  };
}
