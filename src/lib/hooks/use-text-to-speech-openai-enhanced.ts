/**
 * Enhanced OpenAI Text-to-Speech hook with interface compatible with existing components
 */

import { useState, useCallback, useEffect } from 'react';
import { useTextToSpeechOpenAI } from './use-text-to-speech-openai';

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

// OpenAI voice options
export const OPENAI_VOICES = [
  { id: 'alloy', name: 'Alloy' },
  { id: 'ash', name: 'Ash' },
  { id: 'ballad', name: 'Ballad' },
  { id: 'coral', name: 'Coral' },
  { id: 'echo', name: 'Echo' },
  { id: 'fable', name: 'Fable' },
  { id: 'nova', name: 'Nova' },
  { id: 'onyx', name: 'Onyx' },
  { id: 'sage', name: 'Sage' },
  { id: 'shimmer', name: 'Shimmer' }
] as const;

export function useTextToSpeech(): UseTextToSpeechEnhancedReturn {
  const openaiTTS = useTextToSpeechOpenAI();
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const [selectedVoice, setSelectedVoice] = useState('alloy');
  const [speakingRate, setSpeakingRate] = useState(1);
  const [autoRead, setAutoRead] = useState(false);
  const [enableTTS, setEnableTTS] = useState(true);

  // Clear currentlyPlaying when OpenAI TTS stops speaking
  useEffect(() => {
    if (!openaiTTS.isPlaying && currentlyPlaying) {
      setCurrentlyPlaying(null);
    }
  }, [openaiTTS.isPlaying, currentlyPlaying]);

  const speak = useCallback((text: string, messageId: string) => {
    if (!openaiTTS.isSupported || !enableTTS) {
      console.warn('TTS not available or disabled');
      return;
    }

    if (currentlyPlaying === messageId) {
      openaiTTS.stop();
      setCurrentlyPlaying(null);
      return;
    }
    
    // Stop any currently playing audio
    if (currentlyPlaying) {
      openaiTTS.stop();
    }
    
    setCurrentlyPlaying(messageId);
    openaiTTS.speak(text, { 
      voice: selectedVoice as any,
      model: 'tts-1' // Use the standard model for better performance
    }, speakingRate);
  }, [openaiTTS, selectedVoice, speakingRate, enableTTS, currentlyPlaying]);

  const stop = useCallback(() => {
    openaiTTS.stop();
    setCurrentlyPlaying(null);
  }, [openaiTTS]);

  return {
    isTTSAvailable: openaiTTS.isSupported,
    isSpeaking: openaiTTS.isPlaying,
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
