import { useState, useCallback, useRef } from 'react';

export interface SynchronizedTTSOptions {
  voice?: 'alloy' | 'ash' | 'ballad' | 'coral' | 'echo' | 'fable' | 'nova' | 'onyx' | 'sage' | 'shimmer';
  model?: 'gpt-4o-mini-tts' | 'tts-1' | 'tts-1-hd';
  instructions?: string;
  textSpeed?: number; // Characters per second for text display
}

export interface TextSyncState {
  isPlaying: boolean;
  currentCharIndex: number;
  totalChars: number;
  estimatedDuration: number;
  actualDuration: number;
}

export const useTextToSpeechSynchronized = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [textSyncState, setTextSyncState] = useState<TextSyncState>({
    isPlaying: false,
    currentCharIndex: 0,
    totalChars: 0,
    estimatedDuration: 0,
    actualDuration: 0
  });
  const [playbackRate, setPlaybackRate] = useState(1.0);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const textIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const textRef = useRef<string>('');

  // Estimate speech duration based on text length and complexity
  const estimateSpeechDuration = useCallback((text: string, speed: number = 1.0): number => {
    // Clean text for estimation
    const cleanText = text.replace(/\*\*/g, '').replace(/\*/g, '').replace(/[^\w\s]/g, ' ').trim();
    const wordCount = cleanText.split(/\s+/).filter(word => word.length > 0).length;
    
    // Average speaking rate: 150-160 words per minute for natural speech
    // OpenAI TTS tends to be slightly faster, so we use 170 WPM as base
    const baseWordsPerMinute = 170;
    const adjustedWPM = baseWordsPerMinute * speed;
    
    // Calculate base duration
    let estimatedMinutes = wordCount / adjustedWPM;
    
    // Add time for punctuation pauses
    const sentenceCount = (text.match(/[.!?]+/g) || []).length;
    const commaCount = (text.match(/,/g) || []).length;
    
    // Add pause time: 0.5s per sentence, 0.2s per comma
    const pauseTime = (sentenceCount * 0.5 + commaCount * 0.2) / 60; // Convert to minutes
    
    estimatedMinutes += pauseTime;
    
    // Convert to seconds and add small buffer
    return Math.max(estimatedMinutes * 60 * 1.1, 2); // Minimum 2 seconds
  }, []);

  // Calculate text display speed to match audio duration
  const calculateTextSpeed = useCallback((text: string, audioDuration: number): number => {
    const textLength = text.length;
    if (audioDuration <= 0 || textLength <= 0) return 50; // Default fallback
    
    // Characters per second to match audio duration
    const baseSpeed = textLength / audioDuration;
    
    // Ensure reasonable bounds (10-200 chars per second)
    return Math.max(10, Math.min(200, baseSpeed));
  }, []);

  // Start synchronized text display
  const startTextSync = useCallback((text: string, duration: number) => {
    textRef.current = text;
    const textSpeed = calculateTextSpeed(text, duration);
    const intervalMs = 1000 / textSpeed; // Milliseconds per character
    
    setTextSyncState(prev => ({
      ...prev,
      currentCharIndex: 0,
      totalChars: text.length,
      estimatedDuration: duration
    }));

    let charIndex = 0;
    startTimeRef.current = Date.now();

    textIntervalRef.current = setInterval(() => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      const progress = Math.min(elapsed / duration, 1);
      const targetCharIndex = Math.floor(progress * text.length);
      
      // Smooth character progression with slight randomness for natural feel
      if (charIndex < targetCharIndex) {
        charIndex = Math.min(charIndex + 1, targetCharIndex);
      }
      
      setTextSyncState(prev => ({
        ...prev,
        currentCharIndex: charIndex,
        actualDuration: elapsed
      }));

      // Stop when we reach the end
      if (charIndex >= text.length || elapsed >= duration) {
        if (textIntervalRef.current) {
          clearInterval(textIntervalRef.current);
          textIntervalRef.current = null;
        }
        setTextSyncState(prev => ({
          ...prev,
          currentCharIndex: text.length,
          actualDuration: elapsed
        }));
      }
    }, Math.max(intervalMs, 50)); // Minimum 50ms intervals for smooth display
  }, [calculateTextSpeed]);

  const speak = useCallback(async (
    text: string, 
    options: SynchronizedTTSOptions = {}, 
    speed: number = 1.0,
    onTextUpdate?: (displayedText: string, isComplete: boolean) => void
  ) => {
    if (!text.trim()) {
      setError('Text is required');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Stop any currently playing audio and text sync
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (textIntervalRef.current) {
        clearInterval(textIntervalRef.current);
        textIntervalRef.current = null;
      }

      // Estimate duration for text synchronization
      const estimatedDuration = estimateSpeechDuration(text, speed);

      const response = await fetch('/api/tts/openai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          voice: options.voice || 'alloy',
          model: options.model || 'gpt-4o-mini-tts',
          instructions: options.instructions,
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData || 'Failed to generate speech');
      }

      // Create audio blob from response
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      // Create and configure audio
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      audio.playbackRate = speed;
      setPlaybackRate(speed);

      // Set up audio event handlers
      audio.onloadstart = () => {
        setTextSyncState(prev => ({ ...prev, isPlaying: true }));
      };

      audio.onplay = () => {
        // Start text synchronization when audio actually starts
        const actualDuration = audio.duration || estimatedDuration;
        startTextSync(text, actualDuration / speed); // Adjust for playback rate
      };

      audio.onended = () => {
        setTextSyncState(prev => ({ 
          ...prev, 
          isPlaying: false,
          currentCharIndex: text.length 
        }));
        URL.revokeObjectURL(audioUrl);
        audioRef.current = null;
        if (textIntervalRef.current) {
          clearInterval(textIntervalRef.current);
          textIntervalRef.current = null;
        }
        onTextUpdate?.(text, true);
      };

      audio.onerror = () => {
        setTextSyncState(prev => ({ 
          ...prev, 
          isPlaying: false,
          currentCharIndex: text.length 
        }));
        setError('Failed to play audio');
        URL.revokeObjectURL(audioUrl);
        audioRef.current = null;
        if (textIntervalRef.current) {
          clearInterval(textIntervalRef.current);
          textIntervalRef.current = null;
        }
        onTextUpdate?.(text, true);
      };

      // Text update callback will be handled by the textSyncState updates
      // The onTextUpdate callback is called from the startTextSync function

      await audio.play();
    } catch (err: any) {
      console.error('Synchronized TTS Error:', err);
      setError(err.message || 'Failed to generate speech');
      setTextSyncState(prev => ({ 
        ...prev, 
        isPlaying: false,
        currentCharIndex: textRef.current.length 
      }));
      // If TTS fails, still show full text immediately
      onTextUpdate?.(text, true);
    } finally {
      setIsLoading(false);
    }
  }, [estimateSpeechDuration, startTextSync]);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (textIntervalRef.current) {
      clearInterval(textIntervalRef.current);
      textIntervalRef.current = null;
    }
    setTextSyncState(prev => ({ 
      ...prev, 
      isPlaying: false,
      currentCharIndex: textRef.current.length 
    }));
  }, []);

  const getCurrentDisplayText = useCallback(() => {
    return textRef.current.slice(0, textSyncState.currentCharIndex);
  }, [textSyncState.currentCharIndex]);

  const getProgress = useCallback(() => {
    if (textSyncState.totalChars === 0) return 0;
    return textSyncState.currentCharIndex / textSyncState.totalChars;
  }, [textSyncState.currentCharIndex, textSyncState.totalChars]);

  const isSupported = true; // OpenAI TTS is always supported via API

  return {
    speak,
    stop,
    isLoading,
    error,
    isSupported,
    playbackRate,
    setPlaybackRate,
    textSyncState,
    getCurrentDisplayText,
    getProgress,
  };
};
